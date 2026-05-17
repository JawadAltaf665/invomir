namespace InvoMir.Application.Features.Users.Commands.UploadCurrentUserLogo;

public sealed class UploadCurrentUserLogoCommandValidator : AbstractValidator<UploadCurrentUserLogoCommand>
{
    private const int MaxLogoBytes = 2 * 1024 * 1024;

    private static readonly string[] AllowedContentTypes =
    [
        "image/png",
        "image/jpeg",
        "image/svg+xml"
    ];

    private static readonly string[] AllowedExtensions =
    [
        ".png",
        ".jpg",
        ".jpeg",
        ".svg"
    ];

    public UploadCurrentUserLogoCommandValidator()
    {
        RuleFor(command => command.FileName)
            .NotEmpty().WithMessage("Logo file name is required.")
            .MaximumLength(255).WithMessage("Logo file name must not exceed 255 characters.")
            .Must(HaveAllowedExtension)
            .WithMessage("Logo must be a PNG, JPG, or SVG file.");

        RuleFor(command => command.ContentType)
            .NotEmpty().WithMessage("Logo content type is required.")
            .Must(contentType => AllowedContentTypes.Contains(contentType, StringComparer.OrdinalIgnoreCase))
            .WithMessage("Logo must be a PNG, JPG, or SVG file.");

        RuleFor(command => command.Content)
            .NotEmpty().WithMessage("Logo file is required.")
            .Must(content => content.Length <= MaxLogoBytes)
            .WithMessage("Logo file must not exceed 2MB.");
    }

    private static bool HaveAllowedExtension(string fileName)
    {
        var extension = Path.GetExtension(fileName);
        return AllowedExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase);
    }
}
