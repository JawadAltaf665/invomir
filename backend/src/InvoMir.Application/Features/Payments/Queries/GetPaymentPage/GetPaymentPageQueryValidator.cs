namespace InvoMir.Application.Features.Payments.Queries.GetPaymentPage;

public sealed class GetPaymentPageQueryValidator : AbstractValidator<GetPaymentPageQuery>
{
    public GetPaymentPageQueryValidator()
    {
        RuleFor(query => query.Token)
            .NotEmpty().WithMessage("Payment token is required.")
            .MaximumLength(128).WithMessage("Payment token is invalid.");
    }
}
