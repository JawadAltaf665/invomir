namespace InvoMir.API.Controllers;

[ApiController]
[Authorize]
[EnableRateLimiting(RateLimitPolicies.ApiAuthenticated)]
[Route("api/notifications")]
[Produces("application/json")]
[ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status401Unauthorized)]
public sealed class NotificationsController(ISender mediator) : ControllerBase
{
    [HttpGet]
    [RequirePermission(Permissions.Notification.View)]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<NotificationDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> List(
        [FromQuery] string? type,
        [FromQuery] string? status,
        [FromQuery] string? priority,
        [FromQuery(Name = "q")] string? search,
        [FromQuery] int page,
        [FromQuery(Name = "limit")] int limit,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(
            new GetNotificationsQuery(type, status, priority, search, page, limit),
            cancellationToken);

        return Ok(ApiResponse<PagedResult<NotificationDto>>.Ok(result));
    }

    [HttpGet("unread")]
    [RequirePermission(Permissions.Notification.View)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<NotificationDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Unread(
        [FromQuery(Name = "limit")] int limit,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetUnreadNotificationsQuery(limit), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<NotificationDto>>.Ok(result));
    }

    [HttpGet("unread-count")]
    [RequirePermission(Permissions.Notification.View)]
    [ProducesResponseType(typeof(ApiResponse<UnreadNotificationCountDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UnreadCount(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetUnreadCountQuery(), cancellationToken);
        return Ok(ApiResponse<UnreadNotificationCountDto>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    [RequirePermission(Permissions.Notification.View)]
    [ProducesResponseType(typeof(ApiResponse<NotificationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetNotificationByIdQuery(id), cancellationToken);
        return Ok(ApiResponse<NotificationDto>.Ok(result));
    }

    [HttpPut("{id:guid}/read")]
    [RequirePermission(Permissions.Notification.View)]
    [ProducesResponseType(typeof(ApiResponse<NotificationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkRead(Guid id, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new MarkNotificationAsReadCommand(id), cancellationToken);
        return Ok(ApiResponse<NotificationDto>.Ok(result, "Notification marked as read."));
    }

    [HttpPut("read-all")]
    [RequirePermission(Permissions.Notification.View)]
    [ProducesResponseType(typeof(ApiResponse<int>), StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkAllRead(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new MarkAllNotificationsAsReadCommand(), cancellationToken);
        return Ok(ApiResponse<int>.Ok(result, "Notifications marked as read."));
    }

    [HttpDelete("{id:guid}")]
    [RequirePermission(Permissions.Notification.View)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new DeleteNotificationCommand(id), cancellationToken);
        return Ok(ApiResponse<bool>.Ok(result));
    }
}
