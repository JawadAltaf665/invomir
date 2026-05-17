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
}
