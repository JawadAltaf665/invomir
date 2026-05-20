namespace InvoMir.API.Controllers;

[ApiController]
[Authorize]
[EnableRateLimiting(RateLimitPolicies.ApiAuthenticated)]
[Route("api/payments")]
[Produces("application/json")]
[ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status401Unauthorized)]
public sealed class PaymentsController(ISender mediator) : ControllerBase
{
    [HttpGet]
    [RequirePermission(Permissions.Payment.View)]
    [ProducesResponseType(typeof(ApiResponse<PaymentHistoryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> List(
        [FromQuery] string? status,
        [FromQuery] int page,
        [FromQuery(Name = "limit")] int limit,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new ListPaymentsQuery(status, page, limit), cancellationToken);
        return Ok(ApiResponse<PaymentHistoryDto>.Ok(result));
    }
}
