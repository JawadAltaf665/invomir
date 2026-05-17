using InvoMir.Shared.Constants;

namespace InvoMir.Domain.Entities;

public sealed class Subscription : TenantEntity
{
    public Guid UserId { get; private set; }
    public string StripeSubscriptionId { get; private set; } = string.Empty;
    public string? StripeCustomerId { get; private set; }
    public string Plan { get; private set; } = AuthConstants.Plans.Starter;
    public string Status { get; private set; } = SubscriptionConstants.Statuses.Active;
    public string Interval { get; private set; } = SubscriptionConstants.Intervals.Month;
    public decimal Amount { get; private set; }
    public string Currency { get; private set; } = "USD";
    public DateTime CurrentPeriodStart { get; private set; }
    public DateTime CurrentPeriodEnd { get; private set; }
    public bool CancelAtPeriodEnd { get; private set; }
    public DateTime? CancelledAt { get; private set; }

    private Subscription()
    {
    }

    public static Subscription Create(
        Guid userId,
        string stripeSubscriptionId,
        string? stripeCustomerId,
        string plan,
        string status,
        string interval,
        decimal amount,
        string currency,
        DateTime currentPeriodStart,
        DateTime currentPeriodEnd,
        bool cancelAtPeriodEnd,
        DateTime? cancelledAt)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("User id is required.", nameof(userId));

        if (string.IsNullOrWhiteSpace(stripeSubscriptionId))
            throw new ArgumentException("Stripe subscription id is required.", nameof(stripeSubscriptionId));

        Validate(plan, status, interval, amount, currency, currentPeriodStart, currentPeriodEnd);

        return new Subscription
        {
            UserId = userId,
            StripeSubscriptionId = stripeSubscriptionId.Trim(),
            StripeCustomerId = NormalizeOptional(stripeCustomerId),
            Plan = plan,
            Status = status,
            Interval = interval,
            Amount = amount,
            Currency = currency.ToUpperInvariant().Trim(),
            CurrentPeriodStart = currentPeriodStart,
            CurrentPeriodEnd = currentPeriodEnd,
            CancelAtPeriodEnd = cancelAtPeriodEnd,
            CancelledAt = cancelledAt
        };
    }

    public void SyncFromStripe(
        string? stripeCustomerId,
        string plan,
        string status,
        string interval,
        decimal amount,
        string currency,
        DateTime currentPeriodStart,
        DateTime currentPeriodEnd,
        bool cancelAtPeriodEnd,
        DateTime? cancelledAt)
    {
        Validate(plan, status, interval, amount, currency, currentPeriodStart, currentPeriodEnd);

        StripeCustomerId = NormalizeOptional(stripeCustomerId);
        Plan = plan;
        Status = status;
        Interval = interval;
        Amount = amount;
        Currency = currency.ToUpperInvariant().Trim();
        CurrentPeriodStart = currentPeriodStart;
        CurrentPeriodEnd = currentPeriodEnd;
        CancelAtPeriodEnd = cancelAtPeriodEnd;
        CancelledAt = cancelledAt;
    }

    public void ScheduleCancellation(DateTime cancelledAtUtc, DateTime currentPeriodEndUtc)
    {
        if (currentPeriodEndUtc < CurrentPeriodStart)
            throw new ArgumentException("Current period end cannot be before current period start.", nameof(currentPeriodEndUtc));

        Status = currentPeriodEndUtc <= cancelledAtUtc
            ? SubscriptionConstants.Statuses.Cancelled
            : SubscriptionConstants.Statuses.Active;
        CancelAtPeriodEnd = true;
        CancelledAt = cancelledAtUtc;
        CurrentPeriodEnd = currentPeriodEndUtc;
    }

    public void MarkPastDue()
    {
        Status = SubscriptionConstants.Statuses.PastDue;
    }

    private static void Validate(
        string plan,
        string status,
        string interval,
        decimal amount,
        string currency,
        DateTime currentPeriodStart,
        DateTime currentPeriodEnd)
    {
        if (!AuthConstants.Plans.Paid.Contains(plan))
            throw new ArgumentException("Subscription plan is not supported.", nameof(plan));

        if (!SubscriptionConstants.Statuses.All.Contains(status))
            throw new ArgumentException("Subscription status is not supported.", nameof(status));

        if (!SubscriptionConstants.Intervals.All.Contains(interval))
            throw new ArgumentException("Subscription interval is not supported.", nameof(interval));

        if (amount < 0)
            throw new ArgumentOutOfRangeException(nameof(amount), "Subscription amount cannot be negative.");

        if (string.IsNullOrWhiteSpace(currency))
            throw new ArgumentException("Currency is required.", nameof(currency));

        if (currentPeriodEnd < currentPeriodStart)
            throw new ArgumentException("Current period end cannot be before current period start.", nameof(currentPeriodEnd));
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
