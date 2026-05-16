namespace InvoMir.Infrastructure.Services;

public sealed class InvoiceNumberService(IAppDbContext context) : IInvoiceNumberService
{
    private const string Prefix = "INV-";

    public async Task<string> GenerateNextAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        var invoiceNumbers = await context.Invoices
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(invoice => invoice.TenantId == tenantId && invoice.InvoiceNumber.StartsWith(Prefix))
            .Select(invoice => invoice.InvoiceNumber)
            .ToListAsync(cancellationToken);

        var nextNumber = invoiceNumbers
            .Select(ParseNumber)
            .DefaultIfEmpty(0)
            .Max() + 1;

        return $"{Prefix}{nextNumber:000}";
    }

    private static int ParseNumber(string invoiceNumber)
    {
        return int.TryParse(invoiceNumber[Prefix.Length..], out var number) ? number : 0;
    }
}
