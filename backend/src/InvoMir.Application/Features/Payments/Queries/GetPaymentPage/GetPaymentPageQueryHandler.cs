namespace InvoMir.Application.Features.Payments.Queries.GetPaymentPage;

public sealed class GetPaymentPageQueryHandler(
    IAppDbContext context,
    IStripeService stripeService)
    : IRequestHandler<GetPaymentPageQuery, PaymentPageDto>
{
    private const string PaidMessage = "This invoice has already been paid.";
    private const string CancelledMessage = "This invoice is no longer payable.";

    public async Task<PaymentPageDto> Handle(
        GetPaymentPageQuery request,
        CancellationToken cancellationToken)
    {
        var token = request.Token.Trim();
        var snapshot = await context.Invoices
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(invoice =>
                invoice.PaymentLinkToken == token &&
                !invoice.IsDeleted &&
                !invoice.Client.IsDeleted)
            .Select(invoice => new PaymentPageSnapshot(
                invoice.Id,
                invoice.TenantId,
                invoice.PaymentLinkToken!,
                invoice.InvoiceNumber,
                invoice.Status,
                invoice.DueDate,
                invoice.Total,
                invoice.Currency,
                invoice.Client.Name,
                invoice.UserId))
            .FirstOrDefaultAsync(cancellationToken);

        if (snapshot is null)
            throw new NotFoundException(nameof(Invoice), token);

        var issuer = await GetIssuerAsync(snapshot, cancellationToken);
        var pageInvoice = new PaymentPageInvoiceDto(
            snapshot.InvoiceNumber,
            issuer.BusinessName,
            issuer.LogoUrl,
            snapshot.ClientName,
            snapshot.Total,
            snapshot.Currency,
            snapshot.DueDate,
            snapshot.Status);

        if (snapshot.Status == InvoiceConstants.Statuses.Paid)
            return new PaymentPageDto(pageInvoice, null, PaidMessage);

        if (snapshot.Status == InvoiceConstants.Statuses.Cancelled)
            return new PaymentPageDto(pageInvoice, null, CancelledMessage);

        var checkoutSession = await stripeService.CreateCheckoutSessionAsync(
            new StripeCheckoutSessionRequestDto(
                snapshot.InvoiceId,
                snapshot.TenantId,
                snapshot.PaymentLinkToken,
                snapshot.InvoiceNumber,
                snapshot.Total,
                snapshot.Currency),
            cancellationToken);

        return new PaymentPageDto(pageInvoice, checkoutSession.Url, null);
    }

    private async Task<InvoiceIssuerDto> GetIssuerAsync(
        PaymentPageSnapshot snapshot,
        CancellationToken cancellationToken)
    {
        var issuer = await context.Users
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(user =>
                user.Id == snapshot.UserId &&
                user.TenantId == snapshot.TenantId &&
                !user.IsDeleted)
            .Join(
                context.Tenants.IgnoreQueryFilters().AsNoTracking().Where(tenant => !tenant.IsDeleted),
                user => user.TenantId,
                tenant => tenant.Id,
                (user, tenant) => new InvoiceIssuerDto(
                    tenant.Name,
                    user.Email,
                    user.LogoUrl))
            .FirstOrDefaultAsync(cancellationToken);

        return issuer ?? new InvoiceIssuerDto("InvoMir", null, null);
    }

    private sealed record PaymentPageSnapshot(
        Guid InvoiceId,
        Guid TenantId,
        string PaymentLinkToken,
        string InvoiceNumber,
        string Status,
        DateOnly DueDate,
        decimal Total,
        string Currency,
        string ClientName,
        Guid UserId);
}
