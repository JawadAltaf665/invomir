namespace InvoMir.Application.Features.Users.Queries.GetCurrentUser;

public sealed class GetCurrentUserQueryHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext)
    : IRequestHandler<GetCurrentUserQuery, UserProfileDto>
{
    public async Task<UserProfileDto> Handle(
        GetCurrentUserQuery request,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var profile = await context.Users
            .AsNoTracking()
            .Where(user => user.Id == userId)
            .Join(
                context.Tenants.AsNoTracking(),
                user => user.TenantId,
                tenant => tenant.Id,
                (user, tenant) => new UserProfileDto(
                    user.Id,
                    user.Email,
                    user.FirstName,
                    user.LastName,
                    tenant.Name,
                    user.LogoUrl,
                    user.ProfilePictureUrl,
                    user.Currency,
                    user.PreferredLanguage,
                    user.TaxPercent,
                    user.Plan,
                    user.Role,
                    user.StripeAccountId,
                    user.EmailVerified,
                    user.LastLoginAt,
                    user.TrialEndsAt ?? tenant.TrialEndsAt,
                    user.CreationTime))
            .FirstOrDefaultAsync(cancellationToken);

        if (profile is null)
            throw new NotFoundException(nameof(User), userId);

        return profile;
    }
}
