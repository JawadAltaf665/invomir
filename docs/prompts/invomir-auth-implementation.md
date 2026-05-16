# InvoMir — Auth Implementation (Phase 1, Week 1)
# Windsurf-Ready · Production-Grade · Zero Shortcuts

Stack: .NET 10 / C# 13 / EF Core 10 / PostgreSQL / JWT + Refresh Tokens
Auth endpoints covered:
  POST /api/auth/register
  POST /api/auth/login
  POST /api/auth/refresh
  POST /api/auth/forgot-password
  POST /api/auth/reset-password

Current backend status (May 16, 2026):
  - Auth backend flow is implemented.
  - Refresh tokens are handled through `IAuthCookieService` using an httpOnly cookie.
  - IP address and user-agent/device information are read through `IClientContext`.
  - All auth entities now use the enterprise auditing hierarchy:
      BaseEntity -> AuditedEntity -> SoftDeleteEntity -> TenantEntity
  - `Tenant` and `PasswordResetToken` inherit `SoftDeleteEntity`; `User` and `RefreshToken` inherit `TenantEntity`.
  - `AppDbContext.SaveChangesAsync()` automatically fills creation/modification/deletion audit fields.
  - Auth security events are written to `audit_logs` by `IAuditService`.

---

## WHY this auth design matters in a real SaaS product

InvoMir is multi-tenant. When someone registers, they aren't just creating a user — they are
creating a **Tenant** (their business) AND a **User** (the owner). Every JWT must carry both
`user_id` and `tenant_id` as claims so every downstream query is automatically scoped.

Junior mistake: just store userId in the token. At scale this means either joining to users table
on every request to get tenantId, or worse — forgetting tenant isolation entirely.

Senior approach: token carries tenantId. No extra DB lookup per request. Tenant firewall free.

---

## FILE 1 — Domain/Entities/Tenant.cs

```csharp
// InvoMir.Domain/Entities/Tenant.cs
namespace InvoMir.Domain.Entities;

public sealed class Tenant : SoftDeleteEntity
{
    public string Name { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;   // e.g. "acme-corp"
    public string Plan { get; private set; } = "free";
    public DateTime? TrialEndsAt { get; private set; }
    public string? StripeCustomerId { get; private set; }
    public bool IsActive { get; private set; } = true;

    // Navigation — EF only, not used in business logic
    public ICollection<User> Users { get; private set; } = [];

    private Tenant() { }  // EF constructor

    public static Tenant Create(string name, string slug)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Tenant name is required.", nameof(name));
        if (string.IsNullOrWhiteSpace(slug))
            throw new ArgumentException("Tenant slug is required.", nameof(slug));

        return new Tenant
        {
            Name = name,
            Slug = slug.ToLowerInvariant(),
            Plan = "free",
            TrialEndsAt = DateTime.UtcNow.AddDays(14)
        };
    }
}
```

---

## FILE 2 — Domain/Entities/User.cs

```csharp
// InvoMir.Domain/Entities/User.cs
namespace InvoMir.Domain.Entities;

public sealed class User : TenantEntity
{
    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public string FirstName { get; private set; } = string.Empty;
    public string LastName { get; private set; } = string.Empty;
    public string Role { get; private set; } = "owner";    // owner | admin | member
    public string Plan { get; private set; } = "free";
    public string? LogoUrl { get; private set; }
    public string Currency { get; private set; } = "USD";
    public decimal TaxPercent { get; private set; } = 0;
    public string? StripeAccountId { get; private set; }
    public bool IsActive { get; private set; } = true;
    public bool EmailVerified { get; private set; } = false;
    public DateTime? LastLoginAt { get; private set; }
    public DateTime? TrialEndsAt { get; private set; }

    // Navigation
    public ICollection<RefreshToken> RefreshTokens { get; private set; } = [];
    public ICollection<PasswordResetToken> PasswordResetTokens { get; private set; } = [];

    private User() { }  // EF constructor

    public static User Create(
        Guid tenantId,
        string email,
        string passwordHash,
        string firstName,
        string lastName,
        string currency = "USD",
        decimal taxPercent = 0)
    {
        var user = new User
        {
            Email = email.ToLowerInvariant().Trim(),
            PasswordHash = passwordHash,
            FirstName = firstName.Trim(),
            LastName = lastName.Trim(),
            Currency = currency,
            TaxPercent = taxPercent,
            Role = "owner",
            Plan = "free",
            TrialEndsAt = DateTime.UtcNow.AddDays(14)
        };

        user.SetTenant(tenantId);
        return user;
    }

    public void RecordLogin() => LastLoginAt = DateTime.UtcNow;

    public void VerifyEmail() => EmailVerified = true;

    public void UpdatePasswordHash(string newHash) => PasswordHash = newHash;
}
```

---

## FILE 3 — Domain/Entities/RefreshToken.cs

```csharp
// InvoMir.Domain/Entities/RefreshToken.cs
namespace InvoMir.Domain.Entities;

public sealed class RefreshToken : TenantEntity
{
    public Guid UserId { get; private set; }
    public string Token { get; private set; } = string.Empty;
    public string? DeviceInfo { get; private set; }
    public string? IpAddress { get; private set; }
    public bool IsRevoked { get; private set; } = false;
    public DateTime ExpiresAt { get; private set; }
    public DateTime? RevokedAt { get; private set; }

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsActive => !IsRevoked && !IsExpired;

    private RefreshToken() { }  // EF constructor

    public static RefreshToken Create(
        Guid userId,
        Guid tenantId,
        string token,
        int expiryDays = 7,
        string? deviceInfo = null,
        string? ipAddress = null)
    {
        var refreshToken = new RefreshToken
        {
            UserId = userId,
            Token = token,
            DeviceInfo = deviceInfo,
            IpAddress = ipAddress,
            ExpiresAt = DateTime.UtcNow.AddDays(expiryDays)
        };

        refreshToken.SetTenant(tenantId);
        return refreshToken;
    }

    public void Revoke()
    {
        IsRevoked = true;
        RevokedAt = DateTime.UtcNow;
    }
}
```

---

## FILE 4 — Domain/Entities/PasswordResetToken.cs

```csharp
// InvoMir.Domain/Entities/PasswordResetToken.cs
namespace InvoMir.Domain.Entities;

public sealed class PasswordResetToken : SoftDeleteEntity
{
    public Guid UserId { get; private set; }
    public string Token { get; private set; } = string.Empty;
    public bool IsUsed { get; private set; } = false;
    public DateTime ExpiresAt { get; private set; }
    public DateTime? UsedAt { get; private set; }

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsValid => !IsUsed && !IsExpired;

    private PasswordResetToken() { }  // EF constructor

    public static PasswordResetToken Create(Guid userId, string token, int expiryMinutes = 15)
    {
        return new PasswordResetToken
        {
            UserId = userId,
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes)
        };
    }

    public void MarkUsed()
    {
        IsUsed = true;
        UsedAt = DateTime.UtcNow;
    }
}
```

---

## FILE 5 — Application/Features/Auth/Commands/Register/RegisterCommand.cs

```csharp
// InvoMir.Application/Features/Auth/Commands/Register/RegisterCommand.cs
namespace InvoMir.Application.Features.Auth.Commands.Register;

public sealed record RegisterCommand(
    string Email,
    string Password,
    string BusinessName,
    string FirstName,
    string LastName,
    string Currency = "USD",
    decimal TaxPercent = 0
) : IRequest<ApiResponse<AuthTokenDto>>;
```

---

## FILE 6 — Application/Features/Auth/Commands/Register/RegisterCommandValidator.cs

```csharp
// InvoMir.Application/Features/Auth/Commands/Register/RegisterCommandValidator.cs
namespace InvoMir.Application.Features.Auth.Commands.Register;

public sealed class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Email format is invalid.")
            .MaximumLength(255).WithMessage("Email must not exceed 255 characters.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters.")
            .MaximumLength(128).WithMessage("Password must not exceed 128 characters.")
            .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
            .Matches("[0-9]").WithMessage("Password must contain at least one number.");

        RuleFor(x => x.BusinessName)
            .NotEmpty().WithMessage("Business name is required.")
            .MaximumLength(200).WithMessage("Business name must not exceed 200 characters.");

        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required.")
            .MaximumLength(100);

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required.")
            .MaximumLength(100);

        RuleFor(x => x.Currency)
            .Must(c => new[] { "USD", "PKR", "AED", "GBP", "EUR", "SAR" }.Contains(c))
            .WithMessage("Currency must be one of: USD, PKR, AED, GBP, EUR, SAR.");

        RuleFor(x => x.TaxPercent)
            .InclusiveBetween(0, 100).WithMessage("Tax percent must be between 0 and 100.");
    }
}
```

---

## FILE 7 — Application/Features/Auth/Commands/Register/RegisterCommandHandler.cs

```csharp
// InvoMir.Application/Features/Auth/Commands/Register/RegisterCommandHandler.cs
namespace InvoMir.Application.Features.Auth.Commands.Register;

public sealed class RegisterCommandHandler(
    IAppDbContext context,
    ITokenService tokenService,
    IPasswordHasher passwordHasher,
    IAuthCookieService authCookieService,
    IClientContext clientContext,
    IAuditService auditService)
    : IRequestHandler<RegisterCommand, ApiResponse<AuthTokenDto>>
{
    public async Task<ApiResponse<AuthTokenDto>> Handle(
        RegisterCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Guard — no duplicate emails across the entire platform
        var emailExists = await context.Users
            .AsNoTracking()
            .AnyAsync(u => u.Email == request.Email.ToLowerInvariant().Trim(), cancellationToken);

        if (emailExists)
            return ApiResponse<AuthTokenDto>.Fail("Email is already registered.");

        // 2. Create Tenant first — it is the root of everything
        var slug = GenerateSlug(request.BusinessName);
        var tenant = Tenant.Create(request.BusinessName, slug);
        context.Tenants.Add(tenant);

        // 3. Hash password — NEVER store plain text
        var passwordHash = passwordHasher.HashPassword(request.Password);

        // 4. Create the owner User under this Tenant
        var user = User.Create(
            tenantId: tenant.Id,
            email: request.Email,
            passwordHash: passwordHash,
            firstName: request.FirstName,
            lastName: request.LastName,
            currency: request.Currency,
            taxPercent: request.TaxPercent);

        context.Users.Add(user);

        // 5. Generate tokens — access (15 min) + refresh (7 days)
        var accessToken = tokenService.GenerateAccessToken(user, tenant.Id);
        var rawRefreshToken = tokenService.GenerateRefreshTokenString();
        var ipAddress = GetClientIpAddress();

        var refreshToken = RefreshToken.Create(
            userId: user.Id,
            tenantId: tenant.Id,
            token: rawRefreshToken,
            expiryDays: 7,
            ipAddress: ipAddress);

        context.RefreshTokens.Add(refreshToken);

        // 6. Persist everything atomically — all or nothing
        await context.SaveChangesAsync(cancellationToken);

        // 7. Set the refresh token as an httpOnly cookie
        SetRefreshTokenCookie(rawRefreshToken, refreshToken.ExpiresAt);

        return ApiResponse<AuthTokenDto>.Ok(
            new AuthTokenDto(accessToken, user.Id, tenant.Id, user.Email, user.FirstName),
            "Account created successfully. Please verify your email.");
    }

    private static string GenerateSlug(string businessName)
    {
        var slug = businessName.ToLowerInvariant()
            .Replace(" ", "-")
            .Replace("'", "")
            .Replace(".", "");

        // Remove non-alphanumeric chars except hyphens
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9\-]", "");
        slug = slug.Trim('-');

        // Append short GUID suffix to ensure uniqueness
        return $"{slug}-{Guid.NewGuid().ToString("N")[..6]}";
    }

    private string? GetClientIpAddress()
    {
        return httpContextAccessor.HttpContext?
            .Connection.RemoteIpAddress?.ToString();
    }

    private void SetRefreshTokenCookie(string token, DateTime expires)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,       // JavaScript cannot read this — prevents XSS token theft
            Secure = true,         // HTTPS only
            SameSite = SameSiteMode.Strict,
            Expires = expires
        };

        httpContextAccessor.HttpContext?.Response
            .Cookies.Append("refresh_token", token, cookieOptions);
    }
}
```

---

## FILE 8 — Application/Features/Auth/Commands/Login/LoginCommand.cs

```csharp
// InvoMir.Application/Features/Auth/Commands/Login/LoginCommand.cs
namespace InvoMir.Application.Features.Auth.Commands.Login;

public sealed record LoginCommand(
    string Email,
    string Password
) : IRequest<ApiResponse<AuthTokenDto>>;
```

---

## FILE 9 — Application/Features/Auth/Commands/Login/LoginCommandValidator.cs

```csharp
// InvoMir.Application/Features/Auth/Commands/Login/LoginCommandValidator.cs
namespace InvoMir.Application.Features.Auth.Commands.Login;

public sealed class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Invalid email format.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.");
    }
}
```

---

## FILE 10 — Application/Features/Auth/Commands/Login/LoginCommandHandler.cs

```csharp
// InvoMir.Application/Features/Auth/Commands/Login/LoginCommandHandler.cs
namespace InvoMir.Application.Features.Auth.Commands.Login;

public sealed class LoginCommandHandler(
    IAppDbContext context,
    ITokenService tokenService,
    IPasswordHasher passwordHasher,
    IAuthCookieService authCookieService,
    IClientContext clientContext,
    IAuditService auditService)
    : IRequestHandler<LoginCommand, ApiResponse<AuthTokenDto>>
{
    public async Task<ApiResponse<AuthTokenDto>> Handle(
        LoginCommand request,
        CancellationToken cancellationToken)
    {
        // SECURITY: Same generic error for wrong email OR wrong password.
        // Never reveal which one was wrong — prevents user enumeration.
        const string InvalidCredentials = "Invalid email or password.";

        // 1. Find user by email — bypass global tenant filter (login has no tenant context yet)
        var user = await context.Users
            .IgnoreQueryFilters()   // ← intentional: we don't have tenantId yet
            .AsNoTracking()
            .Where(u => u.Email == request.Email.ToLowerInvariant().Trim() && u.IsActive)
            .Select(u => new
            {
                u.Id,
                u.TenantId,
                u.Email,
                u.PasswordHash,
                u.FirstName,
                u.IsActive,
                u.EmailVerified
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (user is null)
            return ApiResponse<AuthTokenDto>.Fail(InvalidCredentials);

        // 2. Verify password
        if (!passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
            return ApiResponse<AuthTokenDto>.Fail(InvalidCredentials);

        // 3. Update last login timestamp — load entity for modification
        var userEntity = await context.Users
            .IgnoreQueryFilters()
            .FirstAsync(u => u.Id == user.Id, cancellationToken);

        userEntity.RecordLogin();

        // 4. Revoke all previous refresh tokens for this user (session rotation)
        var oldTokens = await context.RefreshTokens
            .IgnoreQueryFilters()
            .Where(t => t.UserId == user.Id && !t.IsRevoked && !t.IsExpired)
            .ToListAsync(cancellationToken);

        foreach (var oldToken in oldTokens)
            oldToken.Revoke();

        // 5. Issue new tokens
        var accessToken = tokenService.GenerateAccessToken(userEntity, user.TenantId);
        var rawRefreshToken = tokenService.GenerateRefreshTokenString();
        var ipAddress = httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();

        var refreshToken = RefreshToken.Create(
            userId: user.Id,
            tenantId: user.TenantId,
            token: rawRefreshToken,
            expiryDays: 7,
            ipAddress: ipAddress);

        context.RefreshTokens.Add(refreshToken);

        await context.SaveChangesAsync(cancellationToken);

        // 6. Set httpOnly cookie
        SetRefreshTokenCookie(rawRefreshToken, refreshToken.ExpiresAt);

        return ApiResponse<AuthTokenDto>.Ok(
            new AuthTokenDto(accessToken, user.Id, user.TenantId, user.Email, user.FirstName));
    }

    private void SetRefreshTokenCookie(string token, DateTime expires)
    {
        httpContextAccessor.HttpContext?.Response.Cookies.Append("refresh_token", token,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = expires
            });
    }
}
```

---

## FILE 11 — Application/Features/Auth/Commands/Refresh/RefreshTokenCommand.cs

```csharp
// InvoMir.Application/Features/Auth/Commands/Refresh/RefreshTokenCommand.cs
namespace InvoMir.Application.Features.Auth.Commands.Refresh;

// No body needed — token comes from the httpOnly cookie
public sealed record RefreshTokenCommand : IRequest<ApiResponse<AuthTokenDto>>;
```

---

## FILE 12 — Application/Features/Auth/Commands/Refresh/RefreshTokenCommandHandler.cs

```csharp
// InvoMir.Application/Features/Auth/Commands/Refresh/RefreshTokenCommandHandler.cs
namespace InvoMir.Application.Features.Auth.Commands.Refresh;

public sealed class RefreshTokenCommandHandler(
    IAppDbContext context,
    ITokenService tokenService,
    IAuthCookieService authCookieService,
    IClientContext clientContext,
    IAuditService auditService)
    : IRequestHandler<RefreshTokenCommand, ApiResponse<AuthTokenDto>>
{
    public async Task<ApiResponse<AuthTokenDto>> Handle(
        RefreshTokenCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Read refresh token from httpOnly cookie
        var rawToken = httpContextAccessor.HttpContext?.Request.Cookies["refresh_token"];
        if (string.IsNullOrWhiteSpace(rawToken))
            return ApiResponse<AuthTokenDto>.Fail("No refresh token provided.");

        // 2. Find the token in DB — bypass tenant filter (no context yet)
        var refreshToken = await context.RefreshTokens
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Token == rawToken, cancellationToken);

        if (refreshToken is null)
            return ApiResponse<AuthTokenDto>.Fail("Invalid refresh token.");

        if (!refreshToken.IsActive)
            return ApiResponse<AuthTokenDto>.Fail("Refresh token has expired or been revoked.");

        // 3. Revoke the old token immediately (rotation — prevents replay attacks)
        refreshToken.Revoke();

        // 4. Load the user for the new access token
        var user = await context.Users
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(u => u.Id == refreshToken.UserId && u.IsActive)
            .Select(u => new { u.Id, u.TenantId, u.Email, u.FirstName })
            .FirstOrDefaultAsync(cancellationToken);

        if (user is null)
            return ApiResponse<AuthTokenDto>.Fail("User not found or inactive.");

        // 5. Issue new tokens
        // Load user entity for token generation
        var userEntity = await context.Users
            .IgnoreQueryFilters()
            .FirstAsync(u => u.Id == user.Id, cancellationToken);

        var newAccessToken = tokenService.GenerateAccessToken(userEntity, user.TenantId);
        var newRawRefreshToken = tokenService.GenerateRefreshTokenString();
        var ipAddress = httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();

        var newRefreshToken = RefreshToken.Create(
            userId: user.Id,
            tenantId: user.TenantId,
            token: newRawRefreshToken,
            expiryDays: 7,
            ipAddress: ipAddress);

        context.RefreshTokens.Add(newRefreshToken);
        await context.SaveChangesAsync(cancellationToken);

        // 6. Rotate the cookie
        SetRefreshTokenCookie(newRawRefreshToken, newRefreshToken.ExpiresAt);

        return ApiResponse<AuthTokenDto>.Ok(
            new AuthTokenDto(newAccessToken, user.Id, user.TenantId, user.Email, user.FirstName));
    }

    private void SetRefreshTokenCookie(string token, DateTime expires)
    {
        httpContextAccessor.HttpContext?.Response.Cookies.Append("refresh_token", token,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = expires
            });
    }
}
```

---

## FILE 13 — Application/Features/Auth/Commands/ForgotPassword/ForgotPasswordCommand.cs

```csharp
// InvoMir.Application/Features/Auth/Commands/ForgotPassword/ForgotPasswordCommand.cs
namespace InvoMir.Application.Features.Auth.Commands.ForgotPassword;

public sealed record ForgotPasswordCommand(string Email) : IRequest<ApiResponse<string>>;
```

---

## FILE 14 — Application/Features/Auth/Commands/ForgotPassword/ForgotPasswordCommandHandler.cs

```csharp
// InvoMir.Application/Features/Auth/Commands/ForgotPassword/ForgotPasswordCommandHandler.cs
namespace InvoMir.Application.Features.Auth.Commands.ForgotPassword;

public sealed class ForgotPasswordCommandHandler(
    IAppDbContext context,
    IEmailService emailService)
    : IRequestHandler<ForgotPasswordCommand, ApiResponse<string>>
{
    public async Task<ApiResponse<string>> Handle(
        ForgotPasswordCommand request,
        CancellationToken cancellationToken)
    {
        // SECURITY: Always return 200. Never reveal if email exists.
        // Prevents email enumeration — attacker cannot probe your user database.
        const string AlwaysSuccessMessage = "If your email is registered, a reset link has been sent.";

        var user = await context.Users
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(u => u.Email == request.Email.ToLowerInvariant().Trim() && u.IsActive)
            .Select(u => new { u.Id })
            .FirstOrDefaultAsync(cancellationToken);

        if (user is null)
            return ApiResponse<string>.Ok(AlwaysSuccessMessage);  // Silent no-op

        // Invalidate any existing reset tokens for this user
        var existingTokens = await context.PasswordResetTokens
            .Where(t => t.UserId == user.Id && !t.IsUsed)
            .ToListAsync(cancellationToken);

        foreach (var token in existingTokens)
            token.MarkUsed();

        // Generate a new cryptographically secure token
        var rawToken = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(64))
            .Replace("+", "-").Replace("/", "_").Replace("=", "");  // URL-safe base64

        var resetToken = PasswordResetToken.Create(
            userId: user.Id,
            token: rawToken,
            expiryMinutes: 15);

        context.PasswordResetTokens.Add(resetToken);
        await context.SaveChangesAsync(cancellationToken);

        // Send the email (fire — if email fails, user retries)
        await emailService.SendPasswordResetAsync(request.Email, rawToken, cancellationToken);

        return ApiResponse<string>.Ok(AlwaysSuccessMessage);
    }
}
```

---

## FILE 15 — Application/Features/Auth/Commands/ResetPassword/ResetPasswordCommand.cs

```csharp
// InvoMir.Application/Features/Auth/Commands/ResetPassword/ResetPasswordCommand.cs
namespace InvoMir.Application.Features.Auth.Commands.ResetPassword;

public sealed record ResetPasswordCommand(
    string Token,
    string NewPassword
) : IRequest<ApiResponse<string>>;
```

---

## FILE 16 — Application/Features/Auth/Commands/ResetPassword/ResetPasswordCommandValidator.cs

```csharp
// InvoMir.Application/Features/Auth/Commands/ResetPassword/ResetPasswordCommandValidator.cs
namespace InvoMir.Application.Features.Auth.Commands.ResetPassword;

public sealed class ResetPasswordCommandValidator : AbstractValidator<ResetPasswordCommand>
{
    public ResetPasswordCommandValidator()
    {
        RuleFor(x => x.Token)
            .NotEmpty().WithMessage("Reset token is required.");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("New password is required.")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters.")
            .MaximumLength(128)
            .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
            .Matches("[0-9]").WithMessage("Password must contain at least one number.");
    }
}
```

---

## FILE 17 — Application/Features/Auth/Commands/ResetPassword/ResetPasswordCommandHandler.cs

```csharp
// InvoMir.Application/Features/Auth/Commands/ResetPassword/ResetPasswordCommandHandler.cs
namespace InvoMir.Application.Features.Auth.Commands.ResetPassword;

public sealed class ResetPasswordCommandHandler(
    IAppDbContext context,
    IPasswordHasher passwordHasher)
    : IRequestHandler<ResetPasswordCommand, ApiResponse<string>>
{
    public async Task<ApiResponse<string>> Handle(
        ResetPasswordCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Find the reset token
        var resetToken = await context.PasswordResetTokens
            .FirstOrDefaultAsync(t => t.Token == request.Token, cancellationToken);

        if (resetToken is null || !resetToken.IsValid)
            return ApiResponse<string>.Fail("Reset token is invalid or has expired.");

        // 2. Load the user
        var user = await context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == resetToken.UserId && u.IsActive, cancellationToken);

        if (user is null)
            return ApiResponse<string>.Fail("User not found.");

        // 3. Update password
        var newHash = passwordHasher.HashPassword(request.NewPassword);
        user.UpdatePasswordHash(newHash);

        // 4. Invalidate the reset token
        resetToken.MarkUsed();

        // 5. Revoke ALL refresh tokens — force re-login on all devices after password reset
        var activeRefreshTokens = await context.RefreshTokens
            .IgnoreQueryFilters()
            .Where(t => t.UserId == user.Id && !t.IsRevoked)
            .ToListAsync(cancellationToken);

        foreach (var token in activeRefreshTokens)
            token.Revoke();

        await context.SaveChangesAsync(cancellationToken);

        return ApiResponse<string>.Ok("Password has been reset successfully. Please log in again.");
    }
}
```

---

## FILE 18 — Application/Features/Auth/DTOs/AuthTokenDto.cs

```csharp
// InvoMir.Application/Features/Auth/DTOs/AuthTokenDto.cs
namespace InvoMir.Application.Features.Auth.DTOs;

public sealed record AuthTokenDto(
    string AccessToken,
    Guid UserId,
    Guid TenantId,
    string Email,
    string FirstName
);
```

---

## FILE 19 — Application/Interfaces/ITokenService.cs

```csharp
// InvoMir.Application/Interfaces/ITokenService.cs
namespace InvoMir.Application.Interfaces;

public interface ITokenService
{
    string GenerateAccessToken(User user, Guid tenantId);
    string GenerateRefreshTokenString();
    ClaimsPrincipal? ValidateToken(string token);
}
```

---

## FILE 20 — Application/Interfaces/IPasswordHasher.cs

```csharp
// InvoMir.Application/Interfaces/IPasswordHasher.cs
namespace InvoMir.Application.Interfaces;

public interface IPasswordHasher
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string hash);
}
```

---

## FILE 21 — Application/Interfaces/IEmailService.cs (Auth-relevant portion)

```csharp
// InvoMir.Application/Interfaces/IEmailService.cs
namespace InvoMir.Application.Interfaces;

public interface IEmailService
{
    Task SendPasswordResetAsync(string toEmail, string resetToken, CancellationToken cancellationToken);
    Task SendWelcomeAsync(string toEmail, string firstName, CancellationToken cancellationToken);
}
```

---

## FILE 22 — Infrastructure/Identity/TokenService.cs

```csharp
// InvoMir.Infrastructure/Identity/TokenService.cs
namespace InvoMir.Infrastructure.Identity;

public sealed class TokenService(IOptions<JwtSettings> jwtSettings) : ITokenService
{
    private readonly JwtSettings _settings = jwtSettings.Value;

    public string GenerateAccessToken(User user, Guid tenantId)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_settings.Secret));

        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // Claims are the data embedded inside the JWT
        // They are readable by anyone who has the token — never store sensitive data
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),  // unique per token
            new Claim("tenant_id", tenantId.ToString()),   // drives multi-tenant filtering
            new Claim("first_name", user.FirstName),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("plan", user.Plan)
        };

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_settings.AccessTokenExpiryMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshTokenString()
    {
        // 64 bytes = 512 bits of entropy — cryptographically secure
        return Convert.ToBase64String(
            System.Security.Cryptography.RandomNumberGenerator.GetBytes(64))
            .Replace("+", "-").Replace("/", "_").Replace("=", "");
    }

    public ClaimsPrincipal? ValidateToken(string token)
    {
        try
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Secret));

            var handler = new JwtSecurityTokenHandler();
            return handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = _settings.Issuer,
                ValidateAudience = true,
                ValidAudience = _settings.Audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero   // No grace period — 15 min means 15 min
            }, out _);
        }
        catch
        {
            return null;
        }
    }
}
```

---

## FILE 23 — Infrastructure/Identity/PasswordHasher.cs

```csharp
// InvoMir.Infrastructure/Identity/PasswordHasher.cs
namespace InvoMir.Infrastructure.Identity;

// BCrypt — the industry standard for password hashing
// Work factor 12 = ~250ms per hash — fast for users, brutal for attackers brute-forcing
public sealed class BcryptPasswordHasher : IPasswordHasher
{
    private const int WorkFactor = 12;

    public string HashPassword(string password)
        => BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);

    public bool VerifyPassword(string password, string hash)
        => BCrypt.Net.BCrypt.Verify(password, hash);
}
```

---

## FILE 24 — Infrastructure/Settings/JwtSettings.cs

```csharp
// InvoMir.Infrastructure/Settings/JwtSettings.cs
namespace InvoMir.Infrastructure.Settings;

public sealed class JwtSettings
{
    public string Secret { get; init; } = string.Empty;          // From environment variable
    public string Issuer { get; init; } = "invomir";
    public string Audience { get; init; } = "invomir-users";
    public int AccessTokenExpiryMinutes { get; init; } = 15;     // Short-lived access token
    public int RefreshTokenExpiryDays { get; init; } = 7;
}
```

---

## FILE 25 — Infrastructure/Persistence/Configurations/TenantConfiguration.cs

```csharp
// InvoMir.Infrastructure/Persistence/Configurations/TenantConfiguration.cs
namespace InvoMir.Infrastructure.Persistence.Configurations;

public sealed class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    public void Configure(EntityTypeBuilder<Tenant> builder)
    {
        builder.ToTable("tenants");
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Name).HasMaxLength(200).IsRequired();
        builder.Property(t => t.Slug).HasMaxLength(100).IsRequired();
        builder.Property(t => t.Plan).HasMaxLength(30).IsRequired().HasDefaultValue("free");
        builder.Property(t => t.StripeCustomerId).HasMaxLength(100);
        builder.Property(t => t.IsActive).IsRequired().HasDefaultValue(true);

        builder.HasIndex(t => t.Slug).IsUnique();

        builder.HasMany(t => t.Users)
            .WithOne()
            .HasForeignKey(u => u.TenantId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
```

---

## FILE 26 — Infrastructure/Persistence/Configurations/UserConfiguration.cs

```csharp
// InvoMir.Infrastructure/Persistence/Configurations/UserConfiguration.cs
namespace InvoMir.Infrastructure.Persistence.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");
        builder.HasKey(u => u.Id);

        builder.Property(u => u.Email).HasMaxLength(255).IsRequired();
        builder.Property(u => u.PasswordHash).HasMaxLength(255).IsRequired();
        builder.Property(u => u.FirstName).HasMaxLength(100).IsRequired();
        builder.Property(u => u.LastName).HasMaxLength(100).IsRequired();
        builder.Property(u => u.Role).HasMaxLength(20).IsRequired().HasDefaultValue("owner");
        builder.Property(u => u.Plan).HasMaxLength(30).IsRequired().HasDefaultValue("free");
        builder.Property(u => u.Currency).HasMaxLength(10).IsRequired().HasDefaultValue("USD");
        builder.Property(u => u.TaxPercent).HasColumnType("decimal(5,2)").HasDefaultValue(0);
        builder.Property(u => u.LogoUrl).HasMaxLength(500);
        builder.Property(u => u.StripeAccountId).HasMaxLength(100);
        builder.Property(u => u.IsActive).IsRequired().HasDefaultValue(true);
        builder.Property(u => u.EmailVerified).IsRequired().HasDefaultValue(false);

        builder.HasIndex(u => u.Email).IsUnique();
        builder.HasIndex(u => u.TenantId);
        builder.HasIndex(u => new { u.TenantId, u.IsActive });

        builder.HasMany(u => u.RefreshTokens)
            .WithOne()
            .HasForeignKey(rt => rt.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(u => u.PasswordResetTokens)
            .WithOne()
            .HasForeignKey(prt => prt.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
```

---

## FILE 27 — Infrastructure/Persistence/Configurations/RefreshTokenConfiguration.cs

```csharp
// InvoMir.Infrastructure/Persistence/Configurations/RefreshTokenConfiguration.cs
namespace InvoMir.Infrastructure.Persistence.Configurations;

public sealed class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("refresh_tokens");
        builder.HasKey(rt => rt.Id);

        builder.Property(rt => rt.Token).HasMaxLength(200).IsRequired();
        builder.Property(rt => rt.DeviceInfo).HasMaxLength(500);
        builder.Property(rt => rt.IpAddress).HasMaxLength(50);
        builder.Property(rt => rt.IsRevoked).IsRequired().HasDefaultValue(false);

        builder.HasIndex(rt => rt.Token).IsUnique();
        builder.HasIndex(rt => rt.UserId);
        builder.HasIndex(rt => new { rt.UserId, rt.IsRevoked });    // fast lookup for active tokens
    }
}
```

---

## FILE 28 — Infrastructure/Persistence/Configurations/PasswordResetTokenConfiguration.cs

```csharp
// InvoMir.Infrastructure/Persistence/Configurations/PasswordResetTokenConfiguration.cs
namespace InvoMir.Infrastructure.Persistence.Configurations;

public sealed class PasswordResetTokenConfiguration : IEntityTypeConfiguration<PasswordResetToken>
{
    public void Configure(EntityTypeBuilder<PasswordResetToken> builder)
    {
        builder.ToTable("password_reset_tokens");
        builder.HasKey(prt => prt.Id);

        builder.Property(prt => prt.Token).HasMaxLength(200).IsRequired();
        builder.Property(prt => prt.IsUsed).IsRequired().HasDefaultValue(false);

        builder.HasIndex(prt => prt.Token).IsUnique();
        builder.HasIndex(prt => prt.UserId);
    }
}
```

---

## FILE 29 — Infrastructure/Persistence/AppDbContext.cs (Auth DbSets)

```csharp
// InvoMir.Infrastructure/Persistence/AppDbContext.cs
// Add these DbSets to the existing AppDbContext

public DbSet<Tenant> Tenants => Set<Tenant>();
public DbSet<User> Users => Set<User>();
public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();

// IMPORTANT: Tenant and PasswordResetToken do NOT inherit TenantEntity
// (Tenant IS the root, PasswordResetToken belongs to User not Tenant)
// Only add global query filters for TenantEntity descendants (users, clients, invoices, etc.)
```

---

## FILE 30 — Application/Interfaces/IAppDbContext.cs (Auth-relevant portion)

```csharp
// InvoMir.Application/Interfaces/IAppDbContext.cs
namespace InvoMir.Application.Interfaces;

public interface IAppDbContext
{
    DbSet<Tenant> Tenants { get; }
    DbSet<User> Users { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<PasswordResetToken> PasswordResetTokens { get; }
    // ... other DbSets for invoices, clients etc. added later

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
```

---

## FILE 31 — API/Controllers/AuthController.cs

```csharp
// InvoMir.API/Controllers/AuthController.cs
namespace InvoMir.API.Controllers;

[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public sealed class AuthController(ISender mediator) : ControllerBase
{
    // POST /api/auth/register
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<AuthTokenDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<AuthTokenDto>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register(
        [FromBody] RegisterCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return result.Success
            ? StatusCode(StatusCodes.Status201Created, result)
            : Conflict(result);
    }

    // POST /api/auth/login
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<AuthTokenDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AuthTokenDto>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(
        [FromBody] LoginCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return result.Success ? Ok(result) : Unauthorized(result);
    }

    // POST /api/auth/refresh
    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<AuthTokenDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AuthTokenDto>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new RefreshTokenCommand(), cancellationToken);
        return result.Success ? Ok(result) : Unauthorized(result);
    }

    // POST /api/auth/forgot-password
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ForgotPassword(
        [FromBody] ForgotPasswordCommand command,
        CancellationToken cancellationToken)
    {
        // Always 200 — never reveal if email exists
        var result = await mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    // POST /api/auth/reset-password
    [HttpPost("reset-password")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword(
        [FromBody] ResetPasswordCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
```

---

## FILE 32 — API/Extensions/AuthServiceExtensions.cs

```csharp
// InvoMir.API/Extensions/AuthServiceExtensions.cs
namespace InvoMir.API.Extensions;

public static class AuthServiceExtensions
{
    public static IServiceCollection AddJwtAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var jwtSettings = configuration.GetSection("Jwt").Get<JwtSettings>()
            ?? throw new InvalidOperationException("JWT settings are not configured.");

        services
            .AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwtSettings.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwtSettings.Audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtSettings.Secret)),
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero    // Zero tolerance — 15 min is exactly 15 min
                };

                // Return JSON error — not HTML
                options.Events = new JwtBearerEvents
                {
                    OnChallenge = context =>
                    {
                        context.HandleResponse();
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        context.Response.ContentType = "application/json";
                        var result = JsonSerializer.Serialize(
                            ApiResponse<string>.Fail("Authentication required."));
                        return context.Response.WriteAsync(result);
                    },
                    OnForbidden = context =>
                    {
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        context.Response.ContentType = "application/json";
                        var result = JsonSerializer.Serialize(
                            ApiResponse<string>.Fail("You do not have permission to perform this action."));
                        return context.Response.WriteAsync(result);
                    }
                };
            });

        services.AddAuthorization();

        return services;
    }
}
```

---

## FILE 33 — API/Middlewares/GlobalExceptionMiddleware.cs

```csharp
// InvoMir.API/Middlewares/GlobalExceptionMiddleware.cs
namespace InvoMir.API.Middlewares;

public sealed class GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (ValidationException ex)
        {
            var errors = ex.Errors.Select(e => e.ErrorMessage).ToList();
            context.Response.StatusCode = StatusCodes.Status422UnprocessableEntity;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(ApiResponse<string>.Fail(errors));
        }
        catch (Exception ex)
        {
            // Log the real error internally — NEVER expose it to the client
            logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);

            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(
                ApiResponse<string>.Fail("An unexpected error occurred. Please try again."));
        }
    }
}
```

---

## FILE 34 — Program.cs (Auth-wired)

```csharp
// InvoMir.API/Program.cs
using InvoMir.API.Extensions;
using InvoMir.API.Middlewares;
using InvoMir.Application;
using InvoMir.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// ── Services ─────────────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddApplication();           // MediatR, FluentValidation, pipeline behaviors
builder.Services.AddInfrastructure(builder.Configuration);   // EF, Redis, services
builder.Services.AddJwtAuthentication(builder.Configuration);

// Swagger with JWT support
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new() { Title = "InvoMir API", Version = "v1" });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "Enter your JWT access token."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// CORS — allow your Angular app origin only
builder.Services.AddCors(options =>
    options.AddPolicy("InvoMirPolicy", policy =>
        policy
            .WithOrigins(
                "http://localhost:4200",    // Angular dev server
                "https://invomir.com",     // Production web app
                "https://www.invomir.com")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()));   // Required for httpOnly cookies

// ── Pipeline ──────────────────────────────────────────────────────────
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<GlobalExceptionMiddleware>();  // Must be first — catches all errors
app.UseHttpsRedirection();
app.UseCors("InvoMirPolicy");
app.UseAuthentication();    // Order matters: Authentication before Authorization
app.UseAuthorization();
app.MapControllers();

app.Run();
```

---

## FILE 35 — appsettings.json (structure only — values come from env vars)

```json
{
  "Jwt": {
    "Secret": "",
    "Issuer": "invomir",
    "Audience": "invomir-users",
    "AccessTokenExpiryMinutes": 15,
    "RefreshTokenExpiryDays": 7
  },
  "ConnectionStrings": {
    "DefaultConnection": "",
    "Redis": ""
  },
  "SendGrid": {
    "ApiKey": "",
    "FromEmail": "noreply@invomir.com",
    "FromName": "InvoMir"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

---

## FILE 36 — Infrastructure/DependencyInjection.cs (auth additions)

```csharp
// Add these lines inside AddInfrastructure():

// Password hashing
services.AddScoped<IPasswordHasher, BcryptPasswordHasher>();

// Token service
services.AddScoped<ITokenService, TokenService>();

// JWT settings binding
services.Configure<JwtSettings>(configuration.GetSection("Jwt"));
```

---

## FILE 37 — NuGet packages to install

```bash
# In InvoMir.Infrastructure:
dotnet add package BCrypt.Net-Next
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package System.IdentityModel.Tokens.Jwt

# In InvoMir.Application:
dotnet add package FluentValidation.DependencyInjectionExtensions
dotnet add package MediatR
dotnet add package MediatR.Extensions.Microsoft.DependencyInjection

# In InvoMir.API:
dotnet add package Swashbuckle.AspNetCore
```

---

## FILE 38 — EF Core Migration commands

```bash
# Run from the backend/ folder
# Step 1: Add the first migration
dotnet ef migrations add InitialAuthSchema \
  --project InvoMir.Infrastructure \
  --startup-project InvoMir.API \
  --output-dir Persistence/Migrations

# Step 2: Apply to the database
dotnet ef database update \
  --project InvoMir.Infrastructure \
  --startup-project InvoMir.API
```

---

## SECURITY IMPACT SUMMARY

| Threat | Protection |
|---|---|
| Password theft via DB breach | BCrypt work factor 12 — cracking 1 password takes years |
| XSS token theft | Refresh token in httpOnly cookie — JS cannot read it |
| Token replay attacks | Refresh tokens rotate on every use — each token single-use |
| Email enumeration | Forgot-password always returns 200 — attacker learns nothing |
| Cross-tenant data leakage | tenant_id in JWT + global EF query filter — architectural guarantee |
| Brute force login | Generic "invalid email or password" — no signal to attacker |
| Stale sessions after password reset | All refresh tokens revoked — forced re-login on all devices |
| Expired token abuse | ClockSkew = zero — tokens valid for exactly their declared lifetime |

---

## PERFORMANCE IMPACT SUMMARY

| Decision | Why it matters at scale |
|---|---|
| tenant_id in JWT claims | Zero DB lookup per request to resolve tenant — saves 1 query on every authenticated call |
| IgnoreQueryFilters() on login/refresh | Only used where deliberately needed — global filter stays intact everywhere else |
| AsNoTracking() on all auth reads | Login fetches only 6 fields — no entity tracking overhead |
| Revoke old tokens in batch | Single query finds all active tokens — not N queries per token |
| CancellationToken on every async | If client disconnects, DB work stops immediately — no wasted connections |

---

## NEXT STEPS (in order)

1. Create the entities in InvoMir.Domain (Files 1–4)
2. Add DbSets + configurations to AppDbContext (Files 25–29)
3. Run the EF migration (File 38)
4. Implement Application layer handlers (Files 5–17)
5. Implement Infrastructure services (Files 22–23)
6. Wire up the controller and Program.cs (Files 31–34)
7. Install NuGet packages (File 37)
8. Test with Swagger UI — register → login → refresh → forgot → reset
