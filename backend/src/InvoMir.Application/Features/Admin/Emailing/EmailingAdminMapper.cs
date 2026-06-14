using InvoMir.Application.Features.Admin.Emailing.DTOs;

namespace InvoMir.Application.Features.Admin.Emailing;

public static class EmailingAdminMapper
{
    public static EmailTemplateDto ToDto(EmailTemplate template)
    {
        return new EmailTemplateDto(
            template.Id,
            template.TemplateType,
            template.TemplateType.ToString(),
            template.Name,
            template.Subject,
            template.Body,
            template.Language,
            template.IsActive,
            template.IsSystemTemplate,
            template.CreationTime,
            template.LastModificationTime);
    }

    public static QueuedEmailDto ToDto(QueuedEmail email)
    {
        return new QueuedEmailDto(
            email.Id,
            email.TenantId,
            email.TemplateType,
            email.TemplateType?.ToString(),
            email.ToEmail,
            email.ToName,
            email.Cc,
            email.Bcc,
            email.Subject,
            email.Body,
            email.Status,
            email.Status.ToString(),
            email.RetryCount,
            email.MaxRetryCount,
            email.ErrorMessage,
            email.ScheduledAt,
            email.SentAt,
            email.CreationTime,
            email.LastAttemptAt,
            !string.IsNullOrWhiteSpace(email.AttachmentContentBase64),
            email.AttachmentFileName);
    }
}
