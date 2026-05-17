namespace InvoMir.Application.Interfaces;

public interface ITenantContext
{
    Guid TenantId { get; }
    bool IsAuthenticated { get; }
}
