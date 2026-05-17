namespace InvoMir.Application.Features.Invoices.Commands.ResendInvoice;

public sealed class ResendInvoiceCommandValidator : AbstractValidator<ResendInvoiceCommand>
{
    public ResendInvoiceCommandValidator()
    {
        RuleFor(command => command.Id)
            .NotEmpty().WithMessage("Invoice id is required.");

        RuleFor(command => command.Message)
            .MaximumLength(1000).WithMessage("Message cannot exceed 1000 characters.");
    }
}
