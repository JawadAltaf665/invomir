namespace InvoMir.API.Controllers;

[ApiController]
[Authorize]
[EnableRateLimiting(RateLimitPolicies.ApiAuthenticated)]
[Route("api/reports")]
[Produces("application/json")]
[ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status401Unauthorized)]
public sealed class ReportsController(ISender mediator) : ControllerBase
{
    [HttpGet("monthly")]
    [ProducesResponseType(typeof(ApiResponse<MonthlyReportsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Monthly(
        [FromQuery] int? months,
        [FromQuery] int? year,
        [FromQuery] int? month,
        CancellationToken cancellationToken)
    {
        var query = new GetMonthlyReportsQuery(months ?? 12, year, month);
        var result = await mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<MonthlyReportsDto>.Ok(result));
    }

    [HttpGet("export")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Export(
        [FromQuery] string? format,
        [FromQuery] DateOnly from,
        [FromQuery] DateOnly to,
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetReportExportQuery(format, from, to, status), cancellationToken);
        return File(result.Content, result.ContentType, result.FileName);
    }
}
