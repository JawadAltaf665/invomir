namespace InvoMir.Application.Features.Emailing;

public static class DefaultEmailTemplateCatalog
{
    public const string DefaultLanguage = "en";

    public static readonly string[] AvailableTokens =
    [
        "CompanyName",
        "CustomerName",
        "InvoiceNumber",
        "InvoiceAmount",
        "DueDate",
        "InvoiceUrl",
        "PaymentLink",
        "UserName",
        "PlanName",
        "VerificationLink",
        "ResetPasswordLink",
        "InvitationLink",
        "CustomMessage",
        "TrackingPixelUrl"
    ];

    public static IReadOnlyList<DefaultEmailTemplateDefinition> All { get; } =
    [
        new(
            EmailTemplateType.InvoiceCreated,
            "Invoice created",
            "Invoice {{InvoiceNumber}} was created",
            """
            <p>Hello {{UserName}},</p>
            <p>Invoice <strong>{{InvoiceNumber}}</strong> has been created for {{CustomerName}}.</p>
            <p>Amount: {{InvoiceAmount}}</p>
            <p>You can review it here: <a href="{{InvoiceUrl}}">Open invoice</a></p>
            <p>Thank you.</p>
            """),
        new(
            EmailTemplateType.InvoiceSent,
            "Invoice sent",
            "Invoice {{InvoiceNumber}} from {{CompanyName}}",
            """
            <p>Hello {{CustomerName}},</p>
            {{CustomMessage}}
            <p>You have received invoice <strong>{{InvoiceNumber}}</strong> from {{CompanyName}}.</p>
            <p>Amount: {{InvoiceAmount}}</p>
            <p>Due Date: {{DueDate}}</p>
            <p>You can view your invoice here: <a href="{{InvoiceUrl}}">View Invoice</a></p>
            <p>Thank you.</p>
            <img src="{{TrackingPixelUrl}}" alt="" width="1" height="1" style="display:none" />
            """),
        new(
            EmailTemplateType.InvoiceViewed,
            "Invoice viewed",
            "Invoice {{InvoiceNumber}} was viewed",
            """
            <p>Hello {{UserName}},</p>
            <p>{{CustomerName}} viewed invoice <strong>{{InvoiceNumber}}</strong>.</p>
            <p>Amount: {{InvoiceAmount}}</p>
            <p><a href="{{InvoiceUrl}}">Open invoice</a></p>
            """),
        new(
            EmailTemplateType.InvoicePaid,
            "Invoice paid",
            "Payment received for invoice {{InvoiceNumber}}",
            """
            <p>Hello {{CustomerName}},</p>
            <p>Payment has been received for invoice <strong>{{InvoiceNumber}}</strong>.</p>
            <p>Amount: {{InvoiceAmount}}</p>
            <p>Thank you for your payment.</p>
            """),
        new(
            EmailTemplateType.InvoiceOverdue,
            "Invoice overdue",
            "Invoice {{InvoiceNumber}} is overdue",
            """
            <p>Hello {{CustomerName}},</p>
            <p>Invoice <strong>{{InvoiceNumber}}</strong> from {{CompanyName}} is now overdue.</p>
            <p>Amount: {{InvoiceAmount}}</p>
            <p>Due Date: {{DueDate}}</p>
            <p>Payment link: <a href="{{PaymentLink}}">Pay Now</a></p>
            <p>Thank you.</p>
            """),
        new(
            EmailTemplateType.PaymentReminder,
            "Payment reminder",
            "Payment reminder for invoice {{InvoiceNumber}}",
            """
            <p>Hello {{CustomerName}},</p>
            <p>This is a reminder that invoice <strong>{{InvoiceNumber}}</strong> is due on {{DueDate}}.</p>
            <p>Amount: {{InvoiceAmount}}</p>
            <p>Payment link: <a href="{{PaymentLink}}">Pay Now</a></p>
            <p>Thank you.</p>
            """),
        new(
            EmailTemplateType.WelcomeEmail,
            "Welcome email",
            "Welcome to InvoMir, {{UserName}}",
            """
            <p>Hello {{UserName}},</p>
            <p>Welcome to InvoMir. We are excited to help you manage invoices faster and more professionally.</p>
            <p>Thank you for joining us.</p>
            """),
        new(
            EmailTemplateType.EmailVerification,
            "Email verification",
            "Verify your InvoMir email",
            """
            <p>Hello {{UserName}},</p>
            <p>Please verify your email address for your InvoMir account.</p>
            <p><a href="{{VerificationLink}}">Verify your email</a></p>
            <p>This link expires in 24 hours.</p>
            """),
        new(
            EmailTemplateType.PasswordReset,
            "Password reset",
            "Reset your InvoMir password",
            """
            <p>Hello {{UserName}},</p>
            <p>You requested a password reset for your InvoMir account.</p>
            <p><a href="{{ResetPasswordLink}}">Reset your password</a></p>
            <p>This link expires in 15 minutes.</p>
            """),
        new(
            EmailTemplateType.SubscriptionStarted,
            "Subscription started",
            "Your {{PlanName}} plan is active",
            """
            <p>Hello {{UserName}},</p>
            <p>Your InvoMir <strong>{{PlanName}}</strong> plan is active.</p>
            <p>Thank you for choosing InvoMir.</p>
            """),
        new(
            EmailTemplateType.SubscriptionRenewed,
            "Subscription renewed",
            "Your {{PlanName}} plan has renewed",
            """
            <p>Hello {{UserName}},</p>
            <p>Your InvoMir <strong>{{PlanName}}</strong> subscription has renewed successfully.</p>
            <p>Thank you for staying with InvoMir.</p>
            """),
        new(
            EmailTemplateType.SubscriptionCancelled,
            "Subscription cancelled",
            "Your InvoMir subscription cancellation is scheduled",
            """
            <p>Hello {{UserName}},</p>
            <p>Your InvoMir <strong>{{PlanName}}</strong> subscription cancellation has been scheduled.</p>
            <p>You can continue using your paid plan until the end of the current billing period.</p>
            """),
        new(
            EmailTemplateType.TrialExpiryReminder,
            "Trial expiry reminder",
            "Your InvoMir trial ends soon",
            """
            <p>Hello {{UserName}},</p>
            <p>Your InvoMir trial ends on {{DueDate}}.</p>
            <p>Upgrade your workspace to keep reminders, online payments, exports, and higher limits active.</p>
            """),
        new(
            EmailTemplateType.TeamMemberInvitation,
            "Team member invitation",
            "Join {{CompanyName}} on InvoMir",
            """
            <p>Hello,</p>
            <p>{{UserName}} invited you to join <strong>{{CompanyName}}</strong> on InvoMir.</p>
            <p><a href="{{InvitationLink}}">Accept invitation</a></p>
            <p>This invitation expires soon.</p>
            """)
    ];

    public static DefaultEmailTemplateDefinition? Find(
        EmailTemplateType templateType,
        string? language = null)
    {
        var normalizedLanguage = string.IsNullOrWhiteSpace(language)
            ? DefaultLanguage
            : language.Trim();

        return All.FirstOrDefault(template =>
            template.TemplateType == templateType &&
            template.Language.Equals(normalizedLanguage, StringComparison.OrdinalIgnoreCase));
    }
}

public sealed record DefaultEmailTemplateDefinition(
    EmailTemplateType TemplateType,
    string Name,
    string Subject,
    string Body,
    string Language = DefaultEmailTemplateCatalog.DefaultLanguage);
