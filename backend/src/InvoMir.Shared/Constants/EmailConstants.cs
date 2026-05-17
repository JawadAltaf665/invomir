namespace InvoMir.Shared.Constants;

public static class EmailConstants
{
    public static class Types
    {
        public const string Generic = "generic";
        public const string InvoiceSent = "invoice_sent";
        public const string InvoiceResent = "invoice_resent";
        public const string Reminder = "reminder";
        public const string Receipt = "receipt";
        public const string Welcome = "welcome";
        public const string PasswordReset = "reset";
        public const string EmailVerification = "email_verification";
    }

    public static class Statuses
    {
        public const string Queued = "queued";
        public const string Sent = "sent";
        public const string Delivered = "delivered";
        public const string Failed = "failed";
        public const string Bounced = "bounced";
    }
}
