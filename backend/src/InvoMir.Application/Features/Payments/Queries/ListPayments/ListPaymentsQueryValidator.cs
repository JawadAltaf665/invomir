namespace InvoMir.Application.Features.Payments.Queries.ListPayments;

public sealed class ListPaymentsQueryValidator : AbstractValidator<ListPaymentsQuery>
{
    public ListPaymentsQueryValidator()
    {
        RuleFor(query => query.Status)
            .Must(status => string.IsNullOrWhiteSpace(status) ||
                status.Trim().Equals("all", StringComparison.OrdinalIgnoreCase) ||
                PaymentConstants.Statuses.All.Contains(status.Trim().ToLowerInvariant()))
            .WithMessage("Payment status must be completed, failed, refunded, or all.");
    }
}
