namespace InvoMir.Shared.Constants;

public static class DashboardActionConstants
{
    public static class Ids
    {
        public const string PaymentAccountRequired = "payment-account-required";
    }

    public static class Types
    {
        public const string Info = "info";
        public const string Success = "success";
        public const string Warning = "warning";
        public const string Critical = "critical";

        public static readonly string[] All =
        [
            Info,
            Success,
            Warning,
            Critical
        ];
    }

    public static class Priorities
    {
        public const int PaymentAccountRequired = 100;
        public const int SubscriptionExpiring = 90;
        public const int EmailNotVerified = 80;
        public const int CompanyProfileIncomplete = 70;
        public const int NoClientsCreated = 60;
        public const int ProductAnnouncement = 50;
    }
}
