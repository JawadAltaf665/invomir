namespace InvoMir.Application.Features.Invoices.Queries.ListInvoices;

public sealed class ListInvoicesQueryValidator : AbstractValidator<ListInvoicesQuery>
{
    public ListInvoicesQueryValidator()
    {
        RuleFor(query => query.Status)
            .Must(status =>
                status is null ||
                InvoiceConstants.Statuses.All.Contains(status.Trim().ToLowerInvariant()))
            .WithMessage("Invoice status is invalid.");

        RuleFor(query => query)
            .Must(query => !query.From.HasValue || !query.To.HasValue || query.From.Value <= query.To.Value)
            .WithMessage("From date must be on or before to date.");

        RuleFor(query => query.Search)
            .MaximumLength(100).WithMessage("Search term must not exceed 100 characters.");

        RuleFor(query => query.MinAmount)
            .GreaterThanOrEqualTo(0).When(query => query.MinAmount.HasValue)
            .WithMessage("Minimum amount must be zero or greater.");

        RuleFor(query => query.MaxAmount)
            .GreaterThanOrEqualTo(0).When(query => query.MaxAmount.HasValue)
            .WithMessage("Maximum amount must be zero or greater.");

        RuleFor(query => query)
            .Must(query =>
                !query.MinAmount.HasValue ||
                !query.MaxAmount.HasValue ||
                query.MinAmount.Value <= query.MaxAmount.Value)
            .WithMessage("Minimum amount must be less than or equal to maximum amount.");

        RuleFor(query => query.SortBy)
            .Must(sortBy => sortBy is null || IsSupportedSortBy(sortBy))
            .WithMessage("Invoice sort field is invalid.");

        RuleFor(query => query.SortDirection)
            .Must(direction => direction is null || IsSupportedSortDirection(direction))
            .WithMessage("Invoice sort direction is invalid.");
    }

    private static bool IsSupportedSortBy(string sortBy)
    {
        return Normalize(sortBy) is
            "created" or
            "invoice" or
            "client" or
            "status" or
            "due" or
            "sent" or
            "total";
    }

    private static bool IsSupportedSortDirection(string direction)
    {
        return Normalize(direction) is "asc" or "desc";
    }

    private static string Normalize(string value)
    {
        return value.Trim().ToLowerInvariant();
    }
}
