namespace InvoMir.Infrastructure.Persistence;

public sealed class AppDbContext(
    DbContextOptions<AppDbContext> options,
    ITenantContext tenantContext,
    ICurrentUserContext currentUserContext)
    : DbContext(options), IAppDbContext
{
    public Guid CurrentTenantId => tenantContext.IsAuthenticated ? tenantContext.TenantId : Guid.Empty;

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        ApplyGlobalQueryFilters(modelBuilder);

        base.OnModelCreating(modelBuilder);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditMetadata();

        return await base.SaveChangesAsync(cancellationToken);
    }

    private void ApplyAuditMetadata()
    {
        var utcNow = DateTime.UtcNow;
        var currentUserId = currentUserContext.UserId;

        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State is EntityState.Detached or EntityState.Unchanged)
                continue;

            entry.Entity.EnsureConcurrencyStamp();

            if (entry.Entity is TenantEntity tenantEntity &&
                entry.State == EntityState.Added &&
                tenantEntity.TenantId == Guid.Empty)
            {
                tenantEntity.SetTenant(tenantContext.TenantId);
            }

            if (entry.Entity is SoftDeleteEntity softDeleteEntity &&
                entry.State == EntityState.Deleted)
            {
                entry.State = EntityState.Modified;
                softDeleteEntity.SoftDelete(currentUserId, utcNow);
                continue;
            }

            if (entry.Entity is AuditedEntity auditedEntity)
            {
                if (entry.State == EntityState.Added)
                    auditedEntity.SetCreationAudit(currentUserId, utcNow);
                else if (entry.State == EntityState.Modified)
                    auditedEntity.SetModificationAudit(currentUserId, utcNow);
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.RefreshConcurrencyStamp();
            }
        }
    }

    private void ApplyGlobalQueryFilters(ModelBuilder modelBuilder)
    {
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (!typeof(SoftDeleteEntity).IsAssignableFrom(entityType.ClrType))
                continue;

            var parameter = Expression.Parameter(entityType.ClrType, "entity");
            var isDeletedProperty = Expression.Property(parameter, nameof(SoftDeleteEntity.IsDeleted));
            Expression filterBody = Expression.Equal(isDeletedProperty, Expression.Constant(false));

            if (typeof(TenantEntity).IsAssignableFrom(entityType.ClrType))
            {
                var tenantProperty = Expression.Property(parameter, nameof(TenantEntity.TenantId));
                var currentTenantProperty = Expression.Property(
                    Expression.Constant(this),
                    nameof(CurrentTenantId));

                filterBody = Expression.AndAlso(
                    filterBody,
                    Expression.Equal(tenantProperty, currentTenantProperty));
            }

            var filter = Expression.Lambda(filterBody, parameter);

            modelBuilder.Entity(entityType.ClrType).HasQueryFilter(filter);
        }
    }
}
