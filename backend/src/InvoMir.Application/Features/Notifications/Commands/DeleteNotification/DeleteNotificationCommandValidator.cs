namespace InvoMir.Application.Features.Notifications.Commands.DeleteNotification;

public sealed class DeleteNotificationCommandValidator : AbstractValidator<DeleteNotificationCommand>
{
    public DeleteNotificationCommandValidator()
    {
        RuleFor(command => command.Id).NotEmpty();
    }
}
