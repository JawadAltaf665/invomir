namespace InvoMir.API.Controllers;

[ApiController]
[Authorize]
[EnableRateLimiting(RateLimitPolicies.ApiAuthenticated)]
[Route("api/lookups")]
[Produces("application/json")]
[ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status401Unauthorized)]
public sealed class LookupsController(ISender mediator) : ControllerBase
{
    [HttpGet("calling-countries")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<CallingCountryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListCallingCountries(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new ListCallingCountriesQuery(), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<CallingCountryDto>>.Ok(result));
    }
}
