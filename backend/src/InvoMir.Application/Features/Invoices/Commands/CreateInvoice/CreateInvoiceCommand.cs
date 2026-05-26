namespace InvoMir.Application.Features.Invoices.Commands.CreateInvoice;

public sealed record CreateInvoiceCommand : IRequest<InvoiceDetailDto>
{
    public Guid ClientId { get; init; }
    public DateOnly? DueDate { get; init; }
    public string? PaymentTerms { get; init; }
    public decimal? TaxPercent { get; init; }
    public DiscountDto? Discount { get; init; }
    public string? Notes { get; init; }
    public List<InvoiceItemInputDto> Items { get; init; } = [];
}
