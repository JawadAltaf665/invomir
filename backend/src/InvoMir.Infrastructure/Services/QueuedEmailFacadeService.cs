namespace InvoMir.Infrastructure.Services;

public sealed class QueuedEmailFacadeService(
    IQueuedEmailService queuedEmailService,
    ITenantContext tenantContext,
    IInvoiceLinkBuilder invoiceLinkBuilder,
    IOptions<EmailSettings> settings)
    : IEmailService
{
    private readonly EmailSettings _settings = settings.Value;

    public async Task SendAsync(
        string to,
        string subject,
        string htmlBody,
        byte[]? attachment,
        CancellationToken cancellationToken)
    {
        await queuedEmailService.EnqueueAsync(
            to,
            subject,
            htmlBody,
            tenantId: GetCurrentTenantId(),
            attachment: attachment,
            attachmentFileName: attachment is null ? null : "attachment.pdf",
            attachmentContentType: attachment is null ? null : "application/pdf",
            cancellationToken: cancellationToken);
    }

    public async Task SendInvoiceAsync(
        InvoiceEmailDto invoiceEmail,
        CancellationToken cancellationToken)
    {
        var paymentLink = invoiceLinkBuilder.BuildPaymentLink(invoiceEmail.PaymentLinkToken);
        var trackingPixel = invoiceLinkBuilder.BuildTrackingPixelUrl(invoiceEmail.PaymentLinkToken);
        var tokens = new Dictionary<string, string>
        {
            ["CompanyName"] = Html(invoiceEmail.BusinessName),
            ["CustomerName"] = Html(invoiceEmail.ClientName),
            ["InvoiceNumber"] = Html(invoiceEmail.InvoiceNumber),
            ["InvoiceAmount"] = FormatMoney(invoiceEmail.Currency, invoiceEmail.Total),
            ["DueDate"] = invoiceEmail.DueDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) ?? string.Empty,
            ["InvoiceUrl"] = Html(paymentLink),
            ["PaymentLink"] = Html(paymentLink),
            ["CustomMessage"] = BuildCustomMessageHtml(invoiceEmail.CustomMessage),
            ["TrackingPixelUrl"] = Html(trackingPixel)
        };

        await queuedEmailService.EnqueueFromTemplateAsync(
            EmailTemplateType.InvoiceSent,
            invoiceEmail.ToEmail,
            tokens,
            toName: invoiceEmail.ClientName,
            cc: invoiceEmail.CcEmail,
            tenantId: GetCurrentTenantId(),
            attachment: invoiceEmail.PdfAttachment,
            attachmentFileName: BuildInvoiceAttachmentFileName(invoiceEmail.InvoiceNumber),
            attachmentContentType: "application/pdf",
            cancellationToken: cancellationToken);
    }

    public async Task SendInvoiceReminderAsync(
        InvoiceReminderEmailDto reminderEmail,
        CancellationToken cancellationToken)
    {
        var paymentLink = invoiceLinkBuilder.BuildPaymentLink(reminderEmail.PaymentLinkToken);
        var templateType = reminderEmail.ReminderType == ReminderConstants.Types.DueSoon
            ? EmailTemplateType.PaymentReminder
            : EmailTemplateType.InvoiceOverdue;
        var tokens = new Dictionary<string, string>
        {
            ["CompanyName"] = Html(reminderEmail.BusinessName),
            ["CustomerName"] = Html(reminderEmail.ClientName),
            ["InvoiceNumber"] = Html(reminderEmail.InvoiceNumber),
            ["InvoiceAmount"] = FormatMoney(reminderEmail.Currency, reminderEmail.Total),
            ["DueDate"] = reminderEmail.DueDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            ["InvoiceUrl"] = Html(paymentLink),
            ["PaymentLink"] = Html(paymentLink)
        };

        await queuedEmailService.EnqueueFromTemplateAsync(
            templateType,
            reminderEmail.ToEmail,
            tokens,
            toName: reminderEmail.ClientName,
            tenantId: reminderEmail.TenantId,
            cancellationToken: cancellationToken);
    }

    public async Task SendPaymentReceiptAsync(
        PaymentReceiptEmailDto receiptEmail,
        CancellationToken cancellationToken)
    {
        var tokens = new Dictionary<string, string>
        {
            ["CompanyName"] = Html(receiptEmail.BusinessName),
            ["CustomerName"] = Html(receiptEmail.ClientName),
            ["InvoiceNumber"] = Html(receiptEmail.InvoiceNumber),
            ["InvoiceAmount"] = FormatMoney(receiptEmail.Currency, receiptEmail.Amount),
            ["DueDate"] = receiptEmail.PaidAt.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)
        };

        await queuedEmailService.EnqueueFromTemplateAsync(
            EmailTemplateType.InvoicePaid,
            receiptEmail.ToEmail,
            tokens,
            toName: receiptEmail.ClientName,
            tenantId: receiptEmail.TenantId,
            cancellationToken: cancellationToken);
    }

    public async Task SendPasswordResetAsync(
        string toEmail,
        string resetToken,
        CancellationToken cancellationToken)
    {
        var resetUrl = BuildQueryTokenUrl(_settings.PasswordResetBaseUrl, resetToken);
        await queuedEmailService.EnqueueFromTemplateAsync(
            EmailTemplateType.PasswordReset,
            toEmail,
            new Dictionary<string, string>
            {
                ["UserName"] = "there",
                ["ResetPasswordLink"] = Html(resetUrl)
            },
            cancellationToken: cancellationToken);
    }

    public async Task SendEmailVerificationAsync(
        string toEmail,
        string verificationToken,
        CancellationToken cancellationToken)
    {
        var verificationUrl = BuildQueryTokenUrl(_settings.EmailVerificationBaseUrl, verificationToken);
        await queuedEmailService.EnqueueFromTemplateAsync(
            EmailTemplateType.EmailVerification,
            toEmail,
            new Dictionary<string, string>
            {
                ["UserName"] = "there",
                ["VerificationLink"] = Html(verificationUrl)
            },
            cancellationToken: cancellationToken);
    }

    public async Task SendWelcomeAsync(
        string toEmail,
        string firstName,
        CancellationToken cancellationToken)
    {
        await queuedEmailService.EnqueueFromTemplateAsync(
            EmailTemplateType.WelcomeEmail,
            toEmail,
            new Dictionary<string, string>
            {
                ["UserName"] = Html(firstName)
            },
            tenantId: GetCurrentTenantId(),
            cancellationToken: cancellationToken);
    }

    public async Task SendTeamInvitationAsync(
        string toEmail,
        string inviterName,
        string tenantName,
        string role,
        string invitationToken,
        DateTime expiresAt,
        CancellationToken cancellationToken)
    {
        var invitationUrl = BuildQueryTokenUrl(_settings.TeamInvitationBaseUrl, invitationToken);
        await queuedEmailService.EnqueueFromTemplateAsync(
            EmailTemplateType.TeamMemberInvitation,
            toEmail,
            new Dictionary<string, string>
            {
                ["UserName"] = Html(inviterName),
                ["CompanyName"] = Html(tenantName),
                ["PlanName"] = Html(role),
                ["InvitationLink"] = Html(invitationUrl),
                ["DueDate"] = expiresAt.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture)
            },
            tenantId: GetCurrentTenantId(),
            cancellationToken: cancellationToken);
    }

    public async Task SendSubscriptionStartedAsync(
        string toEmail,
        string planName,
        DateTime currentPeriodEnd,
        Guid? tenantId,
        CancellationToken cancellationToken)
    {
        await queuedEmailService.EnqueueFromTemplateAsync(
            EmailTemplateType.SubscriptionStarted,
            toEmail,
            BuildSubscriptionTokens(planName, currentPeriodEnd),
            tenantId: ResolveTenantId(tenantId),
            cancellationToken: cancellationToken);
    }

    public async Task SendSubscriptionCancelledAsync(
        string toEmail,
        string planName,
        DateTime currentPeriodEnd,
        Guid? tenantId,
        CancellationToken cancellationToken)
    {
        await queuedEmailService.EnqueueFromTemplateAsync(
            EmailTemplateType.SubscriptionCancelled,
            toEmail,
            BuildSubscriptionTokens(planName, currentPeriodEnd),
            tenantId: ResolveTenantId(tenantId),
            cancellationToken: cancellationToken);
    }

    public async Task SendTrialExpiryReminderAsync(
        string toEmail,
        string userName,
        DateTime trialEndsAt,
        Guid? tenantId,
        CancellationToken cancellationToken)
    {
        await queuedEmailService.EnqueueFromTemplateAsync(
            EmailTemplateType.TrialExpiryReminder,
            toEmail,
            new Dictionary<string, string>
            {
                ["UserName"] = Html(userName),
                ["DueDate"] = trialEndsAt.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)
            },
            tenantId: ResolveTenantId(tenantId),
            cancellationToken: cancellationToken);
    }

    private Guid? GetCurrentTenantId()
    {
        return tenantContext.IsAuthenticated ? tenantContext.TenantId : null;
    }

    private Guid? ResolveTenantId(Guid? tenantId)
    {
        return tenantId ?? GetCurrentTenantId();
    }

    private static Dictionary<string, string> BuildSubscriptionTokens(string planName, DateTime currentPeriodEnd)
    {
        return new Dictionary<string, string>
        {
            ["UserName"] = "there",
            ["PlanName"] = Html(planName),
            ["DueDate"] = currentPeriodEnd.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)
        };
    }

    private static string BuildCustomMessageHtml(string? customMessage)
    {
        if (string.IsNullOrWhiteSpace(customMessage))
            return string.Empty;

        var safeMessage = Html(customMessage.Trim())
            .Replace("\r\n", "<br />", StringComparison.Ordinal)
            .Replace("\n", "<br />", StringComparison.Ordinal)
            .Replace("\r", "<br />", StringComparison.Ordinal);

        return $"<p>{safeMessage}</p>";
    }

    private static string BuildInvoiceAttachmentFileName(string invoiceNumber)
    {
        var safeInvoiceNumber = new string(invoiceNumber
            .Select(character => char.IsLetterOrDigit(character) || character is '-' or '_'
                ? character
                : '-')
            .ToArray());

        return $"{safeInvoiceNumber}.pdf";
    }

    private static string BuildQueryTokenUrl(string baseUrl, string token)
    {
        var separator = baseUrl.Contains('?', StringComparison.Ordinal) ? '&' : '?';
        return $"{baseUrl}{separator}token={Uri.EscapeDataString(token)}";
    }

    private static string FormatMoney(string currency, decimal amount)
    {
        return $"{Html(currency.ToUpperInvariant())} {amount:0.00}";
    }

    private static string Html(string? value)
    {
        return WebUtility.HtmlEncode(value ?? string.Empty);
    }
}
