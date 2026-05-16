namespace InvoMir.Domain.Entities;

public sealed class InvoiceItem : TenantEntity
{
    public Guid InvoiceId { get; private set; }
    public string Description { get; private set; } = string.Empty;
    public decimal Quantity { get; private set; }
    public decimal UnitPrice { get; private set; }
    public decimal Amount { get; private set; }
    public int SortOrder { get; private set; }

    public Invoice Invoice { get; private set; } = null!;

    private InvoiceItem()
    {
    }

    public static InvoiceItem Create(
        Guid invoiceId,
        string description,
        decimal quantity,
        decimal unitPrice,
        int sortOrder)
    {
        if (invoiceId == Guid.Empty)
            throw new ArgumentException("Invoice id is required.", nameof(invoiceId));

        if (string.IsNullOrWhiteSpace(description))
            throw new ArgumentException("Item description is required.", nameof(description));

        if (quantity <= 0)
            throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity must be greater than zero.");

        if (unitPrice < 0)
            throw new ArgumentOutOfRangeException(nameof(unitPrice), "Unit price cannot be negative.");

        return new InvoiceItem
        {
            InvoiceId = invoiceId,
            Description = description.Trim(),
            Quantity = quantity,
            UnitPrice = unitPrice,
            Amount = Math.Round(quantity * unitPrice, 2),
            SortOrder = sortOrder
        };
    }
}
