namespace InvoMir.Application.Features.Admin.Emailing;

public static class EmailTemplateDuplicateGuard
{
    public static async Task EnsureNoDuplicateActiveTemplateAsync(
        IAppDbContext context,
        EmailTemplateType templateType,
        string language,
        Guid? excludedId,
        CancellationToken cancellationToken)
    {
        var normalizedLanguage = NormalizeLanguage(language);
        var exists = await context.EmailTemplates
            .IgnoreQueryFilters()
            .AsNoTracking()
            .AnyAsync(template =>
                !template.IsDeleted &&
                template.IsActive &&
                template.TemplateType == templateType &&
                template.Language == normalizedLanguage &&
                (excludedId == null || template.Id != excludedId.Value),
                cancellationToken);

        if (exists)
            throw new ConflictException("An active template already exists for this template type and language.");
    }

    public static string NormalizeLanguage(string? language)
    {
        return string.IsNullOrWhiteSpace(language)
            ? "en"
            : language.Trim().ToLowerInvariant();
    }
}
