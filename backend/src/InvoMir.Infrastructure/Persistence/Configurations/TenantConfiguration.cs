namespace InvoMir.Infrastructure.Persistence.Configurations;

public sealed class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    public void Configure(EntityTypeBuilder<Tenant> builder)
    {
        builder.ToTable("tenants");
        builder.HasKey(tenant => tenant.Id);
        builder.ConfigureSoftDeleteEntity();

        builder.Property(tenant => tenant.Name).HasMaxLength(200).IsRequired();
        builder.Property(tenant => tenant.Slug).HasMaxLength(100).IsRequired();
        builder.Property(tenant => tenant.Plan).HasMaxLength(30).IsRequired().HasDefaultValue(AuthConstants.Plans.Free);
        builder.Property(tenant => tenant.TrialEndsAt);
        builder.Property(tenant => tenant.StripeCustomerId).HasMaxLength(100);
        builder.Property(tenant => tenant.IsActive).IsRequired().HasDefaultValue(true);

        builder.HasIndex(tenant => tenant.Slug).IsUnique();
        builder.HasIndex(tenant => tenant.IsActive);
        builder.HasIndex(tenant => tenant.IsDeleted);
        builder.HasIndex(tenant => new { tenant.IsActive, tenant.IsDeleted });

        builder.HasMany(tenant => tenant.Users)
            .WithOne()
            .HasForeignKey(user => user.TenantId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
