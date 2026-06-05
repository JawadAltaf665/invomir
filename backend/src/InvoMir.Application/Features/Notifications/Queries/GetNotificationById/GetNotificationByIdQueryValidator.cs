namespace InvoMir.Application.Features.Notifications.Queries.GetNotificationById;

public sealed class GetNotificationByIdQueryValidator : AbstractValidator<GetNotificationByIdQuery>
{
    public GetNotificationByIdQueryValidator()
    {
        RuleFor(query => query.Id).NotEmpty();
    }
}
