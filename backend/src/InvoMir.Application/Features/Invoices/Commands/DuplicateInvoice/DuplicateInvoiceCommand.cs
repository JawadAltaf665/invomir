namespace InvoMir.Application.Features.Invoices.Commands.DuplicateInvoice;

public sealed record DuplicateInvoiceCommand : IRequest<InvoiceDetailDto>
{
    public Guid Id { get; init; }
    public Guid? ClientId { get; init; }
    public DateOnly? DueDate { get; init; }
}
