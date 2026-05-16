namespace InvoMir.Application.Features.Auth.Commands.Register;

public sealed record RegisterCommand(
    string Email,
    string Password,
    string BusinessName,
    string FirstName,
    string LastName,
    string Currency = "USD",
    decimal TaxPercent = 0) : IRequest<ApiResponse<AuthTokenDto>>;
