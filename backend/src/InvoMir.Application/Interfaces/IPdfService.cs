namespace InvoMir.Application.Interfaces;

public interface IPdfService
{
    Task<byte[]> GeneratePdfAsync(
        string htmlContent,
        CancellationToken cancellationToken);

    Task<byte[]> GenerateInvoicePdfAsync(
        InvoiceDetailDto invoice,
        CancellationToken cancellationToken);
}
