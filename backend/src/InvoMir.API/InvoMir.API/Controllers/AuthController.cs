using MediatR;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace InvoMir.API.Controllers;

[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public sealed class AuthController(ISender mediator) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.AuthStrict)]
    [ProducesResponseType(typeof(ApiResponse<AuthTokenDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<AuthTokenDto>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Register(
        [FromBody] RegisterCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return result.Success
            ? StatusCode(StatusCodes.Status201Created, result)
            : Conflict(result);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.AuthStrict)]
    [ProducesResponseType(typeof(ApiResponse<AuthTokenDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AuthTokenDto>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Login(
        [FromBody] LoginCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return result.Success ? Ok(result) : Unauthorized(result);
    }

    [HttpPost("google")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.AuthStrict)]
    [ProducesResponseType(typeof(ApiResponse<AuthTokenDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AuthTokenDto>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Google(
        [FromBody] GoogleLoginCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return result.Success ? Ok(result) : Unauthorized(result);
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.AuthToken)]
    [ProducesResponseType(typeof(ApiResponse<AuthTokenDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AuthTokenDto>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh(
        [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] RefreshTokenCommand? command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command ?? new RefreshTokenCommand(), cancellationToken);
        return result.Success ? Ok(result) : Unauthorized(result);
    }

    [HttpPost("logout")]
    [Authorize]
    [EnableRateLimiting(RateLimitPolicies.AuthToken)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Logout(
        [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] LogoutCommand? command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command ?? new LogoutCommand(), cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.AuthStrict)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ForgotPassword(
        [FromBody] ForgotPasswordCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.AuthStrict)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ResetPassword(
        [FromBody] ResetPasswordCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("verify-email")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.AuthStrict)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> VerifyEmail(
        [FromBody] VerifyEmailCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
