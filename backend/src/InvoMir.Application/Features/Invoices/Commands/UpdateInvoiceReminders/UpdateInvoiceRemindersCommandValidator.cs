namespace InvoMir.Application.Features.Invoices.Commands.UpdateInvoiceReminders;

public sealed class UpdateInvoiceRemindersCommandValidator : AbstractValidator<UpdateInvoiceRemindersCommand>
{
    public UpdateInvoiceRemindersCommandValidator()
    {
        RuleFor(command => command.Id)
            .NotEmpty().WithMessage("Invoice id is required.");

        RuleFor(command => command.Enabled)
            .NotNull().WithMessage("Reminder enabled flag is required.");
    }
}
