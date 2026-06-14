using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace InvoMir.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailTemplatesAndQueuedEmails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "email_templates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TemplateType = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Subject = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Body = table.Column<string>(type: "text", nullable: false),
                    Language = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "en"),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    IsSystemTemplate = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    ConcurrencyStamp = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatorUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifierUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    DeletionTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeleterUserId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_email_templates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "queued_emails",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: true),
                    TemplateType = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    ToEmail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    ToName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Cc = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Bcc = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Subject = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Body = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "Pending"),
                    RetryCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    MaxRetryCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 3),
                    ErrorMessage = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ScheduledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastAttemptAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AttachmentFileName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    AttachmentContentType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    AttachmentContentBase64 = table.Column<string>(type: "text", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatorUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifierUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    DeletionTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeleterUserId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_queued_emails", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "email_templates",
                columns: new[] { "Id", "Body", "ConcurrencyStamp", "CreationTime", "CreatorUserId", "DeleterUserId", "DeletionTime", "IsActive", "IsSystemTemplate", "Language", "LastModificationTime", "LastModifierUserId", "Name", "Subject", "TemplateType" },
                values: new object[,]
                {
                    { new Guid("10000000-0000-0000-0000-000000000001"), "<p>Hello {{UserName}},</p>\n<p>Invoice <strong>{{InvoiceNumber}}</strong> has been created for {{CustomerName}}.</p>\n<p>Amount: {{InvoiceAmount}}</p>\n<p>You can review it here: <a href=\"{{InvoiceUrl}}\">Open invoice</a></p>\n<p>Thank you.</p>", "email-template-seed-01", new DateTime(2026, 6, 14, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, true, true, "en", null, null, "Invoice created", "Invoice {{InvoiceNumber}} was created", "InvoiceCreated" },
                    { new Guid("10000000-0000-0000-0000-000000000002"), "<p>Hello {{CustomerName}},</p>\n{{CustomMessage}}\n<p>You have received invoice <strong>{{InvoiceNumber}}</strong> from {{CompanyName}}.</p>\n<p>Amount: {{InvoiceAmount}}</p>\n<p>Due Date: {{DueDate}}</p>\n<p>You can view your invoice here: <a href=\"{{InvoiceUrl}}\">View Invoice</a></p>\n<p>Thank you.</p>\n<img src=\"{{TrackingPixelUrl}}\" alt=\"\" width=\"1\" height=\"1\" style=\"display:none\" />", "email-template-seed-02", new DateTime(2026, 6, 14, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, true, true, "en", null, null, "Invoice sent", "Invoice {{InvoiceNumber}} from {{CompanyName}}", "InvoiceSent" },
                    { new Guid("10000000-0000-0000-0000-000000000003"), "<p>Hello {{UserName}},</p>\n<p>{{CustomerName}} viewed invoice <strong>{{InvoiceNumber}}</strong>.</p>\n<p>Amount: {{InvoiceAmount}}</p>\n<p><a href=\"{{InvoiceUrl}}\">Open invoice</a></p>", "email-template-seed-03", new DateTime(2026, 6, 14, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, true, true, "en", null, null, "Invoice viewed", "Invoice {{InvoiceNumber}} was viewed", "InvoiceViewed" },
                    { new Guid("10000000-0000-0000-0000-000000000004"), "<p>Hello {{CustomerName}},</p>\n<p>Payment has been received for invoice <strong>{{InvoiceNumber}}</strong>.</p>\n<p>Amount: {{InvoiceAmount}}</p>\n<p>Thank you for your payment.</p>", "email-template-seed-04", new DateTime(2026, 6, 14, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, true, true, "en", null, null, "Invoice paid", "Payment received for invoice {{InvoiceNumber}}", "InvoicePaid" },
                    { new Guid("10000000-0000-0000-0000-000000000005"), "<p>Hello {{CustomerName}},</p>\n<p>Invoice <strong>{{InvoiceNumber}}</strong> from {{CompanyName}} is now overdue.</p>\n<p>Amount: {{InvoiceAmount}}</p>\n<p>Due Date: {{DueDate}}</p>\n<p>Payment link: <a href=\"{{PaymentLink}}\">Pay Now</a></p>\n<p>Thank you.</p>", "email-template-seed-05", new DateTime(2026, 6, 14, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, true, true, "en", null, null, "Invoice overdue", "Invoice {{InvoiceNumber}} is overdue", "InvoiceOverdue" },
                    { new Guid("10000000-0000-0000-0000-000000000006"), "<p>Hello {{CustomerName}},</p>\n<p>This is a reminder that invoice <strong>{{InvoiceNumber}}</strong> is due on {{DueDate}}.</p>\n<p>Amount: {{InvoiceAmount}}</p>\n<p>Payment link: <a href=\"{{PaymentLink}}\">Pay Now</a></p>\n<p>Thank you.</p>", "email-template-seed-06", new DateTime(2026, 6, 14, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, true, true, "en", null, null, "Payment reminder", "Payment reminder for invoice {{InvoiceNumber}}", "PaymentReminder" },
                    { new Guid("10000000-0000-0000-0000-000000000007"), "<p>Hello {{UserName}},</p>\n<p>Welcome to InvoMir. We are excited to help you manage invoices faster and more professionally.</p>\n<p>Thank you for joining us.</p>", "email-template-seed-07", new DateTime(2026, 6, 14, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, true, true, "en", null, null, "Welcome email", "Welcome to InvoMir, {{UserName}}", "WelcomeEmail" },
                    { new Guid("10000000-0000-0000-0000-000000000008"), "<p>Hello {{UserName}},</p>\n<p>Please verify your email address for your InvoMir account.</p>\n<p><a href=\"{{VerificationLink}}\">Verify your email</a></p>\n<p>This link expires in 24 hours.</p>", "email-template-seed-08", new DateTime(2026, 6, 14, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, true, true, "en", null, null, "Email verification", "Verify your InvoMir email", "EmailVerification" },
                    { new Guid("10000000-0000-0000-0000-000000000009"), "<p>Hello {{UserName}},</p>\n<p>You requested a password reset for your InvoMir account.</p>\n<p><a href=\"{{ResetPasswordLink}}\">Reset your password</a></p>\n<p>This link expires in 15 minutes.</p>", "email-template-seed-09", new DateTime(2026, 6, 14, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, true, true, "en", null, null, "Password reset", "Reset your InvoMir password", "PasswordReset" },
                    { new Guid("10000000-0000-0000-0000-000000000010"), "<p>Hello {{UserName}},</p>\n<p>Your InvoMir <strong>{{PlanName}}</strong> plan is active.</p>\n<p>Thank you for choosing InvoMir.</p>", "email-template-seed-10", new DateTime(2026, 6, 14, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, true, true, "en", null, null, "Subscription started", "Your {{PlanName}} plan is active", "SubscriptionStarted" },
                    { new Guid("10000000-0000-0000-0000-000000000011"), "<p>Hello {{UserName}},</p>\n<p>Your InvoMir <strong>{{PlanName}}</strong> subscription has renewed successfully.</p>\n<p>Thank you for staying with InvoMir.</p>", "email-template-seed-11", new DateTime(2026, 6, 14, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, true, true, "en", null, null, "Subscription renewed", "Your {{PlanName}} plan has renewed", "SubscriptionRenewed" },
                    { new Guid("10000000-0000-0000-0000-000000000012"), "<p>Hello {{UserName}},</p>\n<p>Your InvoMir <strong>{{PlanName}}</strong> subscription cancellation has been scheduled.</p>\n<p>You can continue using your paid plan until the end of the current billing period.</p>", "email-template-seed-12", new DateTime(2026, 6, 14, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, true, true, "en", null, null, "Subscription cancelled", "Your InvoMir subscription cancellation is scheduled", "SubscriptionCancelled" },
                    { new Guid("10000000-0000-0000-0000-000000000013"), "<p>Hello {{UserName}},</p>\n<p>Your InvoMir trial ends on {{DueDate}}.</p>\n<p>Upgrade your workspace to keep reminders, online payments, exports, and higher limits active.</p>", "email-template-seed-13", new DateTime(2026, 6, 14, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, true, true, "en", null, null, "Trial expiry reminder", "Your InvoMir trial ends soon", "TrialExpiryReminder" },
                    { new Guid("10000000-0000-0000-0000-000000000014"), "<p>Hello,</p>\n<p>{{UserName}} invited you to join <strong>{{CompanyName}}</strong> on InvoMir.</p>\n<p><a href=\"{{InvitationLink}}\">Accept invitation</a></p>\n<p>This invitation expires soon.</p>", "email-template-seed-14", new DateTime(2026, 6, 14, 0, 0, 0, 0, DateTimeKind.Utc), null, null, null, true, true, "en", null, null, "Team member invitation", "Join {{CompanyName}} on InvoMir", "TeamMemberInvitation" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_email_templates_IsActive",
                table: "email_templates",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_email_templates_Language",
                table: "email_templates",
                column: "Language");

            migrationBuilder.CreateIndex(
                name: "IX_email_templates_TemplateType",
                table: "email_templates",
                column: "TemplateType");

            migrationBuilder.CreateIndex(
                name: "IX_email_templates_TemplateType_Language",
                table: "email_templates",
                columns: new[] { "TemplateType", "Language" });

            migrationBuilder.CreateIndex(
                name: "IX_email_templates_TemplateType_Language_IsActive",
                table: "email_templates",
                columns: new[] { "TemplateType", "Language", "IsActive" },
                unique: true,
                filter: "\"IsActive\" = TRUE AND \"IsDeleted\" = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_queued_emails_CreationTime",
                table: "queued_emails",
                column: "CreationTime");

            migrationBuilder.CreateIndex(
                name: "IX_queued_emails_ScheduledAt",
                table: "queued_emails",
                column: "ScheduledAt");

            migrationBuilder.CreateIndex(
                name: "IX_queued_emails_Status",
                table: "queued_emails",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_queued_emails_Status_ScheduledAt_CreationTime",
                table: "queued_emails",
                columns: new[] { "Status", "ScheduledAt", "CreationTime" });

            migrationBuilder.CreateIndex(
                name: "IX_queued_emails_TemplateType",
                table: "queued_emails",
                column: "TemplateType");

            migrationBuilder.CreateIndex(
                name: "IX_queued_emails_TenantId",
                table: "queued_emails",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_queued_emails_TenantId_Status",
                table: "queued_emails",
                columns: new[] { "TenantId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "email_templates");

            migrationBuilder.DropTable(
                name: "queued_emails");
        }
    }
}
