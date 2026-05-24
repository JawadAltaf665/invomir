using InvoMir.Application.Features.Invoices;

namespace InvoMir.Application.Features.Invoices.Commands.CreateInvoice;

public sealed class CreateInvoiceCommandHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    ITenantContext tenantContext,
    IClientContext clientContext,
    IAuditService auditService,
    IInvoiceNumberService invoiceNumberService)
    : IRequestHandler<CreateInvoiceCommand, InvoiceDetailDto>
{
    public async Task<InvoiceDetailDto> Handle(
        CreateInvoiceCommand request,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var client = await context.Clients
            .AsNoTracking()
            .Where(currentClient => currentClient.Id == request.ClientId)
            .Select(currentClient => new InvoiceClientDto(
                currentClient.Id,
                currentClient.Name,
                currentClient.Email))
            .FirstOrDefaultAsync(cancellationToken);

        if (client is null)
            throw new NotFoundException(nameof(Client), request.ClientId);

        var userSettings = await context.Users
            .AsNoTracking()
            .Where(user => user.Id == userId)
            .Select(user => new { user.Currency, user.TaxPercent })
            .FirstOrDefaultAsync(cancellationToken);

        if (userSettings is null)
            throw new UnauthorizedAccessException("User context is not available.");

        var issueDate = DateOnly.FromDateTime(DateTime.UtcNow);
        var dueDate = InvoiceDraftCalculator.ResolveDueDate(
            issueDate,
            request.DueDate,
            NormalizeOptional(request.PaymentTerms));

        if (dueDate < issueDate)
            throw new BadRequestException("Due date must be on or after issue date.");

        var currency = NormalizeInvoiceCurrency(request.Currency, userSettings.Currency);
        var taxPercent = request.TaxPercent ?? userSettings.TaxPercent;
        var totals = InvoiceDraftCalculator.CalculateTotals(request.Items, taxPercent, request.Discount);
        var invoiceNumber = await invoiceNumberService.GenerateNextAsync(tenantContext.TenantId, cancellationToken);

        var invoice = Invoice.Create(
            userId,
            request.ClientId,
            invoiceNumber,
            issueDate,
            dueDate,
            currency,
            totals.Subtotal,
            totals.TaxPercent,
            totals.TaxAmount,
            totals.DiscountAmount,
            totals.Total,
            request.Notes);

        context.Invoices.Add(invoice);
        var items = BuildItems(invoice.Id, request.Items);
        foreach (var item in items)
            context.InvoiceItems.Add(item);

        await context.SaveChangesAsync(cancellationToken);

        await auditService.LogAsync(
            AuditConstants.Entities.Invoice,
            invoice.Id,
            AuditConstants.Actions.Created,
            tenantContext.TenantId,
            userId,
            newValues: ToAuditSnapshot(invoice),
            ipAddress: clientContext.IpAddress,
            userAgent: clientContext.DeviceInfo,
            cancellationToken: cancellationToken);

        return ToDto(invoice, client, items);
    }

    private static List<InvoiceItem> BuildItems(Guid invoiceId, IReadOnlyList<InvoiceItemInputDto> items)
    {
        return items
            .Select((item, index) => InvoiceItem.Create(
                invoiceId,
                item.Description,
                item.Quantity,
                item.UnitPrice,
                index))
            .ToList();
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
            invoice.CancelledAt,
            invoice.RemindersEnabled);
    }

    private static object ToAuditSnapshot(Invoice invoice)
    {
        return new
        {
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

    private static string NormalizeInvoiceCurrency(string? requestedCurrency, string defaultCurrency)
    {
        var currency = string.IsNullOrWhiteSpace(requestedCurrency)
            ? defaultCurrency
            : requestedCurrency;

        return currency.ToUpperInvariant().Trim();
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
