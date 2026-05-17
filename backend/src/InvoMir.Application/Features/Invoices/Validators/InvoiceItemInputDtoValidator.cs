namespace InvoMir.Application.Features.Invoices.Validators;

public sealed class InvoiceItemInputDtoValidator : AbstractValidator<InvoiceItemInputDto>
{
    public InvoiceItemInputDtoValidator()
    {
        RuleFor(item => item.Description)
            .NotEmpty().WithMessage("Item description is required.")
            .MaximumLength(200);

        RuleFor(item => item.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be greater than zero.");

        RuleFor(item => item.UnitPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Unit price cannot be negative.");
    }
}
