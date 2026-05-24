namespace InvoMir.Application.Features.AuditLogs.Queries.ListAuditLogs;

public sealed class ListAuditLogsQueryValidator : AbstractValidator<ListAuditLogsQuery>
{
    public ListAuditLogsQueryValidator()
    {
        RuleFor(query => query.EntityName)
            .MaximumLength(100)
            .When(query => !string.IsNullOrWhiteSpace(query.EntityName))
            .WithMessage("Entity name must not exceed 100 characters.");

        RuleFor(query => query.Action)
            .MaximumLength(100)
            .When(query => !string.IsNullOrWhiteSpace(query.Action))
            .WithMessage("Action must not exceed 100 characters.");

        RuleFor(query => query.SearchTerm)
            .MaximumLength(100)
            .When(query => !string.IsNullOrWhiteSpace(query.SearchTerm))
            .WithMessage("Search must not exceed 100 characters.");

        RuleFor(query => query)
            .Must(query => !query.From.HasValue || !query.To.HasValue || query.From.Value <= query.To.Value)
            .WithMessage("From date must be on or before to date.");
    }
}
