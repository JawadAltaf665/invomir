using System.Security.Cryptography;

namespace InvoMir.Application.Features.Payments.Commands.CreateStripeConnect;

public sealed class CreateStripeConnectCommandHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    ITenantContext tenantContext,
    IClientContext clientContext,
    IStripeService stripeService,
    IAuditService auditService)
    : IRequestHandler<CreateStripeConnectCommand, StripeConnectUrlDto>
{
    public async Task<StripeConnectUrlDto> Handle(
        CreateStripeConnectCommand request,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var user = await context.Users
            .AsNoTracking()
            .Where(currentUser => currentUser.Id == userId)
            .Select(currentUser => new
            {
                currentUser.Id,
                currentUser.StripeAccountId
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (user is null)
            throw new UnauthorizedAccessException("User context is not available.");

        if (!string.IsNullOrWhiteSpace(user.StripeAccountId))
            throw new BadRequestException("Stripe account is already connected.");

        var state = GenerateState();
        var result = stripeService.CreateConnectOAuthUrl(new StripeConnectOAuthRequestDto(
            user.Id,
            tenantContext.TenantId,
            state));

        await auditService.LogAsync(
            AuditConstants.Entities.User,
            user.Id,
            AuditConstants.Actions.StripeConnectStarted,
            tenantContext.TenantId,
            user.Id,
            oldValues: null,
            newValues: new { stripeConnectStarted = true },
            ipAddress: clientContext.IpAddress,
            userAgent: clientContext.DeviceInfo,
            cancellationToken: cancellationToken);

        return result;
    }

    private static string GenerateState()
    {
        Span<byte> bytes = stackalloc byte[32];
        RandomNumberGenerator.Fill(bytes);

        return Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }
}
