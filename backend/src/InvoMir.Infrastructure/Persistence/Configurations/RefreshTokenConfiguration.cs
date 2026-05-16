namespace InvoMir.Infrastructure.Persistence.Configurations;

public sealed class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("refresh_tokens");
        builder.HasKey(token => token.Id);
        builder.ConfigureTenantEntity();

        builder.Property(token => token.UserId).IsRequired();
        builder.Property(token => token.Token).HasMaxLength(200).IsRequired();
        builder.Property(token => token.DeviceInfo).HasMaxLength(500);
        builder.Property(token => token.IpAddress).HasMaxLength(50);
        builder.Property(token => token.IsRevoked).IsRequired().HasDefaultValue(false);
        builder.Property(token => token.ExpiresAt).IsRequired();
        builder.Property(token => token.RevokedAt);

        builder.Ignore(token => token.IsExpired);
        builder.Ignore(token => token.IsActive);

        builder.HasIndex(token => token.Token).IsUnique();
        builder.HasIndex(token => token.UserId);
        builder.HasIndex(token => token.TenantId);
        builder.HasIndex(token => new { token.TenantId, token.IsDeleted });
        builder.HasIndex(token => new { token.UserId, token.IsRevoked });
        builder.HasIndex(token => new { token.UserId, token.IsRevoked, token.IsDeleted });
        builder.HasIndex(token => new { token.TenantId, token.UserId, token.IsRevoked });
        builder.HasIndex(token => new { token.TenantId, token.UserId, token.IsRevoked, token.IsDeleted });
    }
}
