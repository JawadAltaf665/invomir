namespace InvoMir.API.Controllers;

[ApiController]
[Authorize]
[EnableRateLimiting(RateLimitPolicies.ApiAuthenticated)]
[Route("api/audit-logs")]
[Produces("application/json")]
[ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status401Unauthorized)]
public sealed class AuditLogsController(ISender mediator) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<AuditLogDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> List(
        [FromQuery] string? entityName,
        [FromQuery] Guid? entityId,
        [FromQuery] string? action,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int page,
        [FromQuery(Name = "limit")] int limit,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(
            new ListAuditLogsQuery(entityName, entityId, action, from, to, page, limit),
            cancellationToken);

        return Ok(ApiResponse<PagedResult<AuditLogDto>>.Ok(result));
    }

    [HttpGet("{entityName}/{entityId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<AuditLogDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> GetEntityHistory(
        string entityName,
        Guid entityId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int page,
        [FromQuery(Name = "limit")] int limit,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(
            new GetEntityAuditLogsQuery(entityName, entityId, from, to, page, limit),
            cancellationToken);

        return Ok(ApiResponse<PagedResult<AuditLogDto>>.Ok(result));
    }
}
