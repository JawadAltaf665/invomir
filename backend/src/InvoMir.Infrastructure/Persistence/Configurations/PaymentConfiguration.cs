namespace InvoMir.Infrastructure.Persistence.Configurations;

public sealed class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("payments");
        builder.HasKey(payment => payment.Id);
        builder.ConfigureTenantEntity();

        builder.Property(payment => payment.InvoiceId).IsRequired();
        builder.Property(payment => payment.UserId).IsRequired();
        builder.Property(payment => payment.Amount).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(payment => payment.Currency).HasMaxLength(10).IsRequired();
        builder.Property(payment => payment.Method).HasMaxLength(30).IsRequired();
        builder.Property(payment => payment.Status).HasMaxLength(30).IsRequired();
        builder.Property(payment => payment.StripeChargeId).HasMaxLength(128);
        builder.Property(payment => payment.StripePaymentIntentId).HasMaxLength(128);
        builder.Property(payment => payment.FailureReason);
        builder.Property(payment => payment.Note);
        builder.Property(payment => payment.PaidAt).IsRequired();

        builder.HasIndex(payment => payment.TenantId);
        builder.HasIndex(payment => new { payment.TenantId, payment.InvoiceId });
        builder.HasIndex(payment => new { payment.TenantId, payment.UserId });
        builder.HasIndex(payment => new { payment.TenantId, payment.Status });
        builder.HasIndex(payment => new { payment.TenantId, payment.PaidAt });
        builder.HasIndex(payment => new { payment.TenantId, payment.CreationTime });

        builder.HasOne(payment => payment.Invoice)
            .WithMany()
            .HasForeignKey(payment => payment.InvoiceId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
