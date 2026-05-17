namespace InvoMir.Infrastructure.Persistence.Configurations;

public sealed class InvoiceConfiguration : IEntityTypeConfiguration<Invoice>
{
    public void Configure(EntityTypeBuilder<Invoice> builder)
    {
        builder.ToTable("invoices");
        builder.HasKey(invoice => invoice.Id);
        builder.ConfigureTenantEntity();

        builder.Property(invoice => invoice.UserId).IsRequired();
        builder.Property(invoice => invoice.ClientId).IsRequired();
        builder.Property(invoice => invoice.InvoiceNumber).HasMaxLength(30).IsRequired();
        builder.Property(invoice => invoice.Status).HasMaxLength(20).IsRequired().HasDefaultValue(InvoiceConstants.Statuses.Draft);
        builder.Property(invoice => invoice.IssueDate).HasColumnType("date").IsRequired();
        builder.Property(invoice => invoice.DueDate).HasColumnType("date").IsRequired();
        builder.Property(invoice => invoice.Currency).HasMaxLength(10).IsRequired().HasDefaultValue("USD");
        builder.Property(invoice => invoice.Subtotal).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(invoice => invoice.TaxPercent).HasColumnType("decimal(5,2)").IsRequired();
        builder.Property(invoice => invoice.TaxAmount).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(invoice => invoice.Discount).HasColumnType("decimal(18,2)").IsRequired().HasDefaultValue(0);
        builder.Property(invoice => invoice.Total).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(invoice => invoice.Notes);
        builder.Property(invoice => invoice.PaymentLinkToken).HasMaxLength(128);
        builder.Property(invoice => invoice.StripePaymentIntentId).HasMaxLength(128);
        builder.Property(invoice => invoice.RemindersEnabled).IsRequired().HasDefaultValue(true);
        builder.Property(invoice => invoice.SentAt);
        builder.Property(invoice => invoice.ViewedAt);
        builder.Property(invoice => invoice.PaidAt);
        builder.Property(invoice => invoice.CancelledAt);

        builder.HasIndex(invoice => invoice.TenantId);
        builder.HasIndex(invoice => new { invoice.TenantId, invoice.InvoiceNumber }).IsUnique();
        builder.HasIndex(invoice => new { invoice.TenantId, invoice.Status });
        builder.HasIndex(invoice => new { invoice.TenantId, invoice.ClientId });
        builder.HasIndex(invoice => new { invoice.TenantId, invoice.IssueDate });
        builder.HasIndex(invoice => new { invoice.TenantId, invoice.DueDate });
        builder.HasIndex(invoice => new { invoice.TenantId, invoice.CreationTime });
        builder.HasIndex(invoice => new { invoice.TenantId, invoice.RemindersEnabled });
        builder.HasIndex(invoice => invoice.PaymentLinkToken).IsUnique();

        builder.HasOne(invoice => invoice.Client)
            .WithMany(client => client.Invoices)
            .HasForeignKey(invoice => invoice.ClientId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(invoice => invoice.Items)
            .WithOne(item => item.Invoice)
            .HasForeignKey(item => item.InvoiceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
