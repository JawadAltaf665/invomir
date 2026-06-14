namespace InvoMir.Application.Features.Admin.Emailing.Commands.DeleteEmailTemplate;

public sealed class DeleteEmailTemplateCommandHandler(IAppDbContext context)
    : IRequestHandler<DeleteEmailTemplateCommand, bool>
{
    public async Task<bool> Handle(
        DeleteEmailTemplateCommand request,
        CancellationToken cancellationToken)
    {
        var template = await context.EmailTemplates
            .FirstOrDefaultAsync(currentTemplate => currentTemplate.Id == request.Id, cancellationToken);

        if (template is null)
            throw new NotFoundException(nameof(EmailTemplate), request.Id);

        context.EmailTemplates.Remove(template);
        await context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
