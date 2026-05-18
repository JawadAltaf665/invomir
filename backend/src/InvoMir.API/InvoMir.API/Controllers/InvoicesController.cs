using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace InvoMir.API.Controllers;

[ApiController]
[Authorize]
[Route("api/invoices")]
[Produces("application/json")]
[ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status401Unauthorized)]
public sealed class InvoicesController(ISender mediator) : ControllerBase
{
    private const string TransparentPixelBase64 = "R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==";

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<InvoiceListItemDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> List(
        [FromQuery] string? status,
        [FromQuery] Guid? clientId,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] int page,
        [FromQuery(Name = "limit")] int limit,
        CancellationToken cancellationToken)
    {
        var query = new ListInvoicesQuery(status, clientId, from, to, page, limit);
        var result = await mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<InvoiceListItemDto>>.Ok(result));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<InvoiceDetailDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Create(
        [FromBody] CreateInvoiceCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<InvoiceDetailDto>.Ok(result, "Invoice created successfully."));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<InvoiceDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetInvoiceQuery(id), cancellationToken);
        return Ok(ApiResponse<InvoiceDetailDto>.Ok(result));
    }

    [HttpGet("{id:guid}/pdf")]
    [Produces("application/pdf")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadPdf(
        Guid id,
        [FromQuery] bool preview,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GenerateInvoicePdfQuery(id), cancellationToken);
        Response.Headers["X-PDF-Generated-At"] = result.GeneratedAtUtc.ToString("O");

        if (preview)
        {
            Response.Headers["Content-Disposition"] = $"inline; filename=\"{result.FileName}\"";
            return File(result.Content, result.ContentType);
        }

        return File(result.Content, result.ContentType, result.FileName);
    }

    [HttpPost("{id:guid}/send")]
    [ProducesResponseType(typeof(ApiResponse<InvoiceSendResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Send(
        Guid id,
        [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] SendInvoiceCommand? command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send((command ?? new SendInvoiceCommand()) with { Id = id }, cancellationToken);
        return Ok(ApiResponse<InvoiceSendResultDto>.Ok(result, "Invoice sent successfully."));
    }

    [HttpPost("{id:guid}/resend")]
    [ProducesResponseType(typeof(ApiResponse<InvoiceSendResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Resend(
        Guid id,
        [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] ResendInvoiceCommand? command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send((command ?? new ResendInvoiceCommand()) with { Id = id }, cancellationToken);
        return Ok(ApiResponse<InvoiceSendResultDto>.Ok(result, "Invoice resent successfully."));
    }

    [HttpPost("{id:guid}/mark-paid")]
    [ProducesResponseType(typeof(ApiResponse<InvoicePaymentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> MarkPaid(
        Guid id,
        [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] MarkInvoicePaidCommand? command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send((command ?? new MarkInvoicePaidCommand()) with { Id = id }, cancellationToken);
        return Ok(ApiResponse<InvoicePaymentDto>.Ok(result, "Invoice marked paid successfully."));
    }

    [HttpPatch("{id:guid}/reminders")]
    [ProducesResponseType(typeof(ApiResponse<InvoiceReminderSettingsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> UpdateReminders(
        Guid id,
        [FromBody] UpdateInvoiceRemindersCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command with { Id = id }, cancellationToken);
        return Ok(ApiResponse<InvoiceReminderSettingsDto>.Ok(result, "Invoice reminder settings updated successfully."));
    }

    [AllowAnonymous]
    [HttpGet("track/{token}")]
    [Produces("image/gif")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> Track(
        string token,
        CancellationToken cancellationToken)
    {
        await mediator.Send(new TrackInvoiceViewCommand(token), cancellationToken);
        return File(Convert.FromBase64String(TransparentPixelBase64), "image/gif");
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<InvoiceDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateInvoiceCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command with { Id = id }, cancellationToken);
        return Ok(ApiResponse<InvoiceDetailDto>.Ok(result, "Invoice updated successfully."));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<InvoiceCancellationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new DeleteInvoiceCommand(id), cancellationToken);
        return Ok(ApiResponse<InvoiceCancellationDto>.Ok(result));
    }

    [HttpPost("{id:guid}/cancel")]
    [ProducesResponseType(typeof(ApiResponse<InvoiceCancellationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new CancelInvoiceCommand(id), cancellationToken);
        return Ok(ApiResponse<InvoiceCancellationDto>.Ok(result, "Invoice cancelled successfully."));
    }

    [HttpPost("{id:guid}/duplicate")]
    [ProducesResponseType(typeof(ApiResponse<InvoiceDetailDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Duplicate(
        Guid id,
        [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] DuplicateInvoiceCommand? command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send((command ?? new DuplicateInvoiceCommand()) with { Id = id }, cancellationToken);
        return StatusCode(
            StatusCodes.Status201Created,
            ApiResponse<InvoiceDetailDto>.Ok(result, "Invoice duplicated successfully."));
    }
}
