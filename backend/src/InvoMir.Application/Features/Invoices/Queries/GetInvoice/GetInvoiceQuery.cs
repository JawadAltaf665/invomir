namespace InvoMir.Application.Features.Invoices.Queries.GetInvoice;

public sealed record GetInvoiceQuery(Guid Id) : IRequest<InvoiceDetailDto>;
