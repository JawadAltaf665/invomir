namespace InvoMir.Application.Features.Invoices.Queries.GenerateInvoicePdf;

public sealed class GenerateInvoicePdfQueryHandler(
    IAppDbContext context,
    IPdfService pdfService)
    : IRequestHandler<GenerateInvoicePdfQuery, InvoicePdfDto>
{
    private const string PdfContentType = "application/pdf";
    private const string DefaultBusinessName = "InvoMir";

    public async Task<InvoicePdfDto> Handle(
        GenerateInvoicePdfQuery request,
        CancellationToken cancellationToken)
    {
        var snapshot = await context.Invoices
            .AsNoTracking()
            .Where(invoice => invoice.Id == request.Id)
            .Select(invoice => new InvoicePdfSnapshot(
                invoice.UserId,
                new InvoiceDetailDto(
                    invoice.Id,
                    invoice.InvoiceNumber,
                    invoice.Status,
                    new InvoiceClientDto(
                        invoice.Client.Id,
                        invoice.Client.Name,
                        invoice.Client.Email,
                        invoice.Client.Phone,
                        invoice.Client.Address,
                        invoice.Client.Company,
                        invoice.Client.TaxId),
                    invoice.Items
                        .OrderBy(item => item.SortOrder)
                        .Select(item => new InvoiceItemDto(
                            item.Id,
                            item.Description,
                            item.Quantity,
                            item.UnitPrice,
                            item.Amount,
                            item.SortOrder))
                        .ToList(),
                    invoice.IssueDate,
                    invoice.DueDate,
                    invoice.Currency,
                    invoice.Subtotal,
                    invoice.TaxPercent,
                    invoice.TaxAmount,
                    invoice.Discount,
                    invoice.Total,
                    invoice.Notes,
                    invoice.SentAt,
                    invoice.ViewedAt,
                    invoice.PaidAt,
                    invoice.CancelledAt,
                    invoice.RemindersEnabled)))
            .FirstOrDefaultAsync(cancellationToken);

        if (snapshot is null)
            throw new NotFoundException(nameof(Invoice), request.Id);

        var issuer = await GetIssuerAsync(snapshot.UserId, cancellationToken);
        var invoiceWithIssuer = snapshot.Invoice with { Issuer = issuer };
        var pdfBytes = await pdfService.GenerateInvoicePdfAsync(invoiceWithIssuer, cancellationToken);

        return new InvoicePdfDto(
            pdfBytes,
            BuildFileName(invoiceWithIssuer.InvoiceNumber),
            PdfContentType,
            DateTime.UtcNow);
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

    private static string BuildFileName(string invoiceNumber)
    {
        var safeInvoiceNumber = new string(invoiceNumber
            .Select(character => char.IsLetterOrDigit(character) || character is '-' or '_'
                ? character
                : '-')
            .ToArray());

        return $"{safeInvoiceNumber}.pdf";
    }

    private sealed record InvoicePdfSnapshot(Guid UserId, InvoiceDetailDto Invoice);
}
