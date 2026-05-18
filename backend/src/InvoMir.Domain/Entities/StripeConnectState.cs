namespace InvoMir.Domain.Entities;

public sealed class StripeConnectState : TenantEntity
{
    public Guid UserId { get; private set; }
    public string State { get; private set; } = string.Empty;
    public DateTime ExpiresAt { get; private set; }
    public DateTime? UsedAt { get; private set; }

    public bool IsUsed => UsedAt.HasValue;
    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsActive => !IsUsed && !IsExpired;

    private StripeConnectState()
    {
    }

    public static StripeConnectState Create(
        Guid userId,
        Guid tenantId,
        string state,
        int expiryMinutes = 15)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("User id is required.", nameof(userId));

        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        if (string.IsNullOrWhiteSpace(state))
            throw new ArgumentException("Stripe Connect state is required.", nameof(state));

        if (expiryMinutes <= 0)
            throw new ArgumentOutOfRangeException(nameof(expiryMinutes), "State expiry must be positive.");

        var connectState = new StripeConnectState
        {
            UserId = userId,
            State = state.Trim(),
            ExpiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes)
        };

        connectState.SetTenant(tenantId);
        return connectState;
    }

    public void MarkUsed()
    {
        if (UsedAt.HasValue)
            return;

        UsedAt = DateTime.UtcNow;
    }
}
