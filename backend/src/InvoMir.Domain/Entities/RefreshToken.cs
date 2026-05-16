namespace InvoMir.Domain.Entities;

public sealed class RefreshToken : TenantEntity
{
    public Guid UserId { get; private set; }
    public string Token { get; private set; } = string.Empty;
    public string? DeviceInfo { get; private set; }
    public string? IpAddress { get; private set; }
    public bool IsRevoked { get; private set; }
    public DateTime ExpiresAt { get; private set; }
    public DateTime? RevokedAt { get; private set; }

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsActive => !IsRevoked && !IsExpired;

    private RefreshToken()
    {
    }

    public static RefreshToken Create(
        Guid userId,
        Guid tenantId,
        string token,
        int expiryDays = 7,
        string? deviceInfo = null,
        string? ipAddress = null)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("User id is required.", nameof(userId));

        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        if (string.IsNullOrWhiteSpace(token))
            throw new ArgumentException("Refresh token is required.", nameof(token));

        if (expiryDays <= 0)
            throw new ArgumentOutOfRangeException(nameof(expiryDays), "Refresh token expiry must be positive.");

        var refreshToken = new RefreshToken
        {
            UserId = userId,
            Token = token,
            DeviceInfo = deviceInfo,
            IpAddress = ipAddress,
            ExpiresAt = DateTime.UtcNow.AddDays(expiryDays)
        };

        refreshToken.SetTenant(tenantId);
        return refreshToken;
    }

    public void Revoke()
    {
        if (IsRevoked)
            return;

        IsRevoked = true;
        RevokedAt = DateTime.UtcNow;
    }
}
