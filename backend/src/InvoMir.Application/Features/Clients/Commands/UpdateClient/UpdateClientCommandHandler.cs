namespace InvoMir.Application.Features.Clients.Commands.UpdateClient;

public sealed class UpdateClientCommandHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    ITenantContext tenantContext,
    IClientContext clientContext,
    IAuditService auditService)
    : IRequestHandler<UpdateClientCommand, ClientDto>
{
    public async Task<ClientDto> Handle(
        UpdateClientCommand request,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var client = await context.Clients
            .FirstOrDefaultAsync(currentClient => currentClient.Id == request.Id, cancellationToken);

        if (client is null)
            throw new NotFoundException(nameof(Client), request.Id);

        var oldValues = ToAuditSnapshot(client);
        client.Update(
            request.Name,
            request.Email,
            request.Phone,
            request.Address,
            request.Company,
            request.TaxId,
            request.Notes);

        await context.SaveChangesAsync(cancellationToken);

        await auditService.LogAsync(
            AuditConstants.Entities.Client,
            client.Id,
            AuditConstants.Actions.Updated,
            tenantContext.TenantId,
            userId,
            oldValues,
            ToAuditSnapshot(client),
            clientContext.IpAddress,
            clientContext.DeviceInfo,
            cancellationToken);

        return ToDto(client);
    }

    private static ClientDto ToDto(Client client)
    {
        return new ClientDto(
            client.Id,
            client.Name,
            client.Email,
            client.Phone,
            client.Address,
            client.Company,
            client.TaxId,
            client.Notes,
            client.IsActive,
            client.CreationTime);
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
