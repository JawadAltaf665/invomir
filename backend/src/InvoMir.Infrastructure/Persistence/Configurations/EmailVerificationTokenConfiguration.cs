namespace InvoMir.Infrastructure.Persistence.Configurations;

public sealed class EmailVerificationTokenConfiguration : IEntityTypeConfiguration<EmailVerificationToken>
{
    public void Configure(EntityTypeBuilder<EmailVerificationToken> builder)
    {
        builder.ToTable("email_verification_tokens");
        builder.HasKey(token => token.Id);
        builder.ConfigureSoftDeleteEntity();

        builder.Property(token => token.UserId).IsRequired();
        builder.Property(token => token.Token).HasMaxLength(200).IsRequired();
        builder.Property(token => token.IsUsed).IsRequired().HasDefaultValue(false);
        builder.Property(token => token.ExpiresAt).IsRequired();
        builder.Property(token => token.UsedAt);

        builder.Ignore(token => token.IsExpired);
        builder.Ignore(token => token.IsValid);

        builder.HasIndex(token => token.Token).IsUnique();
        builder.HasIndex(token => token.UserId);
        builder.HasIndex(token => new { token.UserId, token.IsDeleted });
        builder.HasIndex(token => new { token.UserId, token.IsUsed });
        builder.HasIndex(token => new { token.UserId, token.IsUsed, token.IsDeleted });
    }
}
