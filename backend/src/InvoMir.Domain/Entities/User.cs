using InvoMir.Shared.Constants;

namespace InvoMir.Domain.Entities;

public sealed class User : TenantEntity
{
    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public string FirstName { get; private set; } = string.Empty;
    public string LastName { get; private set; } = string.Empty;
    public string Role { get; private set; } = AuthConstants.Roles.Owner;
    public string Plan { get; private set; } = AuthConstants.Plans.Free;
    public string? LogoUrl { get; private set; }
    public string Currency { get; private set; } = "USD";
    public decimal TaxPercent { get; private set; }
    public string? StripeAccountId { get; private set; }
    public bool IsActive { get; private set; } = true;
    public bool EmailVerified { get; private set; }
    public DateTime? LastLoginAt { get; private set; }
    public DateTime? TrialEndsAt { get; private set; }

    public ICollection<RefreshToken> RefreshTokens { get; private set; } = [];
    public ICollection<PasswordResetToken> PasswordResetTokens { get; private set; } = [];

    private User()
    {
    }

    public static User Create(
        Guid tenantId,
        string email,
        string passwordHash,
        string firstName,
        string lastName,
        string currency = "USD",
        decimal taxPercent = 0)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email is required.", nameof(email));

        if (string.IsNullOrWhiteSpace(passwordHash))
            throw new ArgumentException("Password hash is required.", nameof(passwordHash));

        if (string.IsNullOrWhiteSpace(firstName))
            throw new ArgumentException("First name is required.", nameof(firstName));

        if (string.IsNullOrWhiteSpace(lastName))
            throw new ArgumentException("Last name is required.", nameof(lastName));

        var user = new User
        {
            Email = email.ToLowerInvariant().Trim(),
            PasswordHash = passwordHash,
            FirstName = firstName.Trim(),
            LastName = lastName.Trim(),
            Currency = currency.ToUpperInvariant().Trim(),
            TaxPercent = taxPercent,
            Role = AuthConstants.Roles.Owner,
            Plan = AuthConstants.Plans.Free,
            TrialEndsAt = DateTime.UtcNow.AddDays(14)
        };

        user.SetTenant(tenantId);
        return user;
    }

    public void RecordLogin() => LastLoginAt = DateTime.UtcNow;

    public void VerifyEmail() => EmailVerified = true;

    public void UpdatePasswordHash(string newHash)
    {
        if (string.IsNullOrWhiteSpace(newHash))
            throw new ArgumentException("Password hash is required.", nameof(newHash));

        PasswordHash = newHash;
    }
}
