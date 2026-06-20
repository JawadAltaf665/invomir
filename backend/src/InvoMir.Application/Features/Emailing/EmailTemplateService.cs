using System.Text.RegularExpressions;

namespace InvoMir.Application.Features.Emailing;

public sealed class EmailTemplateService(IAppDbContext context) : IEmailTemplateService
{
    private static readonly Regex TokenRegex = new(
        @"\{\{\s*(?<token>[A-Za-z0-9_]+)\s*\}\}",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    public async Task<EmailTemplate?> GetTemplateAsync(
        EmailTemplateType templateType,
        string language = DefaultEmailTemplateCatalog.DefaultLanguage,
        CancellationToken cancellationToken = default)
    {
        var normalizedLanguage = NormalizeLanguage(language);

        var template = await context.EmailTemplates
            .AsNoTracking()
            .Where(currentTemplate =>
                currentTemplate.TemplateType == templateType &&
                currentTemplate.Language == normalizedLanguage &&
                currentTemplate.IsActive)
            .OrderByDescending(currentTemplate => currentTemplate.LastModificationTime ?? currentTemplate.CreationTime)
            .FirstOrDefaultAsync(cancellationToken);

        if (template is not null)
            return template;

        if (!normalizedLanguage.Equals(DefaultEmailTemplateCatalog.DefaultLanguage, StringComparison.OrdinalIgnoreCase))
        {
            template = await context.EmailTemplates
                .AsNoTracking()
                .Where(currentTemplate =>
                    currentTemplate.TemplateType == templateType &&
                    currentTemplate.Language == DefaultEmailTemplateCatalog.DefaultLanguage &&
                    currentTemplate.IsActive)
                .OrderByDescending(currentTemplate => currentTemplate.LastModificationTime ?? currentTemplate.CreationTime)
                .FirstOrDefaultAsync(cancellationToken);

            if (template is not null)
                return template;
        }

        var defaultTemplate = DefaultEmailTemplateCatalog.Find(templateType, DefaultEmailTemplateCatalog.DefaultLanguage);
        return defaultTemplate is null
            ? null
            : EmailTemplate.Create(
                defaultTemplate.TemplateType,
                defaultTemplate.Name,
                defaultTemplate.Subject,
                defaultTemplate.Body,
                defaultTemplate.Language);
    }

    public async Task<string> RenderSubjectAsync(
        EmailTemplateType templateType,
        Dictionary<string, string> tokens,
        string language = DefaultEmailTemplateCatalog.DefaultLanguage,
        CancellationToken cancellationToken = default)
    {
        var template = await GetTemplateOrThrowAsync(templateType, language, cancellationToken);
        return RenderTokens(template.Subject, tokens);
    }

    public async Task<string> RenderBodyAsync(
        EmailTemplateType templateType,
        Dictionary<string, string> tokens,
        string language = DefaultEmailTemplateCatalog.DefaultLanguage,
        CancellationToken cancellationToken = default)
    {
        var template = await GetTemplateOrThrowAsync(templateType, language, cancellationToken);
        return RenderTokens(template.Body, tokens);
    }

    public static string RenderTokens(string template, IReadOnlyDictionary<string, string> tokens)
    {
        if (string.IsNullOrEmpty(template) || tokens.Count == 0)
            return template;

        var tokenLookup = new Dictionary<string, string>(tokens, StringComparer.OrdinalIgnoreCase);
        return TokenRegex.Replace(template, match =>
        {
            var tokenName = match.Groups["token"].Value;
            return tokenLookup.TryGetValue(tokenName, out var value)
                ? value
                : match.Value;
        });
    }

    private async Task<EmailTemplate> GetTemplateOrThrowAsync(
        EmailTemplateType templateType,
        string language,
        CancellationToken cancellationToken)
    {
        var template = await GetTemplateAsync(templateType, language, cancellationToken);
        if (template is null)
            throw new NotFoundException(nameof(EmailTemplate), templateType);

        return template;
    }

    private static string NormalizeLanguage(string? language)
    {
        return string.IsNullOrWhiteSpace(language)
            ? DefaultEmailTemplateCatalog.DefaultLanguage
            : language.Trim().ToLowerInvariant();
    }
}
