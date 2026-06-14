using InvoMir.Application.Features.Admin.Emailing.DTOs;

namespace InvoMir.Application.Features.Admin.Emailing.Commands.CancelQueuedEmail;

public sealed class CancelQueuedEmailCommandHandler(IAppDbContext context)
    : IRequestHandler<CancelQueuedEmailCommand, QueuedEmailDto>
{
    public async Task<QueuedEmailDto> Handle(
        CancelQueuedEmailCommand request,
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

        if (email.Status is not (QueuedEmailStatus.Pending or QueuedEmailStatus.Failed))
            throw new BadRequestException("Only pending or failed queued emails can be cancelled.");

        email.Cancel(DateTime.UtcNow);
        await context.SaveChangesAsync(cancellationToken);

        return EmailingAdminMapper.ToDto(email);
    }
}
