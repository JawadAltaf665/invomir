using InvoMir.Application.Features.Settings.DTOs;

namespace InvoMir.Application.Features.Settings.Queries.GetLanguagePreference;

public sealed record GetLanguagePreferenceQuery : IRequest<LanguagePreferenceDto>;
