namespace InvoMir.Application.Features.Invoices;

internal static class InvoiceDraftCalculator
{
    public static DateOnly ResolveDueDate(DateOnly issueDate, DateOnly? dueDate, string? paymentTerms)
    {
        if (dueDate.HasValue)
            return dueDate.Value;

        return paymentTerms switch
        {
            InvoiceConstants.PaymentTerms.DueOnReceipt => issueDate,
            InvoiceConstants.PaymentTerms.Net7 => issueDate.AddDays(7),
            InvoiceConstants.PaymentTerms.Net14 => issueDate.AddDays(14),
            InvoiceConstants.PaymentTerms.Net30 => issueDate.AddDays(30),
            _ => throw new BadRequestException("Due date or valid payment terms are required.")
        };
    }

    public static InvoiceTotalsDto CalculateTotals(
        IReadOnlyCollection<InvoiceItemInputDto> items,
        decimal taxPercent,
        DiscountDto? discount)
    {
        var subtotal = RoundCurrency(items.Sum(item => item.Quantity * item.UnitPrice));
        var discountAmount = CalculateDiscount(subtotal, discount);

        if (discountAmount > subtotal)
            throw new BadRequestException("Discount cannot be greater than subtotal.");

        var taxableAmount = subtotal - discountAmount;
        var taxAmount = RoundCurrency(taxableAmount * (taxPercent / 100));
        var total = RoundCurrency(taxableAmount + taxAmount);

        return new InvoiceTotalsDto(subtotal, taxPercent, taxAmount, discountAmount, total);
    }

    private static decimal CalculateDiscount(decimal subtotal, DiscountDto? discount)
    {
        if (discount is null)
            return 0;

        if (discount.Type == InvoiceConstants.DiscountTypes.Percent)
            return RoundCurrency(subtotal * (discount.Value / 100));

        return RoundCurrency(discount.Value);
    }

    private static decimal RoundCurrency(decimal amount)
    {
        return Math.Round(amount, 2, MidpointRounding.AwayFromZero);
    }
}
