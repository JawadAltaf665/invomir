namespace InvoMir.Infrastructure.Persistence.Configurations;

public sealed class SubscriptionConfiguration : IEntityTypeConfiguration<Subscription>
{
    public void Configure(EntityTypeBuilder<Subscription> builder)
    {
        builder.ToTable("subscriptions");
        builder.HasKey(subscription => subscription.Id);
        builder.ConfigureTenantEntity();

        builder.Property(subscription => subscription.UserId).IsRequired();
        builder.Property(subscription => subscription.StripeSubscriptionId).HasMaxLength(128).IsRequired();
        builder.Property(subscription => subscription.StripeCustomerId).HasMaxLength(128);
        builder.Property(subscription => subscription.Plan).HasMaxLength(30).IsRequired();
        builder.Property(subscription => subscription.Status).HasMaxLength(30).IsRequired();
        builder.Property(subscription => subscription.Interval).HasMaxLength(10).IsRequired();
        builder.Property(subscription => subscription.Amount).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(subscription => subscription.Currency).HasMaxLength(10).IsRequired();
        builder.Property(subscription => subscription.CurrentPeriodStart).IsRequired();
        builder.Property(subscription => subscription.CurrentPeriodEnd).IsRequired();
        builder.Property(subscription => subscription.CancelAtPeriodEnd).IsRequired().HasDefaultValue(false);
        builder.Property(subscription => subscription.CancelledAt);

        builder.HasIndex(subscription => subscription.StripeSubscriptionId).IsUnique();
        builder.HasIndex(subscription => subscription.TenantId);
        builder.HasIndex(subscription => new { subscription.TenantId, subscription.UserId });
        builder.HasIndex(subscription => new { subscription.TenantId, subscription.Status });
        builder.HasIndex(subscription => new { subscription.TenantId, subscription.CurrentPeriodEnd });

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(subscription => subscription.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
