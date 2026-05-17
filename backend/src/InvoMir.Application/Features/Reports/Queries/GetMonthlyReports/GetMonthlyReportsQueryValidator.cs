namespace InvoMir.Application.Features.Reports.Queries.GetMonthlyReports;

public sealed class GetMonthlyReportsQueryValidator : AbstractValidator<GetMonthlyReportsQuery>
{
    public GetMonthlyReportsQueryValidator()
    {
        RuleFor(query => query.Months)
            .InclusiveBetween(1, 24).WithMessage("Months must be between 1 and 24.");

        RuleFor(query => query.Year)
            .InclusiveBetween(2000, 2100)
            .When(query => query.Year.HasValue)
            .WithMessage("Year must be between 2000 and 2100.");

        RuleFor(query => query.Month)
            .InclusiveBetween(1, 12)
            .When(query => query.Month.HasValue)
            .WithMessage("Month must be between 1 and 12.");

        RuleFor(query => query.Month)
            .Must((query, month) => month is null || query.Year.HasValue)
            .WithMessage("Year is required when month is provided.");
    }
}
