namespace InvoMir.Infrastructure.Persistence.Configurations;

public sealed class EmailLogConfiguration : IEntityTypeConfiguration<EmailLog>
{
    public void Configure(EntityTypeBuilder<EmailLog> builder)
    {
        builder.ToTable("email_logs");
        builder.HasKey(emailLog => emailLog.Id);
        builder.ConfigureTenantEntity();

        builder.Property(emailLog => emailLog.InvoiceId);
        builder.Property(emailLog => emailLog.UserId);
        builder.Property(emailLog => emailLog.Type).HasMaxLength(50).IsRequired();
        builder.Property(emailLog => emailLog.ToEmail).HasMaxLength(256).IsRequired();
        builder.Property(emailLog => emailLog.Subject).HasMaxLength(256).IsRequired();
        builder.Property(emailLog => emailLog.Status).HasMaxLength(30).IsRequired();
        builder.Property(emailLog => emailLog.SendGridMessageId).HasMaxLength(128);
        builder.Property(emailLog => emailLog.FailureReason);
        builder.Property(emailLog => emailLog.SentAt);
        builder.Property(emailLog => emailLog.DeliveredAt);

        builder.HasIndex(emailLog => emailLog.TenantId);
        builder.HasIndex(emailLog => new { emailLog.TenantId, emailLog.InvoiceId });
        builder.HasIndex(emailLog => new { emailLog.TenantId, emailLog.UserId });
        builder.HasIndex(emailLog => new { emailLog.TenantId, emailLog.Type });
        builder.HasIndex(emailLog => new { emailLog.TenantId, emailLog.Status });
        builder.HasIndex(emailLog => new { emailLog.TenantId, emailLog.CreationTime });
    }
}
