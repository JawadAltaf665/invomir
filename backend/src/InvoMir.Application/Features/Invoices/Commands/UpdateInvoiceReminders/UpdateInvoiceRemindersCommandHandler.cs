namespace InvoMir.Application.Features.Invoices.Commands.UpdateInvoiceReminders;

public sealed class UpdateInvoiceRemindersCommandHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    ITenantContext tenantContext,
    IClientContext clientContext,
    IInvoiceReminderJobService invoiceReminderJobService,
    IAuditService auditService)
    : IRequestHandler<UpdateInvoiceRemindersCommand, InvoiceReminderSettingsDto>
{
    public async Task<InvoiceReminderSettingsDto> Handle(
        UpdateInvoiceRemindersCommand request,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var invoice = await context.Invoices
            .FirstOrDefaultAsync(currentInvoice => currentInvoice.Id == request.Id, cancellationToken);

        if (invoice is null)
            throw new NotFoundException(nameof(Invoice), request.Id);

        if (!invoice.CanUseReminders())
            throw new BadRequestException("Invoice is paid or cancelled. Reminders are not applicable.");

        var oldValues = ToAuditSnapshot(invoice);
        var enabled = request.Enabled.GetValueOrDefault();
        invoice.SetRemindersEnabled(enabled);

        var cancelledReminderJobCount = 0;
        IReadOnlyList<DateTime> scheduledReminders = [];

        if (enabled)
        {
            if (invoice.CanScheduleReminders())
            {
                scheduledReminders = await invoiceReminderJobService
                    .ScheduleForInvoiceAsync(invoice.Id, invoice.DueDate, cancellationToken);
            }
        }
        else
        {
            cancelledReminderJobCount = await invoiceReminderJobService
                .CancelPendingAsync(invoice.Id, cancellationToken);
        }

        await context.SaveChangesAsync(cancellationToken);

        await auditService.LogAsync(
            AuditConstants.Entities.Invoice,
            invoice.Id,
            AuditConstants.Actions.RemindersUpdated,
            tenantContext.TenantId,
            userId,
            oldValues,
            ToAuditSnapshot(invoice, cancelledReminderJobCount, scheduledReminders.Count),
            clientContext.IpAddress,
            clientContext.DeviceInfo,
            cancellationToken);

        return new InvoiceReminderSettingsDto(
            invoice.Id,
            invoice.RemindersEnabled,
            cancelledReminderJobCount,
            scheduledReminders);
    }

    private static InvoiceAuditSnapshot ToAuditSnapshot(Invoice invoice)
    {
        return new InvoiceAuditSnapshot(
            invoice.InvoiceNumber,
            invoice.ClientId,
            invoice.Status,
            invoice.DueDate,
            invoice.RemindersEnabled,
            null,
            null);
    }

    private static InvoiceAuditSnapshot ToAuditSnapshot(
        Invoice invoice,
        int cancelledReminderJobCount,
        int scheduledReminderCount)
    {
        return new InvoiceAuditSnapshot(
            invoice.InvoiceNumber,
            invoice.ClientId,
            invoice.Status,
            invoice.DueDate,
            invoice.RemindersEnabled,
            cancelledReminderJobCount,
            scheduledReminderCount);
    }

    private sealed record InvoiceAuditSnapshot(
        string InvoiceNumber,
        Guid ClientId,
        string Status,
        DateOnly DueDate,
        bool RemindersEnabled,
        int? CancelledReminderJobCount,
        int? ScheduledReminderCount);
}
