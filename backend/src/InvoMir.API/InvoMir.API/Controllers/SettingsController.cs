namespace InvoMir.API.Controllers;

[ApiController]
[Authorize]
[EnableRateLimiting(RateLimitPolicies.ApiAuthenticated)]
[Route("api/settings")]
[Produces("application/json")]
[ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status401Unauthorized)]
public sealed class SettingsController(ISender mediator) : ControllerBase
{
    [HttpGet("language")]
    [ProducesResponseType(typeof(ApiResponse<LanguagePreferenceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetLanguage(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetLanguagePreferenceQuery(), cancellationToken);
        return Ok(ApiResponse<LanguagePreferenceDto>.Ok(result));
    }

    [HttpPut("language")]
    [ProducesResponseType(typeof(ApiResponse<LanguagePreferenceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> UpdateLanguage(
        [FromBody] UpdateLanguagePreferenceCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<LanguagePreferenceDto>.Ok(result, "Language preference updated successfully."));
    }
}
