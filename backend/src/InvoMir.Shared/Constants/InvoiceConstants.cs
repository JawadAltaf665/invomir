namespace InvoMir.Shared.Constants;

public static class InvoiceConstants
{
    public static class Statuses
    {
        public const string Draft = "draft";
        public const string Sent = "sent";
        public const string Viewed = "viewed";
        public const string Paid = "paid";
        public const string Overdue = "overdue";
        public const string Cancelled = "cancelled";

        public static readonly string[] All =
        [
            Draft,
            Sent,
            Viewed,
            Paid,
            Overdue,
            Cancelled
        ];
    }

    public static class PaymentTerms
    {
        public const string DueOnReceipt = "due_on_receipt";
        public const string Net7 = "net_7";
        public const string Net14 = "net_14";
        public const string Net30 = "net_30";

        public static readonly string[] All =
        [
            DueOnReceipt,
            Net7,
            Net14,
            Net30
        ];
    }

    public static class DiscountTypes
    {
        public const string Fixed = "fixed";
        public const string Percent = "percent";

        public static readonly string[] All =
        [
            Fixed,
            Percent
        ];
    }
}
