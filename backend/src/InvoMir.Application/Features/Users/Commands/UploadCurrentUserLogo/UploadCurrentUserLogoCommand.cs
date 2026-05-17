namespace InvoMir.Application.Features.Users.Commands.UploadCurrentUserLogo;

public sealed record UploadCurrentUserLogoCommand(
    string FileName,
    string ContentType,
    byte[] Content) : IRequest<UserLogoDto>;
