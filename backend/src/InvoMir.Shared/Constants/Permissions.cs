namespace InvoMir.Shared.Constants;

public static class Permissions
{
    public static class Dashboard
    {
        public const string View = "dashboard.view";

        public static readonly string[] All =
        [
            View
        ];
    }

    public static class Invoice
    {
        public const string View = "invoice.view";
        public const string Create = "invoice.create";
        public const string Update = "invoice.update";
        public const string Delete = "invoice.delete";
        public const string Send = "invoice.send";
        public const string MarkPaid = "invoice.mark_paid";
        public const string Cancel = "invoice.cancel";
        public const string Duplicate = "invoice.duplicate";
        public const string ManageReminders = "invoice.manage_reminders";

        public static readonly string[] All =
        [
            View,
            Create,
            Update,
            Delete,
            Send,
            MarkPaid,
            Cancel,
            Duplicate,
            ManageReminders
        ];
    }

    public static class Client
    {
        public const string View = "client.view";
        public const string Create = "client.create";
        public const string Update = "client.update";
        public const string Delete = "client.delete";

        public static readonly string[] All =
        [
            View,
            Create,
            Update,
            Delete
        ];
    }

    public static class Payment
    {
        public const string View = "payment.view";
        public const string Manage = "payment.manage";

        public static readonly string[] All =
        [
            View,
            Manage
        ];
    }

    public static class Report
    {
        public const string View = "report.view";
        public const string Export = "report.export";

        public static readonly string[] All =
        [
            View,
            Export
        ];
    }

    public static class AuditLog
    {
        public const string View = "audit_log.view";

        public static readonly string[] All =
        [
            View
        ];
    }

    public static class Notification
    {
        public const string View = "notification.view";

        public static readonly string[] All =
        [
            View
        ];
    }

    public static class Subscription
    {
        public const string View = "subscription.view";
        public const string Manage = "subscription.manage";

        public static readonly string[] All =
        [
            View,
            Manage
        ];
    }

    public static class Team
    {
        public const string Manage = "team.manage";

        public static readonly string[] All =
        [
            Manage
        ];
    }

    public static class Settings
    {
        public const string Manage = "settings.manage";

        public static readonly string[] All =
        [
            Manage
        ];
    }

    public static class System
    {
        public const string Access = "system.access";

        public static class Users
        {
            public const string View = "system.user.view";
            public const string Manage = "system.user.manage";

            public static readonly string[] All =
            [
                View,
                Manage
            ];
        }

        public static readonly string[] All =
        [
            Access,
            ..Users.All
        ];
    }

    public static readonly string[] OrganizationScoped =
    [
        ..Dashboard.All,
        ..Invoice.All,
        ..Client.All,
        ..Payment.All,
        ..Report.All,
        ..Notification.All,
        ..Subscription.All,
        ..Team.All,
        ..Settings.All
    ];

    public static readonly string[] All =
    [
        ..OrganizationScoped,
        ..AuditLog.All,
        ..System.All
    ];

    private static readonly HashSet<string> KnownPermissions = new(All, StringComparer.OrdinalIgnoreCase);

    public static bool IsKnown(string permission)
    {
        return KnownPermissions.Contains(permission);
    }
}
