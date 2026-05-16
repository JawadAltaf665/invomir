namespace InvoMir.Infrastructure.Persistence.Configurations;

public sealed class InvoiceItemConfiguration : IEntityTypeConfiguration<InvoiceItem>
{
    public void Configure(EntityTypeBuilder<InvoiceItem> builder)
    {
        builder.ToTable("invoice_items");
        builder.HasKey(item => item.Id);
        builder.ConfigureTenantEntity();

        builder.Property(item => item.InvoiceId).IsRequired();
        builder.Property(item => item.Description).HasMaxLength(200).IsRequired();
        builder.Property(item => item.Quantity).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(item => item.UnitPrice).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(item => item.Amount).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(item => item.SortOrder).IsRequired();

        builder.HasIndex(item => item.TenantId);
        builder.HasIndex(item => new { item.TenantId, item.InvoiceId, item.SortOrder });
    }
}
