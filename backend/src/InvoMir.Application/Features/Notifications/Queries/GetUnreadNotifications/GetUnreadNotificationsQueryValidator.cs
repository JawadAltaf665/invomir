namespace InvoMir.Application.Features.Notifications.Queries.GetUnreadNotifications;

public sealed class GetUnreadNotificationsQueryValidator : AbstractValidator<GetUnreadNotificationsQuery>
{
    public GetUnreadNotificationsQueryValidator()
    {
        RuleFor(query => query.Limit)
            .GreaterThanOrEqualTo(0)
            .LessThanOrEqualTo(50);
    }
}
