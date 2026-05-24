namespace InvoMir.Application.Features.Users.Commands.UploadCurrentUserProfilePicture;

public sealed record UploadCurrentUserProfilePictureCommand(
    string FileName,
    string ContentType,
    byte[] Content) : IRequest<UserProfilePictureDto>;
