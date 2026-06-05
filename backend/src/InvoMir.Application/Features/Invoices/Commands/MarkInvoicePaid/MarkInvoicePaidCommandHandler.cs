using InvoMir.Application.Features.Notifications;

namespace InvoMir.Application.Features.Invoices.Commands.MarkInvoicePaid;

public sealed class MarkInvoicePaidCommandHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    ITenantContext tenantContext,
    IClientContext clientContext,
    IInvoiceReminderJobService invoiceReminderJobService,
    IEmailService emailService,
    IAuditService auditService,
    INotificationService notificationService)
    : IRequestHandler<MarkInvoicePaidCommand, InvoicePaymentDto>
{
    private const string DefaultBusinessName = "InvoMir";

    public async Task<InvoicePaymentDto> Handle(
        MarkInvoicePaidCommand request,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var invoice = await context.Invoices
            .FirstOrDefaultAsync(currentInvoice => currentInvoice.Id == request.Id, cancellationToken);

        if (invoice is null)
            throw new NotFoundException(nameof(Invoice), request.Id);

        if (!invoice.CanMarkPaid())
            throw new BadRequestException("Invoice is already paid or cancelled.");

        var receiptSnapshot = await GetReceiptSnapshotAsync(invoice.Id, userId, cancellationToken);
        var paidAtUtc = NormalizePaidAt(request.PaidAt);
        var method = NormalizeMethod(request.Method);
        var oldValues = ToAuditSnapshot(invoice);

        invoice.MarkPaid(paidAtUtc);

        var payment = Payment.CreateManual(
            invoice.Id,
            invoice.UserId,
            invoice.Total,
            invoice.Currency,
            method,
            paidAtUtc,
            request.Note);

        context.Payments.Add(payment);
        var cancelledReminderJobCount = await invoiceReminderJobService.CancelPendingAsync(invoice.Id, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        await emailService.SendPaymentReceiptAsync(
            BuildReceiptEmail(receiptSnapshot, invoice, payment),
            cancellationToken);

        await auditService.LogAsync(
            AuditConstants.Entities.Invoice,
            invoice.Id,
            AuditConstants.Actions.Paid,
            tenantContext.TenantId,
            userId,
            oldValues,
            ToAuditSnapshot(invoice, payment, cancelledReminderJobCount),
            clientContext.IpAddress,
            clientContext.DeviceInfo,
            cancellationToken);

        await NotificationEventPublisher.CreateForRolesAsync(
            notificationService,
            invoice.TenantId,
            NotificationEventPublisher.BillingOperatorRoles,
            "Payment received",
            $"{invoice.InvoiceNumber} was marked paid.",
            NotificationConstants.Types.Payment,
            NotificationConstants.Priorities.High,
            $"/app/invoices/{invoice.Id}",
            new
            {
                invoice.Id,
                invoice.InvoiceNumber,
                PaymentId = payment.Id,
                payment.Amount,
                payment.Currency,
                payment.Method,
                payment.PaidAt
            },
            cancellationToken);

        return new InvoicePaymentDto(
            invoice.Id,
            payment.Id,
            invoice.Status,
            payment.Amount,
            payment.Currency,
            payment.Method,
            payment.PaidAt,
            cancelledReminderJobCount);
    }

    private async Task<ReceiptSnapshot> GetReceiptSnapshotAsync(
        Guid invoiceId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var client = await context.Invoices
            .AsNoTracking()
            .Where(invoice => invoice.Id == invoiceId)
            .Select(invoice => new InvoiceClientDto(
                invoice.Client.Id,
                invoice.Client.Name,
                invoice.Client.Email))
            .FirstOrDefaultAsync(cancellationToken);

        if (client is null)
            throw new NotFoundException(nameof(Invoice), invoiceId);

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

        return new ReceiptSnapshot(
            client,
            issuer ?? new InvoiceIssuerDto(DefaultBusinessName, null, null));
    }

    private static PaymentReceiptEmailDto BuildReceiptEmail(
        ReceiptSnapshot receiptSnapshot,
        Invoice invoice,
        Payment payment)
    {
        return new PaymentReceiptEmailDto(
            invoice.Id,
            receiptSnapshot.Client.Email,
            receiptSnapshot.Client.Name,
            invoice.InvoiceNumber,
            receiptSnapshot.Issuer.BusinessName,
            payment.Currency,
            payment.Amount,
            payment.PaidAt,
            payment.Method,
            invoice.TenantId,
            invoice.UserId);
    }

    private static DateTime NormalizePaidAt(DateTime? paidAt)
    {
        if (paidAt is null)
            return DateTime.UtcNow;

        return paidAt.Value.Kind switch
        {
            DateTimeKind.Utc => paidAt.Value,
            DateTimeKind.Local => paidAt.Value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(paidAt.Value, DateTimeKind.Utc)
        };
    }

    private static string NormalizeMethod(string? method)
    {
        return string.IsNullOrWhiteSpace(method)
            ? PaymentConstants.Methods.Other
            : method.Trim().ToLowerInvariant();
    }

    private static InvoiceAuditSnapshot ToAuditSnapshot(Invoice invoice)
    {
        return new InvoiceAuditSnapshot(
            invoice.InvoiceNumber,
            invoice.ClientId,
            invoice.Status,
            invoice.Total,
            invoice.PaidAt,
            null,
            null,
            null,
            null);
    }

    private static InvoiceAuditSnapshot ToAuditSnapshot(
        Invoice invoice,
        Payment payment,
        int cancelledReminderJobCount)
    {
        return new InvoiceAuditSnapshot(
            invoice.InvoiceNumber,
            invoice.ClientId,
            invoice.Status,
            invoice.Total,
            invoice.PaidAt,
            payment.Id,
            payment.Method,
            payment.Note,
            cancelledReminderJobCount);
    }

    private sealed record ReceiptSnapshot(InvoiceClientDto Client, InvoiceIssuerDto Issuer);

    private sealed record InvoiceAuditSnapshot(
        string InvoiceNumber,
        Guid ClientId,
        string Status,
        decimal Total,
        DateTime? PaidAt,
        Guid? PaymentId,
        string? PaymentMethod,
        string? PaymentNote,
        int? CancelledReminderJobCount);
}
