using System.Net.Mail;

namespace InvoMir.Application.Features.Emailing;

public sealed class QueuedEmailService(
    IAppDbContext context,
    IEmailTemplateService emailTemplateService)
    : IQueuedEmailService
{
    public async Task<Guid> EnqueueAsync(
        string toEmail,
        string subject,
        string body,
        string? toName = null,
        string? cc = null,
        string? bcc = null,
        Guid? tenantId = null,
        EmailTemplateType? templateType = null,
        DateTime? scheduledAt = null,
        byte[]? attachment = null,
        string? attachmentFileName = null,
        string? attachmentContentType = null,
        CancellationToken cancellationToken = default)
    {
        EnsureValidEmail(toEmail);

        var queuedEmail = QueuedEmail.Create(
            toEmail,
            subject,
            body,
            toName,
            cc,
            bcc,
            NormalizeTenantId(tenantId),
            templateType,
            scheduledAt,
            attachmentFileName: attachmentFileName,
            attachmentContentType: attachment is null ? null : attachmentContentType ?? "application/octet-stream",
            attachmentContentBase64: attachment is null ? null : Convert.ToBase64String(attachment));

        context.QueuedEmails.Add(queuedEmail);
        await context.SaveChangesAsync(cancellationToken);

        return queuedEmail.Id;
    }

    public async Task<Guid> EnqueueFromTemplateAsync(
        EmailTemplateType templateType,
        string toEmail,
        Dictionary<string, string> tokens,
        string language = DefaultEmailTemplateCatalog.DefaultLanguage,
        string? toName = null,
        string? cc = null,
        string? bcc = null,
        Guid? tenantId = null,
        DateTime? scheduledAt = null,
        byte[]? attachment = null,
        string? attachmentFileName = null,
        string? attachmentContentType = null,
        CancellationToken cancellationToken = default)
    {
        var subject = await emailTemplateService.RenderSubjectAsync(
            templateType,
            tokens,
            language,
            cancellationToken);
        var body = await emailTemplateService.RenderBodyAsync(
            templateType,
            tokens,
            language,
            cancellationToken);

        return await EnqueueAsync(
            toEmail,
            subject,
            body,
            toName,
            cc,
            bcc,
            tenantId,
            templateType,
            scheduledAt,
            attachment,
            attachmentFileName,
            attachmentContentType,
            cancellationToken);
    }

    private static void EnsureValidEmail(string toEmail)
    {
        try
        {
            var parsed = new MailAddress(toEmail);
            if (!parsed.Address.Equals(toEmail.Trim(), StringComparison.OrdinalIgnoreCase))
                throw new FormatException();
        }
        catch (FormatException exception)
        {
            _ = exception;
            throw new BadRequestException("Recipient email is invalid.");
        }
    }

    private static Guid? NormalizeTenantId(Guid? tenantId)
    {
        if (tenantId is null || tenantId.Value == Guid.Empty)
            return null;

        return tenantId;
    }
}
