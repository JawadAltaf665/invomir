namespace InvoMir.Infrastructure.Persistence.Configurations;

public sealed class StripeConnectStateConfiguration : IEntityTypeConfiguration<StripeConnectState>
{
    public void Configure(EntityTypeBuilder<StripeConnectState> builder)
    {
        builder.ToTable("stripe_connect_states");
        builder.HasKey(connectState => connectState.Id);
        builder.ConfigureTenantEntity();

        builder.Property(connectState => connectState.UserId).IsRequired();
        builder.Property(connectState => connectState.State).HasMaxLength(200).IsRequired();
        builder.Property(connectState => connectState.ExpiresAt).IsRequired();
        builder.Property(connectState => connectState.UsedAt);

        builder.HasIndex(connectState => connectState.State).IsUnique();
        builder.HasIndex(connectState => connectState.UserId);
        builder.HasIndex(connectState => new { connectState.TenantId, connectState.UserId });
        builder.HasIndex(connectState => new { connectState.TenantId, connectState.IsDeleted });
    }
}
