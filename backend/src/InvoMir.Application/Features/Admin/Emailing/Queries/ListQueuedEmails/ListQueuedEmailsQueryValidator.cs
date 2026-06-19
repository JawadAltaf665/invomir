namespace InvoMir.Application.Features.Admin.Emailing.Queries.ListQueuedEmails;

public sealed class ListQueuedEmailsQueryValidator : AbstractValidator<ListQueuedEmailsQuery>
{
    public ListQueuedEmailsQueryValidator()
    {
        RuleFor(query => query.Status)
            .IsInEnum()
            .When(query => query.Status is not null)
            .WithMessage("Queued email status is invalid.");
        RuleFor(query => query.TemplateType)
            .IsInEnum()
            .When(query => query.TemplateType is not null)
            .WithMessage("Template type is invalid.");
        RuleFor(query => query.SearchEmail)
            .MaximumLength(256).WithMessage("Email search must not exceed 256 characters.");
        RuleFor(query => query)
            .Must(query => query.From is null || query.To is null || query.From <= query.To)
            .WithMessage("From date must be before or equal to To date.");
    }
}
