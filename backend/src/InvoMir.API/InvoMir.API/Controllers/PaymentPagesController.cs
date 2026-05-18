namespace InvoMir.API.Controllers;

[ApiController]
[AllowAnonymous]
[Route("pay")]
public sealed class PaymentPagesController(ISender mediator) : ControllerBase
{
    [HttpGet("{token}")]
    [Produces("text/html")]
    [ProducesResponseType(typeof(ContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(
        string token,
        CancellationToken cancellationToken)
    {
        var page = await mediator.Send(new GetPaymentPageQuery(token), cancellationToken);
        return Content(RenderPaymentPage(page), "text/html");
    }

    private static string RenderPaymentPage(PaymentPageDto page)
    {
        var checkoutButton = string.IsNullOrWhiteSpace(page.StripeCheckoutUrl)
            ? $"<p class=\"status\">{Html(page.Message ?? "This invoice is not payable.")}</p>"
            : $"<a class=\"button\" href=\"{Html(page.StripeCheckoutUrl)}\">Pay with card</a>";
        var logoHtml = string.IsNullOrWhiteSpace(page.Invoice.BusinessLogo)
            ? "<div class=\"mark\">IM</div>"
            : $"<img class=\"logo\" src=\"{Html(page.Invoice.BusinessLogo)}\" alt=\"{Html(page.Invoice.BusinessName)} logo\" />";

        return $$"""
            <!doctype html>
            <html lang="en">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <title>Pay {{Html(page.Invoice.Number)}} | InvoMir</title>
              <style>
                body { margin:0; font-family:Arial,sans-serif; background:#f8fafc; color:#111827; }
                main { max-width:680px; margin:0 auto; padding:40px 20px; }
                .panel { background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:28px; box-shadow:0 10px 30px rgba(15,23,42,.06); }
                .brand { display:flex; align-items:center; gap:14px; margin-bottom:28px; }
                .logo { width:48px; height:48px; object-fit:contain; }
                .mark { width:48px; height:48px; display:grid; place-items:center; border-radius:8px; background:#2563eb; color:#fff; font-weight:700; }
                h1 { margin:0; font-size:24px; }
                dl { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:24px 0; }
                dt { color:#6b7280; font-size:13px; }
                dd { margin:4px 0 0; font-weight:700; }
                .total { font-size:28px; }
                .button { display:inline-block; padding:13px 18px; background:#2563eb; color:#fff; border-radius:6px; text-decoration:none; font-weight:700; }
                .status { padding:13px 16px; background:#eef2ff; border-radius:6px; color:#3730a3; }
                @media (max-width:520px) { dl { grid-template-columns:1fr; } }
              </style>
            </head>
            <body>
              <main>
                <section class="panel">
                  <div class="brand">
                    {{logoHtml}}
                    <div>
                      <h1>{{Html(page.Invoice.BusinessName)}}</h1>
                      <div>Invoice {{Html(page.Invoice.Number)}}</div>
                    </div>
                  </div>
                  <dl>
                    <div><dt>Client</dt><dd>{{Html(page.Invoice.ClientName)}}</dd></div>
                    <div><dt>Status</dt><dd>{{Html(page.Invoice.Status)}}</dd></div>
                    <div><dt>Due date</dt><dd>{{Html(page.Invoice.DueDate.ToString("yyyy-MM-dd"))}}</dd></div>
                    <div><dt>Total</dt><dd class="total">{{Html(page.Invoice.Currency)}} {{page.Invoice.Total:0.00}}</dd></div>
                  </dl>
                  {{checkoutButton}}
                </section>
              </main>
            </body>
            </html>
            """;
    }

    private static string Html(string? value)
    {
        return System.Net.WebUtility.HtmlEncode(value ?? string.Empty);
    }
}
