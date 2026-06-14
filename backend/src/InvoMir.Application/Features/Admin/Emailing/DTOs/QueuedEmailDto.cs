namespace InvoMir.Application.Features.Admin.Emailing.DTOs;

public sealed record QueuedEmailDto(
    Guid Id,
    Guid? TenantId,
    EmailTemplateType? TemplateType,
    string? TemplateTypeName,
    string ToEmail,
    string? ToName,
    string? Cc,
    string? Bcc,
    string Subject,
    string Body,
    QueuedEmailStatus Status,
    string StatusName,
    int RetryCount,
    int MaxRetryCount,
    string? ErrorMessage,
    DateTime? ScheduledAt,
    DateTime? SentAt,
    DateTime CreatedAt,
    DateTime? LastAttemptAt,
    bool HasAttachment,
    string? AttachmentFileName);
