namespace InvoMir.API.Controllers;

[ApiController]
[Authorize]
[Route("api/users")]
[Produces("application/json")]
[ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status401Unauthorized)]
public sealed class UsersController(ISender mediator) : ControllerBase
{
    private const long MaxLogoBytes = 2 * 1024 * 1024;

    [HttpGet("me")]
    [ProducesResponseType(typeof(ApiResponse<UserProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCurrent(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetCurrentUserQuery(), cancellationToken);
        return Ok(ApiResponse<UserProfileDto>.Ok(result));
    }

    [HttpPut("me")]
    [ProducesResponseType(typeof(ApiResponse<UserProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> UpdateCurrent(
        [FromBody] UpdateCurrentUserCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<UserProfileDto>.Ok(result, "Profile updated successfully."));
    }

    [HttpPut("me/password")]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangeCurrentUserPasswordCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("me/logo")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ApiResponse<UserLogoDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> UploadLogo(
        IFormFile? logo,
        CancellationToken cancellationToken)
    {
        if (logo is null)
            return BadRequest(ApiResponse<string>.Fail("Logo file is required."));

        if (logo.Length > MaxLogoBytes)
            return BadRequest(ApiResponse<string>.Fail("Logo file must not exceed 2MB."));

        await using var stream = logo.OpenReadStream();
        using var memoryStream = new MemoryStream();
        await stream.CopyToAsync(memoryStream, cancellationToken);

        var result = await mediator.Send(
            new UploadCurrentUserLogoCommand(
                logo.FileName,
                logo.ContentType,
                memoryStream.ToArray()),
            cancellationToken);

        return Ok(ApiResponse<UserLogoDto>.Ok(result, "Logo uploaded successfully."));
    }
}
