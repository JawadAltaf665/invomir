namespace InvoMir.Application.Interfaces;

public interface IGoogleAuthService
{
    bool IsConfigured { get; }

    Task<GoogleUserProfileDto?> VerifyIdTokenAsync(
        string idToken,
        CancellationToken cancellationToken);
}
