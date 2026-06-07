namespace InvoMir.Application.Interfaces;

public interface IUserProfilePictureStorageService
{
    Task<string> SaveProfilePictureAsync(
        Guid tenantId,
        Guid userId,
        string fileName,
        string contentType,
        byte[] content,
        CancellationToken cancellationToken);
}
