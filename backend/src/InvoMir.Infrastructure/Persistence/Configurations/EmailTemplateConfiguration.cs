using InvoMir.Application.Features.Emailing;

namespace InvoMir.Infrastructure.Persistence.Configurations;

public sealed class EmailTemplateConfiguration : IEntityTypeConfiguration<EmailTemplate>
{
    private static readonly DateTime SeededAt = new(2026, 6, 14, 0, 0, 0, DateTimeKind.Utc);

    private static readonly IReadOnlyDictionary<EmailTemplateType, Guid> TemplateIds =
        new Dictionary<EmailTemplateType, Guid>
        {
            [EmailTemplateType.InvoiceCreated] = Guid.Parse("10000000-0000-0000-0000-000000000001"),
            [EmailTemplateType.InvoiceSent] = Guid.Parse("10000000-0000-0000-0000-000000000002"),
            [EmailTemplateType.InvoiceViewed] = Guid.Parse("10000000-0000-0000-0000-000000000003"),
            [EmailTemplateType.InvoicePaid] = Guid.Parse("10000000-0000-0000-0000-000000000004"),
            [EmailTemplateType.InvoiceOverdue] = Guid.Parse("10000000-0000-0000-0000-000000000005"),
            [EmailTemplateType.PaymentReminder] = Guid.Parse("10000000-0000-0000-0000-000000000006"),
            [EmailTemplateType.WelcomeEmail] = Guid.Parse("10000000-0000-0000-0000-000000000007"),
            [EmailTemplateType.EmailVerification] = Guid.Parse("10000000-0000-0000-0000-000000000008"),
            [EmailTemplateType.PasswordReset] = Guid.Parse("10000000-0000-0000-0000-000000000009"),
            [EmailTemplateType.SubscriptionStarted] = Guid.Parse("10000000-0000-0000-0000-000000000010"),
            [EmailTemplateType.SubscriptionRenewed] = Guid.Parse("10000000-0000-0000-0000-000000000011"),
            [EmailTemplateType.SubscriptionCancelled] = Guid.Parse("10000000-0000-0000-0000-000000000012"),
            [EmailTemplateType.TrialExpiryReminder] = Guid.Parse("10000000-0000-0000-0000-000000000013"),
            [EmailTemplateType.TeamMemberInvitation] = Guid.Parse("10000000-0000-0000-0000-000000000014")
        };

    public void Configure(EntityTypeBuilder<EmailTemplate> builder)
    {
        builder.ToTable("email_templates");
        builder.HasKey(template => template.Id);
        builder.ConfigureSoftDeleteEntity();

        builder.Property(template => template.TemplateType)
            .HasConversion<string>()
            .HasMaxLength(60)
            .IsRequired();

        builder.Property(template => template.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(template => template.Subject)
            .HasMaxLength(300)
            .IsRequired();

        builder.Property(template => template.Body)
            .IsRequired();

        builder.Property(template => template.Language)
            .HasMaxLength(20)
            .IsRequired()
            .HasDefaultValue("en");

        builder.Property(template => template.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(template => template.IsSystemTemplate)
            .IsRequired()
            .HasDefaultValue(true);

        builder.HasIndex(template => template.TemplateType);
        builder.HasIndex(template => template.Language);
        builder.HasIndex(template => template.IsActive);
        builder.HasIndex(template => new { template.TemplateType, template.Language });
        builder.HasIndex(template => new { template.TemplateType, template.Language, template.IsActive })
            .IsUnique()
            .HasFilter("\"IsActive\" = TRUE AND \"IsDeleted\" = FALSE");

        builder.HasData(DefaultEmailTemplateCatalog.All.Select(template => new
        {
            Id = TemplateIds[template.TemplateType],
            template.TemplateType,
            template.Name,
            template.Subject,
            template.Body,
            template.Language,
            IsActive = true,
            IsSystemTemplate = true,
            ConcurrencyStamp = $"email-template-seed-{(int)template.TemplateType:00}",
            CreationTime = SeededAt,
            IsDeleted = false
        }));
    }
}
