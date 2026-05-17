namespace InvoMir.Application.Interfaces;

public interface IEmailService
{
    Task SendPasswordResetAsync(string toEmail, string resetToken, CancellationToken cancellationToken);
    Task SendEmailVerificationAsync(string toEmail, string verificationToken, CancellationToken cancellationToken);
    Task SendWelcomeAsync(string toEmail, string firstName, CancellationToken cancellationToken);
}
