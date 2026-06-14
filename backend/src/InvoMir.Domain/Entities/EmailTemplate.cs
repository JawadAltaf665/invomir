using InvoMir.Domain.Enums;

namespace InvoMir.Domain.Entities;

public sealed class EmailTemplate : SoftDeleteEntity
{
    public EmailTemplateType TemplateType { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Subject { get; private set; } = string.Empty;
    public string Body { get; private set; } = string.Empty;
    public string Language { get; private set; } = "en";
    public bool IsActive { get; private set; } = true;
    public bool IsSystemTemplate { get; private set; } = true;

    private EmailTemplate()
    {
    }

    public static EmailTemplate Create(
        EmailTemplateType templateType,
        string name,
        string subject,
        string body,
        string? language = null,
        bool isActive = true,
        bool isSystemTemplate = true)
    {
        return new EmailTemplate
        {
            TemplateType = templateType,
            Name = NormalizeRequired(name, "Template name is required.", nameof(name), 200),
            Subject = NormalizeRequired(subject, "Template subject is required.", nameof(subject), 300),
            Body = NormalizeRequired(body, "Template body is required.", nameof(body)),
            Language = NormalizeLanguage(language),
            IsActive = isActive,
            IsSystemTemplate = isSystemTemplate
        };
    }

    public void Update(
        EmailTemplateType templateType,
        string name,
        string subject,
        string body,
        string? language,
        bool isActive)
    {
        TemplateType = templateType;
        Name = NormalizeRequired(name, "Template name is required.", nameof(name), 200);
        Subject = NormalizeRequired(subject, "Template subject is required.", nameof(subject), 300);
        Body = NormalizeRequired(body, "Template body is required.", nameof(body));
        Language = NormalizeLanguage(language);
        IsActive = isActive;
    }

    public void Activate()
    {
        IsActive = true;
    }

    public void Deactivate()
    {
        IsActive = false;
    }

    private static string NormalizeRequired(
        string value,
        string message,
        string parameterName,
        int? maxLength = null)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException(message, parameterName);

        var normalized = value.Trim();
        if (maxLength is not null && normalized.Length > maxLength.Value)
            throw new ArgumentException($"{parameterName} must not exceed {maxLength.Value} characters.", parameterName);

        return normalized;
    }

    private static string NormalizeLanguage(string? language)
    {
        if (string.IsNullOrWhiteSpace(language))
            return "en";

        var normalized = language.Trim().ToLowerInvariant();
        if (normalized.Length > 20)
            throw new ArgumentException("Language must not exceed 20 characters.", nameof(language));

        return normalized;
    }
}
