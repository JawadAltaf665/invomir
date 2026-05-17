namespace InvoMir.Application.Features.Clients.Commands.CreateClient;

public sealed class CreateClientCommandValidator : AbstractValidator<CreateClientCommand>
{
    public CreateClientCommandValidator()
    {
        RuleFor(command => command.Name)
            .NotEmpty().WithMessage("Client name is required.")
            .MaximumLength(200);

        RuleFor(command => command.Email)
            .NotEmpty().WithMessage("Client email is required.")
            .EmailAddress().WithMessage("Invalid client email format.")
            .MaximumLength(255);

        RuleFor(command => command.Phone).MaximumLength(50);
        RuleFor(command => command.Company).MaximumLength(200);
        RuleFor(command => command.TaxId).MaximumLength(100);
    }
}
