namespace InvoMir.Application.Interfaces;

public interface IEmailTemplateService
{
    Task<EmailTemplate?> GetTemplateAsync(
        EmailTemplateType templateType,
        string language = "en",
        CancellationToken cancellationToken = default);

    Task<string> RenderSubjectAsync(
        EmailTemplateType templateType,
        Dictionary<string, string> tokens,
        string language = "en",
        CancellationToken cancellationToken = default);

    Task<string> RenderBodyAsync(
        EmailTemplateType templateType,
        Dictionary<string, string> tokens,
        string language = "en",
        CancellationToken cancellationToken = default);
}
