namespace InvoMir.Application.Features.Admin.Users.Commands.UpdateAdminUserRole;

public sealed class UpdateAdminUserRoleCommandValidator : AbstractValidator<UpdateAdminUserRoleCommand>
{
    public UpdateAdminUserRoleCommandValidator()
    {
        RuleFor(command => command.Id)
            .NotEmpty().WithMessage("User id is required.");

        RuleFor(command => command.Role)
            .NotEmpty().WithMessage("Role is required.")
            .Must(role => role is not null &&
                AuthConstants.Roles.All.Contains(role.Trim().ToLowerInvariant()))
            .WithMessage("Role must be system_admin, owner, admin, accountant, member, or viewer.");
    }
}
