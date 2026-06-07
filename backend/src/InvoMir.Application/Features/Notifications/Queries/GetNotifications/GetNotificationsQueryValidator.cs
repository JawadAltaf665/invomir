namespace InvoMir.Application.Features.Notifications.Queries.GetNotifications;

public sealed class GetNotificationsQueryValidator : AbstractValidator<GetNotificationsQuery>
{
    public GetNotificationsQueryValidator()
    {
        RuleFor(query => query.Type)
            .Must(type => string.IsNullOrWhiteSpace(type) ||
                type == NotificationConstants.Statuses.All ||
                NotificationConstants.Types.All.Contains(type.Trim().ToLowerInvariant()))
            .WithMessage("Notification type is not supported.");

        RuleFor(query => query.Status)
            .Must(status => string.IsNullOrWhiteSpace(status) ||
                NotificationConstants.Statuses.FilterValues.Contains(status.Trim().ToLowerInvariant()))
            .WithMessage("Notification status is not supported.");

        RuleFor(query => query.Priority)
            .Must(priority => string.IsNullOrWhiteSpace(priority) ||
                priority == NotificationConstants.Statuses.All ||
                NotificationConstants.Priorities.All.Contains(priority.Trim().ToLowerInvariant()))
            .WithMessage("Notification priority is not supported.");

        RuleFor(query => query.Search)
            .MaximumLength(200);

        RuleFor(query => query.Page)
            .GreaterThanOrEqualTo(0);

        RuleFor(query => query.Limit)
            .GreaterThanOrEqualTo(0)
            .LessThanOrEqualTo(100);
    }
}
