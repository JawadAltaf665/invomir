namespace InvoMir.Application.Features.Auth.Commands.VerifyEmail;

public sealed class VerifyEmailCommandHandler(
    IAppDbContext context,
    IClientContext clientContext,
    IAuditService auditService)
    : IRequestHandler<VerifyEmailCommand, ApiResponse<string>>
{
    public async Task<ApiResponse<string>> Handle(
        VerifyEmailCommand request,
        CancellationToken cancellationToken)
    {
        var verificationToken = await context.EmailVerificationTokens
            .FirstOrDefaultAsync(token => token.Token == request.Token, cancellationToken);

        if (verificationToken is null || !verificationToken.IsValid)
            return ApiResponse<string>.Fail("Verification token is invalid or has expired.");

        var user = await context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(
                currentUser => currentUser.Id == verificationToken.UserId &&
                    currentUser.IsActive &&
                    !currentUser.IsDeleted,
                cancellationToken);

        if (user is null)
            return ApiResponse<string>.Fail("Verification token is invalid or has expired.");

        var wasAlreadyVerified = user.EmailVerified;
        user.VerifyEmail();

        var activeVerificationTokens = await context.EmailVerificationTokens
            .Where(token => token.UserId == user.Id && !token.IsUsed)
            .ToListAsync(cancellationToken);

        foreach (var activeVerificationToken in activeVerificationTokens)
            activeVerificationToken.MarkUsed();

        await context.SaveChangesAsync(cancellationToken);

        if (!wasAlreadyVerified)
        {
            await auditService.LogAsync(
                AuditConstants.Entities.User,
                user.Id,
                AuditConstants.Actions.EmailVerified,
                user.TenantId,
                user.Id,
                newValues: new
                {
                    verifiedAt = DateTime.UtcNow,
                    email = user.Email
                },
                ipAddress: clientContext.IpAddress,
                userAgent: clientContext.DeviceInfo,
                cancellationToken: cancellationToken);
        }

        return ApiResponse<string>.Ok("Email verified successfully.");
    }
}
