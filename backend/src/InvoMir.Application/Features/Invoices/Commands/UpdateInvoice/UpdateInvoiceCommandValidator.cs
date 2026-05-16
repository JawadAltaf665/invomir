using InvoMir.Application.Features.Invoices.Validators;

namespace InvoMir.Application.Features.Invoices.Commands.UpdateInvoice;

public sealed class UpdateInvoiceCommandValidator : AbstractValidator<UpdateInvoiceCommand>
{
    public UpdateInvoiceCommandValidator()
    {
        RuleFor(command => command.Id)
            .NotEmpty().WithMessage("Invoice id is required.");

        RuleFor(command => command.ClientId)
            .NotEmpty().WithMessage("Client is required.");

        RuleFor(command => command)
            .Must(command => command.DueDate.HasValue || !string.IsNullOrWhiteSpace(command.PaymentTerms))
            .WithMessage("Due date or payment terms are required.");

        RuleFor(command => command.PaymentTerms)
            .Must(paymentTerms => paymentTerms is null || InvoiceConstants.PaymentTerms.All.Contains(paymentTerms))
            .WithMessage("Payment terms are invalid.");

        RuleFor(command => command.TaxPercent)
            .InclusiveBetween(0, 100)
            .When(command => command.TaxPercent.HasValue)
            .WithMessage("Tax percent must be between 0 and 100.");

        RuleFor(command => command.Currency)
            .Length(3).When(command => command.Currency is not null)
            .WithMessage("Currency must be a 3-letter ISO code.")
            .Must(currency => currency is null || AuthConstants.SupportedCurrencies.Contains(currency.ToUpperInvariant()))
            .WithMessage("Currency is not supported.");

        RuleFor(command => command.Discount)
            .SetValidator(new DiscountDtoValidator()!)
            .When(command => command.Discount is not null);

        RuleFor(command => command.Items)
            .NotEmpty().WithMessage("At least one line item is required.")
            .Must(items => items.Count <= 100).WithMessage("Maximum 100 line items per invoice.");

        RuleForEach(command => command.Items)
            .SetValidator(new InvoiceItemInputDtoValidator());
    }
}
