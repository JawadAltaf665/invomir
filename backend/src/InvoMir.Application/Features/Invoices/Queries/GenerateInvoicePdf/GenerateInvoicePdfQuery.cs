namespace InvoMir.Application.Features.Invoices.Queries.GenerateInvoicePdf;

public sealed record GenerateInvoicePdfQuery(Guid Id) : IRequest<InvoicePdfDto>;
