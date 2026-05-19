using InvoMir.Application.Interfaces;

namespace InvoMir.API.Authorization;

public sealed class PermissionAuthorizationHandler(IPermissionChecker permissionChecker)
    : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        if (permissionChecker.HasPermission(context.User, requirement.Permission))
            context.Succeed(requirement);

        return Task.CompletedTask;
    }
}
