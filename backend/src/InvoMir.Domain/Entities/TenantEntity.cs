namespace InvoMir.Domain.Entities;

public abstract class TenantEntity : SoftDeleteEntity
{
    public Guid TenantId { get; protected set; }

    public void SetTenant(Guid tenantId)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        if (TenantId != Guid.Empty)
            throw new InvalidOperationException("TenantId cannot be changed after assignment.");

        TenantId = tenantId;
    }
}
