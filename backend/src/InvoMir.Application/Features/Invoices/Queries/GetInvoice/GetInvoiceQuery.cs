namespace InvoMir.Application.Features.Invoices.Queries.GetInvoice;

public sealed record GetInvoiceQuery(
    Guid Id,
    bool UseWorkspaceCurrency = false) : IRequest<InvoiceDetailDto>;
