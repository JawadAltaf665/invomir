using InvoMir.Application.Features.Settings.DTOs;

namespace InvoMir.Application.Features.Settings.Commands.UpdateLanguagePreference;

public sealed class UpdateLanguagePreferenceCommandHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    ITenantContext tenantContext,
    IClientContext clientContext,
    IAuditService auditService)
    : IRequestHandler<UpdateLanguagePreferenceCommand, LanguagePreferenceDto>
{
    public async Task<LanguagePreferenceDto> Handle(
        UpdateLanguagePreferenceCommand request,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var user = await context.Users
            .FirstOrDefaultAsync(currentUser => currentUser.Id == userId, cancellationToken);

        if (user is null)
            throw new NotFoundException(nameof(User), userId);

        var previousLanguage = user.PreferredLanguage;
        user.UpdatePreferredLanguage(request.Language);

        await context.SaveChangesAsync(cancellationToken);

        await auditService.LogAsync(
            AuditConstants.Entities.User,
            user.Id,
            AuditConstants.Actions.Updated,
            tenantContext.TenantId,
            userId,
            new { PreferredLanguage = previousLanguage },
            new { user.PreferredLanguage },
            clientContext.IpAddress,
            clientContext.DeviceInfo,
            cancellationToken);

        return new LanguagePreferenceDto(user.PreferredLanguage);
    }
}
