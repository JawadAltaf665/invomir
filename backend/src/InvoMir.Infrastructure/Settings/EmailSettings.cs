namespace InvoMir.Infrastructure.Settings;

public sealed class EmailSettings
{
    public const string SectionName = "Email";

    public SmtpEmailSettings Smtp { get; init; } = new();
    public string Host { get; init; } = string.Empty;
    public int? Port { get; init; }
    public string Username { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public string FromEmail { get; init; } = string.Empty;
    public string FromName { get; init; } = string.Empty;
    public bool? EnableSsl { get; init; }
    public int? TimeoutSeconds { get; init; }
    public string PasswordResetBaseUrl { get; init; } = "http://localhost:4200/reset-password";
    public string EmailVerificationBaseUrl { get; init; } = "http://localhost:4200/verify-email";
    public string TeamInvitationBaseUrl { get; init; } = "http://localhost:4200/accept-invitation";
    public string PaymentBaseUrl { get; init; } = "http://localhost:4200/pay";
    public string ApiBaseUrl { get; init; } = "http://localhost:5299";

    public SmtpEmailSettings GetSmtpSettings()
    {
        return new SmtpEmailSettings
        {
            Host = FirstConfigured(Host, Smtp.Host),
            Port = Port ?? Smtp.Port,
            Username = FirstConfigured(Username, Smtp.Username),
            Password = FirstConfigured(Password, Smtp.Password),
            FromEmail = FirstConfigured(FromEmail, Smtp.FromEmail),
            FromName = FirstConfigured(FromName, Smtp.FromName),
            EnableSsl = EnableSsl ?? Smtp.EnableSsl,
            TimeoutSeconds = TimeoutSeconds ?? Smtp.TimeoutSeconds
        };
    }

    private static string FirstConfigured(string first, string fallback)
    {
        return string.IsNullOrWhiteSpace(first) ? fallback : first;
    }
}

public sealed class SmtpEmailSettings
{
    public string Host { get; init; } = string.Empty;
    public int Port { get; init; } = 587;
    public string Username { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public string FromEmail { get; init; } = "noreply@invomir.com";
    public string FromName { get; init; } = "InvoMir";
    public bool EnableSsl { get; init; } = true;
    public int TimeoutSeconds { get; init; } = 30;
}
