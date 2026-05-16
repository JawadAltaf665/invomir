namespace InvoMir.Infrastructure.Persistence.Configurations;

public sealed class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("audit_logs");
        builder.HasKey(auditLog => auditLog.Id);

        builder.Property(auditLog => auditLog.Id).HasColumnName("id");
        builder.Property(auditLog => auditLog.TenantId).HasColumnName("tenant_id");
        builder.Property(auditLog => auditLog.UserId).HasColumnName("user_id");
        builder.Property(auditLog => auditLog.EntityName).HasColumnName("entity_name").HasMaxLength(100).IsRequired();
        builder.Property(auditLog => auditLog.EntityId).HasColumnName("entity_id");
        builder.Property(auditLog => auditLog.Action).HasColumnName("action").HasMaxLength(100).IsRequired();
        builder.Property(auditLog => auditLog.OldValues).HasColumnName("old_values").HasColumnType("jsonb");
        builder.Property(auditLog => auditLog.NewValues).HasColumnName("new_values").HasColumnType("jsonb");
        builder.Property(auditLog => auditLog.IpAddress).HasColumnName("ip_address").HasMaxLength(50);
        builder.Property(auditLog => auditLog.UserAgent).HasColumnName("user_agent").HasMaxLength(500);
        builder.Property(auditLog => auditLog.CreatedAt).HasColumnName("created_at").IsRequired().HasDefaultValueSql("NOW()");

        builder.HasIndex(auditLog => auditLog.TenantId).HasDatabaseName("IX_audit_logs_tenant_id");
        builder.HasIndex(auditLog => auditLog.UserId).HasDatabaseName("IX_audit_logs_user_id");
        builder.HasIndex(auditLog => new { auditLog.EntityName, auditLog.EntityId }).HasDatabaseName("IX_audit_logs_entity_name_entity_id");
        builder.HasIndex(auditLog => auditLog.CreatedAt).HasDatabaseName("IX_audit_logs_created_at");
        builder.HasIndex(auditLog => new { auditLog.TenantId, auditLog.CreatedAt }).HasDatabaseName("IX_audit_logs_tenant_id_created_at");
    }
}
