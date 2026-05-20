namespace InvoMir.Shared.Constants;

public static class AuthConstants
{
    public const string RefreshTokenCookieName = "refresh_token";

    public static class Claims
    {
        public const string UserId = "user_id";
        public const string Subject = "sub";
        public const string TenantId = "tenant_id";
        public const string OrganizationId = "organization_id";
        public const string FirstName = "first_name";
        public const string Plan = "plan";
        public const string IsAdmin = "isAdmin";
        public const string Role = "role";
        public const string Permission = "permission";
    }

    public static class Policies
    {
        public const string Admin = "AdminOnly";
        public const string PermissionPrefix = "Permission:";
    }

    public static class Roles
    {
        public const string SystemAdmin = "system_admin";
        public const string Owner = "owner";
        public const string Admin = "admin";
        public const string Member = "member";
        public const string Accountant = "accountant";
        public const string Viewer = "viewer";
    }

    public static class Plans
    {
        public const string Free = "free";
        public const string Starter = "starter";
        public const string Professional = "professional";
        public const string Business = "business";

        public static readonly string[] All =
        [
            Free,
            Starter,
            Professional,
            Business
        ];

        public static readonly string[] Paid =
        [
            Starter,
            Professional,
            Business
        ];
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
