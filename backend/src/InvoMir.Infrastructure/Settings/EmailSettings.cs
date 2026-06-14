namespace InvoMir.Infrastructure.Settings;

public sealed class EmailSettings
{
    public const string SectionName = "Email";

    public SmtpEmailSettings Smtp { get; init; } = new();
    public string PasswordResetBaseUrl { get; init; } = "http://localhost:4200/reset-password";
    public string EmailVerificationBaseUrl { get; init; } = "http://localhost:4200/verify-email";
    public string TeamInvitationBaseUrl { get; init; } = "http://localhost:4200/accept-invitation";
    public string PaymentBaseUrl { get; init; } = "http://localhost:4200/pay";
    public string ApiBaseUrl { get; init; } = "http://localhost:5299";
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
