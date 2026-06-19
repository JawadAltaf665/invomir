using InvoMir.Application.Features.Admin.Emailing.DTOs;

namespace InvoMir.Application.Features.Admin.Emailing.Queries.ListEmailTemplates;

public sealed class ListEmailTemplatesQueryHandler(IAppDbContext context)
    : IRequestHandler<ListEmailTemplatesQuery, PagedResult<EmailTemplateDto>>
{
    private const int DefaultPage = 1;
    private const int DefaultLimit = 20;
    private const int MaxLimit = 100;

    public async Task<PagedResult<EmailTemplateDto>> Handle(
        ListEmailTemplatesQuery request,
        CancellationToken cancellationToken)
    {
        var page = request.Page < DefaultPage ? DefaultPage : request.Page;
        var limit = request.Limit <= 0 ? DefaultLimit : Math.Min(request.Limit, MaxLimit);
        var templates = context.EmailTemplates.AsNoTracking();

        if (request.TemplateType is not null)
            templates = templates.Where(template => template.TemplateType == request.TemplateType.Value);

        if (!string.IsNullOrWhiteSpace(request.Language))
        {
            var language = EmailTemplateDuplicateGuard.NormalizeLanguage(request.Language);
            templates = templates.Where(template => template.Language == language);
        }

        if (request.IsActive is not null)
            templates = templates.Where(template => template.IsActive == request.IsActive.Value);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLowerInvariant();
            templates = templates.Where(template =>
                template.Name.ToLower().Contains(search) ||
                template.Subject.ToLower().Contains(search) ||
                template.Body.ToLower().Contains(search));
        }

        var totalCount = await templates.CountAsync(cancellationToken);
        var templateEntities = await templates
            .OrderBy(template => template.TemplateType)
            .ThenBy(template => template.Language)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(cancellationToken);
        var items = templateEntities
            .Select(EmailingAdminMapper.ToDto)
            .ToList();

        return new PagedResult<EmailTemplateDto>(items, page, limit, totalCount);
    }
}
