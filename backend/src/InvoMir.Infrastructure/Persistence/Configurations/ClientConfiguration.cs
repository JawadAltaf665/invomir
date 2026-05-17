namespace InvoMir.Infrastructure.Persistence.Configurations;

public sealed class ClientConfiguration : IEntityTypeConfiguration<Client>
{
    public void Configure(EntityTypeBuilder<Client> builder)
    {
        builder.ToTable("clients");
        builder.HasKey(client => client.Id);
        builder.ConfigureTenantEntity();

        builder.Property(client => client.Name).HasMaxLength(200).IsRequired();
        builder.Property(client => client.Email).HasMaxLength(255).IsRequired();
        builder.Property(client => client.Phone).HasMaxLength(50);
        builder.Property(client => client.Address);
        builder.Property(client => client.Company).HasMaxLength(200);
        builder.Property(client => client.TaxId).HasMaxLength(100);
        builder.Property(client => client.Notes);
        builder.Property(client => client.IsActive).IsRequired().HasDefaultValue(true);

        builder.HasIndex(client => client.TenantId);
        builder.HasIndex(client => new { client.TenantId, client.IsDeleted });
        builder.HasIndex(client => new { client.TenantId, client.Email });
        builder.HasIndex(client => new { client.TenantId, client.Name });
        builder.HasIndex(client => new { client.TenantId, client.CreationTime });
    }
}
