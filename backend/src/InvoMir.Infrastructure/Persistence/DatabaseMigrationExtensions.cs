using Microsoft.AspNetCore.Builder;

namespace InvoMir.Infrastructure.Persistence;

public static class DatabaseMigrationExtensions
{
    public static async Task MigrateDatabaseAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<AppDbContext>>();

        try
        {
            var pending = (await db.Database.GetPendingMigrationsAsync()).ToList();

            if (pending.Count == 0)
            {
                logger.LogInformation("Database is up to date. No pending migrations.");
                return;
            }

            logger.LogInformation(
                "Applying {Count} pending database migration(s): {Migrations}",
                pending.Count,
                string.Join(", ", pending));

            await db.Database.MigrateAsync();

            logger.LogInformation("Database migrations applied successfully.");
        }
        catch (Exception ex)
        {
            logger.LogCritical(ex, "Database migration failed. Application startup aborted.");
            throw;
        }
    }
}
