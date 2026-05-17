namespace InvoMir.Infrastructure.Services;

public sealed class SendGridEmailService(
    IOptions<SendGridSettings> settings,
    IAppDbContext context,
    ITenantContext tenantContext,
    ICurrentUserContext currentUserContext,
    IInvoiceLinkBuilder invoiceLinkBuilder,
    ILogger<SendGridEmailService> logger)
    : IEmailService
{
    private static readonly HttpClient HttpClient = new();
    private readonly SendGridSettings _settings = settings.Value;

    public async Task SendAsync(
        string to,
        string subject,
        string htmlBody,
        byte[]? attachment,
        CancellationToken cancellationToken)
    {
        var request = new EmailDeliveryRequest(
            to,
            subject,
            htmlBody,
            attachment,
            "invoice.pdf",
            EmailConstants.Types.Generic,
            null,
            null);

        await SendEmailAsync(request, cancellationToken);
    }

    public async Task SendInvoiceAsync(
        InvoiceEmailDto invoiceEmail,
        CancellationToken cancellationToken)
    {
        var subject = $"Invoice {invoiceEmail.InvoiceNumber} from {invoiceEmail.BusinessName}";
        var html = BuildInvoiceEmailHtml(invoiceEmail);
        var request = new EmailDeliveryRequest(
            invoiceEmail.ToEmail,
            subject,
            html,
            invoiceEmail.PdfAttachment,
            BuildInvoiceAttachmentFileName(invoiceEmail.InvoiceNumber),
            invoiceEmail.EmailType,
            invoiceEmail.InvoiceId,
            invoiceEmail.CcEmail);

        await SendEmailAsync(request, cancellationToken);
    }

    public async Task SendPasswordResetAsync(
        string toEmail,
        string resetToken,
        CancellationToken cancellationToken)
    {
        var resetUrl = BuildPasswordResetUrl(resetToken);
        var html = $"""
            <p>You requested a password reset for your InvoMir account.</p>
            <p><a href="{WebUtility.HtmlEncode(resetUrl)}">Reset your password</a></p>
            <p>This link expires in 15 minutes.</p>
            """;

        await SendEmailAsync(
            new EmailDeliveryRequest(
                toEmail,
                "Reset your InvoMir password",
                html,
                null,
                null,
                EmailConstants.Types.PasswordReset,
                null,
                null),
            cancellationToken);
    }

    public async Task SendEmailVerificationAsync(
        string toEmail,
        string verificationToken,
        CancellationToken cancellationToken)
    {
        var verificationUrl = BuildEmailVerificationUrl(verificationToken);
        var html = $"""
            <p>Please verify your email address for your InvoMir account.</p>
            <p><a href="{WebUtility.HtmlEncode(verificationUrl)}">Verify your email</a></p>
            <p>This link expires in 24 hours.</p>
            """;

        await SendEmailAsync(
            new EmailDeliveryRequest(
                toEmail,
                "Verify your InvoMir email",
                html,
                null,
                null,
                EmailConstants.Types.EmailVerification,
                null,
                null),
            cancellationToken);
    }

    public async Task SendWelcomeAsync(
        string toEmail,
        string firstName,
        CancellationToken cancellationToken)
    {
        var safeFirstName = WebUtility.HtmlEncode(firstName);
        var html = $"<p>Welcome to InvoMir, {safeFirstName}.</p>";

        await SendEmailAsync(
            new EmailDeliveryRequest(
                toEmail,
                "Welcome to InvoMir",
                html,
                null,
                null,
                EmailConstants.Types.Welcome,
                null,
                null),
            cancellationToken);
    }

    private async Task SendEmailAsync(
        EmailDeliveryRequest deliveryRequest,
        CancellationToken cancellationToken)
    {
        var emailLog = CreateEmailLog(deliveryRequest);

        if (string.IsNullOrWhiteSpace(_settings.ApiKey) || string.IsNullOrWhiteSpace(_settings.FromEmail))
        {
            emailLog?.MarkFailed("SendGrid is not configured.");
            await SaveEmailLogAsync(emailLog, cancellationToken);
            logger.LogWarning("SendGrid email is not configured. Email was not sent.");
            return;
        }

        var payload = BuildSendGridPayload(deliveryRequest);

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.sendgrid.com/v3/mail/send")
        {
            Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        };

        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.ApiKey);

        try
        {
            using var response = await HttpClient.SendAsync(request, cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                emailLog?.MarkSent(GetSendGridMessageId(response), DateTime.UtcNow);
            }
            else
            {
                var failureReason = $"SendGrid returned {(int)response.StatusCode} {response.StatusCode}.";
                emailLog?.MarkFailed(failureReason);
                logger.LogWarning("SendGrid email failed with status code {StatusCode}.", response.StatusCode);
            }
        }
        catch (HttpRequestException exception)
        {
            emailLog?.MarkFailed("SendGrid request failed.");
            logger.LogWarning(exception, "SendGrid email request failed.");
        }
        catch (TaskCanceledException exception) when (!cancellationToken.IsCancellationRequested)
        {
            emailLog?.MarkFailed("SendGrid request timed out.");
            logger.LogWarning(exception, "SendGrid email request timed out.");
        }
        finally
        {
            await SaveEmailLogAsync(emailLog, cancellationToken);
        }
    }

    private EmailLog? CreateEmailLog(EmailDeliveryRequest deliveryRequest)
    {
        if (!tenantContext.IsAuthenticated)
            return null;

        return EmailLog.Create(
            deliveryRequest.InvoiceId,
            currentUserContext.UserId,
            deliveryRequest.EmailType,
            deliveryRequest.ToEmail,
            deliveryRequest.Subject);
    }

    private async Task SaveEmailLogAsync(EmailLog? emailLog, CancellationToken cancellationToken)
    {
        if (emailLog is null)
            return;

        try
        {
            context.EmailLogs.Add(emailLog);
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Email log write failed for recipient {Recipient}.", emailLog.ToEmail);
        }
    }

    private object BuildSendGridPayload(EmailDeliveryRequest deliveryRequest)
    {
        var personalization = new Dictionary<string, object>
        {
            ["to"] = new[] { new { email = deliveryRequest.ToEmail } }
        };

        if (!string.IsNullOrWhiteSpace(deliveryRequest.CcEmail))
            personalization["cc"] = new[] { new { email = deliveryRequest.CcEmail } };

        var payload = new Dictionary<string, object>
        {
            ["personalizations"] = new[] { personalization },
            ["from"] = new
            {
                email = _settings.FromEmail,
                name = _settings.FromName
            },
            ["subject"] = deliveryRequest.Subject,
            ["content"] = new[]
            {
                new
                {
                    type = "text/html",
                    value = deliveryRequest.HtmlContent
                }
            }
        };

        if (deliveryRequest.Attachment is not null)
        {
            payload["attachments"] = new[]
            {
                new
                {
                    content = Convert.ToBase64String(deliveryRequest.Attachment),
                    type = "application/pdf",
                    filename = deliveryRequest.AttachmentFileName ?? "invoice.pdf",
                    disposition = "attachment"
                }
            };
        }

        return payload;
    }

    private string BuildInvoiceEmailHtml(InvoiceEmailDto invoiceEmail)
    {
        var paymentUrl = invoiceLinkBuilder.BuildPaymentLink(invoiceEmail.PaymentLinkToken);
        var trackingPixelUrl = invoiceLinkBuilder.BuildTrackingPixelUrl(invoiceEmail.PaymentLinkToken);
        var customMessage = BuildCustomMessageHtml(invoiceEmail.CustomMessage);

        return $"""
            <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.55">
              <p>Hello {Html(invoiceEmail.ClientName)},</p>
              {customMessage}
              <p>{Html(invoiceEmail.BusinessName)} sent you invoice <strong>{Html(invoiceEmail.InvoiceNumber)}</strong>.</p>
              <p><strong>Total:</strong> {Html(invoiceEmail.Currency.ToUpperInvariant())} {invoiceEmail.Total:0.00}</p>
              <p><a href="{Html(paymentUrl)}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px">View and pay invoice</a></p>
              <p>The PDF copy is attached for your records.</p>
              <p style="color:#6b7280;font-size:12px">Sent via InvoMir.</p>
              <img src="{Html(trackingPixelUrl)}" alt="" width="1" height="1" style="display:none" />
            </div>
            """;
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

    private static string? GetSendGridMessageId(HttpResponseMessage response)
    {
        return response.Headers.TryGetValues("X-Message-Id", out var values)
            ? values.FirstOrDefault()
            : null;
    }

    private string BuildPasswordResetUrl(string resetToken)
    {
        var separator = _settings.PasswordResetBaseUrl.Contains('?', StringComparison.Ordinal) ? '&' : '?';
        return $"{_settings.PasswordResetBaseUrl}{separator}token={Uri.EscapeDataString(resetToken)}";
    }

    private string BuildEmailVerificationUrl(string verificationToken)
    {
        var separator = _settings.EmailVerificationBaseUrl.Contains('?', StringComparison.Ordinal) ? '&' : '?';
        return $"{_settings.EmailVerificationBaseUrl}{separator}token={Uri.EscapeDataString(verificationToken)}";
    }

    private static string Html(string? value)
    {
        return WebUtility.HtmlEncode(value ?? string.Empty);
    }

    private sealed record EmailDeliveryRequest(
        string ToEmail,
        string Subject,
        string HtmlContent,
        byte[]? Attachment,
        string? AttachmentFileName,
        string EmailType,
        Guid? InvoiceId,
        string? CcEmail);
}
