using InvoMir.Application.Features.Settings.DTOs;

namespace InvoMir.Application.Features.Settings.Commands.UpdateLanguagePreference;

public sealed record UpdateLanguagePreferenceCommand(string Language)
    : IRequest<LanguagePreferenceDto>;
