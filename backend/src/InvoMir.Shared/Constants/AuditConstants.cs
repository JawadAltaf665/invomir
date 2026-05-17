namespace InvoMir.Shared.Constants;

public static class AuditConstants
{
    public static class Entities
    {
        public const string User = "User";
        public const string Client = "Client";
        public const string Invoice = "Invoice";
    }

    public static class Actions
    {
        public const string Created = "created";
        public const string Updated = "updated";
        public const string Deleted = "deleted";
        public const string Cancelled = "cancelled";
        public const string Duplicated = "duplicated";
        public const string Login = "login";
        public const string TokenRefreshed = "token_refreshed";
        public const string PasswordResetRequested = "password_reset_requested";
        public const string PasswordReset = "password_reset";
    }
}
