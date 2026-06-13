namespace InvoMir.Application.Interfaces;

public interface IEmailService
{
    Task SendAsync(string to, string subject, string htmlBody, byte[]? attachment, CancellationToken cancellationToken);
    Task SendInvoiceAsync(InvoiceEmailDto invoiceEmail, CancellationToken cancellationToken);
    Task SendInvoiceReminderAsync(InvoiceReminderEmailDto reminderEmail, CancellationToken cancellationToken);
    Task SendPaymentReceiptAsync(PaymentReceiptEmailDto receiptEmail, CancellationToken cancellationToken);
    Task SendPasswordResetAsync(string toEmail, string resetToken, CancellationToken cancellationToken);
    Task SendEmailVerificationAsync(string toEmail, string verificationToken, CancellationToken cancellationToken);
    Task SendWelcomeAsync(string toEmail, string firstName, CancellationToken cancellationToken);
    Task SendTeamInvitationAsync(
        string toEmail,
        string inviterName,
        string tenantName,
        string role,
        string invitationToken,
        DateTime expiresAt,
        CancellationToken cancellationToken);
}
