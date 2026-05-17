namespace InvoMir.Domain.Entities;

public sealed class EmailVerificationToken : SoftDeleteEntity
{
    public Guid UserId { get; private set; }
    public string Token { get; private set; } = string.Empty;
    public bool IsUsed { get; private set; }
    public DateTime ExpiresAt { get; private set; }
    public DateTime? UsedAt { get; private set; }

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsValid => !IsUsed && !IsExpired;

    private EmailVerificationToken()
    {
    }

    public static EmailVerificationToken Create(Guid userId, string token, int expiryHours = 24)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("User id is required.", nameof(userId));

        if (string.IsNullOrWhiteSpace(token))
            throw new ArgumentException("Verification token is required.", nameof(token));

        if (expiryHours <= 0)
            throw new ArgumentOutOfRangeException(nameof(expiryHours), "Verification token expiry must be positive.");

        return new EmailVerificationToken
        {
            UserId = userId,
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddHours(expiryHours)
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
