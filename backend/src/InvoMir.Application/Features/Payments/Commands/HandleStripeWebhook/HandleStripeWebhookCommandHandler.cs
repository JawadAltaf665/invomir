using InvoMir.Application.Features.Notifications;
using InvoMir.Application.Features.Subscriptions;
using InvoMir.Application.Features.Team;

namespace InvoMir.Application.Features.Payments.Commands.HandleStripeWebhook;

public sealed class HandleStripeWebhookCommandHandler(
    IStripeService stripeService,
    IAppDbContext context,
    IInvoiceReminderJobService invoiceReminderJobService,
    IEmailService emailService,
    IAuditService auditService,
    INotificationService notificationService)
    : IRequestHandler<HandleStripeWebhookCommand>
{
    private const string PaymentIntentSucceeded = "payment_intent.succeeded";
    private const string PaymentIntentFailed = "payment_intent.payment_failed";
    private const string CheckoutSessionCompleted = "checkout.session.completed";
    private const string InvoicePaymentFailed = "invoice.payment_failed";
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
            return;
        }

        if (stripeEvent.Type == CheckoutSessionCompleted &&
            stripeEvent.SubscriptionCheckoutSession is not null)
        {
            await HandleSubscriptionCheckoutCompletedAsync(
                stripeEvent.SubscriptionCheckoutSession,
                cancellationToken);
            return;
        }

        if (stripeEvent.Type == InvoicePaymentFailed && stripeEvent.Subscription is not null)
        {
            await HandleSubscriptionPaymentFailedAsync(stripeEvent.Subscription, cancellationToken);
            return;
        }

        if (stripeEvent.Type.StartsWith("customer.subscription.", StringComparison.Ordinal) &&
            stripeEvent.Subscription is not null)
        {
            await HandleSubscriptionSyncedAsync(stripeEvent.Subscription, cancellationToken);
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

        await NotificationEventPublisher.CreateForRolesAsync(
            notificationService,
            invoice.TenantId,
            NotificationEventPublisher.BillingOperatorRoles,
            "Payment received",
            $"{invoice.InvoiceNumber} was paid online.",
            NotificationConstants.Types.Payment,
            NotificationConstants.Priorities.High,
            $"/app/invoices/{invoice.Id}",
            new
            {
                invoice.Id,
                invoice.InvoiceNumber,
                PaymentId = payment.Id,
                payment.Amount,
                payment.Currency,
                payment.StripePaymentIntentId
            },
            cancellationToken);
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

        await NotificationEventPublisher.CreateForRolesAsync(
            notificationService,
            invoice.TenantId,
            NotificationEventPublisher.BillingOperatorRoles,
            "Payment Failed",
            $"Client payment for Invoice {invoice.InvoiceNumber} failed.",
            NotificationConstants.Types.Payment,
            NotificationConstants.Priorities.High,
            $"/app/invoices/{invoice.Id}",
            new
            {
                invoice.Id,
                invoice.InvoiceNumber,
                PaymentId = payment.Id,
                payment.Amount,
                payment.Currency,
                payment.FailureReason
            },
            cancellationToken);
    }

    private async Task HandleSubscriptionCheckoutCompletedAsync(
        StripeSubscriptionCheckoutCompletedDto checkoutSession,
        CancellationToken cancellationToken)
    {
        var tenantId = checkoutSession.TenantId;
        var userId = checkoutSession.UserId;
        var plan = NormalizePaidPlan(checkoutSession.Plan);
        var interval = NormalizeInterval(checkoutSession.Interval);

        if (tenantId is null || userId is null || plan is null || interval is null)
            return;

        var existingSubscription = await context.Subscriptions
            .IgnoreQueryFilters()
            .AsNoTracking()
            .AnyAsync(subscription =>
                subscription.StripeSubscriptionId == checkoutSession.StripeSubscriptionId &&
                !subscription.IsDeleted,
                cancellationToken);

        if (existingSubscription)
            return;

        var planDefinition = SubscriptionPlanCatalog.GetPlan(plan);
        var now = DateTime.UtcNow;
        var currentPeriodEnd = interval == SubscriptionConstants.Intervals.Year
            ? now.AddYears(1)
            : now.AddMonths(1);
        var subscription = Subscription.Create(
            userId.Value,
            checkoutSession.StripeSubscriptionId,
            checkoutSession.StripeCustomerId,
            plan,
            SubscriptionConstants.Statuses.Active,
            interval,
            interval == SubscriptionConstants.Intervals.Year
                ? planDefinition.PricePerYear
                : planDefinition.PricePerMonth,
            planDefinition.Currency,
            now,
            currentPeriodEnd,
            cancelAtPeriodEnd: false,
            cancelledAt: null);

        subscription.SetTenant(tenantId.Value);
        context.Subscriptions.Add(subscription);

        await SyncAccountPlanAsync(
            tenantId.Value,
            userId.Value,
            plan,
            checkoutSession.StripeCustomerId,
            cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        await auditService.LogAsync(
            AuditConstants.Entities.User,
            userId.Value,
            AuditConstants.Actions.SubscriptionSynced,
            tenantId.Value,
            userId.Value,
            oldValues: null,
            newValues: ToAuditSnapshot(subscription),
            cancellationToken: cancellationToken);

        await notificationService.CreateForUserAsync(
            tenantId.Value,
            userId.Value,
            "Subscription activated",
            $"Your {subscription.Plan} plan is active.",
            NotificationConstants.Types.Subscription,
            NotificationConstants.Priorities.High,
            "/app/subscriptions",
            new
            {
                subscription.Id,
                subscription.Plan,
                subscription.Status,
                subscription.Interval,
                subscription.CurrentPeriodEnd
            },
            cancellationToken);

        var userEmail = await context.Users
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(user =>
                user.Id == userId.Value &&
                user.TenantId == tenantId.Value &&
                !user.IsDeleted)
            .Select(user => user.Email)
            .FirstOrDefaultAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(userEmail))
        {
            await emailService.SendSubscriptionStartedAsync(
                userEmail,
                subscription.Plan,
                subscription.CurrentPeriodEnd,
                tenantId.Value,
                cancellationToken);
        }
    }

    private async Task HandleSubscriptionSyncedAsync(
        StripeSubscriptionEventDto subscriptionEvent,
        CancellationToken cancellationToken)
    {
        var existingSubscription = await context.Subscriptions
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(subscription =>
                subscription.StripeSubscriptionId == subscriptionEvent.StripeSubscriptionId &&
                !subscription.IsDeleted,
                cancellationToken);

        var tenantId = subscriptionEvent.TenantId ?? existingSubscription?.TenantId;
        var userId = subscriptionEvent.UserId ?? existingSubscription?.UserId;
        var plan = NormalizePaidPlan(subscriptionEvent.Plan ?? existingSubscription?.Plan);
        var interval = NormalizeInterval(subscriptionEvent.Interval ?? existingSubscription?.Interval);

        if (tenantId is null || userId is null || plan is null || interval is null)
            return;

        var amount = subscriptionEvent.Amount > 0
            ? subscriptionEvent.Amount
            : GetPlanAmount(plan, interval);
        var currency = string.IsNullOrWhiteSpace(subscriptionEvent.Currency)
            ? SubscriptionPlanCatalog.GetPlan(plan).Currency
            : subscriptionEvent.Currency;
        var oldValues = existingSubscription is null
            ? null
            : ToAuditSnapshot(existingSubscription);

        if (existingSubscription is null)
        {
            existingSubscription = Subscription.Create(
                userId.Value,
                subscriptionEvent.StripeSubscriptionId,
                subscriptionEvent.StripeCustomerId,
                plan,
                subscriptionEvent.Status,
                interval,
                amount,
                currency,
                subscriptionEvent.CurrentPeriodStart,
                subscriptionEvent.CurrentPeriodEnd,
                subscriptionEvent.CancelAtPeriodEnd,
                subscriptionEvent.CancelledAt);

            existingSubscription.SetTenant(tenantId.Value);
            context.Subscriptions.Add(existingSubscription);
        }
        else
        {
            existingSubscription.SyncFromStripe(
                subscriptionEvent.StripeCustomerId,
                plan,
                subscriptionEvent.Status,
                interval,
                amount,
                currency,
                subscriptionEvent.CurrentPeriodStart,
                subscriptionEvent.CurrentPeriodEnd,
                subscriptionEvent.CancelAtPeriodEnd,
                subscriptionEvent.CancelledAt);
        }

        var accountPlan = ShouldDowngradeToFree(subscriptionEvent)
            ? AuthConstants.Plans.Free
            : plan;

        await SyncAccountPlanAsync(
            tenantId.Value,
            userId.Value,
            accountPlan,
            subscriptionEvent.StripeCustomerId,
            cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        await auditService.LogAsync(
            AuditConstants.Entities.User,
            userId.Value,
            AuditConstants.Actions.SubscriptionSynced,
            tenantId.Value,
            userId.Value,
            oldValues,
            ToAuditSnapshot(existingSubscription),
            cancellationToken: cancellationToken);
    }

    private async Task HandleSubscriptionPaymentFailedAsync(
        StripeSubscriptionEventDto subscriptionEvent,
        CancellationToken cancellationToken)
    {
        var subscription = await context.Subscriptions
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(currentSubscription =>
                currentSubscription.StripeSubscriptionId == subscriptionEvent.StripeSubscriptionId &&
                !currentSubscription.IsDeleted,
                cancellationToken);

        if (subscription is null)
            return;

        var oldValues = ToAuditSnapshot(subscription);
        subscription.MarkPastDue();
        await context.SaveChangesAsync(cancellationToken);

        await SyncAccountPlanAsync(
            subscription.TenantId,
            subscription.UserId,
            AuthConstants.Plans.Free,
            subscription.StripeCustomerId,
            cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        await auditService.LogAsync(
            AuditConstants.Entities.User,
            subscription.UserId,
            AuditConstants.Actions.SubscriptionSynced,
            subscription.TenantId,
            subscription.UserId,
            oldValues,
            ToAuditSnapshot(subscription),
            cancellationToken: cancellationToken);

        await notificationService.CreateForUserAsync(
            subscription.TenantId,
            subscription.UserId,
            "Subscription payment failed",
            "Your subscription payment failed and the workspace was moved to the free plan.",
            NotificationConstants.Types.Subscription,
            NotificationConstants.Priorities.Critical,
            "/app/subscriptions",
            new
            {
                subscription.Id,
                subscription.Plan,
                subscription.Status,
                subscription.StripeSubscriptionId
            },
            cancellationToken);
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

    private async Task SyncAccountPlanAsync(
        Guid tenantId,
        Guid userId,
        string plan,
        string? stripeCustomerId,
        CancellationToken cancellationToken)
    {
        var tenant = await context.Tenants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(currentTenant =>
                currentTenant.Id == tenantId &&
                !currentTenant.IsDeleted,
                cancellationToken);

        if (tenant is not null)
        {
            tenant.UpdatePlan(plan);
            await TeamInvitationLifecycle.CancelPendingInvitationsForPlanAsync(
                context,
                tenant.Id,
                plan,
                DateTime.UtcNow,
                cancellationToken);

            if (!string.IsNullOrWhiteSpace(stripeCustomerId))
                tenant.UpdateStripeCustomerId(stripeCustomerId);
        }

        var user = await context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(currentUser =>
                currentUser.Id == userId &&
                currentUser.TenantId == tenantId &&
                !currentUser.IsDeleted,
                cancellationToken);

        user?.UpdatePlan(plan);
    }

    private static string? NormalizePaidPlan(string? plan)
    {
        var normalizedPlan = plan?.Trim().ToLowerInvariant();
        return normalizedPlan is not null && AuthConstants.Plans.Paid.Contains(normalizedPlan)
            ? normalizedPlan
            : null;
    }

    private static string? NormalizeInterval(string? interval)
    {
        var normalizedInterval = interval?.Trim().ToLowerInvariant();
        return normalizedInterval is not null && SubscriptionConstants.Intervals.All.Contains(normalizedInterval)
            ? normalizedInterval
            : null;
    }

    private static decimal GetPlanAmount(string plan, string interval)
    {
        var planDefinition = SubscriptionPlanCatalog.GetPlan(plan);
        return interval == SubscriptionConstants.Intervals.Year
            ? planDefinition.PricePerYear
            : planDefinition.PricePerMonth;
    }

    private static bool ShouldDowngradeToFree(StripeSubscriptionEventDto subscriptionEvent)
    {
        return subscriptionEvent.Status == SubscriptionConstants.Statuses.Cancelled &&
            subscriptionEvent.CurrentPeriodEnd <= DateTime.UtcNow;
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

    private static object ToAuditSnapshot(Subscription subscription)
    {
        return new
        {
            subscription.StripeSubscriptionId,
            subscription.StripeCustomerId,
            subscription.Plan,
            subscription.Status,
            subscription.Interval,
            subscription.Amount,
            subscription.Currency,
            subscription.CurrentPeriodStart,
            subscription.CurrentPeriodEnd,
            subscription.CancelAtPeriodEnd,
            subscription.CancelledAt
        };
    }
}
