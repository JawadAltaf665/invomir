namespace InvoMir.Application.Features.Payments.Commands.HandleStripeWebhook;

public sealed class HandleStripeWebhookCommandHandler(
    IStripeService stripeService,
    IAppDbContext context,
    IInvoiceReminderJobService invoiceReminderJobService,
    IEmailService emailService,
    IAuditService auditService)
    : IRequestHandler<HandleStripeWebhookCommand>
{
    private const string PaymentIntentSucceeded = "payment_intent.succeeded";
    private const string PaymentIntentFailed = "payment_intent.payment_failed";
    private const string DefaultBusinessName = "InvoMir";

    public async Task Handle(
        HandleStripeWebhookCommand request,
        CancellationToken cancellationToken)
    {
        var stripeEvent = stripeService.ConstructWebhookEvent(request.Payload, request.SignatureHeader);

        if (stripeEvent.Type == PaymentIntentSucceeded && stripeEvent.PaymentIntent is not null)
        {
            await HandlePaymentSucceededAsync(stripeEvent.PaymentIntent, cancellationToken);
            return;
        }

        if (stripeEvent.Type == PaymentIntentFailed && stripeEvent.PaymentIntent is not null)
        {
            await HandlePaymentFailedAsync(stripeEvent.PaymentIntent, cancellationToken);
        }
    }

    private async Task HandlePaymentSucceededAsync(
        StripePaymentIntentDto paymentIntent,
        CancellationToken cancellationToken)
    {
        if (paymentIntent.InvoiceId is null)
            return;

        var existingPayment = await context.Payments
            .IgnoreQueryFilters()
            .AsNoTracking()
            .AnyAsync(payment =>
                payment.StripePaymentIntentId == paymentIntent.Id &&
                !payment.IsDeleted,
                cancellationToken);

        if (existingPayment)
            return;

        var invoice = await context.Invoices
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(currentInvoice =>
                currentInvoice.Id == paymentIntent.InvoiceId.Value &&
                !currentInvoice.IsDeleted,
                cancellationToken);

        if (invoice is null || !invoice.CanMarkPaid() || !MatchesInvoice(paymentIntent, invoice))
            return;

        var oldValues = ToAuditSnapshot(invoice);
        invoice.MarkPaid(paymentIntent.ReceivedAtUtc);
        invoice.RecordStripePaymentIntent(paymentIntent.Id);

        var payment = Payment.CreateStripe(
            invoice.Id,
            invoice.UserId,
            paymentIntent.Amount,
            paymentIntent.Currency,
            paymentIntent.ReceivedAtUtc,
            paymentIntent.Id,
            paymentIntent.LatestChargeId);

        payment.SetTenant(invoice.TenantId);
        context.Payments.Add(payment);

        var cancelledReminderJobCount = await invoiceReminderJobService.CancelPendingAsync(invoice.Id, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var receiptSnapshot = await GetReceiptSnapshotAsync(invoice, cancellationToken);
        await emailService.SendPaymentReceiptAsync(
            BuildReceiptEmail(receiptSnapshot, invoice, payment),
            cancellationToken);

        await auditService.LogAsync(
            AuditConstants.Entities.Invoice,
            invoice.Id,
            AuditConstants.Actions.Paid,
            invoice.TenantId,
            null,
            oldValues,
            ToAuditSnapshot(invoice, payment, cancelledReminderJobCount),
            cancellationToken: cancellationToken);
    }

    private async Task HandlePaymentFailedAsync(
        StripePaymentIntentDto paymentIntent,
        CancellationToken cancellationToken)
    {
        if (paymentIntent.InvoiceId is null)
            return;

        var alreadyLogged = await context.Payments
            .IgnoreQueryFilters()
            .AsNoTracking()
            .AnyAsync(payment =>
                payment.StripePaymentIntentId == paymentIntent.Id &&
                payment.Status == PaymentConstants.Statuses.Failed &&
                !payment.IsDeleted,
                cancellationToken);

        if (alreadyLogged)
            return;

        var invoice = await context.Invoices
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(currentInvoice =>
                currentInvoice.Id == paymentIntent.InvoiceId.Value &&
                !currentInvoice.IsDeleted,
                cancellationToken);

        if (invoice is null)
            return;

        var payment = Payment.CreateFailedStripe(
            invoice.Id,
            invoice.UserId,
            paymentIntent.Amount,
            string.IsNullOrWhiteSpace(paymentIntent.Currency) ? invoice.Currency : paymentIntent.Currency,
            paymentIntent.ReceivedAtUtc,
            paymentIntent.Id,
            paymentIntent.FailureReason);

        payment.SetTenant(invoice.TenantId);
        context.Payments.Add(payment);
        await context.SaveChangesAsync(cancellationToken);
    }

    private async Task<ReceiptSnapshot> GetReceiptSnapshotAsync(
        Invoice invoice,
        CancellationToken cancellationToken)
    {
        var client = await context.Clients
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(client =>
                client.Id == invoice.ClientId &&
                client.TenantId == invoice.TenantId &&
                !client.IsDeleted)
            .Select(client => new InvoiceClientDto(
                client.Id,
                client.Name,
                client.Email))
            .FirstOrDefaultAsync(cancellationToken);

        if (client is null)
            return new ReceiptSnapshot(
                new InvoiceClientDto(Guid.Empty, "Client", string.Empty),
                new InvoiceIssuerDto(DefaultBusinessName, null, null));

        var issuer = await context.Users
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(user =>
                user.Id == invoice.UserId &&
                user.TenantId == invoice.TenantId &&
                !user.IsDeleted)
            .Join(
                context.Tenants.IgnoreQueryFilters().AsNoTracking().Where(tenant => !tenant.IsDeleted),
                user => user.TenantId,
                tenant => tenant.Id,
                (user, tenant) => new InvoiceIssuerDto(
                    tenant.Name,
                    user.Email,
                    user.LogoUrl))
            .FirstOrDefaultAsync(cancellationToken);

        return new ReceiptSnapshot(
            client,
            issuer ?? new InvoiceIssuerDto(DefaultBusinessName, null, null));
    }

    private static bool MatchesInvoice(StripePaymentIntentDto paymentIntent, Invoice invoice)
    {
        return paymentIntent.Amount == invoice.Total &&
            string.Equals(paymentIntent.Currency, invoice.Currency, StringComparison.OrdinalIgnoreCase);
    }

    private static PaymentReceiptEmailDto BuildReceiptEmail(
        ReceiptSnapshot receiptSnapshot,
        Invoice invoice,
        Payment payment)
    {
        return new PaymentReceiptEmailDto(
            invoice.Id,
            receiptSnapshot.Client.Email,
            receiptSnapshot.Client.Name,
            invoice.InvoiceNumber,
            receiptSnapshot.Issuer.BusinessName,
            payment.Currency,
            payment.Amount,
            payment.PaidAt,
            payment.Method,
            invoice.TenantId,
            invoice.UserId);
    }

    private static InvoiceAuditSnapshot ToAuditSnapshot(Invoice invoice)
    {
        return new InvoiceAuditSnapshot(
            invoice.InvoiceNumber,
            invoice.ClientId,
            invoice.Status,
            invoice.Total,
            invoice.PaidAt,
            null,
            null,
            null);
    }

    private static InvoiceAuditSnapshot ToAuditSnapshot(
        Invoice invoice,
        Payment payment,
        int cancelledReminderJobCount)
    {
        return new InvoiceAuditSnapshot(
            invoice.InvoiceNumber,
            invoice.ClientId,
            invoice.Status,
            invoice.Total,
            invoice.PaidAt,
            payment.Id,
            payment.StripePaymentIntentId,
            cancelledReminderJobCount);
    }

    private sealed record ReceiptSnapshot(InvoiceClientDto Client, InvoiceIssuerDto Issuer);

    private sealed record InvoiceAuditSnapshot(
        string InvoiceNumber,
        Guid ClientId,
        string Status,
        decimal Total,
        DateTime? PaidAt,
        Guid? PaymentId,
        string? StripePaymentIntentId,
        int? CancelledReminderJobCount);
}
