namespace InvoMir.Shared.Constants;

public static class NotificationConstants
{
    public static class Types
    {
        public const string System = "system";
        public const string Invoice = "invoice";
        public const string Payment = "payment";
        public const string Client = "client";
        public const string Subscription = "subscription";
        public const string UserManagement = "user_management";
        public const string Security = "security";
        public const string Reminder = "reminder";

        public static readonly string[] All =
        [
            System,
            Invoice,
            Payment,
            Client,
            Subscription,
            UserManagement,
            Security,
            Reminder
        ];
    }

    public static class Priorities
    {
        public const string Low = "low";
        public const string Medium = "medium";
        public const string High = "high";
        public const string Critical = "critical";

        public static readonly string[] All =
        [
            Low,
            Medium,
            High,
            Critical
        ];
    }

    public static class Targets
    {
        public const string User = "user";
        public const string Role = "role";
        public const string Broadcast = "broadcast";

        public static readonly string[] All =
        [
            User,
            Role,
            Broadcast
        ];
    }

    public static class Statuses
    {
        public const string All = "all";
        public const string Read = "read";
        public const string Unread = "unread";

        public static readonly string[] FilterValues =
        [
            All,
            Read,
            Unread
        ];
    }

    public static readonly string[] SupportedRoleIds =
    [
        AuthConstants.Roles.SystemAdmin,
        AuthConstants.Roles.Owner,
        AuthConstants.Roles.Admin,
        AuthConstants.Roles.Accountant,
        AuthConstants.Roles.Member,
        AuthConstants.Roles.Viewer
    ];
}
