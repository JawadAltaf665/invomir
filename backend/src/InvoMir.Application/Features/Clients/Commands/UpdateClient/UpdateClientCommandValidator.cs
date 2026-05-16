namespace InvoMir.Application.Features.Clients.Commands.UpdateClient;

public sealed class UpdateClientCommandValidator : AbstractValidator<UpdateClientCommand>
{
    public UpdateClientCommandValidator()
    {
        RuleFor(command => command.Id)
            .NotEmpty().WithMessage("Client id is required.");

        RuleFor(command => command.Name)
            .NotEmpty()
            .MaximumLength(200)
            .When(command => command.Name is not null);

        RuleFor(command => command.Email)
            .NotEmpty()
            .EmailAddress().WithMessage("Invalid client email format.")
            .MaximumLength(255)
            .When(command => command.Email is not null);

        RuleFor(command => command.Phone).MaximumLength(50);
        RuleFor(command => command.Company).MaximumLength(200);
        RuleFor(command => command.TaxId).MaximumLength(100);
    }
}
