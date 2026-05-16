namespace InvoMir.Application.Features.Invoices.Validators;

public sealed class DiscountDtoValidator : AbstractValidator<DiscountDto>
{
    public DiscountDtoValidator()
    {
        RuleFor(discount => discount.Type)
            .NotEmpty().WithMessage("Discount type is required.")
            .Must(type => InvoiceConstants.DiscountTypes.All.Contains(type))
            .WithMessage("Discount type must be fixed or percent.");

        RuleFor(discount => discount.Value)
            .GreaterThanOrEqualTo(0).WithMessage("Discount value cannot be negative.");

        RuleFor(discount => discount.Value)
            .LessThanOrEqualTo(100).WithMessage("Percent discount cannot exceed 100.")
            .When(discount => discount.Type == InvoiceConstants.DiscountTypes.Percent);
    }
}
