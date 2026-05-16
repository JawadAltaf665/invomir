namespace InvoMir.Domain.Entities;

public abstract class BaseEntity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();
    public string ConcurrencyStamp { get; protected set; } = Guid.NewGuid().ToString("N");

    public void EnsureConcurrencyStamp()
    {
        if (string.IsNullOrWhiteSpace(ConcurrencyStamp))
            ConcurrencyStamp = Guid.NewGuid().ToString("N");
    }

    public void RefreshConcurrencyStamp() => ConcurrencyStamp = Guid.NewGuid().ToString("N");
}
