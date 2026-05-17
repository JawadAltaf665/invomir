namespace InvoMir.Domain.Entities;

public abstract class SoftDeleteEntity : AuditedEntity
{
    public bool IsDeleted { get; protected set; }
    public DateTime? DeletionTime { get; protected set; }
    public Guid? DeleterUserId { get; protected set; }

    public void SoftDelete(Guid? deleterUserId, DateTime utcNow)
    {
        if (IsDeleted)
            return;

        IsDeleted = true;
        DeletionTime = utcNow;
        DeleterUserId = deleterUserId;
        SetModificationAudit(deleterUserId, utcNow);
    }
}
