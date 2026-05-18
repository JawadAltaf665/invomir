namespace InvoMir.Application.Features.Invoices.Commands.TrackInvoiceView;

public sealed class TrackInvoiceViewCommandHandler(
    IAppDbContext context,
    IClientContext clientContext,
    IAuditService auditService)
    : IRequestHandler<TrackInvoiceViewCommand, bool>
{
    public async Task<bool> Handle(
        TrackInvoiceViewCommand request,
        CancellationToken cancellationToken)
    {
        var token = request.Token.Trim();
        var invoice = await context.Invoices
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(currentInvoice =>
                currentInvoice.PaymentLinkToken == token &&
                !currentInvoice.IsDeleted,
                cancellationToken);

        if (invoice is null || !CanTrackView(invoice))
            return false;

        var oldValues = ToAuditSnapshot(invoice);
        invoice.MarkViewed(DateTime.UtcNow);
        await context.SaveChangesAsync(cancellationToken);

        await auditService.LogAsync(
            AuditConstants.Entities.Invoice,
            invoice.Id,
            AuditConstants.Actions.Viewed,
            invoice.TenantId,
            null,
            oldValues,
            ToAuditSnapshot(invoice),
            clientContext.IpAddress,
            clientContext.DeviceInfo,
            cancellationToken);

        return true;
    }

    private static bool CanTrackView(Invoice invoice)
    {
        return invoice.Status is InvoiceConstants.Statuses.Sent
            or InvoiceConstants.Statuses.Viewed
            or InvoiceConstants.Statuses.Overdue;
    }

    private static InvoiceAuditSnapshot ToAuditSnapshot(Invoice invoice)
    {
        return new InvoiceAuditSnapshot(
            invoice.InvoiceNumber,
            invoice.Status,
            invoice.ViewedAt);
    }

    private sealed record InvoiceAuditSnapshot(
        string InvoiceNumber,
        string Status,
        DateTime? ViewedAt);
}
