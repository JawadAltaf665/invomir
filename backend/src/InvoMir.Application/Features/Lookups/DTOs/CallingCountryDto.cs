namespace InvoMir.Application.Features.Lookups.DTOs;

public sealed record CallingCountryDto(
    string Iso2,
    string Name,
    string DialCode);
