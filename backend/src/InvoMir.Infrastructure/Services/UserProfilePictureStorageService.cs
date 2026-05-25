using Microsoft.Extensions.Hosting;

namespace InvoMir.Infrastructure.Services;

public sealed class UserProfilePictureStorageService(IHostEnvironment environment)
    : IUserProfilePictureStorageService
{
    public async Task<string> SaveProfilePictureAsync(
        Guid tenantId,
        Guid userId,
        string fileName,
        string contentType,
        byte[] content,
        CancellationToken cancellationToken)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        var profilePictureDirectory = Path.Combine(
            environment.ContentRootPath,
            "wwwroot",
            "profile-pictures",
            tenantId.ToString("N"));

        Directory.CreateDirectory(profilePictureDirectory);

        foreach (var existingProfilePicture in Directory.EnumerateFiles(profilePictureDirectory, $"{userId:N}.*"))
            File.Delete(existingProfilePicture);

        var storedFileName = $"{userId:N}{extension}";
        var storedPath = Path.Combine(profilePictureDirectory, storedFileName);

        await File.WriteAllBytesAsync(storedPath, content, cancellationToken);

        return $"/profile-pictures/{tenantId:N}/{storedFileName}";
    }
}
