using DinkToPdf;
using DinkToPdf.Contracts;
using Hangfire;
using Hangfire.Dashboard;
using InvoMir.API.Extensions;
using InvoMir.API.HealthChecks;
using InvoMir.API.Middlewares;
using InvoMir.Application;
using InvoMir.Infrastructure;
using InvoMir.Infrastructure.BackgroundJobs;
using InvoMir.Infrastructure.RateLimiting;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.OpenApi;
using System.Net;
using System.Runtime.InteropServices;
using System.Runtime.Loader;
using System.Text.Json;

var nativePdfLibraryName = RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
    ? "libwkhtmltox.dll"
    : RuntimeInformation.IsOSPlatform(OSPlatform.Linux)
        ? "libwkhtmltox.so"
        : throw new PlatformNotSupportedException("DinkToPdf native library is only configured for Windows and Linux.");
var nativePdfLibraryPath = Path.Combine(AppContext.BaseDirectory, nativePdfLibraryName);
new CustomAssemblyLoadContext().LoadUnmanagedLibrary(nativePdfLibraryPath);

var builder = WebApplication.CreateBuilder(args);

if (builder.Environment.IsDevelopment())
{
    builder.Logging.ClearProviders();
    builder.Logging.AddConsole();
    builder.Logging.AddDebug();

    var dataProtectionKeysPath = Path.Combine(
        builder.Environment.ContentRootPath,
        "App_Data",
        "DataProtectionKeys");

    Directory.CreateDirectory(dataProtectionKeysPath);

    builder.Services
        .AddDataProtection()
        .SetApplicationName("InvoMir.API")
        .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionKeysPath));
}

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase);
builder.Services.AddEndpointsApiExplorer();
builder.Services
    .AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy(), tags: ["live"])
    .AddCheck<DatabaseHealthCheck>("database", tags: ["ready"])
    .AddCheck<RedisHealthCheck>("redis", tags: ["ready"]);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddSingleton(typeof(IConverter), new SynchronizedConverter(new PdfTools()));
builder.Services.AddJwtAuthentication(builder.Configuration);

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "InvoMir API", Version = "v1" });
    options.AddServer(new OpenApiServer { Url = "/" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "Enter your JWT access token."
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer", document),
            []
        }
    });
});

builder.Services.AddCors(options =>
    options.AddPolicy("InvoMirPolicy", policy =>
    {
        policy
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();

        if (builder.Environment.IsDevelopment())
        {
            policy.SetIsOriginAllowed(IsAllowedDevelopmentOrigin);
            return;
        }

        policy.WithOrigins(
            "https://invomir.com",
            "https://www.invomir.com");
    }));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<GlobalExceptionMiddleware>();

if (!app.Environment.IsDevelopment())
    app.UseHttpsRedirection();

app.UseStaticFiles();
app.UseRouting();
app.UseCors("InvoMirPolicy");
app.UseAuthentication();
app.UseInvoMirRateLimitRequestEnrichment();
app.UseRateLimiter();
app.UseAuthorization();

var hangfireDashboardEnabled = app.Environment.IsDevelopment() ||
    app.Configuration.GetValue<bool>("Hangfire:Dashboard:Enabled");
if (hangfireDashboardEnabled)
{
    app.UseHangfireDashboard("/hangfire", new DashboardOptions
    {
        Authorization = [new HangfireDashboardAuthorizationFilter(app.Environment)],
        DashboardTitle = "InvoMir Jobs"
    });
}

if (app.Environment.IsDevelopment())
{
    app.MapGet("/", () => Results.Content(BuildDeveloperHomePage(), "text/html"))
        .AllowAnonymous()
        .DisableRateLimiting();
}

app.MapHealthChecks("/health", new HealthCheckOptions
{
    Predicate = registration => registration.Tags.Contains("live"),
    ResponseWriter = WriteHealthResponseAsync
}).DisableRateLimiting();
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = registration => registration.Tags.Contains("ready"),
    ResponseWriter = WriteHealthResponseAsync
}).DisableRateLimiting();
app.MapControllers();
HangfireInfrastructureConfiguration.RegisterRecurringJobs(
    app.Services.GetRequiredService<IRecurringJobManager>());

app.Run();

static async Task WriteHealthResponseAsync(HttpContext context, HealthReport report)
{
    context.Response.ContentType = "application/json";

    var response = new
    {
        status = report.Status.ToString(),
        checks = report.Entries.Select(entry => new
        {
            name = entry.Key,
            status = entry.Value.Status.ToString(),
            description = entry.Value.Description
        }),
        durationMs = report.TotalDuration.TotalMilliseconds
    };

    await JsonSerializer.SerializeAsync(
        context.Response.Body,
        response,
        cancellationToken: context.RequestAborted);
}

static string BuildDeveloperHomePage()
{
    return """
        <!doctype html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>InvoMir API</title>
          <style>
            :root {
              color-scheme: light;
              --ink: #0f172a;
              --muted: #64748b;
              --line: #dbe3ef;
              --soft: #f6f8fc;
              --blue: #2563eb;
              --blue-dark: #1d4ed8;
            }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              min-height: 100vh;
              display: grid;
              place-items: center;
              font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              background: linear-gradient(180deg, #f8fbff 0%, #ffffff 48%, #f3f6fb 100%);
              color: var(--ink);
            }
            main {
              width: min(920px, calc(100vw - 32px));
              border: 1px solid var(--line);
              border-radius: 16px;
              background: rgba(255, 255, 255, 0.94);
              box-shadow: 0 24px 80px rgba(15, 23, 42, 0.08);
              padding: 40px;
            }
            .eyebrow {
              margin: 0 0 10px;
              color: var(--blue);
              font-size: 12px;
              font-weight: 700;
              letter-spacing: 0.08em;
              text-transform: uppercase;
            }
            h1 {
              margin: 0;
              font-size: clamp(32px, 5vw, 52px);
              line-height: 1.02;
              letter-spacing: 0;
            }
            p {
              margin: 16px 0 0;
              max-width: 620px;
              color: var(--muted);
              font-size: 16px;
              line-height: 1.65;
            }
            .actions {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 16px;
              margin-top: 32px;
            }
            a {
              min-height: 108px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              gap: 8px;
              padding: 20px;
              border: 1px solid var(--line);
              border-radius: 12px;
              color: var(--ink);
              text-decoration: none;
              background: var(--soft);
              transition: border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
            }
            a:hover {
              border-color: #9db8ff;
              transform: translateY(-2px);
              box-shadow: 0 14px 32px rgba(37, 99, 235, 0.14);
            }
            strong { font-size: 18px; }
            span { color: var(--muted); font-size: 14px; }
            .primary {
              color: #ffffff;
              border-color: var(--blue);
              background: var(--blue);
            }
            .primary span { color: #dbeafe; }
            .primary:hover { border-color: var(--blue-dark); }
            @media (max-width: 680px) {
              main { padding: 28px; }
              .actions { grid-template-columns: 1fr; }
            }
          </style>
        </head>
        <body>
          <main>
            <p class="eyebrow">Development tools</p>
            <h1>InvoMir API</h1>
            <p>Choose where you want to go. This page is only available in Development.</p>
            <section class="actions" aria-label="Developer destinations">
              <a class="primary" href="/swagger">
                <strong>Swagger</strong>
                <span>Review and test API endpoints.</span>
              </a>
              <a href="/hangfire">
                <strong>Hangfire Jobs</strong>
                <span>Inspect recurring and queued background jobs.</span>
              </a>
            </section>
          </main>
        </body>
        </html>
        """;
}

static bool IsAllowedDevelopmentOrigin(string origin)
{
    if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
        return false;

    if (uri.Scheme is not ("http" or "https"))
        return false;

    var host = uri.Host;

    if (host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
        host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase) ||
        host.Equals("::1", StringComparison.OrdinalIgnoreCase))
        return true;

    return IPAddress.TryParse(host, out var address) && IsPrivateNetworkAddress(address);
}

static bool IsPrivateNetworkAddress(IPAddress address)
{
    if (IPAddress.IsLoopback(address))
        return true;

    var bytes = address.GetAddressBytes();

    return address.AddressFamily switch
    {
        System.Net.Sockets.AddressFamily.InterNetwork =>
            bytes[0] == 10 ||
            (bytes[0] == 172 && bytes[1] is >= 16 and <= 31) ||
            (bytes[0] == 192 && bytes[1] == 168),
        _ => false
    };
}

internal sealed class CustomAssemblyLoadContext : AssemblyLoadContext
{
    public IntPtr LoadUnmanagedLibrary(string absolutePath)
    {
        return LoadUnmanagedDll(absolutePath);
    }

    protected override IntPtr LoadUnmanagedDll(string unmanagedDllName)
    {
        return LoadUnmanagedDllFromPath(unmanagedDllName);
    }
}
