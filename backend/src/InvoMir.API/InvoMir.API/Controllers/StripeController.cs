using System.Text;

namespace InvoMir.API.Controllers;

[ApiController]
[Route("api/stripe")]
public sealed class StripeController(ISender mediator) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("webhook")]
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
