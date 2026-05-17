namespace InvoMir.Application.Features.Invoices.Commands.CancelInvoice;

public sealed record CancelInvoiceCommand(Guid Id) : IRequest<InvoiceCancellationDto>;
