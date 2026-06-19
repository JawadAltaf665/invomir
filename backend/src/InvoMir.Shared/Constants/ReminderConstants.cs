namespace InvoMir.Shared.Constants;

public static class ReminderConstants
{
    public static class Types
    {
        public const string DueSoon = "due_soon";
        public const string OneDayOverdue = "one_day_overdue";
        public const string SevenDaysOverdue = "seven_days_overdue";

        public static readonly string[] All =
        [
            DueSoon,
            OneDayOverdue,
            SevenDaysOverdue
        ];
    }

    public static class Statuses
    {
        public const string Pending = "pending";
        public const string Sent = "sent";
        public const string Cancelled = "cancelled";
        public const string Failed = "failed";

        public static readonly string[] All =
        [
            Pending,
            Sent,
            Cancelled,
            Failed
        ];
    }
}
