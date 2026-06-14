using InvoMir.Domain.Enums;

namespace InvoMir.Domain.Entities;

public sealed class QueuedEmail : SoftDeleteEntity
{
    private const int DefaultMaxRetryCount = 3;

    public Guid? TenantId { get; private set; }
    public EmailTemplateType? TemplateType { get; private set; }
    public string ToEmail { get; private set; } = string.Empty;
    public string? ToName { get; private set; }
    public string? Cc { get; private set; }
    public string? Bcc { get; private set; }
    public string Subject { get; private set; } = string.Empty;
    public string Body { get; private set; } = string.Empty;
    public QueuedEmailStatus Status { get; private set; } = QueuedEmailStatus.Pending;
    public int RetryCount { get; private set; }
    public int MaxRetryCount { get; private set; } = DefaultMaxRetryCount;
    public string? ErrorMessage { get; private set; }
    public DateTime? ScheduledAt { get; private set; }
    public DateTime? SentAt { get; private set; }
    public DateTime? LastAttemptAt { get; private set; }
    public string? AttachmentFileName { get; private set; }
    public string? AttachmentContentType { get; private set; }
    public string? AttachmentContentBase64 { get; private set; }

    private QueuedEmail()
    {
    }

    public static QueuedEmail Create(
        string toEmail,
        string subject,
        string body,
        string? toName = null,
        string? cc = null,
        string? bcc = null,
        Guid? tenantId = null,
        EmailTemplateType? templateType = null,
        DateTime? scheduledAt = null,
        int? maxRetryCount = null,
        string? attachmentFileName = null,
        string? attachmentContentType = null,
        string? attachmentContentBase64 = null)
    {
        var retryLimit = maxRetryCount.GetValueOrDefault(DefaultMaxRetryCount);
        if (retryLimit <= 0)
            throw new ArgumentOutOfRangeException(nameof(maxRetryCount), "Max retry count must be positive.");

        return new QueuedEmail
        {
            ToEmail = NormalizeRequired(toEmail, "Recipient email is required.", nameof(toEmail), 256).ToLowerInvariant(),
            ToName = NormalizeOptional(toName, 200),
            Cc = NormalizeOptional(cc, 1000),
            Bcc = NormalizeOptional(bcc, 1000),
            Subject = NormalizeRequired(subject, "Email subject is required.", nameof(subject), 300),
            Body = NormalizeRequired(body, "Email body is required.", nameof(body)),
            TenantId = tenantId,
            TemplateType = templateType,
            ScheduledAt = NormalizeUtc(scheduledAt),
            MaxRetryCount = retryLimit,
            AttachmentFileName = NormalizeOptional(attachmentFileName, 255),
            AttachmentContentType = NormalizeOptional(attachmentContentType, 100),
            AttachmentContentBase64 = NormalizeOptional(attachmentContentBase64)
        };
    }

    public bool CanBeProcessed(DateTime utcNow)
    {
        return Status == QueuedEmailStatus.Pending &&
            RetryCount < MaxRetryCount &&
            (ScheduledAt is null || ScheduledAt <= utcNow);
    }

    public void MarkProcessing(DateTime utcNow)
    {
        if (Status != QueuedEmailStatus.Pending)
            throw new InvalidOperationException("Only pending emails can be processed.");

        Status = QueuedEmailStatus.Processing;
        LastAttemptAt = NormalizeUtc(utcNow);
        ErrorMessage = null;
    }

    public void MarkSent(DateTime utcNow)
    {
        Status = QueuedEmailStatus.Sent;
        SentAt = NormalizeUtc(utcNow);
        ErrorMessage = null;
    }

    public void MarkFailed(string errorMessage, DateTime utcNow)
    {
        RetryCount++;
        LastAttemptAt = NormalizeUtc(utcNow);
        ErrorMessage = NormalizeOptional(errorMessage, 2000);
        Status = RetryCount >= MaxRetryCount
            ? QueuedEmailStatus.Failed
            : QueuedEmailStatus.Pending;
    }

    public void ResetForRetry()
    {
        if (Status != QueuedEmailStatus.Failed)
            throw new InvalidOperationException("Only failed emails can be retried.");

        Status = QueuedEmailStatus.Pending;
        RetryCount = 0;
        ErrorMessage = null;
        SentAt = null;
        LastAttemptAt = null;
    }

    public void Cancel(DateTime utcNow)
    {
        if (Status is not (QueuedEmailStatus.Pending or QueuedEmailStatus.Failed))
            throw new InvalidOperationException("Only pending or failed emails can be cancelled.");

        Status = QueuedEmailStatus.Cancelled;
        LastAttemptAt ??= NormalizeUtc(utcNow);
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

    private static string? NormalizeOptional(string? value, int? maxLength = null)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var normalized = value.Trim();
        if (maxLength is not null && normalized.Length > maxLength.Value)
            return normalized[..maxLength.Value];

        return normalized;
    }

    private static DateTime? NormalizeUtc(DateTime? value)
    {
        if (value is null)
            return null;

        return NormalizeUtc(value.Value);
    }

    private static DateTime NormalizeUtc(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
    }
}
