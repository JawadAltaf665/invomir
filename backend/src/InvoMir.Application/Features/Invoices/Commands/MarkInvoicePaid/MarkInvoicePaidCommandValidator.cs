namespace InvoMir.Application.Features.Invoices.Commands.MarkInvoicePaid;

public sealed class MarkInvoicePaidCommandValidator : AbstractValidator<MarkInvoicePaidCommand>
{
    public MarkInvoicePaidCommandValidator()
    {
        RuleFor(command => command.Id)
            .NotEmpty().WithMessage("Invoice id is required.");

        RuleFor(command => command.PaidAt)
            .Must(paidAt => paidAt is null || ToUtc(paidAt.Value) <= DateTime.UtcNow.AddMinutes(1))
            .WithMessage("Paid at cannot be in the future.");

        RuleFor(command => command.Method)
            .Must(method => string.IsNullOrWhiteSpace(method) ||
                PaymentConstants.Methods.Manual.Contains(method.Trim().ToLowerInvariant()))
            .WithMessage("Payment method must be cash, bank_transfer, cheque, or other.");

        RuleFor(command => command.Note)
            .MaximumLength(1000).WithMessage("Payment note cannot exceed 1000 characters.");
    }

    private static DateTime ToUtc(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
    }
}
