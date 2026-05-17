namespace InvoMir.Application.Features.Invoices.Commands.UpdateInvoice;

public sealed record UpdateInvoiceCommand : IRequest<InvoiceDetailDto>
{
    public Guid Id { get; init; }
    public Guid ClientId { get; init; }
    public DateOnly? DueDate { get; init; }
    public string? PaymentTerms { get; init; }
    public decimal? TaxPercent { get; init; }
    public DiscountDto? Discount { get; init; }
    public string? Notes { get; init; }
    public string? Currency { get; init; }
    public List<InvoiceItemInputDto> Items { get; init; } = [];
}
