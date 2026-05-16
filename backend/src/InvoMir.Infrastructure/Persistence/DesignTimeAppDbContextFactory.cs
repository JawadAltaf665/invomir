namespace InvoMir.Infrastructure.Persistence;

public sealed class DesignTimeAppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var connectionString = GetConnectionString();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new AppDbContext(options, new DesignTimeTenantContext(), new DesignTimeCurrentUserContext());
    }

    private static string GetConnectionString()
    {
        var environmentConnectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? Environment.GetEnvironmentVariable("ConnectionStrings:DefaultConnection");

        var connectionString = string.IsNullOrWhiteSpace(environmentConnectionString)
            ? GetConnectionStringFromAppSettings()
            : environmentConnectionString;

        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException(
                "ConnectionStrings:DefaultConnection is not configured for EF migrations.");

        if (LooksLikeSqlServerConnectionString(connectionString))
            throw new InvalidOperationException(
                "DefaultConnection is a SQL Server connection string, but InvoMir is configured for PostgreSQL/Npgsql. Use a PostgreSQL connection string like: Host=localhost;Port=5432;Database=invomir_db;Username=postgres;Password=your_password");

        return connectionString;
    }

    private static string? GetConnectionStringFromAppSettings()
    {
        var apiProjectPath = ResolveApiProjectPath();
        var connectionString = ReadConnectionString(Path.Combine(apiProjectPath, "appsettings.json"));
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
        var environmentConnectionString = ReadConnectionString(
            Path.Combine(apiProjectPath, $"appsettings.{environment}.json"));

        return string.IsNullOrWhiteSpace(environmentConnectionString)
            ? connectionString
            : environmentConnectionString;
    }

    private static string ResolveApiProjectPath()
    {
        var currentDirectory = Directory.GetCurrentDirectory();
        var directPath = Path.Combine(currentDirectory, "src", "InvoMir.API", "InvoMir.API");
        if (Directory.Exists(directPath))
            return directPath;

        var parentPath = Path.Combine(currentDirectory, "..", "InvoMir.API", "InvoMir.API");
        if (Directory.Exists(parentPath))
            return Path.GetFullPath(parentPath);

        return currentDirectory;
    }

    private static string? ReadConnectionString(string path)
    {
        if (!File.Exists(path))
            return null;

        using var stream = File.OpenRead(path);
        using var document = JsonDocument.Parse(stream);

        if (!document.RootElement.TryGetProperty("ConnectionStrings", out var connectionStrings))
            return null;

        if (!connectionStrings.TryGetProperty("DefaultConnection", out var defaultConnection))
            return null;

        return defaultConnection.GetString();
    }

    private static bool LooksLikeSqlServerConnectionString(string connectionString)
    {
        return connectionString.Contains("TrustServerCertificate", StringComparison.OrdinalIgnoreCase)
            || connectionString.Contains("MultipleActiveResultSets", StringComparison.OrdinalIgnoreCase)
            || connectionString.Contains("User Id=sa", StringComparison.OrdinalIgnoreCase);
    }

    private sealed class DesignTimeTenantContext : ITenantContext
    {
        public Guid TenantId => Guid.Empty;
        public bool IsAuthenticated => false;
    }

    private sealed class DesignTimeCurrentUserContext : ICurrentUserContext
    {
        public Guid? UserId => null;
        public bool IsAuthenticated => false;
    }
}
