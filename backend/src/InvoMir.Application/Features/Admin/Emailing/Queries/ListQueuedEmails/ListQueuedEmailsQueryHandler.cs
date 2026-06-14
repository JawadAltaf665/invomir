using InvoMir.Application.Features.Admin.Emailing.DTOs;

namespace InvoMir.Application.Features.Admin.Emailing.Queries.ListQueuedEmails;

public sealed class ListQueuedEmailsQueryHandler(IAppDbContext context)
    : IRequestHandler<ListQueuedEmailsQuery, PagedResult<QueuedEmailDto>>
{
    private const int DefaultPage = 1;
    private const int DefaultLimit = 20;
    private const int MaxLimit = 100;

    public async Task<PagedResult<QueuedEmailDto>> Handle(
        ListQueuedEmailsQuery request,
        CancellationToken cancellationToken)
    {
        var page = request.Page < DefaultPage ? DefaultPage : request.Page;
        var limit = request.Limit <= 0 ? DefaultLimit : Math.Min(request.Limit, MaxLimit);
        var emails = context.QueuedEmails
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(email => !email.IsDeleted);

        if (request.Status is not null)
            emails = emails.Where(email => email.Status == request.Status.Value);

        if (request.TenantId is not null)
            emails = emails.Where(email => email.TenantId == request.TenantId.Value);

        if (request.TemplateType is not null)
            emails = emails.Where(email => email.TemplateType == request.TemplateType.Value);

        if (request.From is not null)
            emails = emails.Where(email => email.CreationTime >= NormalizeUtc(request.From.Value));

        if (request.To is not null)
            emails = emails.Where(email => email.CreationTime <= NormalizeUtc(request.To.Value));

        if (!string.IsNullOrWhiteSpace(request.SearchEmail))
        {
            var search = request.SearchEmail.Trim().ToLowerInvariant();
            emails = emails.Where(email =>
                email.ToEmail.ToLower().Contains(search) ||
                email.Subject.ToLower().Contains(search));
        }

        var totalCount = await emails.CountAsync(cancellationToken);
        var emailEntities = await emails
            .OrderByDescending(email => email.CreationTime)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(cancellationToken);
        var items = emailEntities
            .Select(EmailingAdminMapper.ToDto)
            .ToList();

        return new PagedResult<QueuedEmailDto>(items, page, limit, totalCount);
    }

    private static DateTime NormalizeUtc(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
    }
}
