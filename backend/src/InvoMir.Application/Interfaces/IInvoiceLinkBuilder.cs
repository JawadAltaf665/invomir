namespace InvoMir.Application.Interfaces;

public interface IInvoiceLinkBuilder
{
    string BuildPaymentLink(string token);
    string BuildTrackingPixelUrl(string token);
}
