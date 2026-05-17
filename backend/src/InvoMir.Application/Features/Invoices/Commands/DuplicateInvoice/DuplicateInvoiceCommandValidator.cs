namespace InvoMir.Application.Features.Invoices.Commands.DuplicateInvoice;

public sealed class DuplicateInvoiceCommandValidator : AbstractValidator<DuplicateInvoiceCommand>
{
    public DuplicateInvoiceCommandValidator()
    {
        RuleFor(command => command.Id)
            .NotEmpty().WithMessage("Source invoice is required.");

        RuleFor(command => command.ClientId)
            .Must(clientId => clientId is null || clientId.Value != Guid.Empty)
            .WithMessage("Client is invalid.");
    }
}
