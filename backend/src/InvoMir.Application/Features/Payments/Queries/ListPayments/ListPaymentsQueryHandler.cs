namespace InvoMir.Application.Features.Payments.Queries.ListPayments;

public sealed class ListPaymentsQueryHandler(IAppDbContext context)
    : IRequestHandler<ListPaymentsQuery, PaymentHistoryDto>
{
    private const int DefaultPage = 1;
    private const int DefaultLimit = 20;
    private const int MaxLimit = 100;

    public async Task<PaymentHistoryDto> Handle(
        ListPaymentsQuery request,
        CancellationToken cancellationToken)
    {
        var page = request.Page < DefaultPage ? DefaultPage : request.Page;
        var limit = request.Limit <= 0 ? DefaultLimit : Math.Min(request.Limit, MaxLimit);
        var status = NormalizeStatus(request.Status);

        var query = context.Payments.AsNoTracking();

        if (status is null)
            query = query.Where(payment => payment.Status == PaymentConstants.Statuses.Completed);
        else if (status != "all")
            query = query.Where(payment => payment.Status == status);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(payment => payment.PaidAt)
            .ThenByDescending(payment => payment.CreationTime)
            .Select(payment => new PaymentHistoryItemDto(
                payment.Id,
                payment.InvoiceId,
                payment.Invoice.InvoiceNumber,
                payment.Invoice.Client.Id,
                payment.Invoice.Client.Name,
                payment.Amount,
                payment.Currency,
                payment.Method,
                payment.Status,
                payment.PaidAt,
                payment.StripeChargeId,
                payment.StripePaymentIntentId,
                payment.Note))
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(cancellationToken);

        return new PaymentHistoryDto(
            items,
            page,
            limit,
            totalCount,
            totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)limit));
    }

    private static string? NormalizeStatus(string? status)
    {
        return string.IsNullOrWhiteSpace(status)
            ? null
            : status.Trim().ToLowerInvariant();
    }
}
