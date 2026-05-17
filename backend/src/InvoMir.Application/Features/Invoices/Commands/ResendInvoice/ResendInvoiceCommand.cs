using System.Text.Json.Serialization;

namespace InvoMir.Application.Features.Invoices.Commands.ResendInvoice;

public sealed record ResendInvoiceCommand : IRequest<InvoiceSendResultDto>
{
    public Guid Id { get; init; }
    public string? Message { get; init; }

    [JsonPropertyName("cc_self")]
    public bool CcSelf { get; init; }
}
