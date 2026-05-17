namespace InvoMir.Application.Features.Payments.Queries.ListPayments;

public sealed record ListPaymentsQuery(
    string? Status,
    int Page,
    int Limit) : IRequest<PaymentHistoryDto>;
