namespace InvoMir.Domain.Entities;

public sealed class Client : TenantEntity
{
    public string Name { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string? Phone { get; private set; }
    public string? Address { get; private set; }
    public string? Company { get; private set; }
    public string? TaxId { get; private set; }
    public string? Notes { get; private set; }
    public bool IsActive { get; private set; } = true;

    public ICollection<Invoice> Invoices { get; private set; } = [];

    private Client()
    {
    }

    public static Client Create(
        string name,
        string email,
        string? phone,
        string? address,
        string? company,
        string? taxId,
        string? notes)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Client name is required.", nameof(name));

        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Client email is required.", nameof(email));

        return new Client
        {
            Name = name.Trim(),
            Email = email.ToLowerInvariant().Trim(),
            Phone = NormalizeOptional(phone),
            Address = NormalizeOptional(address),
            Company = NormalizeOptional(company),
            TaxId = NormalizeOptional(taxId),
            Notes = NormalizeOptional(notes)
        };
    }

    public void Update(
        string? name,
        string? email,
        string? phone,
        string? address,
        string? company,
        string? taxId,
        string? notes)
    {
        if (name is not null)
            Name = name.Trim();

        if (email is not null)
            Email = email.ToLowerInvariant().Trim();

        if (phone is not null)
            Phone = NormalizeOptional(phone);

        if (address is not null)
            Address = NormalizeOptional(address);

        if (company is not null)
            Company = NormalizeOptional(company);

        if (taxId is not null)
            TaxId = NormalizeOptional(taxId);

        if (notes is not null)
            Notes = NormalizeOptional(notes);
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
