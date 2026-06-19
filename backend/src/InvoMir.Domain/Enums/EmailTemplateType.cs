namespace InvoMir.Domain.Enums;

public enum EmailTemplateType
{
    InvoiceCreated = 1,
    InvoiceSent = 2,
    InvoiceViewed = 3,
    InvoicePaid = 4,
    InvoiceOverdue = 5,
    PaymentReminder = 6,
    WelcomeEmail = 7,
    EmailVerification = 8,
    PasswordReset = 9,
    SubscriptionStarted = 10,
    SubscriptionRenewed = 11,
    SubscriptionCancelled = 12,
    TrialExpiryReminder = 13,
    TeamMemberInvitation = 14
}
