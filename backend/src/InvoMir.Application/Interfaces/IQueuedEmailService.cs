namespace InvoMir.Application.Interfaces;

public interface IQueuedEmailService
{
    Task<Guid> EnqueueAsync(
        string toEmail,
        string subject,
        string body,
        string? toName = null,
        string? cc = null,
        string? bcc = null,
        Guid? tenantId = null,
        EmailTemplateType? templateType = null,
        DateTime? scheduledAt = null,
        byte[]? attachment = null,
        string? attachmentFileName = null,
        string? attachmentContentType = null,
        CancellationToken cancellationToken = default);

    Task<Guid> EnqueueFromTemplateAsync(
        EmailTemplateType templateType,
        string toEmail,
        Dictionary<string, string> tokens,
        string language = "en",
        string? toName = null,
        string? cc = null,
        string? bcc = null,
        Guid? tenantId = null,
        DateTime? scheduledAt = null,
        byte[]? attachment = null,
        string? attachmentFileName = null,
        string? attachmentContentType = null,
        CancellationToken cancellationToken = default);
}
