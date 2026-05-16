namespace InvoMir.Application.Features.Clients.Commands.CreateClient;

public sealed class CreateClientCommandHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    ITenantContext tenantContext,
    IClientContext clientContext,
    IAuditService auditService)
    : IRequestHandler<CreateClientCommand, ClientDto>
{
    private const int FreePlanClientLimit = 2;

    public async Task<ClientDto> Handle(
        CreateClientCommand request,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var userPlan = await context.Users
            .AsNoTracking()
            .Where(user => user.Id == userId)
            .Select(user => user.Plan)
            .FirstOrDefaultAsync(cancellationToken);

        if (string.IsNullOrWhiteSpace(userPlan))
            throw new UnauthorizedAccessException("User context is not available.");

        if (userPlan == AuthConstants.Plans.Free)
        {
            var currentClientCount = await context.Clients.CountAsync(cancellationToken);
            if (currentClientCount >= FreePlanClientLimit)
                throw new ForbiddenException("Free plan client limit reached.");
        }

        var client = Client.Create(
            request.Name,
            request.Email,
            request.Phone,
            request.Address,
            request.Company,
            request.TaxId,
            request.Notes);

        context.Clients.Add(client);
        await context.SaveChangesAsync(cancellationToken);

        await auditService.LogAsync(
            AuditConstants.Entities.Client,
            client.Id,
            AuditConstants.Actions.Created,
            tenantContext.TenantId,
            userId,
            newValues: ToAuditSnapshot(client),
            ipAddress: clientContext.IpAddress,
            userAgent: clientContext.DeviceInfo,
            cancellationToken: cancellationToken);

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
