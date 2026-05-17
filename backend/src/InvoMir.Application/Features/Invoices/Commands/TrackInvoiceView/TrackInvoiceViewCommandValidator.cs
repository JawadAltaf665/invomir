namespace InvoMir.Application.Features.Invoices.Commands.TrackInvoiceView;

public sealed class TrackInvoiceViewCommandValidator : AbstractValidator<TrackInvoiceViewCommand>
{
    public TrackInvoiceViewCommandValidator()
    {
        RuleFor(command => command.Token)
            .NotEmpty().WithMessage("Tracking token is required.")
            .MaximumLength(128).WithMessage("Tracking token is invalid.");
    }
}
