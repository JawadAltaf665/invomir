using InvoMir.Application.Features.Admin.Emailing.Commands.CancelQueuedEmail;
using InvoMir.Application.Features.Admin.Emailing.Commands.RetryQueuedEmail;
using InvoMir.Application.Features.Admin.Emailing.DTOs;
using InvoMir.Application.Features.Admin.Emailing.Queries.GetQueuedEmail;
using InvoMir.Application.Features.Admin.Emailing.Queries.ListQueuedEmails;
using InvoMir.Domain.Enums;

namespace InvoMir.API.Controllers;

[ApiController]
[Authorize]
[EnableRateLimiting(RateLimitPolicies.AdminEndpoints)]
[Route("api/admin/queued-emails")]
[Produces("application/json")]
[ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status401Unauthorized)]
[ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status403Forbidden)]
public sealed class AdminQueuedEmailsController(ISender mediator) : ControllerBase
{
    [HttpGet]
    [RequirePermission(Permissions.System.Access)]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<QueuedEmailDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> List(
        [FromQuery] QueuedEmailStatus? status,
        [FromQuery] Guid? tenantId,
        [FromQuery] EmailTemplateType? templateType,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery(Name = "searchEmail")] string? searchEmail,
        [FromQuery] int page,
        [FromQuery(Name = "limit")] int limit,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(
            new ListQueuedEmailsQuery(status, tenantId, templateType, from, to, searchEmail, page, limit),
            cancellationToken);

        return Ok(ApiResponse<PagedResult<QueuedEmailDto>>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    [RequirePermission(Permissions.System.Access)]
    [ProducesResponseType(typeof(ApiResponse<QueuedEmailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetQueuedEmailQuery(id), cancellationToken);
        return Ok(ApiResponse<QueuedEmailDto>.Ok(result));
    }

    [HttpPost("{id:guid}/retry")]
    [RequirePermission(Permissions.System.Access)]
    [ProducesResponseType(typeof(ApiResponse<QueuedEmailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Retry(Guid id, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new RetryQueuedEmailCommand(id), cancellationToken);
        return Ok(ApiResponse<QueuedEmailDto>.Ok(result, "Queued email retry scheduled."));
    }

    [HttpPost("{id:guid}/cancel")]
    [RequirePermission(Permissions.System.Access)]
    [ProducesResponseType(typeof(ApiResponse<QueuedEmailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new CancelQueuedEmailCommand(id), cancellationToken);
        return Ok(ApiResponse<QueuedEmailDto>.Ok(result, "Queued email cancelled successfully."));
    }
}
