namespace InvoMir.Application.Features.Clients.Commands.DeleteClient;

public sealed class DeleteClientCommandHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    ITenantContext tenantContext,
    IClientContext clientContext,
    IAuditService auditService)
    : IRequestHandler<DeleteClientCommand, bool>
{
    public async Task<bool> Handle(DeleteClientCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var client = await context.Clients
            .FirstOrDefaultAsync(currentClient => currentClient.Id == request.Id, cancellationToken);

        if (client is null)
            throw new NotFoundException(nameof(Client), request.Id);

        var hasUnpaidInvoices = await context.Invoices
            .AnyAsync(invoice =>
                invoice.ClientId == client.Id &&
                invoice.Status != InvoiceConstants.Statuses.Paid &&
                invoice.Status != InvoiceConstants.Statuses.Cancelled,
                cancellationToken);

        if (hasUnpaidInvoices)
            throw new ConflictException("Client has unpaid invoices. Resolve them before deleting the client.");

        var oldValues = ToAuditSnapshot(client);
        context.Clients.Remove(client);
        await context.SaveChangesAsync(cancellationToken);

        await auditService.LogAsync(
            AuditConstants.Entities.Client,
            client.Id,
            AuditConstants.Actions.Deleted,
            tenantContext.TenantId,
            userId,
            oldValues: oldValues,
            ipAddress: clientContext.IpAddress,
            userAgent: clientContext.DeviceInfo,
            cancellationToken: cancellationToken);

        return true;
    }

    private static object ToAuditSnapshot(Client client)
    {
        return new
        {
            client.Name,
            client.Email,
            client.Phone,
            client.Address,
            client.Company,
            client.TaxId,
            client.Notes,
            client.IsActive
        };
    }
}
