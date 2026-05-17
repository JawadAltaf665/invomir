using InvoMir.Shared.Constants;

namespace InvoMir.Domain.Entities;

public sealed class Payment : TenantEntity
{
    public Guid InvoiceId { get; private set; }
    public Guid UserId { get; private set; }
    public decimal Amount { get; private set; }
    public string Currency { get; private set; } = "USD";
    public string Method { get; private set; } = PaymentConstants.Methods.Other;
    public string Status { get; private set; } = PaymentConstants.Statuses.Completed;
    public string? StripeChargeId { get; private set; }
    public string? StripePaymentIntentId { get; private set; }
    public string? FailureReason { get; private set; }
    public string? Note { get; private set; }
    public DateTime PaidAt { get; private set; }

    public Invoice Invoice { get; private set; } = null!;

    private Payment()
    {
    }

    public static Payment CreateManual(
        Guid invoiceId,
        Guid userId,
        decimal amount,
        string currency,
        string method,
        DateTime paidAtUtc,
        string? note)
    {
        if (invoiceId == Guid.Empty)
            throw new ArgumentException("Invoice id is required.", nameof(invoiceId));

        if (userId == Guid.Empty)
            throw new ArgumentException("User id is required.", nameof(userId));

        if (amount <= 0)
            throw new ArgumentOutOfRangeException(nameof(amount), "Payment amount must be greater than zero.");

        if (string.IsNullOrWhiteSpace(currency))
            throw new ArgumentException("Currency is required.", nameof(currency));

        var normalizedMethod = NormalizeMethod(method);

        return new Payment
        {
            InvoiceId = invoiceId,
            UserId = userId,
            Amount = amount,
            Currency = currency.ToUpperInvariant().Trim(),
            Method = normalizedMethod,
            Status = PaymentConstants.Statuses.Completed,
            PaidAt = paidAtUtc,
            Note = NormalizeOptional(note)
        };
    }

    public static Payment CreateStripe(
        Guid invoiceId,
        Guid userId,
        decimal amount,
        string currency,
        DateTime paidAtUtc,
        string stripePaymentIntentId,
        string? stripeChargeId)
    {
        var payment = CreateCardPayment(
            invoiceId,
            userId,
            amount,
            currency,
            PaymentConstants.Statuses.Completed,
            paidAtUtc,
            stripePaymentIntentId);

        payment.StripeChargeId = NormalizeOptional(stripeChargeId);
        return payment;
    }

    public static Payment CreateFailedStripe(
        Guid invoiceId,
        Guid userId,
        decimal amount,
        string currency,
        DateTime paidAtUtc,
        string stripePaymentIntentId,
        string? failureReason)
    {
        var payment = CreateCardPayment(
            invoiceId,
            userId,
            amount,
            currency,
            PaymentConstants.Statuses.Failed,
            paidAtUtc,
            stripePaymentIntentId);

        payment.FailureReason = NormalizeOptional(failureReason);
        return payment;
    }

    private static string NormalizeMethod(string method)
    {
        if (string.IsNullOrWhiteSpace(method))
            return PaymentConstants.Methods.Other;

        var normalizedMethod = method.Trim().ToLowerInvariant();
        if (!PaymentConstants.Methods.Manual.Contains(normalizedMethod))
            throw new ArgumentException("Payment method is not supported.", nameof(method));

        return normalizedMethod;
    }

    private static Payment CreateCardPayment(
        Guid invoiceId,
        Guid userId,
        decimal amount,
        string currency,
        string status,
        DateTime paidAtUtc,
        string stripePaymentIntentId)
    {
        if (invoiceId == Guid.Empty)
            throw new ArgumentException("Invoice id is required.", nameof(invoiceId));

        if (userId == Guid.Empty)
            throw new ArgumentException("User id is required.", nameof(userId));

        if (amount <= 0)
            throw new ArgumentOutOfRangeException(nameof(amount), "Payment amount must be greater than zero.");

        if (string.IsNullOrWhiteSpace(currency))
            throw new ArgumentException("Currency is required.", nameof(currency));

        if (string.IsNullOrWhiteSpace(stripePaymentIntentId))
            throw new ArgumentException("Stripe payment intent id is required.", nameof(stripePaymentIntentId));

        return new Payment
        {
            InvoiceId = invoiceId,
            UserId = userId,
            Amount = amount,
            Currency = currency.ToUpperInvariant().Trim(),
            Method = PaymentConstants.Methods.Card,
            Status = status,
            StripePaymentIntentId = stripePaymentIntentId.Trim(),
            PaidAt = paidAtUtc
        };
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
