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
        public const string Sent = "sent";
        public const string Resent = "resent";
        public const string Viewed = "viewed";
        public const string Paid = "paid";
        public const string RemindersUpdated = "reminders_updated";
        public const string Login = "login";
        public const string TokenRefreshed = "token_refreshed";
        public const string Logout = "logout";
        public const string EmailVerified = "email_verified";
        public const string PasswordResetRequested = "password_reset_requested";
        public const string PasswordReset = "password_reset";
        public const string PasswordChanged = "password_changed";
        public const string StripeConnectStarted = "stripe_connect_started";
        public const string StripeConnectCompleted = "stripe_connect_completed";
        public const string SubscriptionCheckoutStarted = "subscription_checkout_started";
        public const string SubscriptionCancelled = "subscription_cancelled";
        public const string SubscriptionSynced = "subscription_synced";
        public const string PlanOverridden = "plan_overridden";
        public const string TrialExtended = "trial_extended";
    }
}
