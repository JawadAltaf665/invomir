namespace InvoMir.Application.Features.Invoices.Commands.SendInvoice;

public sealed record SendInvoiceCommand : IRequest<InvoiceSendResultDto>
{
    public Guid Id { get; init; }
    public string? Message { get; init; }
    public bool CcSelf { get; init; }
}
