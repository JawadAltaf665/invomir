namespace InvoMir.Application.Features.Invoices.Queries.ListInvoices;

public sealed record ListInvoicesQuery(
    string? Status = null,
    Guid? ClientId = null,
    DateOnly? From = null,
    DateOnly? To = null,
    int Page = 1,
    int Limit = 20) : IRequest<PagedResult<InvoiceListItemDto>>;
