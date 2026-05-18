namespace InvoMir.Application.Features.Reports.Queries.GetReportExport;

public sealed class GetReportExportQueryValidator : AbstractValidator<GetReportExportQuery>
{
    private static readonly string[] Formats = ["csv", "pdf"];

    public GetReportExportQueryValidator()
    {
        RuleFor(query => query.Format)
            .NotEmpty().WithMessage("Export format is required.")
            .Must(format => format is not null && Formats.Contains(format.Trim().ToLowerInvariant()))
            .WithMessage("Export format must be csv or pdf.");

        RuleFor(query => query.From)
            .Must(from => from != default)
            .WithMessage("From date is required.");

        RuleFor(query => query.To)
            .Must(to => to != default)
            .WithMessage("To date is required.");

        RuleFor(query => query)
            .Must(query => query.To >= query.From)
            .WithMessage("To date must be on or after from date.");

        RuleFor(query => query)
            .Must(query => query.From == default || query.To == default || query.To.DayNumber - query.From.DayNumber <= 366)
            .WithMessage("Report date range cannot exceed 366 days.");

        RuleFor(query => query.Status)
            .Must(status => string.IsNullOrWhiteSpace(status) ||
                InvoiceConstants.Statuses.All.Contains(status.Trim().ToLowerInvariant()))
            .WithMessage("Status must be draft, sent, viewed, paid, overdue, or cancelled.");
    }
}
