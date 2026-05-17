namespace InvoMir.Application.Features.Invoices.Commands.CancelInvoice;

public sealed class CancelInvoiceCommandHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    ITenantContext tenantContext,
    IClientContext clientContext,
    IInvoiceReminderJobService invoiceReminderJobService,
    IAuditService auditService)
    : IRequestHandler<CancelInvoiceCommand, InvoiceCancellationDto>
{
    public async Task<InvoiceCancellationDto> Handle(
        CancelInvoiceCommand request,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var invoice = await context.Invoices
            .FirstOrDefaultAsync(currentInvoice => currentInvoice.Id == request.Id, cancellationToken);

        if (invoice is null)
            throw new NotFoundException(nameof(Invoice), request.Id);

        if (!invoice.CanCancelIssued())
            throw new BadRequestException("Only sent, viewed, or overdue invoices can be cancelled.");

        var oldValues = ToAuditSnapshot(invoice);
        invoice.Cancel(DateTime.UtcNow);
        var cancelledReminderJobCount = await invoiceReminderJobService.CancelPendingAsync(invoice.Id, cancellationToken);

        await context.SaveChangesAsync(cancellationToken);

        await auditService.LogAsync(
            AuditConstants.Entities.Invoice,
            invoice.Id,
            AuditConstants.Actions.Cancelled,
            tenantContext.TenantId,
            userId,
            oldValues,
            ToAuditSnapshot(invoice, cancelledReminderJobCount),
            clientContext.IpAddress,
            clientContext.DeviceInfo,
            cancellationToken);

        return new InvoiceCancellationDto(invoice.Id, invoice.Status, invoice.CancelledAt);
    }

    private static InvoiceAuditSnapshot ToAuditSnapshot(Invoice invoice)
    {
        return new InvoiceAuditSnapshot(
            invoice.InvoiceNumber,
            invoice.ClientId,
            invoice.Status,
            invoice.Total,
            invoice.CancelledAt,
            null);
    }

    private static InvoiceAuditSnapshot ToAuditSnapshot(Invoice invoice, int cancelledReminderJobCount)
    {
        return new InvoiceAuditSnapshot(
            invoice.InvoiceNumber,
            invoice.ClientId,
            invoice.Status,
            invoice.Total,
            invoice.CancelledAt,
            cancelledReminderJobCount);
    }

    private sealed record InvoiceAuditSnapshot(
        string InvoiceNumber,
        Guid ClientId,
        string Status,
        decimal Total,
        DateTime? CancelledAt,
        int? CancelledReminderJobCount);
}
