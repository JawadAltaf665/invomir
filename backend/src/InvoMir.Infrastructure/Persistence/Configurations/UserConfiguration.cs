namespace InvoMir.Infrastructure.Persistence.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");
        builder.HasKey(user => user.Id);
        builder.ConfigureTenantEntity();

        builder.Property(user => user.Email).HasMaxLength(255).IsRequired();
        builder.Property(user => user.PasswordHash).HasMaxLength(255).IsRequired();
        builder.Property(user => user.FirstName).HasMaxLength(100).IsRequired();
        builder.Property(user => user.LastName).HasMaxLength(100).IsRequired();
        builder.Property(user => user.Role).HasMaxLength(20).IsRequired().HasDefaultValue(AuthConstants.Roles.Owner);
        builder.Property(user => user.Plan).HasMaxLength(30).IsRequired().HasDefaultValue(AuthConstants.Plans.Free);
        builder.Property(user => user.LogoUrl).HasMaxLength(500);
        builder.Property(user => user.Currency).HasMaxLength(10).IsRequired().HasDefaultValue("USD");
        builder.Property(user => user.TaxPercent).HasColumnType("decimal(5,2)").HasDefaultValue(0);
        builder.Property(user => user.StripeAccountId).HasMaxLength(100);
        builder.Property(user => user.IsActive).IsRequired().HasDefaultValue(true);
        builder.Property(user => user.EmailVerified).IsRequired().HasDefaultValue(false);
        builder.Property(user => user.LastLoginAt);
        builder.Property(user => user.TrialEndsAt);

        builder.HasIndex(user => user.Email)
            .IsUnique()
            .HasFilter("\"IsDeleted\" = false");
        builder.HasIndex(user => user.TenantId);
        builder.HasIndex(user => new { user.TenantId, user.IsDeleted });
        builder.HasIndex(user => new { user.TenantId, user.IsActive });
        builder.HasIndex(user => new { user.TenantId, user.IsActive, user.IsDeleted });

        builder.HasMany(user => user.RefreshTokens)
            .WithOne()
            .HasForeignKey(token => token.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(user => user.PasswordResetTokens)
            .WithOne()
            .HasForeignKey(token => token.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(user => user.EmailVerificationTokens)
            .WithOne()
            .HasForeignKey(token => token.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
