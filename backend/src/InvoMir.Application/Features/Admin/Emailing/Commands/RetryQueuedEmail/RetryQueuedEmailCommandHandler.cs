using InvoMir.Application.Features.Admin.Emailing.DTOs;

namespace InvoMir.Application.Features.Admin.Emailing.Commands.RetryQueuedEmail;

public sealed class RetryQueuedEmailCommandHandler(IAppDbContext context)
    : IRequestHandler<RetryQueuedEmailCommand, QueuedEmailDto>
{
    public async Task<QueuedEmailDto> Handle(
        RetryQueuedEmailCommand request,
        CancellationToken cancellationToken)
    {
        var email = await context.QueuedEmails
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(currentEmail =>
                currentEmail.Id == request.Id &&
                !currentEmail.IsDeleted,
                cancellationToken);

        if (email is null)
            throw new NotFoundException(nameof(QueuedEmail), request.Id);

        if (email.Status != QueuedEmailStatus.Failed)
            throw new BadRequestException("Only failed queued emails can be retried.");

        email.ResetForRetry();
        await context.SaveChangesAsync(cancellationToken);

        return EmailingAdminMapper.ToDto(email);
    }
}
