using System.Text.Json.Serialization;

namespace InvoMir.Application.Features.Invoices.Commands.SendInvoice;

public sealed record SendInvoiceCommand : IRequest<InvoiceSendResultDto>
{
    public Guid Id { get; init; }
    public string? Message { get; init; }

    [JsonPropertyName("cc_self")]
    public bool CcSelf { get; init; }
}
