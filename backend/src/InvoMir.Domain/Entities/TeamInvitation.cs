using InvoMir.Shared.Constants;

namespace InvoMir.Domain.Entities;

public sealed class TeamInvitation : TenantEntity
{
    public Guid InvitedByUserId { get; private set; }
    public string Email { get; private set; } = string.Empty;
    public string Role { get; private set; } = AuthConstants.Roles.Member;
    public string TokenHash { get; private set; } = string.Empty;
    public string Status { get; private set; } = TeamConstants.InvitationStatuses.Pending;
    public DateTime ExpiresAt { get; private set; }
    public DateTime? AcceptedAt { get; private set; }

    public bool IsPending(DateTime utcNow) =>
        Status == TeamConstants.InvitationStatuses.Pending && ExpiresAt > utcNow;

    private TeamInvitation()
    {
    }

    public static TeamInvitation Create(
        Guid tenantId,
        Guid invitedByUserId,
        string email,
        string role,
        string tokenHash,
        DateTime expiresAtUtc)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        if (invitedByUserId == Guid.Empty)
            throw new ArgumentException("Inviting user id is required.", nameof(invitedByUserId));

        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email is required.", nameof(email));

        if (string.IsNullOrWhiteSpace(tokenHash))
            throw new ArgumentException("Token hash is required.", nameof(tokenHash));

        var normalizedRole = NormalizeRole(role);
        var normalizedExpiresAtUtc = EnsureUtc(expiresAtUtc);
        if (normalizedExpiresAtUtc <= DateTime.UtcNow)
            throw new ArgumentOutOfRangeException(nameof(expiresAtUtc), "Invitation expiry must be in the future.");

        var invitation = new TeamInvitation
        {
            InvitedByUserId = invitedByUserId,
            Email = email.ToLowerInvariant().Trim(),
            Role = normalizedRole,
            TokenHash = tokenHash.Trim(),
            Status = TeamConstants.InvitationStatuses.Pending,
            ExpiresAt = normalizedExpiresAtUtc
        };

        invitation.SetTenant(tenantId);
        return invitation;
    }

    public void Accept(DateTime acceptedAtUtc)
    {
        var normalizedAcceptedAtUtc = EnsureUtc(acceptedAtUtc);
        if (!IsPending(normalizedAcceptedAtUtc))
            throw new InvalidOperationException("Only active pending invitations can be accepted.");

        Status = TeamConstants.InvitationStatuses.Accepted;
        AcceptedAt = normalizedAcceptedAtUtc;
    }

    public void Cancel(DateTime cancelledAtUtc)
    {
        if (Status != TeamConstants.InvitationStatuses.Pending)
            return;

        Status = TeamConstants.InvitationStatuses.Cancelled;
        RefreshConcurrencyStamp();
    }

    public void Expire(DateTime expiredAtUtc)
    {
        if (Status != TeamConstants.InvitationStatuses.Pending)
            return;

        var normalizedExpiredAtUtc = EnsureUtc(expiredAtUtc);
        if (ExpiresAt > normalizedExpiredAtUtc)
            return;

        Status = TeamConstants.InvitationStatuses.Expired;
        RefreshConcurrencyStamp();
    }

    private static string NormalizeRole(string role)
    {
        var normalizedRole = role.Trim().ToLowerInvariant();
        if (!TeamConstants.Roles.Manageable.Contains(normalizedRole))
            throw new ArgumentException("Team role is not supported.", nameof(role));

        return normalizedRole;
    }

    private static DateTime EnsureUtc(DateTime value)
    {
        return value.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(value, DateTimeKind.Utc)
            : value.ToUniversalTime();
    }
}
