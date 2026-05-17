using InvoMir.Shared.Constants;

namespace InvoMir.Domain.Entities;

public sealed class Invoice : TenantEntity
{
    public Guid UserId { get; private set; }
    public Guid ClientId { get; private set; }
    public string InvoiceNumber { get; private set; } = string.Empty;
    public string Status { get; private set; } = InvoiceConstants.Statuses.Draft;
    public DateOnly IssueDate { get; private set; }
    public DateOnly DueDate { get; private set; }
    public string Currency { get; private set; } = "USD";
    public decimal Subtotal { get; private set; }
    public decimal TaxPercent { get; private set; }
    public decimal TaxAmount { get; private set; }
    public decimal Discount { get; private set; }
    public decimal Total { get; private set; }
    public string? Notes { get; private set; }
    public string? PaymentLinkToken { get; private set; }
    public string? StripePaymentIntentId { get; private set; }
    public bool RemindersEnabled { get; private set; } = true;
    public DateTime? SentAt { get; private set; }
    public DateTime? ViewedAt { get; private set; }
    public DateTime? PaidAt { get; private set; }
    public DateTime? CancelledAt { get; private set; }

    public Client Client { get; private set; } = null!;
    public ICollection<InvoiceItem> Items { get; private set; } = [];

    private Invoice()
    {
    }

    public static Invoice Create(
        Guid userId,
        Guid clientId,
        string invoiceNumber,
        DateOnly issueDate,
        DateOnly dueDate,
        string currency,
        decimal subtotal,
        decimal taxPercent,
        decimal taxAmount,
        decimal discount,
        decimal total,
        string? notes)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("User id is required.", nameof(userId));

        if (clientId == Guid.Empty)
            throw new ArgumentException("Client id is required.", nameof(clientId));

        if (string.IsNullOrWhiteSpace(invoiceNumber))
            throw new ArgumentException("Invoice number is required.", nameof(invoiceNumber));

        var invoice = new Invoice
        {
            UserId = userId,
            ClientId = clientId,
            InvoiceNumber = invoiceNumber.Trim(),
            IssueDate = issueDate,
            DueDate = dueDate,
            Currency = currency.ToUpperInvariant().Trim(),
            Subtotal = subtotal,
            TaxPercent = taxPercent,
            TaxAmount = taxAmount,
            Discount = discount,
            Total = total,
            Notes = NormalizeOptional(notes)
        };

        return invoice;
    }

    public void UpdateDraft(
        Guid clientId,
        DateOnly dueDate,
        string currency,
        decimal subtotal,
        decimal taxPercent,
        decimal taxAmount,
        decimal discount,
        decimal total,
        string? notes)
    {
        if (!CanEditDraft())
            throw new InvalidOperationException("Only draft invoices can be edited.");

        if (clientId == Guid.Empty)
            throw new ArgumentException("Client id is required.", nameof(clientId));

        ClientId = clientId;
        DueDate = dueDate;
        Currency = currency.ToUpperInvariant().Trim();
        Subtotal = subtotal;
        TaxPercent = taxPercent;
        TaxAmount = taxAmount;
        Discount = discount;
        Total = total;
        Notes = NormalizeOptional(notes);
    }

    public bool CanEditDraft() => Status == InvoiceConstants.Statuses.Draft;

    public bool CanSend() => Status == InvoiceConstants.Statuses.Draft;

    public bool CanResend()
    {
        return Status is InvoiceConstants.Statuses.Sent
            or InvoiceConstants.Statuses.Viewed
            or InvoiceConstants.Statuses.Overdue;
    }

    public bool CanCancelIssued()
    {
        return Status is InvoiceConstants.Statuses.Sent
            or InvoiceConstants.Statuses.Viewed
            or InvoiceConstants.Statuses.Overdue;
    }

    public bool IsPaid() => Status == InvoiceConstants.Statuses.Paid;

    public bool CanMarkPaid()
    {
        return Status is not InvoiceConstants.Statuses.Paid
            and not InvoiceConstants.Statuses.Cancelled;
    }

    public bool CanUseReminders()
    {
        return Status is not InvoiceConstants.Statuses.Paid
            and not InvoiceConstants.Statuses.Cancelled;
    }

    public bool CanScheduleReminders()
    {
        return RemindersEnabled &&
            (Status is InvoiceConstants.Statuses.Sent
                or InvoiceConstants.Statuses.Viewed
                or InvoiceConstants.Statuses.Overdue);
    }

    public void SetRemindersEnabled(bool enabled)
    {
        if (!CanUseReminders())
            throw new InvalidOperationException("Invoice is paid or cancelled.");

        RemindersEnabled = enabled;
    }

    public void Cancel(DateTime utcNow)
    {
        if (IsPaid())
            throw new InvalidOperationException("Paid invoices cannot be cancelled.");

        Status = InvoiceConstants.Statuses.Cancelled;
        CancelledAt ??= utcNow;
    }

    public void Send(string paymentLinkToken, DateTime utcNow)
    {
        if (!CanSend())
            throw new InvalidOperationException("Only draft invoices can be sent.");

        SetPaymentLinkToken(paymentLinkToken);
        Status = InvoiceConstants.Statuses.Sent;
        SentAt ??= utcNow;
    }

    public void EnsurePaymentLinkToken(string paymentLinkToken)
    {
        if (!string.IsNullOrWhiteSpace(PaymentLinkToken))
            return;

        SetPaymentLinkToken(paymentLinkToken);
    }

    public void MarkViewed(DateTime utcNow)
    {
        if (Status == InvoiceConstants.Statuses.Sent)
            Status = InvoiceConstants.Statuses.Viewed;

        ViewedAt ??= utcNow;
    }

    public void MarkPaid(DateTime paidAtUtc)
    {
        if (!CanMarkPaid())
            throw new InvalidOperationException("Invoice is already paid or cancelled.");

        Status = InvoiceConstants.Statuses.Paid;
        PaidAt = paidAtUtc;
    }

    public void RecordStripePaymentIntent(string stripePaymentIntentId)
    {
        if (string.IsNullOrWhiteSpace(stripePaymentIntentId))
            throw new ArgumentException("Stripe payment intent id is required.", nameof(stripePaymentIntentId));

        StripePaymentIntentId = stripePaymentIntentId.Trim();
    }

    private void SetPaymentLinkToken(string paymentLinkToken)
    {
        if (string.IsNullOrWhiteSpace(paymentLinkToken))
            throw new ArgumentException("Payment link token is required.", nameof(paymentLinkToken));

        PaymentLinkToken = paymentLinkToken.Trim();
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
