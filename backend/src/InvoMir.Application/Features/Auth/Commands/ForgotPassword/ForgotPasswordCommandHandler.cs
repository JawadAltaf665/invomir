using System.Security.Cryptography;

namespace InvoMir.Application.Features.Auth.Commands.ForgotPassword;

public sealed class ForgotPasswordCommandHandler(
    IAppDbContext context,
    IEmailService emailService,
    IClientContext clientContext,
    IAuditService auditService)
    : IRequestHandler<ForgotPasswordCommand, ApiResponse<string>>
{
    private const string AlwaysSuccessMessage = "If your email is registered, a reset link has been sent.";

    public async Task<ApiResponse<string>> Handle(
        ForgotPasswordCommand request,
        CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.ToLowerInvariant().Trim();
        var user = await context.Users
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(currentUser => currentUser.Email == normalizedEmail && currentUser.IsActive && !currentUser.IsDeleted)
            .Select(currentUser => new { currentUser.Id })
            .FirstOrDefaultAsync(cancellationToken);

        if (user is null)
            return ApiResponse<string>.Ok(AlwaysSuccessMessage);

        var existingTokens = await context.PasswordResetTokens
            .Where(token => token.UserId == user.Id && !token.IsUsed)
            .ToListAsync(cancellationToken);

        foreach (var token in existingTokens)
            token.MarkUsed();

        var rawToken = GenerateResetToken();
        var resetToken = PasswordResetToken.Create(user.Id, rawToken);

        context.PasswordResetTokens.Add(resetToken);
        await context.SaveChangesAsync(cancellationToken);
        await auditService.LogAsync(
            entityName: AuditConstants.Entities.User,
            entityId: user.Id,
            action: AuditConstants.Actions.PasswordResetRequested,
            userId: user.Id,
            newValues: new
            {
                requestedAt = DateTime.UtcNow,
                email = normalizedEmail
            },
            ipAddress: clientContext.IpAddress,
            userAgent: clientContext.DeviceInfo,
            cancellationToken: cancellationToken);

        await emailService.SendPasswordResetAsync(normalizedEmail, rawToken, cancellationToken);

        return ApiResponse<string>.Ok(AlwaysSuccessMessage);
    }

    private static string GenerateResetToken()
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(64))
            .Replace("+", "-", StringComparison.Ordinal)
            .Replace("/", "_", StringComparison.Ordinal)
            .Replace("=", string.Empty, StringComparison.Ordinal);
    }
}
