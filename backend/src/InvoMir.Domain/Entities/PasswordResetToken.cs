namespace InvoMir.Domain.Entities;

public sealed class PasswordResetToken : SoftDeleteEntity
{
    public Guid UserId { get; private set; }
    public string Token { get; private set; } = string.Empty;
    public bool IsUsed { get; private set; }
    public DateTime ExpiresAt { get; private set; }
    public DateTime? UsedAt { get; private set; }

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsValid => !IsUsed && !IsExpired;

    private PasswordResetToken()
    {
    }

    public static PasswordResetToken Create(Guid userId, string token, int expiryMinutes = 15)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("User id is required.", nameof(userId));

        if (string.IsNullOrWhiteSpace(token))
            throw new ArgumentException("Reset token is required.", nameof(token));

        if (expiryMinutes <= 0)
            throw new ArgumentOutOfRangeException(nameof(expiryMinutes), "Reset token expiry must be positive.");

        return new PasswordResetToken
        {
            UserId = userId,
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes)
        };
    }

    public void MarkUsed()
    {
        if (IsUsed)
            return;

        IsUsed = true;
        UsedAt = DateTime.UtcNow;
    }
}
