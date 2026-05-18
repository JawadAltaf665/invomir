namespace InvoMir.Application.Features.AuditLogs.Queries.GetEntityAuditLogs;

public sealed class GetEntityAuditLogsQueryValidator : AbstractValidator<GetEntityAuditLogsQuery>
{
    public GetEntityAuditLogsQueryValidator()
    {
        RuleFor(query => query.EntityName)
            .NotEmpty().WithMessage("Entity name is required.")
            .MaximumLength(100).WithMessage("Entity name must not exceed 100 characters.");

        RuleFor(query => query.EntityId)
            .NotEmpty().WithMessage("Entity id is required.");

        RuleFor(query => query)
            .Must(query => !query.From.HasValue || !query.To.HasValue || query.From.Value <= query.To.Value)
            .WithMessage("From date must be on or before to date.");
    }
}
