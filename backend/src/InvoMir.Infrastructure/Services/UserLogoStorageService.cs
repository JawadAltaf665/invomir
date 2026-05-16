using Microsoft.Extensions.Hosting;

namespace InvoMir.Infrastructure.Services;

public sealed class UserLogoStorageService(IHostEnvironment environment) : IUserLogoStorageService
{
    public async Task<string> SaveLogoAsync(
        Guid tenantId,
        Guid userId,
        string fileName,
        string contentType,
        byte[] content,
        CancellationToken cancellationToken)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        var logoDirectory = Path.Combine(
            environment.ContentRootPath,
            "wwwroot",
            "logos",
            tenantId.ToString("N"));

        Directory.CreateDirectory(logoDirectory);

        foreach (var existingLogo in Directory.EnumerateFiles(logoDirectory, $"{userId:N}.*"))
            File.Delete(existingLogo);

        var storedFileName = $"{userId:N}{extension}";
        var storedPath = Path.Combine(logoDirectory, storedFileName);

        await File.WriteAllBytesAsync(storedPath, content, cancellationToken);

        return $"/logos/{tenantId:N}/{storedFileName}";
    }
}
