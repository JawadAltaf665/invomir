namespace InvoMir.Application.Features.Invoices.Queries.GetInvoice;

public sealed class GetInvoiceQueryHandler(IAppDbContext context)
    : IRequestHandler<GetInvoiceQuery, InvoiceDetailDto>
{
    public async Task<InvoiceDetailDto> Handle(
        GetInvoiceQuery request,
        CancellationToken cancellationToken)
    {
        var invoice = await context.Invoices
            .AsNoTracking()
            .Where(currentInvoice => currentInvoice.Id == request.Id)
            .Select(currentInvoice => new InvoiceDetailDto(
                currentInvoice.Id,
                currentInvoice.InvoiceNumber,
                currentInvoice.Status,
                new InvoiceClientDto(
                    currentInvoice.Client.Id,
                    currentInvoice.Client.Name,
                    currentInvoice.Client.Email),
                currentInvoice.Items
                    .OrderBy(item => item.SortOrder)
                    .Select(item => new InvoiceItemDto(
                        item.Id,
                        item.Description,
                        item.Quantity,
                        item.UnitPrice,
                        item.Amount,
                        item.SortOrder))
                    .ToList(),
                currentInvoice.IssueDate,
                currentInvoice.DueDate,
                currentInvoice.Currency,
                currentInvoice.Subtotal,
                currentInvoice.TaxPercent,
                currentInvoice.TaxAmount,
                currentInvoice.Discount,
                currentInvoice.Total,
                currentInvoice.Notes,
                currentInvoice.SentAt,
                currentInvoice.ViewedAt,
                currentInvoice.PaidAt,
                currentInvoice.CancelledAt))
            .FirstOrDefaultAsync(cancellationToken);

        return invoice ?? throw new NotFoundException(nameof(Invoice), request.Id);
    }
}
