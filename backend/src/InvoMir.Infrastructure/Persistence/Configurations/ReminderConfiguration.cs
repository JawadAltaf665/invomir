namespace InvoMir.Infrastructure.Persistence.Configurations;

public sealed class ReminderConfiguration : IEntityTypeConfiguration<Reminder>
{
    public void Configure(EntityTypeBuilder<Reminder> builder)
    {
        builder.ToTable("reminders");
        builder.HasKey(reminder => reminder.Id);
        builder.ConfigureTenantEntity();

        builder.Property(reminder => reminder.InvoiceId).IsRequired();
        builder.Property(reminder => reminder.UserId).IsRequired();
        builder.Property(reminder => reminder.Type).HasMaxLength(40).IsRequired();
        builder.Property(reminder => reminder.Status)
            .HasMaxLength(30)
            .IsRequired()
            .HasDefaultValue(ReminderConstants.Statuses.Pending);
        builder.Property(reminder => reminder.ScheduledForUtc).IsRequired();
        builder.Property(reminder => reminder.SentAt);
        builder.Property(reminder => reminder.CancelledAt);
        builder.Property(reminder => reminder.HangfireJobId).HasMaxLength(80);
        builder.Property(reminder => reminder.FailureReason).HasMaxLength(500);

        builder.HasIndex(reminder => reminder.TenantId);
        builder.HasIndex(reminder => new { reminder.TenantId, reminder.InvoiceId });
        builder.HasIndex(reminder => new { reminder.TenantId, reminder.UserId });
        builder.HasIndex(reminder => new { reminder.TenantId, reminder.Status, reminder.ScheduledForUtc });
        builder.HasIndex(reminder => new { reminder.TenantId, reminder.InvoiceId, reminder.Type, reminder.Status });
        builder.HasIndex(reminder => reminder.HangfireJobId);

        builder.HasOne(reminder => reminder.Invoice)
            .WithMany()
            .HasForeignKey(reminder => reminder.InvoiceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
