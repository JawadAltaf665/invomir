namespace InvoMir.Application.Features.Lookups.Queries.ListCallingCountries;

public sealed record ListCallingCountriesQuery : IRequest<IReadOnlyList<CallingCountryDto>>;
