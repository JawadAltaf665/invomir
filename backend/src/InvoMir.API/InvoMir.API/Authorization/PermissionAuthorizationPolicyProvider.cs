using Microsoft.Extensions.Options;

namespace InvoMir.API.Authorization;

public sealed class PermissionAuthorizationPolicyProvider : DefaultAuthorizationPolicyProvider
{
    public PermissionAuthorizationPolicyProvider(IOptions<AuthorizationOptions> options)
        : base(options)
    {
    }

    public override Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        if (!policyName.StartsWith(AuthConstants.Policies.PermissionPrefix, StringComparison.Ordinal))
            return base.GetPolicyAsync(policyName);

        var permission = policyName[AuthConstants.Policies.PermissionPrefix.Length..];
        if (string.IsNullOrWhiteSpace(permission) || !Permissions.IsKnown(permission))
            return Task.FromResult<AuthorizationPolicy?>(null);

        var policy = new AuthorizationPolicyBuilder()
            .RequireAuthenticatedUser()
            .AddRequirements(new PermissionRequirement(permission))
            .Build();

        return Task.FromResult<AuthorizationPolicy?>(policy);
    }
}
