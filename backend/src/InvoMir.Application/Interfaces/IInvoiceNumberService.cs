namespace InvoMir.Application.Interfaces;

public interface IInvoiceNumberService
{
    Task<string> GenerateNextAsync(Guid tenantId, CancellationToken cancellationToken);
}
