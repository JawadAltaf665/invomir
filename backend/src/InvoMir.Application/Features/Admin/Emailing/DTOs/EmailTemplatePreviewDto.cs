namespace InvoMir.Application.Features.Admin.Emailing.DTOs;

public sealed record EmailTemplatePreviewDto(
    string Subject,
    string Body);
