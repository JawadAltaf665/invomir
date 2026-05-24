namespace InvoMir.Application.Features.Clients.Commands.CreateClient;

public sealed class CreateClientCommandValidator : AbstractValidator<CreateClientCommand>
{
    private const int PhoneMaxLength = 16;
    private const string InternationalPhonePattern = @"^\+[1-9]\d{4,14}$";

    public CreateClientCommandValidator()
    {
        RuleFor(command => command.Name)
            .NotEmpty().WithMessage("Client name is required.")
            .MaximumLength(200);

        RuleFor(command => command.Email)
            .NotEmpty().WithMessage("Client email is required.")
            .EmailAddress().WithMessage("Invalid client email format.")
            .MaximumLength(255);

        RuleFor(command => command.Phone)
            .MaximumLength(PhoneMaxLength)
            .Matches(InternationalPhonePattern)
            .WithMessage("Client phone must be in international numeric format, e.g. +923001234567.")
            .When(command => !string.IsNullOrWhiteSpace(command.Phone));

        RuleFor(command => command.Company).MaximumLength(200);
        RuleFor(command => command.TaxId).MaximumLength(100);
    }
}
