namespace InvoMir.Shared.Constants;

public static class SubscriptionConstants
{
    public static class Statuses
    {
        public const string Active = "active";
        public const string Cancelled = "cancelled";
        public const string PastDue = "past_due";
        public const string Trialing = "trialing";

        public static readonly string[] All =
        [
            Active,
            Cancelled,
            PastDue,
            Trialing
        ];
    }

    public static class Intervals
    {
        public const string Month = "month";
        public const string Year = "year";

        public static readonly string[] All =
        [
            Month,
            Year
        ];
    }
}
