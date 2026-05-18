namespace InvoMir.Application.Features.Payments.Queries.GetPaymentPage;

public sealed record GetPaymentPageQuery(string Token) : IRequest<PaymentPageDto>;
