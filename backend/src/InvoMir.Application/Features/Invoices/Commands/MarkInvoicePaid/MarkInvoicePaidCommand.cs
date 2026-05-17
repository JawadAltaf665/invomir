using System.Text.Json.Serialization;

namespace InvoMir.Application.Features.Invoices.Commands.MarkInvoicePaid;

public sealed record MarkInvoicePaidCommand : IRequest<InvoicePaymentDto>
{
    public Guid Id { get; init; }

    [JsonPropertyName("paid_at")]
    public DateTime? PaidAt { get; init; }

    public string? Method { get; init; }
    public string? Note { get; init; }
}
