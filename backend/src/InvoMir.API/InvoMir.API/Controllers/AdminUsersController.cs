namespace InvoMir.API.Controllers;

[ApiController]
[Authorize]
[EnableRateLimiting(RateLimitPolicies.AdminEndpoints)]
[Route("api/admin/users")]
[Produces("application/json")]
[ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status401Unauthorized)]
[ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status403Forbidden)]
public sealed class AdminUsersController(ISender mediator) : ControllerBase
{
    [HttpGet]
    [RequirePermission(Permissions.System.Users.View)]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<AdminUserListItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(
        [FromQuery] string? q,
        [FromQuery] int page,
        [FromQuery(Name = "limit")] int limit,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new ListAdminUsersQuery(q, page, limit), cancellationToken);
        return Ok(ApiResponse<PagedResult<AdminUserListItemDto>>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    [RequirePermission(Permissions.System.Users.View)]
    [ProducesResponseType(typeof(ApiResponse<AdminUserDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetAdminUserQuery(id), cancellationToken);
        return Ok(ApiResponse<AdminUserDetailDto>.Ok(result));
    }

    [HttpPatch("{id:guid}/plan")]
    [RequirePermission(Permissions.System.Users.Manage)]
    [ProducesResponseType(typeof(ApiResponse<AdminUserPlanUpdateDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> UpdatePlan(
        Guid id,
        [FromBody] UpdateAdminUserPlanCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command with { Id = id }, cancellationToken);
        return Ok(ApiResponse<AdminUserPlanUpdateDto>.Ok(result, "User plan updated successfully."));
    }

    [HttpPatch("{id:guid}/trial")]
    [RequirePermission(Permissions.System.Users.Manage)]
    [ProducesResponseType(typeof(ApiResponse<AdminUserTrialUpdateDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> UpdateTrial(
        Guid id,
        [FromBody] UpdateAdminUserTrialCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command with { Id = id }, cancellationToken);
        return Ok(ApiResponse<AdminUserTrialUpdateDto>.Ok(result, "User trial updated successfully."));
    }
}
