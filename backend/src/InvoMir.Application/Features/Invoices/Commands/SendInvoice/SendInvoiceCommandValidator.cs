namespace InvoMir.Application.Features.Invoices.Commands.SendInvoice;

public sealed class SendInvoiceCommandValidator : AbstractValidator<SendInvoiceCommand>
{
    public SendInvoiceCommandValidator()
    {
        RuleFor(command => command.Id)
            .NotEmpty().WithMessage("Invoice id is required.");

        RuleFor(command => command.Message)
            .MaximumLength(1000).WithMessage("Message cannot exceed 1000 characters.");
    }
}
