namespace InvoMir.Application.Features.Invoices.Queries.GetInvoice;

public sealed class GetInvoiceQueryHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    ITenantContext tenantContext,
    ICurrencyConversionService currencyConversionService)
    : IRequestHandler<GetInvoiceQuery, InvoiceDetailDto>
{
    public async Task<InvoiceDetailDto> Handle(
        GetInvoiceQuery request,
        CancellationToken cancellationToken)
    {
        var tenantId = tenantContext.TenantId;
        var invoice = await context.Invoices
            .AsNoTracking()
            .Where(currentInvoice =>
                currentInvoice.Id == request.Id &&
                currentInvoice.TenantId == tenantId)
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
            throw new NotFoundException(nameof(Invoice), request.Id);

        if (!request.UseWorkspaceCurrency)
            return invoice;

        var workspaceCurrency = await GetWorkspaceCurrencyAsync(tenantId, cancellationToken);
        return await ConvertInvoiceAsync(invoice, workspaceCurrency, cancellationToken);
    }

    private async Task<string> GetWorkspaceCurrencyAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");
        var currency = await context.Users
            .AsNoTracking()
            .Where(user => user.Id == userId && user.TenantId == tenantId)
            .Select(user => user.Currency)
            .FirstOrDefaultAsync(cancellationToken);

        if (currency is null)
            throw new NotFoundException(nameof(User), userId);

        return NormalizeCurrency(currency);
    }

    private async Task<InvoiceDetailDto> ConvertInvoiceAsync(
        InvoiceDetailDto invoice,
        string workspaceCurrency,
        CancellationToken cancellationToken)
    {
        var amounts = new List<CurrencyAmount>
        {
            new(invoice.Subtotal, invoice.Currency),
            new(invoice.TaxAmount, invoice.Currency),
            new(invoice.DiscountAmount, invoice.Currency),
            new(invoice.Total, invoice.Currency)
        };

        foreach (var item in invoice.Items)
        {
            amounts.Add(new CurrencyAmount(item.UnitPrice, invoice.Currency));
            amounts.Add(new CurrencyAmount(item.Amount, invoice.Currency));
        }

        var conversions = await currencyConversionService.ConvertAsync(
            amounts,
            workspaceCurrency,
            cancellationToken);
        var index = 0;
        var subtotal = RoundMoney(conversions[index++].ConvertedAmount);
        var taxAmount = RoundMoney(conversions[index++].ConvertedAmount);
        var discountAmount = RoundMoney(conversions[index++].ConvertedAmount);
        var total = RoundMoney(conversions[index++].ConvertedAmount);
        var items = invoice.Items
            .Select(item =>
            {
                var unitPrice = RoundMoney(conversions[index++].ConvertedAmount);
                var amount = RoundMoney(conversions[index++].ConvertedAmount);
                return item with
                {
                    UnitPrice = unitPrice,
                    Amount = amount
                };
            })
            .ToList();

        return invoice with
        {
            Items = items,
            Currency = workspaceCurrency,
            Subtotal = subtotal,
            TaxAmount = taxAmount,
            DiscountAmount = discountAmount,
            Total = total
        };
    }

    private static string NormalizeCurrency(string currency)
    {
        return string.IsNullOrWhiteSpace(currency)
            ? "USD"
            : currency.Trim().ToUpperInvariant();
    }

    private static decimal RoundMoney(decimal amount)
    {
        return decimal.Round(amount, 2, MidpointRounding.AwayFromZero);
    }
}
