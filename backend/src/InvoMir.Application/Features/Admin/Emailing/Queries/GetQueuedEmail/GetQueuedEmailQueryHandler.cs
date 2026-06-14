using InvoMir.Application.Features.Admin.Emailing.DTOs;

namespace InvoMir.Application.Features.Admin.Emailing.Queries.GetQueuedEmail;

public sealed class GetQueuedEmailQueryHandler(IAppDbContext context)
    : IRequestHandler<GetQueuedEmailQuery, QueuedEmailDto>
{
    public async Task<QueuedEmailDto> Handle(
        GetQueuedEmailQuery request,
        CancellationToken cancellationToken)
    {
        var email = await context.QueuedEmails
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(currentEmail =>
                currentEmail.Id == request.Id &&
                !currentEmail.IsDeleted,
                cancellationToken);

        if (email is null)
            throw new NotFoundException(nameof(QueuedEmail), request.Id);

        return EmailingAdminMapper.ToDto(email);
    }
}
