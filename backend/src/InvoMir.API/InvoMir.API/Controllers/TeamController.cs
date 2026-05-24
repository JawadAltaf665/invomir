namespace InvoMir.API.Controllers;

[ApiController]
[Authorize]
[EnableRateLimiting(RateLimitPolicies.ApiAuthenticated)]
[Route("api/team")]
[Produces("application/json")]
[ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status401Unauthorized)]
[ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status403Forbidden)]
public sealed class TeamController(ISender mediator) : ControllerBase
{
    [HttpGet("members")]
    [RequirePermission(Permissions.Team.Manage)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<TeamMemberDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Members(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new ListTeamMembersQuery(), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<TeamMemberDto>>.Ok(result));
    }

    [HttpDelete("members/{id:guid}")]
    [RequirePermission(Permissions.Team.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveMember(Guid id, CancellationToken cancellationToken)
    {
        await mediator.Send(new RemoveTeamMemberCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpPatch("members/{id:guid}/role")]
    [RequirePermission(Permissions.Team.Manage)]
    [ProducesResponseType(typeof(ApiResponse<TeamMemberRoleUpdateDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ChangeRole(
        Guid id,
        [FromBody] ChangeTeamMemberRoleCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command with { Id = id }, cancellationToken);
        return Ok(ApiResponse<TeamMemberRoleUpdateDto>.Ok(result, "Team member role updated successfully."));
    }

    [HttpGet("invitations")]
    [RequirePermission(Permissions.Team.Manage)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<TeamInvitationDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Invitations(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new ListTeamInvitationsQuery(), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<TeamInvitationDto>>.Ok(result));
    }

    [HttpPost("invitations")]
    [RequirePermission(Permissions.Team.Manage)]
    [ProducesResponseType(typeof(ApiResponse<TeamInvitationDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Invite(
        [FromBody] InviteTeamMemberCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return StatusCode(
            StatusCodes.Status201Created,
            ApiResponse<TeamInvitationDto>.Ok(result, "Team invitation created successfully."));
    }

    [HttpDelete("invitations/{id:guid}")]
    [RequirePermission(Permissions.Team.Manage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CancelInvitation(Guid id, CancellationToken cancellationToken)
    {
        await mediator.Send(new CancelTeamInvitationCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpPost("invitations/{token}/accept")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.AuthStrict)]
    [ProducesResponseType(typeof(ApiResponse<TeamInvitationAcceptedDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> AcceptInvitation(
        string token,
        [FromBody] AcceptTeamInvitationCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command with { Token = token }, cancellationToken);
        return StatusCode(
            StatusCodes.Status201Created,
            ApiResponse<TeamInvitationAcceptedDto>.Ok(result, "Team invitation accepted successfully."));
    }
}
