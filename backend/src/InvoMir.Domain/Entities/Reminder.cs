using InvoMir.Shared.Constants;

namespace InvoMir.Domain.Entities;

public sealed class Reminder : TenantEntity
{
    public Guid InvoiceId { get; private set; }
    public Guid UserId { get; private set; }
    public string Type { get; private set; } = ReminderConstants.Types.DueSoon;
    public string Status { get; private set; } = ReminderConstants.Statuses.Pending;
    public DateTime ScheduledForUtc { get; private set; }
    public DateTime? SentAt { get; private set; }
    public DateTime? CancelledAt { get; private set; }
    public string? HangfireJobId { get; private set; }
    public string? FailureReason { get; private set; }

    public Invoice Invoice { get; private set; } = null!;

    private Reminder()
    {
    }

    public static Reminder Create(
        Guid tenantId,
        Guid invoiceId,
        Guid userId,
        string type,
        DateTime scheduledForUtc)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        if (invoiceId == Guid.Empty)
            throw new ArgumentException("Invoice id is required.", nameof(invoiceId));

        if (userId == Guid.Empty)
            throw new ArgumentException("User id is required.", nameof(userId));

        var reminder = new Reminder
        {
            InvoiceId = invoiceId,
            UserId = userId,
            Type = NormalizeType(type),
            ScheduledForUtc = EnsureUtc(scheduledForUtc)
        };

        reminder.SetTenant(tenantId);
        return reminder;
    }

    public bool IsPending() => Status == ReminderConstants.Statuses.Pending;

    public void AttachHangfireJob(string hangfireJobId)
    {
        if (string.IsNullOrWhiteSpace(hangfireJobId))
            throw new ArgumentException("Hangfire job id is required.", nameof(hangfireJobId));

        HangfireJobId = hangfireJobId.Trim();
        RefreshConcurrencyStamp();
    }

    public void MarkSent(DateTime sentAtUtc)
    {
        if (!IsPending())
            return;

        Status = ReminderConstants.Statuses.Sent;
        SentAt = EnsureUtc(sentAtUtc);
        FailureReason = null;
        RefreshConcurrencyStamp();
    }

    public void MarkCancelled(DateTime cancelledAtUtc)
    {
        if (!IsPending())
            return;

        Status = ReminderConstants.Statuses.Cancelled;
        CancelledAt = EnsureUtc(cancelledAtUtc);
        RefreshConcurrencyStamp();
    }

    public void MarkFailed(string failureReason)
    {
        if (!IsPending())
            return;

        Status = ReminderConstants.Statuses.Failed;
        FailureReason = NormalizeOptional(failureReason);
        RefreshConcurrencyStamp();
    }

    private static string NormalizeType(string type)
    {
        var normalizedType = type.Trim().ToLowerInvariant();
        if (!ReminderConstants.Types.All.Contains(normalizedType))
            throw new ArgumentException("Reminder type is not supported.", nameof(type));

        return normalizedType;
    }

    private static DateTime EnsureUtc(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
