namespace InvoMir.Application.Features.Invoices.Commands.DeleteInvoice;

public sealed class DeleteInvoiceCommandHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    ITenantContext tenantContext,
    IClientContext clientContext,
    IAuditService auditService)
    : IRequestHandler<DeleteInvoiceCommand, InvoiceCancellationDto>
{
    public async Task<InvoiceCancellationDto> Handle(
        DeleteInvoiceCommand request,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var invoice = await context.Invoices
            .FirstOrDefaultAsync(currentInvoice => currentInvoice.Id == request.Id, cancellationToken);

        if (invoice is null)
            throw new NotFoundException(nameof(Invoice), request.Id);

        if (invoice.IsPaid())
            throw new BadRequestException("Paid invoices cannot be cancelled.");

        var oldValues = ToAuditSnapshot(invoice);
        invoice.Cancel(DateTime.UtcNow);

        if (oldValues.Status == InvoiceConstants.Statuses.Draft)
        {
            var items = await context.InvoiceItems
                .Where(item => item.InvoiceId == invoice.Id)
                .ToListAsync(cancellationToken);

            context.InvoiceItems.RemoveRange(items);
            context.Invoices.Remove(invoice);
        }

        await context.SaveChangesAsync(cancellationToken);

        await auditService.LogAsync(
            AuditConstants.Entities.Invoice,
            invoice.Id,
            oldValues.Status == InvoiceConstants.Statuses.Draft
                ? AuditConstants.Actions.Deleted
                : AuditConstants.Actions.Cancelled,
            tenantContext.TenantId,
            userId,
            oldValues,
            ToAuditSnapshot(invoice),
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
            invoice.CancelledAt);
    }

    private sealed record InvoiceAuditSnapshot(
        string InvoiceNumber,
        Guid ClientId,
        string Status,
        decimal Total,
        DateTime? CancelledAt);
}
