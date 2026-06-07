using System.Text.Json;

namespace InvoMir.Application.Features.Notifications.Commands.CreateNotification;

public sealed class CreateNotificationCommandValidator : AbstractValidator<CreateNotificationCommand>
{
    public CreateNotificationCommandValidator()
    {
        RuleFor(command => command.Title)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(command => command.Message)
            .NotEmpty()
            .MaximumLength(1000);

        RuleFor(command => command.Type)
            .Must(type => NotificationConstants.Types.All.Contains(type?.Trim().ToLowerInvariant()))
            .WithMessage("Notification type is not supported.");

        RuleFor(command => command.Priority)
            .Must(priority => NotificationConstants.Priorities.All.Contains(priority?.Trim().ToLowerInvariant()))
            .WithMessage("Notification priority is not supported.");

        RuleFor(command => command.Target)
            .Must(target => NotificationConstants.Targets.All.Contains(target?.Trim().ToLowerInvariant()))
            .WithMessage("Notification target is not supported.");

        RuleFor(command => command.UserId)
            .NotEmpty()
            .When(command =>
                string.Equals(
                    command.Target,
                    NotificationConstants.Targets.User,
                    StringComparison.OrdinalIgnoreCase))
            .WithMessage("User id is required for user notifications.");

        RuleFor(command => command.RoleId)
            .Must(roleId => string.IsNullOrWhiteSpace(roleId) ||
                NotificationConstants.SupportedRoleIds.Contains(roleId.Trim().ToLowerInvariant()))
            .WithMessage("Notification role target is not supported.");

        RuleFor(command => command.RoleId)
            .NotEmpty()
            .When(command =>
                string.Equals(
                    command.Target,
                    NotificationConstants.Targets.Role,
                    StringComparison.OrdinalIgnoreCase))
            .WithMessage("Role id is required for role notifications.");

        RuleFor(command => command.ActionUrl)
            .MaximumLength(500);

        RuleFor(command => command.MetadataJson)
            .Must(BeValidJson)
            .When(command => !string.IsNullOrWhiteSpace(command.MetadataJson))
            .WithMessage("Notification metadata must be valid JSON.");
    }

    private static bool BeValidJson(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return true;

        try
        {
            using var _ = JsonDocument.Parse(value);
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }
}
