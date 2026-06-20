using InvoMir.Application.Features.Admin.Emailing.Commands.ActivateEmailTemplate;
using InvoMir.Application.Features.Admin.Emailing.Commands.CreateEmailTemplate;
using InvoMir.Application.Features.Admin.Emailing.Commands.DeactivateEmailTemplate;
using InvoMir.Application.Features.Admin.Emailing.Commands.DeleteEmailTemplate;
using InvoMir.Application.Features.Admin.Emailing.Commands.PreviewEmailTemplate;
using InvoMir.Application.Features.Admin.Emailing.Commands.UpdateEmailTemplate;
using InvoMir.Application.Features.Admin.Emailing.DTOs;
using InvoMir.Application.Features.Admin.Emailing.Queries.GetEmailTemplate;
using InvoMir.Application.Features.Admin.Emailing.Queries.ListEmailTemplates;
using InvoMir.Domain.Enums;

namespace InvoMir.API.Controllers;

[ApiController]
[Authorize]
[EnableRateLimiting(RateLimitPolicies.AdminEndpoints)]
[Route("api/admin/email-templates")]
[Produces("application/json")]
[ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status401Unauthorized)]
[ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status403Forbidden)]
public sealed class AdminEmailTemplatesController(ISender mediator) : ControllerBase
{
    [HttpGet]
    [RequirePermission(Permissions.System.Access)]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<EmailTemplateDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(
        [FromQuery] EmailTemplateType? templateType,
        [FromQuery] string? language,
        [FromQuery] bool? isActive,
        [FromQuery(Name = "search")] string? search,
        [FromQuery] int page,
        [FromQuery(Name = "limit")] int limit,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(
            new ListEmailTemplatesQuery(templateType, language, isActive, search, page, limit),
            cancellationToken);

        return Ok(ApiResponse<PagedResult<EmailTemplateDto>>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    [RequirePermission(Permissions.System.Access)]
    [ProducesResponseType(typeof(ApiResponse<EmailTemplateDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetEmailTemplateQuery(id), cancellationToken);
        return Ok(ApiResponse<EmailTemplateDto>.Ok(result));
    }

    [HttpPost]
    [RequirePermission(Permissions.System.Access)]
    [ProducesResponseType(typeof(ApiResponse<EmailTemplateDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Create(
        [FromBody] CreateEmailTemplateCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return StatusCode(
            StatusCodes.Status201Created,
            ApiResponse<EmailTemplateDto>.Ok(result, "Email template created successfully."));
    }

    [HttpPut("{id:guid}")]
    [RequirePermission(Permissions.System.Access)]
    [ProducesResponseType(typeof(ApiResponse<EmailTemplateDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateEmailTemplateCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command with { Id = id }, cancellationToken);
        return Ok(ApiResponse<EmailTemplateDto>.Ok(result, "Email template updated successfully."));
    }

    [HttpDelete("{id:guid}")]
    [RequirePermission(Permissions.System.Access)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new DeleteEmailTemplateCommand(id), cancellationToken);
        return Ok(ApiResponse<bool>.Ok(result, "Email template deleted successfully."));
    }

    [HttpPost("{id:guid}/activate")]
    [RequirePermission(Permissions.System.Access)]
    [ProducesResponseType(typeof(ApiResponse<EmailTemplateDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Activate(Guid id, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new ActivateEmailTemplateCommand(id), cancellationToken);
        return Ok(ApiResponse<EmailTemplateDto>.Ok(result, "Email template activated successfully."));
    }

    [HttpPost("{id:guid}/deactivate")]
    [RequirePermission(Permissions.System.Access)]
    [ProducesResponseType(typeof(ApiResponse<EmailTemplateDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new DeactivateEmailTemplateCommand(id), cancellationToken);
        return Ok(ApiResponse<EmailTemplateDto>.Ok(result, "Email template deactivated successfully."));
    }

    [HttpPost("preview")]
    [RequirePermission(Permissions.System.Access)]
    [ProducesResponseType(typeof(ApiResponse<EmailTemplatePreviewDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Preview(
        [FromBody] PreviewEmailTemplateCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<EmailTemplatePreviewDto>.Ok(result));
    }
}
