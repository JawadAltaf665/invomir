using System.Security.Cryptography;

namespace InvoMir.Application.Features.Invoices.Commands.ResendInvoice;

public sealed class ResendInvoiceCommandHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    ITenantContext tenantContext,
    IClientContext clientContext,
    IPdfService pdfService,
    IEmailService emailService,
    IInvoiceLinkBuilder invoiceLinkBuilder,
    IAuditService auditService)
    : IRequestHandler<ResendInvoiceCommand, InvoiceSendResultDto>
{
    private const string DefaultBusinessName = "InvoMir";

    public async Task<InvoiceSendResultDto> Handle(
        ResendInvoiceCommand request,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var invoice = await context.Invoices
            .FirstOrDefaultAsync(currentInvoice => currentInvoice.Id == request.Id, cancellationToken);

        if (invoice is null)
            throw new NotFoundException(nameof(Invoice), request.Id);

        if (!invoice.CanResend())
            throw new BadRequestException("Only sent, viewed, or overdue invoices can be resent.");

        var snapshot = await GetInvoiceEmailSnapshotAsync(invoice.Id, userId, cancellationToken);
        EnsureClientEmail(snapshot.Invoice.Client.Email);

        var paymentLinkToken = invoice.PaymentLinkToken;
        if (string.IsNullOrWhiteSpace(paymentLinkToken))
        {
            paymentLinkToken = await GenerateUniqueTokenAsync(cancellationToken);
            invoice.EnsurePaymentLinkToken(paymentLinkToken);
            await context.SaveChangesAsync(cancellationToken);
        }

        var invoiceWithIssuer = snapshot.Invoice with { Issuer = snapshot.Issuer };
        var pdfBytes = await pdfService.GenerateInvoicePdfAsync(invoiceWithIssuer, cancellationToken);

        await emailService.SendInvoiceAsync(
            BuildInvoiceEmail(snapshot, paymentLinkToken, pdfBytes, request, EmailConstants.Types.InvoiceResent),
            cancellationToken);

        await auditService.LogAsync(
            AuditConstants.Entities.Invoice,
            invoice.Id,
            AuditConstants.Actions.Resent,
            tenantContext.TenantId,
            userId,
            ToAuditSnapshot(invoice),
            ToAuditSnapshot(invoice),
            clientContext.IpAddress,
            clientContext.DeviceInfo,
            cancellationToken);

        return new InvoiceSendResultDto(
            invoice.Id,
            invoice.InvoiceNumber,
            invoice.Status,
            invoice.SentAt,
            invoiceLinkBuilder.BuildPaymentLink(paymentLinkToken),
            []);
    }

    private async Task<InvoiceEmailSnapshot> GetInvoiceEmailSnapshotAsync(
        Guid invoiceId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var invoice = await context.Invoices
            .AsNoTracking()
            .Where(currentInvoice => currentInvoice.Id == invoiceId)
            .Select(currentInvoice => new InvoiceDetailDto(
                currentInvoice.Id,
                currentInvoice.InvoiceNumber,
                currentInvoice.Status,
                new InvoiceClientDto(
                    currentInvoice.Client.Id,
                    currentInvoice.Client.Name,
                    currentInvoice.Client.Email,
                    currentInvoice.Client.Phone,
                    currentInvoice.Client.Address,
                    currentInvoice.Client.Company,
                    currentInvoice.Client.TaxId),
                currentInvoice.Items
                    .OrderBy(item => item.SortOrder)
                    .Select(item => new InvoiceItemDto(
                        item.Id,
                        item.Description,
                        item.Quantity,
                        item.UnitPrice,
                        item.Amount,
                        item.SortOrder))
                    .ToList(),
                currentInvoice.IssueDate,
                currentInvoice.DueDate,
                currentInvoice.Currency,
                currentInvoice.Subtotal,
                currentInvoice.TaxPercent,
                currentInvoice.TaxAmount,
                currentInvoice.Discount,
                currentInvoice.Total,
                currentInvoice.Notes,
                currentInvoice.SentAt,
                currentInvoice.ViewedAt,
                currentInvoice.PaidAt,
                currentInvoice.CancelledAt,
                currentInvoice.RemindersEnabled))
            .FirstOrDefaultAsync(cancellationToken);

        if (invoice is null)
            throw new NotFoundException(nameof(Invoice), invoiceId);

        var issuer = await GetIssuerAsync(userId, cancellationToken);
        return new InvoiceEmailSnapshot(invoice, issuer);
    }

    private async Task<InvoiceIssuerDto> GetIssuerAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var issuer = await context.Users
            .AsNoTracking()
            .Where(user => user.Id == userId)
            .Join(
                context.Tenants.AsNoTracking(),
                user => user.TenantId,
                tenant => tenant.Id,
                (user, tenant) => new InvoiceIssuerDto(
                    tenant.Name,
                    user.Email,
                    user.LogoUrl))
            .FirstOrDefaultAsync(cancellationToken);

        return issuer ?? new InvoiceIssuerDto(DefaultBusinessName, null, null);
    }

    private InvoiceEmailDto BuildInvoiceEmail(
        InvoiceEmailSnapshot snapshot,
        string paymentLinkToken,
        byte[] pdfBytes,
        ResendInvoiceCommand request,
        string emailType)
    {
        return new InvoiceEmailDto(
            snapshot.Invoice.Id,
            snapshot.Invoice.Client.Email,
            snapshot.Invoice.Client.Name,
            snapshot.Invoice.InvoiceNumber,
            snapshot.Issuer.BusinessName,
            snapshot.Invoice.Currency,
            snapshot.Invoice.Total,
            paymentLinkToken,
            request.Message,
            pdfBytes,
            emailType,
            request.CcSelf ? snapshot.Issuer.Email : null,
            snapshot.Invoice.DueDate);
    }

    private async Task<string> GenerateUniqueTokenAsync(CancellationToken cancellationToken)
    {
        string token;
        do
        {
            token = GenerateToken();
        }
        while (await context.Invoices
            .IgnoreQueryFilters()
            .AnyAsync(invoice => invoice.PaymentLinkToken == token, cancellationToken));

        return token;
    }

    private static string GenerateToken()
    {
        Span<byte> bytes = stackalloc byte[32];
        RandomNumberGenerator.Fill(bytes);

        return Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }

    private static void EnsureClientEmail(string clientEmail)
    {
        if (string.IsNullOrWhiteSpace(clientEmail))
            throw new BadRequestException("Client email is required before resending an invoice.");
    }

    private static InvoiceAuditSnapshot ToAuditSnapshot(Invoice invoice)
    {
        return new InvoiceAuditSnapshot(
            invoice.InvoiceNumber,
            invoice.ClientId,
            invoice.Status,
            invoice.Total,
            invoice.SentAt);
    }

    private sealed record InvoiceEmailSnapshot(InvoiceDetailDto Invoice, InvoiceIssuerDto Issuer);

    private sealed record InvoiceAuditSnapshot(
        string InvoiceNumber,
        Guid ClientId,
        string Status,
        decimal Total,
        DateTime? SentAt);
}
