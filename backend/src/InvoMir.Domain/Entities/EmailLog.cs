using InvoMir.Shared.Constants;

namespace InvoMir.Domain.Entities;

public sealed class EmailLog : TenantEntity
{
    public Guid? InvoiceId { get; private set; }
    public Guid? UserId { get; private set; }
    public string Type { get; private set; } = string.Empty;
    public string ToEmail { get; private set; } = string.Empty;
    public string Subject { get; private set; } = string.Empty;
    public string Status { get; private set; } = EmailConstants.Statuses.Queued;
    public string? SendGridMessageId { get; private set; }
    public string? FailureReason { get; private set; }
    public DateTime? SentAt { get; private set; }
    public DateTime? DeliveredAt { get; private set; }

    private EmailLog()
    {
    }

    public static EmailLog Create(
        Guid? invoiceId,
        Guid? userId,
        string type,
        string toEmail,
        string subject)
    {
        if (string.IsNullOrWhiteSpace(type))
            throw new ArgumentException("Email type is required.", nameof(type));

        if (string.IsNullOrWhiteSpace(toEmail))
            throw new ArgumentException("Recipient email is required.", nameof(toEmail));

        if (string.IsNullOrWhiteSpace(subject))
            throw new ArgumentException("Email subject is required.", nameof(subject));

        return new EmailLog
        {
            InvoiceId = invoiceId,
            UserId = userId,
            Type = type.Trim(),
            ToEmail = toEmail.Trim().ToLowerInvariant(),
            Subject = subject.Trim()
        };
    }

    public void MarkSent(string? sendGridMessageId, DateTime utcNow)
    {
        Status = EmailConstants.Statuses.Sent;
        SendGridMessageId = NormalizeOptional(sendGridMessageId);
        FailureReason = null;
        SentAt ??= utcNow;
    }

    public void MarkFailed(string failureReason)
    {
        Status = EmailConstants.Statuses.Failed;
        FailureReason = NormalizeOptional(failureReason);
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
