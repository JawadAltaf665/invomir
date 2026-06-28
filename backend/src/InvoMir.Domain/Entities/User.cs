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
    public string? ProfilePictureUrl { get; private set; }
    public string Currency { get; private set; } = "USD";
    public string PreferredLanguage { get; private set; } = LanguageConstants.Default;
    public decimal TaxPercent { get; private set; }
    public string? StripeAccountId { get; private set; }
    public bool IsActive { get; private set; } = true;
    public bool EmailVerified { get; private set; }
    public DateTime? LastLoginAt { get; private set; }
    public DateTime? TrialEndsAt { get; private set; }

    public ICollection<RefreshToken> RefreshTokens { get; private set; } = [];
    public ICollection<PasswordResetToken> PasswordResetTokens { get; private set; } = [];
    public ICollection<EmailVerificationToken> EmailVerificationTokens { get; private set; } = [];

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

    public static User CreateTeamMember(
        Guid tenantId,
        string email,
        string passwordHash,
        string firstName,
        string lastName,
        string role,
        string plan,
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

        var normalizedRole = role.Trim().ToLowerInvariant();
        if (!TeamConstants.Roles.Manageable.Contains(normalizedRole))
            throw new ArgumentException("Team role is not supported.", nameof(role));

        var normalizedPlan = plan.Trim().ToLowerInvariant();
        if (!AuthConstants.Plans.All.Contains(normalizedPlan))
            throw new ArgumentException("Plan is not supported.", nameof(plan));

        var user = new User
        {
            Email = email.ToLowerInvariant().Trim(),
            PasswordHash = passwordHash,
            FirstName = firstName.Trim(),
            LastName = lastName.Trim(),
            Currency = currency.ToUpperInvariant().Trim(),
            TaxPercent = taxPercent,
            Role = normalizedRole,
            Plan = normalizedPlan,
            TrialEndsAt = null
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

    public void UpdateProfile(string? currency, decimal? taxPercent)
    {
        if (currency is not null)
        {
            var normalizedCurrency = currency.ToUpperInvariant().Trim();
            if (!AuthConstants.SupportedCurrencies.Contains(normalizedCurrency))
                throw new ArgumentException("Currency is not supported.", nameof(currency));

            Currency = normalizedCurrency;
        }

        if (taxPercent is not null)
        {
            if (taxPercent is < 0 or > 100)
                throw new ArgumentOutOfRangeException(nameof(taxPercent), "Tax percent must be between 0 and 100.");

            TaxPercent = taxPercent.Value;
        }
    }

    public void UpdateLogoUrl(string logoUrl)
    {
        if (string.IsNullOrWhiteSpace(logoUrl))
            throw new ArgumentException("Logo URL is required.", nameof(logoUrl));

        LogoUrl = logoUrl.Trim();
    }

    public void UpdatePreferredLanguage(string language)
    {
        if (!LanguageConstants.TryNormalize(language, out var normalizedLanguage))
            throw new ArgumentException("Language is not supported.", nameof(language));

        PreferredLanguage = normalizedLanguage;
    }

    public void UpdateProfilePictureUrl(string profilePictureUrl)
    {
        if (string.IsNullOrWhiteSpace(profilePictureUrl))
            throw new ArgumentException("Profile picture URL is required.", nameof(profilePictureUrl));

        ProfilePictureUrl = profilePictureUrl.Trim();
    }

    public void UpdateStripeAccountId(string stripeAccountId)
    {
        if (string.IsNullOrWhiteSpace(stripeAccountId))
            throw new ArgumentException("Stripe account id is required.", nameof(stripeAccountId));

        StripeAccountId = stripeAccountId.Trim();
    }

    public void ClearStripeAccountId()
    {
        StripeAccountId = null;
    }

    public void UpdatePlan(string plan)
    {
        if (!AuthConstants.Plans.All.Contains(plan))
            throw new ArgumentException("Plan is not supported.", nameof(plan));

        Plan = plan;
    }

    public void UpdateRole(string role)
    {
        var normalizedRole = role.Trim().ToLowerInvariant();
        if (!AuthConstants.Roles.All.Contains(normalizedRole))
            throw new ArgumentException("Role is not supported.", nameof(role));

        Role = normalizedRole;
    }

    public void UpdateTrialEndsAt(DateTime trialEndsAtUtc)
    {
        var normalizedTrialEndsAtUtc = EnsureUtc(trialEndsAtUtc);

        if (normalizedTrialEndsAtUtc <= DateTime.UtcNow)
            throw new ArgumentOutOfRangeException(nameof(trialEndsAtUtc), "Trial end date must be in the future.");

        TrialEndsAt = normalizedTrialEndsAtUtc;
    }

    private static DateTime EnsureUtc(DateTime value)
    {
        return value.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(value, DateTimeKind.Utc)
            : value.ToUniversalTime();
    }
}
