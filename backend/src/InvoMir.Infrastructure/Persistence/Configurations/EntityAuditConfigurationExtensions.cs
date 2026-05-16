namespace InvoMir.Infrastructure.Persistence.Configurations;

public static class EntityAuditConfigurationExtensions
{
    public static void ConfigureBaseEntity<TEntity>(this EntityTypeBuilder<TEntity> builder)
        where TEntity : BaseEntity
    {
        builder.Property(entity => entity.ConcurrencyStamp)
            .HasMaxLength(40)
            .IsConcurrencyToken()
            .IsRequired();
    }

    public static void ConfigureAuditedEntity<TEntity>(this EntityTypeBuilder<TEntity> builder)
        where TEntity : AuditedEntity
    {
        builder.ConfigureBaseEntity();

        builder.Property(entity => entity.CreationTime)
            .IsRequired()
            .HasDefaultValueSql("NOW()");

        builder.Property(entity => entity.CreatorUserId);
        builder.Property(entity => entity.LastModificationTime);
        builder.Property(entity => entity.LastModifierUserId);
    }

    public static void ConfigureSoftDeleteEntity<TEntity>(this EntityTypeBuilder<TEntity> builder)
        where TEntity : SoftDeleteEntity
    {
        builder.ConfigureAuditedEntity();

        builder.Property(entity => entity.IsDeleted)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(entity => entity.DeletionTime);
        builder.Property(entity => entity.DeleterUserId);
    }

    public static void ConfigureTenantEntity<TEntity>(this EntityTypeBuilder<TEntity> builder)
        where TEntity : TenantEntity
    {
        builder.ConfigureSoftDeleteEntity();

        builder.Property(entity => entity.TenantId).IsRequired();
    }
}
