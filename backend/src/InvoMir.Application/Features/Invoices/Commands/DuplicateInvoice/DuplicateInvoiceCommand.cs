using System.Text.Json.Serialization;

namespace InvoMir.Application.Features.Invoices.Commands.DuplicateInvoice;

public sealed record DuplicateInvoiceCommand : IRequest<InvoiceDetailDto>
{
    public Guid Id { get; init; }

    [JsonPropertyName("client_id")]
    public Guid? ClientId { get; init; }

    [JsonPropertyName("due_date")]
    public DateOnly? DueDate { get; init; }
}
