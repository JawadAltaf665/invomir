using System.Security.Cryptography;
using System.Text.RegularExpressions;

namespace InvoMir.Application.Features.Auth.Common;

public static partial class AuthAccountHelper
{
    public static string GenerateSlug(string businessName)
    {
        var slug = businessName.ToLowerInvariant().Trim()
            .Replace(" ", "-", StringComparison.Ordinal)
            .Replace("'", string.Empty, StringComparison.Ordinal)
            .Replace(".", string.Empty, StringComparison.Ordinal);

        slug = SlugUnsafeCharacters().Replace(slug, string.Empty).Trim('-');
        if (string.IsNullOrWhiteSpace(slug))
            slug = "tenant";

        if (slug.Length > 93)
            slug = slug[..93].Trim('-');

        return $"{slug}-{Guid.NewGuid():N}"[..(slug.Length + 7)];
    }

    public static string GenerateVerificationToken()
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(64))
            .Replace("+", "-", StringComparison.Ordinal)
            .Replace("/", "_", StringComparison.Ordinal)
            .Replace("=", string.Empty, StringComparison.Ordinal);
    }

    [GeneratedRegex("[^a-z0-9\\-]")]
    private static partial Regex SlugUnsafeCharacters();
}
