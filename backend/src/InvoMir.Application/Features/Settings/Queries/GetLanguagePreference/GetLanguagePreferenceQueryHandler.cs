using InvoMir.Application.Features.Settings.DTOs;

namespace InvoMir.Application.Features.Settings.Queries.GetLanguagePreference;

public sealed class GetLanguagePreferenceQueryHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext)
    : IRequestHandler<GetLanguagePreferenceQuery, LanguagePreferenceDto>
{
    public async Task<LanguagePreferenceDto> Handle(
        GetLanguagePreferenceQuery request,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var language = await context.Users
            .AsNoTracking()
            .Where(user => user.Id == userId)
            .Select(user => user.PreferredLanguage)
            .FirstOrDefaultAsync(cancellationToken);

        if (language is null)
            throw new NotFoundException(nameof(User), userId);

        return new LanguagePreferenceDto(
            LanguageConstants.TryNormalize(language, out var normalizedLanguage)
                ? normalizedLanguage
                : LanguageConstants.Default);
    }
}
