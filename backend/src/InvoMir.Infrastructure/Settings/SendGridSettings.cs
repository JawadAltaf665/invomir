namespace InvoMir.Infrastructure.Settings;

public sealed class SendGridSettings
{
    public const string SectionName = "SendGrid";

    public string ApiKey { get; init; } = string.Empty;
    public string FromEmail { get; init; } = "noreply@invomir.com";
    public string FromName { get; init; } = "InvoMir";
    public string PasswordResetBaseUrl { get; init; } = "http://localhost:4200/reset-password";
    public string EmailVerificationBaseUrl { get; init; } = "http://localhost:4200/verify-email";
}
