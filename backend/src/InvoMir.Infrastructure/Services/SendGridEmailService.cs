namespace InvoMir.Infrastructure.Services;

public sealed class SendGridEmailService(
    IOptions<SendGridSettings> settings,
    ILogger<SendGridEmailService> logger)
    : IEmailService
{
    private static readonly HttpClient HttpClient = new();
    private readonly SendGridSettings _settings = settings.Value;

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

        await SendEmailAsync(toEmail, "Reset your InvoMir password", html, cancellationToken);
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

        await SendEmailAsync(toEmail, "Verify your InvoMir email", html, cancellationToken);
    }

    public async Task SendWelcomeAsync(
        string toEmail,
        string firstName,
        CancellationToken cancellationToken)
    {
        var safeFirstName = WebUtility.HtmlEncode(firstName);
        var html = $"<p>Welcome to InvoMir, {safeFirstName}.</p>";

        await SendEmailAsync(toEmail, "Welcome to InvoMir", html, cancellationToken);
    }

    private async Task SendEmailAsync(
        string toEmail,
        string subject,
        string htmlContent,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_settings.ApiKey) || string.IsNullOrWhiteSpace(_settings.FromEmail))
        {
            logger.LogWarning("SendGrid email is not configured. Email was not sent.");
            return;
        }

        var payload = new
        {
            personalizations = new[]
            {
                new
                {
                    to = new[] { new { email = toEmail } }
                }
            },
            from = new
            {
                email = _settings.FromEmail,
                name = _settings.FromName
            },
            subject,
            content = new[]
            {
                new
                {
                    type = "text/html",
                    value = htmlContent
                }
            }
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.sendgrid.com/v3/mail/send")
        {
            Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        };

        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.ApiKey);

        try
        {
            using var response = await HttpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
                logger.LogWarning("SendGrid email failed with status code {StatusCode}.", response.StatusCode);
        }
        catch (HttpRequestException exception)
        {
            logger.LogWarning(exception, "SendGrid email request failed.");
        }
        catch (TaskCanceledException exception) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(exception, "SendGrid email request timed out.");
        }
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
}
