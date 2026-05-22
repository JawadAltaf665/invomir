namespace InvoMir.Application.Features.Clients.Commands.UpdateClient;

public sealed class UpdateClientCommandValidator : AbstractValidator<UpdateClientCommand>
{
    private const int PhoneMaxLength = 16;
    private const string InternationalPhonePattern = @"^\+[1-9]\d{4,14}$";

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

        RuleFor(command => command.Phone)
            .MaximumLength(PhoneMaxLength)
            .Matches(InternationalPhonePattern)
            .WithMessage("Client phone must be in international numeric format, e.g. +923001234567.")
            .When(command => !string.IsNullOrWhiteSpace(command.Phone));

        RuleFor(command => command.Company).MaximumLength(200);
        RuleFor(command => command.TaxId).MaximumLength(100);
    }
}
