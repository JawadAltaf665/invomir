namespace InvoMir.API.Controllers;

[ApiController]
[Authorize]
[EnableRateLimiting(RateLimitPolicies.Subscriptions)]
[Route("api/subscriptions")]
[Produces("application/json")]
[ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status401Unauthorized)]
public sealed class SubscriptionsController(ISender mediator) : ControllerBase
{
    [HttpGet]
    [RequirePermission(Permissions.Subscription.View)]
    [ProducesResponseType(typeof(ApiResponse<CurrentSubscriptionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetCurrentSubscriptionQuery(), cancellationToken);
        return Ok(ApiResponse<CurrentSubscriptionDto>.Ok(result));
    }

    [HttpGet("status")]
    [RequirePermission(Permissions.Subscription.View)]
    [ProducesResponseType(typeof(ApiResponse<CurrentSubscriptionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Status(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetCurrentSubscriptionQuery(), cancellationToken);
        return Ok(ApiResponse<CurrentSubscriptionDto>.Ok(result));
    }

    [HttpGet("plans")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<SubscriptionPlansDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Plans(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetSubscriptionPlansQuery(), cancellationToken);
        return Ok(ApiResponse<SubscriptionPlansDto>.Ok(result));
    }

    [HttpPost("checkout")]
    [RequirePermission(Permissions.Subscription.Manage)]
    [ProducesResponseType(typeof(ApiResponse<SubscriptionCheckoutDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Checkout(
        [FromBody] CreateSubscriptionCheckoutCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<SubscriptionCheckoutDto>.Ok(result, "Subscription checkout session created."));
    }

    [HttpPost("cancel")]
    [RequirePermission(Permissions.Subscription.Manage)]
    [ProducesResponseType(typeof(ApiResponse<SubscriptionCancellationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Cancel(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new CancelSubscriptionCommand(), cancellationToken);
        return Ok(ApiResponse<SubscriptionCancellationDto>.Ok(result, "Subscription cancellation scheduled."));
    }
}
