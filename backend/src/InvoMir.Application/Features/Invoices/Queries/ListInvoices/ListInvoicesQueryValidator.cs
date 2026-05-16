namespace InvoMir.Application.Features.Invoices.Queries.ListInvoices;

public sealed class ListInvoicesQueryValidator : AbstractValidator<ListInvoicesQuery>
{
    public ListInvoicesQueryValidator()
    {
        RuleFor(query => query.Status)
            .Must(status => status is null || InvoiceConstants.Statuses.All.Contains(status))
            .WithMessage("Invoice status is invalid.");

        RuleFor(query => query)
            .Must(query => !query.From.HasValue || !query.To.HasValue || query.From.Value <= query.To.Value)
            .WithMessage("From date must be on or before to date.");
    }
}
