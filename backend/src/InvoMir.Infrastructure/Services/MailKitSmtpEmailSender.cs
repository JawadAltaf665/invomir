using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace InvoMir.Infrastructure.Services;

public sealed class MailKitSmtpEmailSender(
    IOptions<EmailSettings> settings,
    ILogger<MailKitSmtpEmailSender> logger)
    : ISmtpEmailSender
{
    private readonly EmailSettings _settings = settings.Value;

    public async Task SendAsync(QueuedEmail email, CancellationToken cancellationToken)
    {
        var smtp = _settings.GetSmtpSettings();
        EnsureConfigured(smtp);

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(smtp.FromName, smtp.FromEmail));
        message.To.Add(CreateMailbox(email.ToEmail, email.ToName));
        AddRecipients(message.Cc, email.Cc);
        AddRecipients(message.Bcc, email.Bcc);
        message.Subject = email.Subject;

        var body = new BodyBuilder { HtmlBody = email.Body };
        AddAttachment(body, email);
        message.Body = body.ToMessageBody();

        using var client = new SmtpClient
        {
            Timeout = (int)TimeSpan.FromSeconds(Math.Max(smtp.TimeoutSeconds, 1)).TotalMilliseconds
        };

        await client.ConnectAsync(
            smtp.Host,
            smtp.Port,
            ResolveSocketOptions(smtp),
            cancellationToken);

        if (!string.IsNullOrWhiteSpace(smtp.Username))
            await client.AuthenticateAsync(smtp.Username, smtp.Password, cancellationToken);

        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);

        logger.LogInformation("Queued email {QueuedEmailId} sent to {Recipient}.", email.Id, email.ToEmail);
    }

    private static void EnsureConfigured(SmtpEmailSettings smtp)
    {
        if (string.IsNullOrWhiteSpace(smtp.Host))
            throw new InvalidOperationException("SMTP host is not configured.");

        if (smtp.Port <= 0)
            throw new InvalidOperationException("SMTP port is not configured.");

        if (string.IsNullOrWhiteSpace(smtp.FromEmail))
            throw new InvalidOperationException("SMTP from email is not configured.");
    }

    private static MailboxAddress CreateMailbox(string email, string? name)
    {
        return string.IsNullOrWhiteSpace(name)
            ? MailboxAddress.Parse(email)
            : new MailboxAddress(name.Trim(), email.Trim());
    }

    private static void AddRecipients(InternetAddressList recipients, string? rawRecipients)
    {
        if (string.IsNullOrWhiteSpace(rawRecipients))
            return;

        var addresses = rawRecipients
            .Split([';', ','], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        foreach (var address in addresses)
            recipients.Add(MailboxAddress.Parse(address));
    }

    private static void AddAttachment(BodyBuilder body, QueuedEmail email)
    {
        if (string.IsNullOrWhiteSpace(email.AttachmentContentBase64))
            return;

        var bytes = Convert.FromBase64String(email.AttachmentContentBase64);
        var fileName = string.IsNullOrWhiteSpace(email.AttachmentFileName)
            ? "attachment"
            : email.AttachmentFileName;
        var contentType = string.IsNullOrWhiteSpace(email.AttachmentContentType)
            ? "application/octet-stream"
            : email.AttachmentContentType;

        body.Attachments.Add(fileName, bytes, ContentType.Parse(contentType));
    }

    private static SecureSocketOptions ResolveSocketOptions(SmtpEmailSettings smtp)
    {
        if (!smtp.EnableSsl)
            return SecureSocketOptions.None;

        return smtp.Port == 465
            ? SecureSocketOptions.SslOnConnect
            : SecureSocketOptions.StartTls;
    }
}
