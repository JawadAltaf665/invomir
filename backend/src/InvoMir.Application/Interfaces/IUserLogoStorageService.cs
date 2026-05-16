namespace InvoMir.Application.Interfaces;

public interface IUserLogoStorageService
{
    Task<string> SaveLogoAsync(
        Guid tenantId,
        Guid userId,
        string fileName,
        string contentType,
        byte[] content,
        CancellationToken cancellationToken);
}
