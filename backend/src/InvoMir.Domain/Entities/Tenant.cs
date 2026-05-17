using InvoMir.Shared.Constants;

namespace InvoMir.Domain.Entities;

public sealed class Tenant : SoftDeleteEntity
{
    public string Name { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string Plan { get; private set; } = AuthConstants.Plans.Free;
    public DateTime? TrialEndsAt { get; private set; }
    public string? StripeCustomerId { get; private set; }
    public bool IsActive { get; private set; } = true;

    public ICollection<User> Users { get; private set; } = [];

    private Tenant()
    {
    }

    public static Tenant Create(string name, string slug)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Tenant name is required.", nameof(name));

        if (string.IsNullOrWhiteSpace(slug))
            throw new ArgumentException("Tenant slug is required.", nameof(slug));

        return new Tenant
        {
            Name = name.Trim(),
            Slug = slug.ToLowerInvariant().Trim(),
            Plan = AuthConstants.Plans.Free,
            TrialEndsAt = DateTime.UtcNow.AddDays(14)
        };
    }

    public void UpdateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Tenant name is required.", nameof(name));

        Name = name.Trim();
    }

    public void UpdatePlan(string plan)
    {
        if (!AuthConstants.Plans.All.Contains(plan))
            throw new ArgumentException("Plan is not supported.", nameof(plan));

        Plan = plan;
    }

    public void UpdateStripeCustomerId(string stripeCustomerId)
    {
        if (string.IsNullOrWhiteSpace(stripeCustomerId))
            throw new ArgumentException("Stripe customer id is required.", nameof(stripeCustomerId));

        StripeCustomerId = stripeCustomerId.Trim();
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
