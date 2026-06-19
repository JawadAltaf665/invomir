namespace InvoMir.Application.Interfaces;

public interface ISmtpEmailSender
{
    Task SendAsync(QueuedEmail email, CancellationToken cancellationToken);
}
