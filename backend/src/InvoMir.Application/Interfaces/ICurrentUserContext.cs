namespace InvoMir.Application.Interfaces;

public interface ICurrentUserContext
{
    Guid? UserId { get; }
    bool IsAuthenticated { get; }
}
