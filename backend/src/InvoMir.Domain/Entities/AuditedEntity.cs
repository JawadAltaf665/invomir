namespace InvoMir.Domain.Entities;

public abstract class AuditedEntity : BaseEntity
{
    public DateTime CreationTime { get; protected set; }
    public Guid? CreatorUserId { get; protected set; }
    public DateTime? LastModificationTime { get; protected set; }
    public Guid? LastModifierUserId { get; protected set; }

    public void SetCreationAudit(Guid? creatorUserId, DateTime utcNow)
    {
        if (CreationTime == default)
            CreationTime = utcNow;

        CreatorUserId ??= creatorUserId;
        EnsureConcurrencyStamp();
    }

    public void SetModificationAudit(Guid? modifierUserId, DateTime utcNow)
    {
        LastModificationTime = utcNow;
        LastModifierUserId = modifierUserId;
        RefreshConcurrencyStamp();
    }
}
