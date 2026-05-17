namespace InvoMir.Application.Features.Invoices.Commands.DuplicateInvoice;

public sealed class DuplicateInvoiceCommandHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    ITenantContext tenantContext,
    IClientContext clientContext,
    IAuditService auditService,
    IInvoiceNumberService invoiceNumberService)
    : IRequestHandler<DuplicateInvoiceCommand, InvoiceDetailDto>
{
    public async Task<InvoiceDetailDto> Handle(
        DuplicateInvoiceCommand request,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var sourceInvoice = await GetSourceInvoiceAsync(request.Id, cancellationToken);
        var sourceItems = await GetSourceItemsAsync(sourceInvoice.Id, cancellationToken);
        if (sourceItems.Count == 0)
            throw new BadRequestException("Source invoice has no line items to duplicate.");

        var clientId = request.ClientId ?? sourceInvoice.ClientId;
        var client = await GetClientAsync(clientId, cancellationToken);

        var issueDate = DateOnly.FromDateTime(DateTime.UtcNow);
        var dueDate = request.DueDate ?? ResolveDueDate(sourceInvoice, issueDate);
        if (dueDate < issueDate)
            throw new BadRequestException("Due date must be on or after issue date.");

        var invoiceNumber = await invoiceNumberService.GenerateNextAsync(tenantContext.TenantId, cancellationToken);
        var duplicate = CreateDuplicateInvoice(userId, clientId, invoiceNumber, issueDate, dueDate, sourceInvoice);
        context.Invoices.Add(duplicate);

        var duplicateItems = BuildItems(duplicate.Id, sourceItems);
        foreach (var item in duplicateItems)
            context.InvoiceItems.Add(item);

        await context.SaveChangesAsync(cancellationToken);

        await LogDuplicateAsync(userId, sourceInvoice, duplicate, cancellationToken);

        return ToDto(duplicate, client, duplicateItems);
    }

    private async Task<SourceInvoiceSnapshot> GetSourceInvoiceAsync(
        Guid invoiceId,
        CancellationToken cancellationToken)
    {
        var sourceInvoice = await context.Invoices
            .AsNoTracking()
            .Where(invoice => invoice.Id == invoiceId)
            .Select(invoice => new SourceInvoiceSnapshot(
                invoice.Id,
                invoice.ClientId,
                invoice.InvoiceNumber,
                invoice.IssueDate,
                invoice.DueDate,
                invoice.Currency,
                invoice.Subtotal,
                invoice.TaxPercent,
                invoice.TaxAmount,
                invoice.Discount,
                invoice.Total,
                invoice.Notes,
                invoice.Status))
            .FirstOrDefaultAsync(cancellationToken);

        return sourceInvoice ?? throw new NotFoundException(nameof(Invoice), invoiceId);
    }

    private async Task<List<SourceInvoiceItemSnapshot>> GetSourceItemsAsync(
        Guid invoiceId,
        CancellationToken cancellationToken)
    {
        return await context.InvoiceItems
            .AsNoTracking()
            .Where(item => item.InvoiceId == invoiceId)
            .OrderBy(item => item.SortOrder)
            .Select(item => new SourceInvoiceItemSnapshot(
                item.Description,
                item.Quantity,
                item.UnitPrice))
            .ToListAsync(cancellationToken);
    }

    private async Task<InvoiceClientDto> GetClientAsync(Guid clientId, CancellationToken cancellationToken)
    {
        var client = await context.Clients
            .AsNoTracking()
            .Where(currentClient => currentClient.Id == clientId)
            .Select(currentClient => new InvoiceClientDto(
                currentClient.Id,
                currentClient.Name,
                currentClient.Email))
            .FirstOrDefaultAsync(cancellationToken);

        return client ?? throw new NotFoundException(nameof(Client), clientId);
    }

    private static Invoice CreateDuplicateInvoice(
        Guid userId,
        Guid clientId,
        string invoiceNumber,
        DateOnly issueDate,
        DateOnly dueDate,
        SourceInvoiceSnapshot sourceInvoice)
    {
        return Invoice.Create(
            userId,
            clientId,
            invoiceNumber,
            issueDate,
            dueDate,
            sourceInvoice.Currency,
            sourceInvoice.Subtotal,
            sourceInvoice.TaxPercent,
            sourceInvoice.TaxAmount,
            sourceInvoice.Discount,
            sourceInvoice.Total,
            sourceInvoice.Notes);
    }

    private async Task LogDuplicateAsync(
        Guid userId,
        SourceInvoiceSnapshot sourceInvoice,
        Invoice duplicate,
        CancellationToken cancellationToken)
    {
        await auditService.LogAsync(
            AuditConstants.Entities.Invoice,
            duplicate.Id,
            AuditConstants.Actions.Duplicated,
            tenantContext.TenantId,
            userId,
            oldValues: sourceInvoice,
            newValues: ToAuditSnapshot(sourceInvoice.Id, duplicate),
            ipAddress: clientContext.IpAddress,
            userAgent: clientContext.DeviceInfo,
            cancellationToken: cancellationToken);
    }

    private static List<InvoiceItem> BuildItems(
        Guid invoiceId,
        IReadOnlyList<SourceInvoiceItemSnapshot> sourceItems)
    {
        return sourceItems
            .Select((item, index) => InvoiceItem.Create(
                invoiceId,
                item.Description,
                item.Quantity,
                item.UnitPrice,
                index))
            .ToList();
    }

    private static DateOnly ResolveDueDate(SourceInvoiceSnapshot sourceInvoice, DateOnly issueDate)
    {
        var offsetDays = sourceInvoice.DueDate.DayNumber - sourceInvoice.IssueDate.DayNumber;
        return offsetDays <= 0 ? issueDate : issueDate.AddDays(offsetDays);
    }

    private static InvoiceDetailDto ToDto(
        Invoice invoice,
        InvoiceClientDto client,
        IReadOnlyList<InvoiceItem> items)
    {
        return new InvoiceDetailDto(
            invoice.Id,
            invoice.InvoiceNumber,
            invoice.Status,
            client,
            items.OrderBy(item => item.SortOrder)
                .Select(item => new InvoiceItemDto(
                    item.Id,
                    item.Description,
                    item.Quantity,
                    item.UnitPrice,
                    item.Amount,
                    item.SortOrder))
                .ToList(),
            invoice.IssueDate,
            invoice.DueDate,
            invoice.Currency,
            invoice.Subtotal,
            invoice.TaxPercent,
            invoice.TaxAmount,
            invoice.Discount,
            invoice.Total,
            invoice.Notes,
            invoice.SentAt,
            invoice.ViewedAt,
            invoice.PaidAt,
            invoice.CancelledAt);
    }

    private static object ToAuditSnapshot(Guid duplicatedFrom, Invoice invoice)
    {
        return new
        {
            duplicatedFrom,
            invoice.InvoiceNumber,
            invoice.ClientId,
            invoice.Status,
            invoice.IssueDate,
            invoice.DueDate,
            invoice.Currency,
            invoice.Subtotal,
            invoice.TaxPercent,
            invoice.TaxAmount,
            invoice.Discount,
            invoice.Total
        };
    }

    private sealed record SourceInvoiceSnapshot(
        Guid Id,
        Guid ClientId,
        string InvoiceNumber,
        DateOnly IssueDate,
        DateOnly DueDate,
        string Currency,
        decimal Subtotal,
        decimal TaxPercent,
        decimal TaxAmount,
        decimal Discount,
        decimal Total,
        string? Notes,
        string Status);

    private sealed record SourceInvoiceItemSnapshot(
        string Description,
        decimal Quantity,
        decimal UnitPrice);
}
