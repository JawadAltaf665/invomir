namespace InvoMir.API.Controllers;

[ApiController]
[Authorize]
[Route("api/dashboard")]
[Produces("application/json")]
[ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status401Unauthorized)]
public sealed class DashboardController(ISender mediator) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<DashboardDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetDashboardQuery(), cancellationToken);
        return Ok(ApiResponse<DashboardDto>.Ok(result));
    }
}
