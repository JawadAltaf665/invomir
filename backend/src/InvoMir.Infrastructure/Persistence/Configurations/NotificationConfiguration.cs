namespace InvoMir.Infrastructure.Persistence.Configurations;

public sealed class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("notifications");
        builder.HasKey(notification => notification.Id);
        builder.ConfigureTenantEntity();

        builder.Property(notification => notification.Title).HasMaxLength(200).IsRequired();
        builder.Property(notification => notification.Message).HasMaxLength(1000).IsRequired();
        builder.Property(notification => notification.Type).HasMaxLength(40).IsRequired();
        builder.Property(notification => notification.Priority).HasMaxLength(20).IsRequired();
        builder.Property(notification => notification.Target).HasMaxLength(20).IsRequired();
        builder.Property(notification => notification.UserId).IsRequired();
        builder.Property(notification => notification.RoleId).HasMaxLength(40);
        builder.Property(notification => notification.IsRead).IsRequired().HasDefaultValue(false);
        builder.Property(notification => notification.ReadAt);
        builder.Property(notification => notification.ActionUrl).HasMaxLength(500);
        builder.Property(notification => notification.MetadataJson).HasColumnType("jsonb");

        builder.HasIndex(notification => notification.TenantId);
        builder.HasIndex(notification => new { notification.TenantId, notification.UserId, notification.IsRead });
        builder.HasIndex(notification => new { notification.TenantId, notification.UserId, notification.CreationTime });
        builder.HasIndex(notification => new { notification.TenantId, notification.Type });
        builder.HasIndex(notification => new { notification.TenantId, notification.Priority });
        builder.HasIndex(notification => new { notification.TenantId, notification.RoleId });
        builder.HasIndex(notification => new { notification.TenantId, notification.IsRead, notification.CreationTime });
    }
}
