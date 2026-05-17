using System.Globalization;
using System.Reflection;
using DinkToPdf;
using DinkToPdf.Contracts;
using Microsoft.Extensions.Hosting;

namespace InvoMir.Infrastructure.Services;

public sealed class DinkToPdfService : IPdfService
{
    private const string TemplateResourceName = "InvoMir.Infrastructure.Templates.InvoicePdfTemplate.html";
    private const string DefaultBusinessName = "InvoMir";
    private static readonly CultureInfo PdfCulture = CultureInfo.InvariantCulture;
    private readonly IConverter _converter;
    private readonly IHostEnvironment _environment;

    public DinkToPdfService(
        IConverter converter,
        IHostEnvironment environment)
    {
        _converter = converter;
        _environment = environment;
    }

    public async Task<byte[]> GenerateInvoicePdfAsync(
        InvoiceDetailDto invoice,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var html = await RenderHtmlAsync(invoice, cancellationToken);
        return await GeneratePdfAsync(html, cancellationToken);
    }

    public async Task<byte[]> GeneratePdfAsync(
        string htmlContent,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var document = new HtmlToPdfDocument
        {
            GlobalSettings = new GlobalSettings
            {
                ColorMode = ColorMode.Color,
                Orientation = Orientation.Portrait,
                PaperSize = PaperKind.A4,
                Margins = new MarginSettings { Top = 12, Bottom = 12, Left = 10, Right = 10 },
                DocumentTitle = "InvoMir PDF"
            },
            Objects =
            {
                new ObjectSettings
                {
                    HtmlContent = htmlContent,
                    WebSettings = { DefaultEncoding = "utf-8", LoadImages = true }
                }
            }
        };

        return await Task.Run(() => _converter.Convert(document), cancellationToken);
    }

    private async Task<string> RenderHtmlAsync(
        InvoiceDetailDto invoice,
        CancellationToken cancellationToken)
    {
        var template = await LoadTemplateAsync(cancellationToken);
        var issuer = invoice.Issuer;
        var businessName = string.IsNullOrWhiteSpace(issuer?.BusinessName)
            ? DefaultBusinessName
            : issuer.BusinessName.Trim();

        var replacements = new Dictionary<string, string>
        {
            ["{{LogoHtml}}"] = await BuildLogoHtmlAsync(issuer, businessName, cancellationToken),
            ["{{BusinessName}}"] = Html(businessName),
            ["{{BusinessEmail}}"] = Html(issuer?.Email),
            ["{{InvoiceNumber}}"] = Html(invoice.InvoiceNumber),
            ["{{InvoiceStatus}}"] = Html(invoice.Status.ToUpperInvariant()),
            ["{{IssueDate}}"] = Html(FormatDate(invoice.IssueDate)),
            ["{{DueDate}}"] = Html(FormatDate(invoice.DueDate)),
            ["{{ClientName}}"] = Html(invoice.Client.Name),
            ["{{ClientDetails}}"] = BuildClientDetailsHtml(invoice.Client),
            ["{{LineItems}}"] = BuildLineItemRows(invoice),
            ["{{Subtotal}}"] = Html(FormatMoney(invoice.Subtotal, invoice.Currency)),
            ["{{Discount}}"] = Html(FormatMoney(invoice.DiscountAmount, invoice.Currency)),
            ["{{TaxLabel}}"] = Html($"Tax ({invoice.TaxPercent:0.##}%)"),
            ["{{TaxAmount}}"] = Html(FormatMoney(invoice.TaxAmount, invoice.Currency)),
            ["{{Total}}"] = Html(FormatMoney(invoice.Total, invoice.Currency)),
            ["{{Notes}}"] = BuildNotesHtml(invoice.Notes),
            ["{{GeneratedAt}}"] = Html(DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm 'UTC'", PdfCulture))
        };

        foreach (var replacement in replacements)
            template = template.Replace(replacement.Key, replacement.Value, StringComparison.Ordinal);

        return template;
    }

    private static async Task<string> LoadTemplateAsync(CancellationToken cancellationToken)
    {
        var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream(TemplateResourceName)
            ?? throw new InvalidOperationException("Invoice PDF template was not found.");

        await using (stream)
        using (var reader = new StreamReader(stream))
        {
            return await reader.ReadToEndAsync(cancellationToken);
        }
    }

    private async Task<string> BuildLogoHtmlAsync(
        InvoiceIssuerDto? issuer,
        string businessName,
        CancellationToken cancellationToken)
    {
        var logoSource = await ResolveLogoSourceAsync(issuer?.LogoUrl, cancellationToken);
        if (!string.IsNullOrWhiteSpace(logoSource))
        {
            return $"<img class=\"brand-logo\" src=\"{Html(logoSource)}\" alt=\"{Html(businessName)} logo\" />";
        }

        return $"<div class=\"brand-mark\">{Html(BuildInitials(businessName))}</div>";
    }

    private async Task<string?> ResolveLogoSourceAsync(
        string? logoUrl,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(logoUrl))
            return null;

        var normalizedLogoUrl = logoUrl.Trim();
        if (normalizedLogoUrl.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
            return normalizedLogoUrl;

        if (Uri.TryCreate(normalizedLogoUrl, UriKind.Absolute, out var absoluteUri) &&
            absoluteUri.Scheme is "http" or "https")
        {
            return normalizedLogoUrl;
        }

        if (!normalizedLogoUrl.StartsWith("/", StringComparison.Ordinal))
            return null;

        var webRootPath = Path.GetFullPath(Path.Combine(_environment.ContentRootPath, "wwwroot"));
        var webRootWithSeparator = webRootPath.EndsWith(Path.DirectorySeparatorChar)
            ? webRootPath
            : webRootPath + Path.DirectorySeparatorChar;

        var relativePath = normalizedLogoUrl
            .TrimStart('/')
            .Replace('/', Path.DirectorySeparatorChar)
            .Replace('\\', Path.DirectorySeparatorChar);
        var fullPath = Path.GetFullPath(Path.Combine(webRootPath, relativePath));

        if (!fullPath.StartsWith(webRootWithSeparator, StringComparison.OrdinalIgnoreCase) ||
            !File.Exists(fullPath))
        {
            return null;
        }

        var bytes = await File.ReadAllBytesAsync(fullPath, cancellationToken);
        return $"data:{GetMimeType(fullPath)};base64,{Convert.ToBase64String(bytes)}";
    }

    private static string BuildClientDetailsHtml(InvoiceClientDto client)
    {
        var builder = new StringBuilder();

        AppendIfPresent(builder, client.Company);
        AppendIfPresent(builder, client.Address, preserveLineBreaks: true);
        AppendIfPresent(builder, client.Email);
        AppendIfPresent(builder, client.Phone);
        AppendIfPresent(builder, client.TaxId, "Tax ID: ");

        return builder.Length == 0
            ? "<span class=\"muted\">No billing details supplied.</span>"
            : builder.ToString();
    }

    private static void AppendIfPresent(
        StringBuilder builder,
        string? value,
        string prefix = "",
        bool preserveLineBreaks = false)
    {
        if (string.IsNullOrWhiteSpace(value))
            return;

        if (builder.Length > 0)
            builder.Append("<br />");

        var encodedValue = Html(value.Trim());
        if (preserveLineBreaks)
        {
            encodedValue = encodedValue
                .Replace("\r\n", "<br />", StringComparison.Ordinal)
                .Replace("\n", "<br />", StringComparison.Ordinal)
                .Replace("\r", "<br />", StringComparison.Ordinal);
        }

        builder.Append(Html(prefix));
        builder.Append(encodedValue);
    }

    private static string BuildLineItemRows(InvoiceDetailDto invoice)
    {
        var builder = new StringBuilder();

        foreach (var item in invoice.Items.OrderBy(item => item.SortOrder))
        {
            builder.AppendLine("<tr>");
            builder.Append("<td class=\"item-description\">").Append(Html(item.Description)).AppendLine("</td>");
            builder.Append("<td class=\"numeric\">").Append(Html(FormatQuantity(item.Quantity))).AppendLine("</td>");
            builder.Append("<td class=\"numeric\">").Append(Html(FormatMoney(item.UnitPrice, invoice.Currency))).AppendLine("</td>");
            builder.Append("<td class=\"numeric strong\">").Append(Html(FormatMoney(item.Amount, invoice.Currency))).AppendLine("</td>");
            builder.AppendLine("</tr>");
        }

        return builder.ToString();
    }

    private static string BuildNotesHtml(string? notes)
    {
        if (string.IsNullOrWhiteSpace(notes))
            return "<span class=\"muted\">Thank you for your business.</span>";

        return Html(notes.Trim())
            .Replace("\r\n", "<br />", StringComparison.Ordinal)
            .Replace("\n", "<br />", StringComparison.Ordinal)
            .Replace("\r", "<br />", StringComparison.Ordinal);
    }

    private static string BuildInitials(string businessName)
    {
        var letters = businessName
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(word => word.Length > 0)
            .Take(2)
            .Select(word => char.ToUpperInvariant(word[0]))
            .ToArray();

        return letters.Length == 0 ? "IM" : new string(letters);
    }

    private static string FormatDate(DateOnly date)
    {
        return date.ToString("MMM dd, yyyy", PdfCulture);
    }

    private static string FormatMoney(decimal amount, string currency)
    {
        return $"{currency.ToUpperInvariant()} {amount.ToString("N2", PdfCulture)}";
    }

    private static string FormatQuantity(decimal quantity)
    {
        return quantity.ToString("0.##", PdfCulture);
    }

    private static string GetMimeType(string path)
    {
        return Path.GetExtension(path).ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".svg" => "image/svg+xml",
            ".webp" => "image/webp",
            _ => "application/octet-stream"
        };
    }

    private static string Html(string? value)
    {
        return WebUtility.HtmlEncode(value ?? string.Empty);
    }
}
