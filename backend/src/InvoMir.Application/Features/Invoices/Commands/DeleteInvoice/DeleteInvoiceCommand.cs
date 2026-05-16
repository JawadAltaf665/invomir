namespace InvoMir.Application.Features.Invoices.Commands.DeleteInvoice;

public sealed record DeleteInvoiceCommand(Guid Id) : IRequest<InvoiceCancellationDto>;
