# InvoMir — Audit Log Addition (Auth Layer)
# ADDITIVE ONLY — Do NOT touch existing auth files unless told to add lines
# Windsurf-Ready · Matches ERD v1.2 · PostgreSQL jsonb

This prompt adds the full AUDIT_LOGS table implementation and wires it into
every auth handler that was built in invomir-auth-implementation.md.

Zero existing files are replaced. Every change is an ADDITION or a targeted
line insertion clearly marked with: // ← ADD THIS

Current backend status (May 16, 2026):
  - `audit_logs` is implemented and migrated.
  - Auth writes audit rows for register, login, refresh, forgot password, and reset password.
  - The implemented handlers use `IClientContext` for IP/user-agent and `IAuthCookieService` for refresh cookies instead of direct `IHttpContextAccessor`.
  - The table uses PostgreSQL `jsonb` for `old_values` / `new_values`.
  - `AuditLog` intentionally does not inherit `TenantEntity` or `SoftDeleteEntity`; it is an immutable security ledger and has no global query filter.
  - Normal auth entities use the enterprise auditing hierarchy:
      BaseEntity -> AuditedEntity -> SoftDeleteEntity -> TenantEntity

---

## WHAT IS MISSING (gap analysis)

The ERD defines AUDIT_LOGS with:
  tenant_id, user_id (nullable), entity_name, entity_id,
  action, old_values (jsonb), new_values (jsonb), ip_address, user_agent, created_at

The original auth implementation had none of this wired up. The current backend now has this implemented.

Auth events that must now write an audit log row:
  - Register     → entity: User,  action: "created"
  - Login        → entity: User,  action: "login"
  - Refresh      → entity: User,  action: "token_refreshed"
  - ForgotPwd    → entity: User,  action: "password_reset_requested"
  - ResetPwd     → entity: User,  action: "password_reset"

---

## FILE A1 — Domain/Entities/AuditLog.cs  (NEW FILE)

```csharp
// InvoMir.Domain/Entities/AuditLog.cs
namespace InvoMir.Domain.Entities;

/// <summary>
/// Immutable audit record. Once written it is never updated or deleted.
/// tenant_id is nullable because system-level actions (e.g. background jobs)
/// may not belong to a specific tenant. user_id is nullable for the same reason.
/// </summary>
public sealed class AuditLog
{
    public Guid Id { get; private set; } = Guid.NewGuid();

    // Nullable — system actions have no tenant/user context
    public Guid? TenantId { get; private set; }
    public Guid? UserId { get; private set; }

    // What entity was affected and which one specifically
    public string EntityName { get; private set; } = string.Empty;   // "User" | "Invoice" | "Client"
    public Guid? EntityId { get; private set; }

    // What happened
    public string Action { get; private set; } = string.Empty;
    // "created" | "updated" | "deleted" | "login" | "token_refreshed"
    // "password_reset_requested" | "password_reset" | "sent" | "paid"

    // JSON snapshots — stored as string, EF maps to jsonb column
    public string? OldValues { get; private set; }   // null for created/login events
    public string? NewValues { get; private set; }   // null for deleted events

    // Request context
    public string? IpAddress { get; private set; }
    public string? UserAgent { get; private set; }

    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    private AuditLog() { }  // EF constructor

    public static AuditLog Create(
        string entityName,
        Guid? entityId,
        string action,
        Guid? tenantId = null,
        Guid? userId = null,
        object? oldValues = null,
        object? newValues = null,
        string? ipAddress = null,
        string? userAgent = null)
    {
        return new AuditLog
        {
            TenantId = tenantId,
            UserId = userId,
            EntityName = entityName,
            EntityId = entityId,
            Action = action,
            OldValues = oldValues is null
                ? null
                : System.Text.Json.JsonSerializer.Serialize(oldValues),
            NewValues = newValues is null
                ? null
                : System.Text.Json.JsonSerializer.Serialize(newValues),
            IpAddress = ipAddress,
            UserAgent = userAgent
        };
    }
}
```

---

## FILE A2 — Application/Interfaces/IAuditService.cs  (NEW FILE)

```csharp
// InvoMir.Application/Interfaces/IAuditService.cs
namespace InvoMir.Application.Interfaces;

/// <summary>
/// Writes audit log entries. Handlers call this; the implementation
/// persists to AUDIT_LOGS table. Fire-and-forget safe — failures are
/// logged but NEVER allowed to break the primary operation.
/// </summary>
public interface IAuditService
{
    Task LogAsync(
        string entityName,
        Guid? entityId,
        string action,
        Guid? tenantId = null,
        Guid? userId = null,
        object? oldValues = null,
        object? newValues = null,
        string? ipAddress = null,
        string? userAgent = null,
        CancellationToken cancellationToken = default);
}
```

---

## FILE A3 — Infrastructure/Services/AuditService.cs  (NEW FILE)

```csharp
// InvoMir.Infrastructure/Services/AuditService.cs
namespace InvoMir.Infrastructure.Services;

/// <summary>
/// Writes directly to the audit_logs table via a dedicated DbContext scope.
/// Uses its OWN SaveChangesAsync call — completely isolated from the
/// main business transaction. If the audit write fails, we log the error
/// but NEVER throw — audit must never break register/login/reset.
/// </summary>
public sealed class AuditService(
    IAppDbContext context,
    ILogger<AuditService> logger)
    : IAuditService
{
    public async Task LogAsync(
        string entityName,
        Guid? entityId,
        string action,
        Guid? tenantId = null,
        Guid? userId = null,
        object? oldValues = null,
        object? newValues = null,
        string? ipAddress = null,
        string? userAgent = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var entry = AuditLog.Create(
                entityName: entityName,
                entityId: entityId,
                action: action,
                tenantId: tenantId,
                userId: userId,
                oldValues: oldValues,
                newValues: newValues,
                ipAddress: ipAddress,
                userAgent: userAgent);

            context.AuditLogs.Add(entry);
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            // CRITICAL RULE: audit failure must NEVER propagate up.
            // The user's register/login succeeded. We just lost the audit row.
            // Alert in logs — investigate and replay from app logs if needed.
            logger.LogError(ex,
                "AUDIT WRITE FAILED — Entity: {Entity}, Action: {Action}, TenantId: {TenantId}, UserId: {UserId}",
                entityName, action, tenantId, userId);
        }
    }
}
```

---

## FILE A4 — Infrastructure/Persistence/Configurations/AuditLogConfiguration.cs  (NEW FILE)

```csharp
// InvoMir.Infrastructure/Persistence/Configurations/AuditLogConfiguration.cs
namespace InvoMir.Infrastructure.Persistence.Configurations;

public sealed class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("audit_logs");
        builder.HasKey(a => a.Id);

        builder.Property(a => a.EntityName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(a => a.Action)
            .HasMaxLength(100)
            .IsRequired();

        // jsonb columns — store as text, PostgreSQL stores as native jsonb
        builder.Property(a => a.OldValues)
            .HasColumnType("jsonb");

        builder.Property(a => a.NewValues)
            .HasColumnType("jsonb");

        builder.Property(a => a.IpAddress)
            .HasMaxLength(50);

        builder.Property(a => a.UserAgent)
            .HasMaxLength(500);

        builder.Property(a => a.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("NOW()");

        // IMPORTANT: No global query filter on AuditLog.
        // Audit logs are immutable historical records.
        // Admins can query across tenants if needed.

        // Indexes — support the most common query patterns
        builder.HasIndex(a => a.TenantId);                           // "show all activity for my tenant"
        builder.HasIndex(a => a.UserId);                             // "what did this user do"
        builder.HasIndex(a => new { a.EntityName, a.EntityId });     // "full history of invoice X"
        builder.HasIndex(a => a.CreatedAt);                          // date range scans
        builder.HasIndex(a => new { a.TenantId, a.CreatedAt });      // tenant activity feed
    }
}
```

---

## FILE A5 — MODIFY: Application/Interfaces/IAppDbContext.cs

Add ONE line to the existing IAppDbContext interface:

```csharp
// FIND this block in IAppDbContext.cs:
    DbSet<PasswordResetToken> PasswordResetTokens { get; }

// ADD immediately after it:
    DbSet<AuditLog> AuditLogs { get; }   // ← ADD THIS
```

---

## FILE A6 — MODIFY: Infrastructure/Persistence/AppDbContext.cs

Add ONE line to the existing AppDbContext DbSet declarations:

```csharp
// FIND this line in AppDbContext.cs:
public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();

// ADD immediately after it:
public DbSet<AuditLog> AuditLogs => Set<AuditLog>();   // ← ADD THIS
```

---

## FILE A7 — MODIFY: Infrastructure/DependencyInjection.cs

Add ONE line inside `AddInfrastructure()`:

```csharp
// FIND this comment block in DependencyInjection.cs:
// Token service
services.AddScoped<ITokenService, TokenService>();

// ADD immediately after it:
services.AddScoped<IAuditService, AuditService>();   // ← ADD THIS
```

---

## FILE A8 — MODIFY: RegisterCommandHandler.cs

Open `InvoMir.Application/Features/Auth/Commands/Register/RegisterCommandHandler.cs`

Step 1 — Add `IAuditService` to the constructor injection:

```csharp
// FIND:
public sealed class RegisterCommandHandler(
    IAppDbContext context,
    ITokenService tokenService,
    IPasswordHasher passwordHasher,
    IHttpContextAccessor httpContextAccessor)

// REPLACE WITH:
public sealed class RegisterCommandHandler(
    IAppDbContext context,
    ITokenService tokenService,
    IPasswordHasher passwordHasher,
    IHttpContextAccessor httpContextAccessor,
    IAuditService auditService)   // ← ADD THIS PARAMETER
```

Step 2 — Add audit call after `SaveChangesAsync`. Insert this block immediately after `await context.SaveChangesAsync(cancellationToken);`:

```csharp
        // Audit — record the account creation
        // IMPORTANT: called AFTER SaveChangesAsync so user.Id is assigned
        // Runs in its own try/catch inside AuditService — will never throw
        await auditService.LogAsync(
            entityName: "User",
            entityId: user.Id,
            action: "created",
            tenantId: tenant.Id,
            userId: user.Id,
            oldValues: null,
            newValues: new
            {
                email = user.Email,
                firstName = user.FirstName,
                lastName = user.LastName,
                tenantId = tenant.Id,
                tenantName = tenant.Name,
                plan = user.Plan,
                role = user.Role
            },
            ipAddress: GetClientIpAddress(),
            userAgent: httpContextAccessor.HttpContext?.Request.Headers["User-Agent"].ToString(),
            cancellationToken: cancellationToken);
```

---

## FILE A9 — MODIFY: LoginCommandHandler.cs

Open `InvoMir.Application/Features/Auth/Commands/Login/LoginCommandHandler.cs`

Step 1 — Add `IAuditService` to the constructor injection:

```csharp
// FIND:
public sealed class LoginCommandHandler(
    IAppDbContext context,
    ITokenService tokenService,
    IPasswordHasher passwordHasher,
    IHttpContextAccessor httpContextAccessor)

// REPLACE WITH:
public sealed class LoginCommandHandler(
    IAppDbContext context,
    ITokenService tokenService,
    IPasswordHasher passwordHasher,
    IHttpContextAccessor httpContextAccessor,
    IAuditService auditService)   // ← ADD THIS PARAMETER
```

Step 2 — Add audit call after `SaveChangesAsync`. Insert immediately after `await context.SaveChangesAsync(cancellationToken);`:

```csharp
        // Audit — record the login event
        await auditService.LogAsync(
            entityName: "User",
            entityId: user.Id,
            action: "login",
            tenantId: user.TenantId,
            userId: user.Id,
            oldValues: null,
            newValues: new
            {
                loginAt = DateTime.UtcNow,
                ipAddress = httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString()
            },
            ipAddress: httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString(),
            userAgent: httpContextAccessor.HttpContext?.Request.Headers["User-Agent"].ToString(),
            cancellationToken: cancellationToken);
```

---

## FILE A10 — MODIFY: RefreshTokenCommandHandler.cs

Open `InvoMir.Application/Features/Auth/Commands/Refresh/RefreshTokenCommandHandler.cs`

Step 1 — Add `IAuditService` to constructor:

```csharp
// FIND:
public sealed class RefreshTokenCommandHandler(
    IAppDbContext context,
    ITokenService tokenService,
    IHttpContextAccessor httpContextAccessor)

// REPLACE WITH:
public sealed class RefreshTokenCommandHandler(
    IAppDbContext context,
    ITokenService tokenService,
    IHttpContextAccessor httpContextAccessor,
    IAuditService auditService)   // ← ADD THIS PARAMETER
```

Step 2 — Add audit call after `SaveChangesAsync`. Insert immediately after `await context.SaveChangesAsync(cancellationToken);`:

```csharp
        // Audit — token was silently refreshed (background event, low priority)
        await auditService.LogAsync(
            entityName: "User",
            entityId: user.Id,
            action: "token_refreshed",
            tenantId: user.TenantId,
            userId: user.Id,
            oldValues: null,
            newValues: new
            {
                refreshedAt = DateTime.UtcNow,
                ipAddress = httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString()
            },
            ipAddress: httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString(),
            userAgent: httpContextAccessor.HttpContext?.Request.Headers["User-Agent"].ToString(),
            cancellationToken: cancellationToken);
```

---

## FILE A11 — MODIFY: ForgotPasswordCommandHandler.cs

Open `InvoMir.Application/Features/Auth/Commands/ForgotPassword/ForgotPasswordCommandHandler.cs`

Step 1 — Add `IAuditService` to constructor:

```csharp
// FIND:
public sealed class ForgotPasswordCommandHandler(
    IAppDbContext context,
    IEmailService emailService)

// REPLACE WITH:
public sealed class ForgotPasswordCommandHandler(
    IAppDbContext context,
    IEmailService emailService,
    IAuditService auditService)   // ← ADD THIS PARAMETER
```

Step 2 — Add audit call after `SaveChangesAsync`. This is inside the block where `user is not null`.
Insert immediately after `await context.SaveChangesAsync(cancellationToken);`:

```csharp
        // Audit — password reset was requested
        // user is guaranteed non-null here (we checked above and returned early if null)
        await auditService.LogAsync(
            entityName: "User",
            entityId: user.Id,
            action: "password_reset_requested",
            tenantId: null,     // no tenant context at this point — user not authenticated
            userId: user.Id,
            oldValues: null,
            newValues: new
            {
                requestedAt = DateTime.UtcNow,
                email = request.Email.ToLowerInvariant().Trim()
            },
            ipAddress: null,    // ForgotPasswordCommand has no HttpContext injected — acceptable
            userAgent: null,
            cancellationToken: cancellationToken);
```

---

## FILE A12 — MODIFY: ResetPasswordCommandHandler.cs

Open `InvoMir.Application/Features/Auth/Commands/ResetPassword/ResetPasswordCommandHandler.cs`

Step 1 — Add `IAuditService` to constructor:

```csharp
// FIND:
public sealed class ResetPasswordCommandHandler(
    IAppDbContext context,
    IPasswordHasher passwordHasher)

// REPLACE WITH:
public sealed class ResetPasswordCommandHandler(
    IAppDbContext context,
    IPasswordHasher passwordHasher,
    IAuditService auditService)   // ← ADD THIS PARAMETER
```

Step 2 — Add audit call after `SaveChangesAsync`. Insert immediately after `await context.SaveChangesAsync(cancellationToken);`:

```csharp
        // Audit — password was successfully reset
        // All active refresh tokens were just revoked — this is a high-security event
        await auditService.LogAsync(
            entityName: "User",
            entityId: user.Id,
            action: "password_reset",
            tenantId: null,     // no auth context — user not signed in during reset
            userId: user.Id,
            oldValues: null,
            newValues: new
            {
                resetAt = DateTime.UtcNow,
                allSessionsRevoked = true,
                revokedSessionCount = activeRefreshTokens.Count
            },
            ipAddress: null,
            userAgent: null,
            cancellationToken: cancellationToken);
```

---

## FILE A13 — EF Migration (add to existing schema)

```bash
# Run from the backend/ folder
# This adds ONLY the audit_logs table — does not touch existing tables

dotnet ef migrations add AddAuditLogsTable \
  --project InvoMir.Infrastructure \
  --startup-project InvoMir.API \
  --output-dir Persistence/Migrations

dotnet ef database update \
  --project InvoMir.Infrastructure \
  --startup-project InvoMir.API
```

---

## AUDIT LOG ROW EXAMPLES (what gets stored per auth action)

### Register
```json
{
  "entity_name": "User",
  "entity_id": "a1b2c3d4-...",
  "action": "created",
  "tenant_id": "f5e6d7c8-...",
  "user_id": "a1b2c3d4-...",
  "old_values": null,
  "new_values": {
    "email": "ali@acme.com",
    "firstName": "Ali",
    "lastName": "Khan",
    "tenantId": "f5e6d7c8-...",
    "tenantName": "Acme Corp",
    "plan": "free",
    "role": "owner"
  },
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0 ...",
  "created_at": "2026-05-16T10:00:00Z"
}
```

### Login
```json
{
  "entity_name": "User",
  "entity_id": "a1b2c3d4-...",
  "action": "login",
  "tenant_id": "f5e6d7c8-...",
  "user_id": "a1b2c3d4-...",
  "old_values": null,
  "new_values": {
    "loginAt": "2026-05-16T10:05:00Z",
    "ipAddress": "192.168.1.1"
  },
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0 ...",
  "created_at": "2026-05-16T10:05:00Z"
}
```

### Password Reset
```json
{
  "entity_name": "User",
  "entity_id": "a1b2c3d4-...",
  "action": "password_reset",
  "tenant_id": null,
  "user_id": "a1b2c3d4-...",
  "old_values": null,
  "new_values": {
    "resetAt": "2026-05-16T10:30:00Z",
    "allSessionsRevoked": true,
    "revokedSessionCount": 2
  },
  "ip_address": null,
  "user_agent": null,
  "created_at": "2026-05-16T10:30:00Z"
}
```

---

## IMPLEMENTATION ORDER (Windsurf task sequence)

1. Create FILE A1  → InvoMir.Domain/Entities/AuditLog.cs
2. Create FILE A2  → InvoMir.Application/Interfaces/IAuditService.cs
3. Create FILE A3  → InvoMir.Infrastructure/Services/AuditService.cs
4. Create FILE A4  → InvoMir.Infrastructure/Persistence/Configurations/AuditLogConfiguration.cs
5. Modify FILE A5  → IAppDbContext.cs — add DbSet<AuditLog>
6. Modify FILE A6  → AppDbContext.cs — add DbSet<AuditLog>
7. Modify FILE A7  → DependencyInjection.cs — register IAuditService
8. Modify FILE A8  → RegisterCommandHandler.cs — inject + call
9. Modify FILE A9  → LoginCommandHandler.cs — inject + call
10. Modify FILE A10 → RefreshTokenCommandHandler.cs — inject + call
11. Modify FILE A11 → ForgotPasswordCommandHandler.cs — inject + call
12. Modify FILE A12 → ResetPasswordCommandHandler.cs — inject + call
13. Run FILE A13   → EF migration AddAuditLogsTable

---

## DESIGN DECISIONS

| Decision | Reason |
|---|---|
| AuditLog has NO TenantEntity base | Tenant IS the root. Audit logs are cross-cutting — a password reset audit row has no tenant context because the user isn't authenticated yet. Nullable TenantId handles both cases cleanly. |
| AuditService catches all exceptions internally | Audit must NEVER break register/login. If DB is under pressure, user still gets their token. Lost audit row beats lost customer. |
| Separate SaveChangesAsync in AuditService | Decoupled from the primary transaction. Business data commits first. Audit commits separately. No rollback coupling. |
| jsonb column type on old_values/new_values | PostgreSQL-native jsonb is indexed, queryable, and diff-able. `SELECT * FROM audit_logs WHERE new_values->>'plan' = 'business'` just works. |
| No global EF query filter on AuditLog | Audit logs are historical records. They must not be filtered by tenant on read — admins need cross-tenant audit access. Intentional. |
| action values are lowercase strings not enums | ERD specifies varchar. No enum mapping complexity. Queryable directly in SQL without value conversion. |
| user_agent captured at auth endpoints | Critical for fraud detection — unusual UA pattern mid-session is a compromise signal. |
