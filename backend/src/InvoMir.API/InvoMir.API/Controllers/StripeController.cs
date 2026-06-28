using System.Text;

namespace InvoMir.API.Controllers;

[ApiController]
[Authorize]
[Route("api/stripe")]
[Produces("application/json")]
public sealed class StripeController(ISender mediator) : ControllerBase
{
    [HttpGet("status")]
    [RequirePermission(Permissions.Payment.View)]
    [EnableRateLimiting(RateLimitPolicies.ApiAuthenticated)]
    [ProducesResponseType(typeof(ApiResponse<StripeConnectStatusDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Status(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetStripeConnectStatusQuery(), cancellationToken);
        return Ok(ApiResponse<StripeConnectStatusDto>.Ok(result));
    }

    [HttpPost("connect")]
    [RequirePermission(Permissions.Payment.Manage)]
    [EnableRateLimiting(RateLimitPolicies.Subscriptions)]
    [ProducesResponseType(typeof(ApiResponse<StripeConnectUrlDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Connect(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new CreateStripeConnectCommand(), cancellationToken);
        return Ok(ApiResponse<StripeConnectUrlDto>.Ok(result));
    }

    [HttpDelete("disconnect")]
    [RequirePermission(Permissions.Payment.Manage)]
    [EnableRateLimiting(RateLimitPolicies.Subscriptions)]
    [ProducesResponseType(typeof(ApiResponse<StripeDisconnectResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Disconnect(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new DisconnectStripeConnectCommand(), cancellationToken);
        return Ok(ApiResponse<StripeDisconnectResultDto>.Ok(result));
    }

    [AllowAnonymous]
    [HttpGet("connect/callback")]
    [EnableRateLimiting(RateLimitPolicies.StripeWebhooks)]
    [ProducesResponseType(StatusCodes.Status302Found)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ConnectCallback(
        [FromQuery] string? code,
        [FromQuery] string? state,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(
            new CompleteStripeConnectCallbackCommand(code, state),
            cancellationToken);

        return Redirect(result.RedirectUrl);
    }

    [AllowAnonymous]
    [HttpPost("webhook")]
    [EnableRateLimiting(RateLimitPolicies.StripeWebhooks)]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Webhook(CancellationToken cancellationToken)
    {
        using var reader = new StreamReader(Request.Body, Encoding.UTF8);
        var payload = await reader.ReadToEndAsync(cancellationToken);
        var signatureHeader = Request.Headers["Stripe-Signature"].ToString();

        await mediator.Send(new HandleStripeWebhookCommand(payload, signatureHeader), cancellationToken);
        return Ok();
    }
}
