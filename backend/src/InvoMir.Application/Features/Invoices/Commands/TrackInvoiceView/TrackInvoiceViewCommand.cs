namespace InvoMir.Application.Features.Invoices.Commands.TrackInvoiceView;

public sealed record TrackInvoiceViewCommand(string Token) : IRequest<bool>;
