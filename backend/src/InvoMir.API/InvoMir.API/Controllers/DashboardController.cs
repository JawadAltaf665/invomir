namespace InvoMir.API.Controllers;

[ApiController]
[Authorize]
[EnableRateLimiting(RateLimitPolicies.ApiAuthenticated)]
[Route("api/dashboard")]
[Produces("application/json")]
[ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status401Unauthorized)]
public sealed class DashboardController(ISender mediator) : ControllerBase
{
    [HttpGet]
    [RequirePermission(Permissions.Dashboard.View)]
    [ProducesResponseType(typeof(ApiResponse<DashboardDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetDashboardQuery(), cancellationToken);
        return Ok(ApiResponse<DashboardDto>.Ok(result));
    }

    [HttpGet("action-items")]
    [RequirePermission(Permissions.Dashboard.View)]
    [ProducesResponseType(typeof(ApiResponse<DashboardActionItemsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActionItems(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetDashboardActionItemsQuery(), cancellationToken);
        return Ok(ApiResponse<DashboardActionItemsDto>.Ok(result));
    }
}
