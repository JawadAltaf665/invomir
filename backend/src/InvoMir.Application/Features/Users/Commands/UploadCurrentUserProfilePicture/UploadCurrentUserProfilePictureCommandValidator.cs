namespace InvoMir.Application.Features.Users.Commands.UploadCurrentUserProfilePicture;

public sealed class UploadCurrentUserProfilePictureCommandValidator
    : AbstractValidator<UploadCurrentUserProfilePictureCommand>
{
    private const int MaxProfilePictureBytes = 2 * 1024 * 1024;

    private static readonly string[] AllowedContentTypes =
    [
        "image/png",
        "image/jpeg",
        "image/webp"
    ];

    private static readonly string[] AllowedExtensions =
    [
        ".png",
        ".jpg",
        ".jpeg",
        ".webp"
    ];

    public UploadCurrentUserProfilePictureCommandValidator()
    {
        RuleFor(command => command.FileName)
            .NotEmpty().WithMessage("Profile picture file name is required.")
            .MaximumLength(255).WithMessage("Profile picture file name must not exceed 255 characters.")
            .Must(HaveAllowedExtension)
            .WithMessage("Profile picture must be a PNG, JPG, or WEBP file.");

        RuleFor(command => command.ContentType)
            .NotEmpty().WithMessage("Profile picture content type is required.")
            .Must(contentType => AllowedContentTypes.Contains(contentType, StringComparer.OrdinalIgnoreCase))
            .WithMessage("Profile picture must be a PNG, JPG, or WEBP file.");

        RuleFor(command => command.Content)
            .NotEmpty().WithMessage("Profile picture file is required.")
            .Must(content => content.Length <= MaxProfilePictureBytes)
            .WithMessage("Profile picture file must not exceed 2MB.");
    }

    private static bool HaveAllowedExtension(string fileName)
    {
        var extension = Path.GetExtension(fileName);
        return AllowedExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase);
    }
}
