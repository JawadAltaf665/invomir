namespace InvoMir.Shared.Constants;

public static class AuthConstants
{
    public const string RefreshTokenCookieName = "refresh_token";

    public static class Claims
    {
        public const string UserId = "user_id";
        public const string Subject = "sub";
        public const string TenantId = "tenant_id";
        public const string FirstName = "first_name";
        public const string Plan = "plan";
    }

    public static class Roles
    {
        public const string Owner = "owner";
        public const string Admin = "admin";
        public const string Member = "member";
    }

    public static class Plans
    {
        public const string Free = "free";
    }

    public static readonly string[] SupportedCurrencies =
    [
        "USD",
        "PKR",
        "AED",
        "GBP",
        "EUR",
        "SAR"
    ];
}
