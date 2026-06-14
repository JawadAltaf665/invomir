namespace InvoMir.Infrastructure.Persistence.Configurations;

public sealed class QueuedEmailConfiguration : IEntityTypeConfiguration<QueuedEmail>
{
    public void Configure(EntityTypeBuilder<QueuedEmail> builder)
    {
        builder.ToTable("queued_emails");
        builder.HasKey(email => email.Id);
        builder.ConfigureSoftDeleteEntity();

        builder.Property(email => email.TenantId);

        builder.Property(email => email.TemplateType)
            .HasConversion<string>()
            .HasMaxLength(60);

        builder.Property(email => email.ToEmail)
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(email => email.ToName)
            .HasMaxLength(200);

        builder.Property(email => email.Cc)
            .HasMaxLength(1000);

        builder.Property(email => email.Bcc)
            .HasMaxLength(1000);

        builder.Property(email => email.Subject)
            .HasMaxLength(300)
            .IsRequired();

        builder.Property(email => email.Body)
            .IsRequired();

        builder.Property(email => email.Status)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired()
            .HasDefaultValue(QueuedEmailStatus.Pending);

        builder.Property(email => email.RetryCount)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(email => email.MaxRetryCount)
            .IsRequired()
            .HasDefaultValue(3);

        builder.Property(email => email.ErrorMessage)
            .HasMaxLength(2000);

        builder.Property(email => email.ScheduledAt);
        builder.Property(email => email.SentAt);
        builder.Property(email => email.LastAttemptAt);

        builder.Property(email => email.AttachmentFileName)
            .HasMaxLength(255);

        builder.Property(email => email.AttachmentContentType)
            .HasMaxLength(100);

        builder.Property(email => email.AttachmentContentBase64);

        builder.HasIndex(email => email.Status);
        builder.HasIndex(email => email.ScheduledAt);
        builder.HasIndex(email => email.CreationTime);
        builder.HasIndex(email => email.TenantId);
        builder.HasIndex(email => email.TemplateType);
        builder.HasIndex(email => new { email.Status, email.ScheduledAt, email.CreationTime });
        builder.HasIndex(email => new { email.TenantId, email.Status });
    }
}
