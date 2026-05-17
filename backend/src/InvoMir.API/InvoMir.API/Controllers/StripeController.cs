using System.Text;

namespace InvoMir.API.Controllers;

[ApiController]
[Authorize]
[Route("api/stripe")]
[Produces("application/json")]
public sealed class StripeController(ISender mediator) : ControllerBase
{
    [HttpPost("connect")]
    [ProducesResponseType(typeof(ApiResponse<StripeConnectUrlDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Connect(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new CreateStripeConnectCommand(), cancellationToken);
        return Ok(ApiResponse<StripeConnectUrlDto>.Ok(result));
    }

    [AllowAnonymous]
    [HttpPost("webhook")]
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
