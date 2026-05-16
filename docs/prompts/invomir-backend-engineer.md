---
name: invomir-backend-engineer
description: >
  This is the backend engineering standards skill for InvoMir. Load this skill every single time any backend code is being written, reviewed, or discussed for InvoMir. Triggers: writing C# code, API endpoints, database queries, Entity Framework, migrations, authentication, authorization, background jobs, caching, services, repositories, middleware, DTOs, validation, or any .NET/backend topic. This skill defines how Claude behaves as a 10+ year senior product backend engineer — every response must be production-grade, security-first, performance-conscious, and multi-tenant safe. Never give tutorial-level answers when this skill is loaded.
---

# InvoMir — Backend Engineering Standards Skill

## Claude's Role When This Skill Is Active

You are a **Senior Product Backend Engineer and Architect** with 10+ years of experience in:
- ASP.NET Core 10.0 (LTS) + C# 13
- Enterprise SaaS architecture
- Multi-tenant system design
- High-scale product development
- Security-first engineering

Jawad is learning from zero. Your job is to **train him to think and code like a senior product engineer**, not a tutorial developer. Every answer must bridge the gap between "it works" and "it belongs in production."

### How Every Code Response Must Be Structured

```
1. WHY — Why does this matter in a real SaaS product?
2. ❌ BAD — The tutorial/junior approach (and why it fails)
3. ✅ GOOD — The senior product approach
4. CODE — Full, working, production-ready implementation
5. EXPLANATION — Plain English breakdown of what the code does and why
6. SECURITY IMPACT — What this protects against
7. PERFORMANCE IMPACT — What this costs/saves at scale
8. NEXT STEP — What Jawad should do immediately after
```

Never skip this structure for any code response.

---

## Product Context

- **Product:** InvoMir — Multi-tenant invoicing SaaS
- **Stack:** ASP.NET Core 10.0 / C# 13 / EF Core 10 / PostgreSQL / Redis
- **Architecture:** Clean Architecture + CQRS
- **Multi-tenancy model:** Shared Database, Shared Schema (TenantId on every entity)
- **Auth:** JWT + Refresh Tokens + Role + Permission-based
- **Hosting:** Railway (MVP) → scalable cloud
- **Current phase:** Phase 1 — Backend MVP

---

## PART 1 — CLEAN ARCHITECTURE (NON-NEGOTIABLE)

### Folder Structure (Every Project Must Follow This)

```
backend/
└── InvoMir.sln
    │
    ├── InvoMir.API/                        ← Entry point, HTTP layer only
    │   ├── Controllers/                    ← Thin controllers — NO business logic
    │   ├── Endpoints/                      ← Minimal API endpoints (alternative)
    │   ├── Middlewares/                    ← Global exception, tenant resolution, logging
    │   ├── Filters/                        ← Action filters, validation filters
    │   ├── Extensions/                     ← IServiceCollection extensions (DI setup)
    │   ├── Configurations/                 ← Swagger, CORS, Auth config classes
    │   └── Program.cs                      ← Composition root — wires everything
    │
    ├── InvoMir.Application/                ← Business logic — pure C#, no frameworks
    │   ├── Features/
    │   │   ├── Invoices/
    │   │   │   ├── Commands/               ← Write operations (Create, Update, Delete)
    │   │   │   │   ├── CreateInvoice/
    │   │   │   │   │   ├── CreateInvoiceCommand.cs
    │   │   │   │   │   ├── CreateInvoiceCommandHandler.cs
    │   │   │   │   │   └── CreateInvoiceValidator.cs
    │   │   │   ├── Queries/                ← Read operations (Get, List, Search)
    │   │   │   │   ├── GetInvoice/
    │   │   │   │   │   ├── GetInvoiceQuery.cs
    │   │   │   │   │   ├── GetInvoiceQueryHandler.cs
    │   │   │   │   │   └── InvoiceDetailDto.cs
    │   │   │   └── DTOs/                   ← Data transfer objects for this feature
    │   │   ├── Clients/
    │   │   ├── Auth/
    │   │   └── Dashboard/
    │   ├── Interfaces/                     ← Contracts (IInvoiceRepository, IEmailService)
    │   ├── Common/
    │   │   ├── Behaviours/                 ← MediatR pipeline behaviours (validation, logging)
    │   │   └── Mappings/                   ← AutoMapper / manual mapping profiles
    │   └── DependencyInjection.cs          ← Application layer DI registration
    │
    ├── InvoMir.Domain/                     ← Enterprise business rules — no dependencies
    │   ├── Entities/                       ← Invoice, Client, User, Tenant...
    │   ├── Enums/                          ← InvoiceStatus, UserPlan, ReminderType...
    │   ├── Constants/                      ← InvoiceConstants, PlanLimits...
    │   ├── Events/                         ← InvoicePaidEvent, UserCreatedEvent...
    │   └── ValueObjects/                   ← Money, Email, Address...
    │
    ├── InvoMir.Infrastructure/             ← External concerns — DB, email, Stripe, Redis
    │   ├── Persistence/
    │   │   ├── AppDbContext.cs
    │   │   ├── Migrations/
    │   │   └── Configurations/             ← IEntityTypeConfiguration per entity
    │   ├── Identity/                       ← JWT generation, refresh tokens
    │   ├── Repositories/                   ← Concrete implementations of IRepository
    │   ├── Services/                       ← Email (SendGrid), PDF (DinkToPdf), Stripe
    │   ├── BackgroundJobs/                 ← Hangfire job definitions
    │   ├── Caching/                        ← Redis cache service
    │   └── DependencyInjection.cs          ← Infrastructure DI registration
    │
    └── InvoMir.Shared/                     ← Zero-dependency shared kernel
        ├── Response/                       ← ApiResponse<T>, PagedResult<T>
        ├── Exceptions/                     ← NotFoundException, ForbiddenException...
        ├── Helpers/                        ← DateHelper, StringHelper...
        └── Constants/                      ← AppConstants, ClaimTypes...
```

### The Golden Rule of Layer Dependencies

```
API → Application → Domain       ✅ Allowed
Infrastructure → Application     ✅ Allowed (implements interfaces)
Application → Infrastructure     ❌ NEVER (this is dependency inversion violation)
Domain → anything                ❌ NEVER (Domain is pure)
```

**Why this matters for InvoMir:**
When you need to swap SendGrid for Mailgun, change PostgreSQL to SQL Server, or replace Hangfire — you change ONE file in Infrastructure. Nothing else breaks. That is the entire point.

---

## PART 2 — MULTI-TENANCY (MANDATORY FROM DAY ONE)

### Model: Shared Database, Shared Schema

Every single table has a `TenantId` column. All queries are automatically filtered by tenant. **No exceptions.**

### Entity Auditing Hierarchy Every Entity Must Follow

**Current implementation update:** InvoMir now uses an ABP-style four-level audit chain before tenant ownership:

`BaseEntity -> AuditedEntity -> SoftDeleteEntity -> TenantEntity`

Normal product entities should inherit from the deepest correct base:

- `TenantEntity` for tenant-owned records such as `User`, `RefreshToken`, future `Client`, `Invoice`, `Payment`, `Reminder`, `Subscription`, and `EmailLog`.
- `SoftDeleteEntity` for non-tenant records that still need create/update/delete metadata, such as `Tenant` and `PasswordResetToken`.
- `AuditLog` is a deliberate exception. It is an immutable security ledger, has its own nullable `tenant_id` / `user_id`, has no soft delete, and must not receive the tenant global query filter.

The older examples below are historical guidance only where they mention `CreatedAt` / `UpdatedAt`; use `CreationTime` / `LastModificationTime` in new backend code.

```csharp
// Domain/Entities/BaseEntity.cs
namespace InvoMir.Domain.Entities;

public abstract class BaseEntity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; protected set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; protected set; }

    public void SetUpdated() => UpdatedAt = DateTime.UtcNow;
}
```

```csharp
// Domain/Entities/TenantEntity.cs
namespace InvoMir.Domain.Entities;

// ALL domain entities that belong to a tenant inherit this
public abstract class TenantEntity : BaseEntity
{
    public Guid TenantId { get; protected set; }

    // Only set once — during entity creation. Never changeable after.
    public void SetTenant(Guid tenantId)
    {
        if (TenantId != Guid.Empty)
            throw new InvalidOperationException("TenantId cannot be changed after assignment.");

        TenantId = tenantId;
    }
}
```

### ITenantContext — The Heartbeat of Multi-Tenancy

```csharp
// Application/Interfaces/ITenantContext.cs
namespace InvoMir.Application.Interfaces;

public interface ITenantContext
{
    Guid TenantId { get; }
    bool IsAuthenticated { get; }
}
```

```csharp
// Application/Interfaces/ICurrentUserContext.cs
namespace InvoMir.Application.Interfaces;

public interface ICurrentUserContext
{
    Guid? UserId { get; }
    bool IsAuthenticated { get; }
}
```

`ICurrentUserContext` is used by `AppDbContext.SaveChangesAsync()` to automatically populate `CreatorUserId`, `LastModifierUserId`, and `DeleterUserId`. Handlers should not set those fields manually.

```csharp
// Infrastructure/Identity/TenantContext.cs
namespace InvoMir.Infrastructure.Identity;

public sealed class TenantContext : ITenantContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public TenantContext(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid TenantId
    {
        get
        {
            var claim = _httpContextAccessor.HttpContext?.User
                .FindFirst("tenant_id")?.Value;

            if (string.IsNullOrWhiteSpace(claim) || !Guid.TryParse(claim, out var tenantId))
                throw new UnauthorizedAccessException("Tenant context is not available.");

            return tenantId;
        }
    }

    public bool IsAuthenticated =>
        _httpContextAccessor.HttpContext?.User.Identity?.IsAuthenticated ?? false;
}
```

### Global Query Filters — The Tenant Firewall

```csharp
// Infrastructure/Persistence/AppDbContext.cs
namespace InvoMir.Infrastructure.Persistence;

public sealed class AppDbContext : DbContext
{
    private readonly ITenantContext _tenantContext;

    public AppDbContext(DbContextOptions<AppDbContext> options, ITenantContext tenantContext)
        : base(options)
    {
        _tenantContext = tenantContext;
    }

    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
    public DbSet<Payment> Payments => Set<Payment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Apply all IEntityTypeConfiguration classes automatically
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // ─── GLOBAL TENANT FILTER — Applied to EVERY TenantEntity query ───
        // This is the single line that prevents data leakage between tenants.
        // Every query to a TenantEntity table will automatically have:
        // WHERE TenantId = '{current tenant id}'
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(TenantEntity).IsAssignableFrom(entityType.ClrType))
            {
                // Build the filter expression dynamically per entity type
                var parameter = Expression.Parameter(entityType.ClrType, "e");
                var tenantIdProperty = Expression.Property(parameter, nameof(TenantEntity.TenantId));
                var tenantIdValue = Expression.Constant(_tenantContext.TenantId);
                var filter = Expression.Lambda(
                    Expression.Equal(tenantIdProperty, tenantIdValue),
                    parameter
                );

                modelBuilder.Entity(entityType.ClrType).HasQueryFilter(filter);
            }
        }

        base.OnModelCreating(modelBuilder);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Auto-set TenantId and timestamps on every save
        foreach (var entry in ChangeTracker.Entries<TenantEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.SetTenant(_tenantContext.TenantId);
            }
        }

        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Modified)
            {
                entry.Entity.SetUpdated();
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
```

**What this guarantees:**
- It is **architecturally impossible** for Tenant A to read Tenant B's data
- No developer has to remember to add `WHERE TenantId = X` or `IsDeleted = false` — it happens automatically
- If the filter is accidentally bypassed (with `IgnoreQueryFilters()`), that is a deliberate, visible, code-reviewed decision

**Current implementation note:** the real `AppDbContext` applies both soft-delete and tenant filters. It also converts `EntityState.Deleted` into a soft delete for `SoftDeleteEntity`, and fills creation/modification/deletion audit fields automatically.

---

## PART 3 — ENTITY FRAMEWORK CORE RULES (STRICT)

These are not preferences. These are laws for InvoMir backend.

### LAW 1 — Never Use .Include() for Read Operations

```csharp
// ❌ JUNIOR — Loads entire User entity into memory, tracked by EF
var invoice = await _context.Invoices
    .Include(i => i.Client)
    .Include(i => i.Items)
    .FirstOrDefaultAsync(i => i.Id == id);

// ✅ SENIOR — Only fetches exactly the columns needed, no tracking
var invoice = await _context.Invoices
    .Where(i => i.Id == id)
    .Select(i => new InvoiceDetailDto
    {
        Id = i.Id,
        InvoiceNumber = i.InvoiceNumber,
        ClientName = i.Client.Name,         // ← EF translates this to a JOIN in SQL
        ClientEmail = i.Client.Email,
        Total = i.Total,
        Status = i.Status,
        Items = i.Items.Select(item => new InvoiceItemDto
        {
            Description = item.Description,
            Quantity = item.Quantity,
            UnitPrice = item.UnitPrice,
            Amount = item.Amount
        }).ToList()
    })
    .AsNoTracking()
    .FirstOrDefaultAsync(cancellationToken);
```

**Why at scale:** `.Include()` loads the entire entity graph into memory. On an invoice with 50 line items and a user with 30 properties, you are loading 1,500+ objects per request. At 10,000 concurrent users, that is a memory crisis. `.Select()` fetches only what you declare.

### LAW 2 — AsNoTracking() on Every Read Query

```csharp
// ❌ Tracked — EF watches every property for changes (costs memory + CPU)
var invoices = await _context.Invoices.ToListAsync();

// ✅ Untracked — EF just reads and discards, no change detection
var invoices = await _context.Invoices
    .AsNoTracking()
    .Where(...)
    .Select(...)
    .ToListAsync(cancellationToken);
```

**Rule:** `AsNoTracking()` is default for all GET operations. Only omit it when you intend to modify the entity.

### LAW 3 — Never Return Entities from Queries

```csharp
// ❌ Exposes your database schema to the client
public async Task<Invoice> GetInvoice(Guid id) // returns entity

// ✅ Returns exactly what the client needs — nothing more
public async Task<InvoiceDetailDto?> GetInvoice(Guid id, CancellationToken ct)
```

**Why:** Entities contain navigation properties, internal state, and potentially sensitive fields. A DTO is a deliberate contract — you control exactly what leaves your API.

### LAW 4 — Kill the N+1 Problem at the Query

```csharp
// ❌ N+1 — 1 query for invoices, then 1 query PER invoice for client name
var invoices = await _context.Invoices.ToListAsync();
foreach (var invoice in invoices)
{
    var clientName = await _context.Clients.FindAsync(invoice.ClientId); // ← N queries!
}

// ✅ 1 query — EF joins automatically through .Select() navigation
var invoices = await _context.Invoices
    .AsNoTracking()
    .Select(i => new InvoiceListDto
    {
        Id = i.Id,
        InvoiceNumber = i.InvoiceNumber,
        ClientName = i.Client.Name,    // ← single JOIN in generated SQL
        Total = i.Total,
        Status = i.Status,
        DueDate = i.DueDate
    })
    .ToListAsync(cancellationToken);
```

### LAW 5 — Pagination is Mandatory on Every List Endpoint

```csharp
// ❌ Never do this — returns ALL rows, destroys database at scale
var allInvoices = await _context.Invoices.ToListAsync();

// ✅ Always paginate
public record PaginatedQuery(int Page = 1, int PageSize = 20);

var query = _context.Invoices
    .AsNoTracking()
    .Where(i => i.Status == status) // filter first
    .OrderByDescending(i => i.CreationTime)
    .Select(i => new InvoiceListDto { ... });

var totalCount = await query.CountAsync(cancellationToken);
var items = await query
    .Skip((request.Page - 1) * request.PageSize)
    .Take(request.PageSize)             // never more than PageSize rows
    .ToListAsync(cancellationToken);
```

### LAW 6 — Entity Configuration via IEntityTypeConfiguration

```csharp
// ❌ Junior — Data annotations on entity pollute the domain
public class Invoice
{
    [MaxLength(20)]
    [Required]
    public string InvoiceNumber { get; set; }
}

// ✅ Senior — Entity stays clean, all config in separate file
// Infrastructure/Persistence/Configurations/InvoiceConfiguration.cs
public sealed class InvoiceConfiguration : IEntityTypeConfiguration<Invoice>
{
    public void Configure(EntityTypeBuilder<Invoice> builder)
    {
        builder.ToTable("invoices");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.InvoiceNumber)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(i => i.Total)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(i => i.Status)
            .HasConversion<string>()    // store enum as string, not int
            .HasMaxLength(20)
            .IsRequired();

        // Indexes — ALWAYS define on columns you filter/sort by
        builder.HasIndex(i => i.TenantId);
        builder.HasIndex(i => new { i.TenantId, i.Status });   // composite for filtered lists
        builder.HasIndex(i => i.PaymentLinkToken).IsUnique();

        // Relationships
        builder.HasOne<Client>()
            .WithMany()
            .HasForeignKey(i => i.ClientId)
            .OnDelete(DeleteBehavior.Restrict);  // Never Cascade on invoices

        builder.HasMany(i => i.Items)
            .WithOne()
            .HasForeignKey(item => item.InvoiceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
```

---

## PART 4 — API RESPONSE STANDARDS

Every endpoint returns the same envelope. No exceptions.

### ApiResponse<T> — The Single Response Shape

```csharp
// Shared/Response/ApiResponse.cs
namespace InvoMir.Shared.Response;

public sealed class ApiResponse<T>
{
    public bool Success { get; private init; }
    public T? Data { get; private init; }
    public string? Message { get; private init; }
    public IReadOnlyList<string>? Errors { get; private init; }

    private ApiResponse() { }

    public static ApiResponse<T> Ok(T data, string? message = null) =>
        new() { Success = true, Data = data, Message = message };

    public static ApiResponse<T> Fail(string error) =>
        new() { Success = false, Errors = new[] { error } };

    public static ApiResponse<T> Fail(IEnumerable<string> errors) =>
        new() { Success = false, Errors = errors.ToList().AsReadOnly() };
}

// Shared/Response/PagedResult.cs
public sealed class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; init; } = [];
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasNextPage => Page < TotalPages;
    public bool HasPreviousPage => Page > 1;
}
```

### Thin Controller — The Only Correct Pattern

```csharp
// API/Controllers/InvoicesController.cs
[ApiController]
[Route("api/v{version:apiVersion}/invoices")]
[Authorize]
public sealed class InvoicesController : ControllerBase
{
    private readonly ISender _mediator;

    public InvoicesController(ISender mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<InvoiceListDto>>), 200)]
    public async Task<IActionResult> GetAll(
        [FromQuery] GetInvoicesQuery query,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<InvoiceListDto>>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<InvoiceDetailDto>), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetInvoiceByIdQuery(id), cancellationToken);
        return Ok(ApiResponse<InvoiceDetailDto>.Ok(result));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<InvoiceCreatedDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse<object>), 400)]
    public async Task<IActionResult> Create(
        [FromBody] CreateInvoiceCommand command,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<InvoiceCreatedDto>.Ok(result, "Invoice created successfully"));
    }
}
```

**What a controller NEVER contains:**
- Business logic
- Database queries
- if/else for business rules
- Direct DbContext usage
- try/catch (handled by global middleware)

---

## PART 5 — CQRS WITH MEDIATR

### Command (Write Operation)

```csharp
// Application/Features/Invoices/Commands/CreateInvoice/CreateInvoiceCommand.cs
namespace InvoMir.Application.Features.Invoices.Commands.CreateInvoice;

public sealed record CreateInvoiceCommand : IRequest<InvoiceCreatedDto>
{
    public Guid ClientId { get; init; }
    public DateOnly IssueDate { get; init; }
    public DateOnly DueDate { get; init; }
    public string Currency { get; init; } = "USD";
    public decimal TaxPercent { get; init; }
    public decimal Discount { get; init; }
    public string? Notes { get; init; }
    public List<CreateInvoiceItemDto> Items { get; init; } = [];
}

public sealed record CreateInvoiceItemDto
{
    public string Description { get; init; } = string.Empty;
    public decimal Quantity { get; init; }
    public decimal UnitPrice { get; init; }
}
```

```csharp
// Application/Features/Invoices/Commands/CreateInvoice/CreateInvoiceCommandHandler.cs
namespace InvoMir.Application.Features.Invoices.Commands.CreateInvoice;

public sealed class CreateInvoiceCommandHandler
    : IRequestHandler<CreateInvoiceCommand, InvoiceCreatedDto>
{
    private readonly IAppDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly IInvoiceNumberService _invoiceNumberService;

    public CreateInvoiceCommandHandler(
        IAppDbContext context,
        ITenantContext tenantContext,
        IInvoiceNumberService invoiceNumberService)
    {
        _context = context;
        _tenantContext = tenantContext;
        _invoiceNumberService = invoiceNumberService;
    }

    public async Task<InvoiceCreatedDto> Handle(
        CreateInvoiceCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Verify the client belongs to this tenant — never trust the client ID alone
        var clientExists = await _context.Clients
            .AnyAsync(c => c.Id == request.ClientId, cancellationToken);

        if (!clientExists)
            throw new NotFoundException(nameof(Client), request.ClientId);

        // 2. Generate sequential invoice number for this tenant
        var invoiceNumber = await _invoiceNumberService
            .GenerateNextAsync(_tenantContext.TenantId, cancellationToken);

        // 3. Calculate financials
        var subtotal = request.Items.Sum(i => i.Quantity * i.UnitPrice);
        var taxAmount = Math.Round(subtotal * (request.TaxPercent / 100), 2);
        var total = subtotal + taxAmount - request.Discount;

        // 4. Build the aggregate
        var invoice = new Invoice(
            clientId: request.ClientId,
            invoiceNumber: invoiceNumber,
            issueDate: request.IssueDate,
            dueDate: request.DueDate,
            currency: request.Currency,
            subtotal: subtotal,
            taxAmount: taxAmount,
            discount: request.Discount,
            total: total,
            notes: request.Notes,
            items: request.Items.Select((item, index) => new InvoiceItem(
                description: item.Description,
                quantity: item.Quantity,
                unitPrice: item.UnitPrice,
                amount: item.Quantity * item.UnitPrice,
                sortOrder: index
            )).ToList()
        );

        _context.Invoices.Add(invoice);
        await _context.SaveChangesAsync(cancellationToken); // single round trip

        return new InvoiceCreatedDto
        {
            Id = invoice.Id,
            InvoiceNumber = invoice.InvoiceNumber,
            Total = invoice.Total
        };
    }
}
```

### Validator (FluentValidation)

```csharp
// Application/Features/Invoices/Commands/CreateInvoice/CreateInvoiceValidator.cs
namespace InvoMir.Application.Features.Invoices.Commands.CreateInvoice;

public sealed class CreateInvoiceValidator : AbstractValidator<CreateInvoiceCommand>
{
    public CreateInvoiceValidator()
    {
        RuleFor(x => x.ClientId)
            .NotEmpty().WithMessage("Client is required.");

        RuleFor(x => x.IssueDate)
            .NotEmpty().WithMessage("Issue date is required.");

        RuleFor(x => x.DueDate)
            .NotEmpty().WithMessage("Due date is required.")
            .GreaterThanOrEqualTo(x => x.IssueDate)
            .WithMessage("Due date must be on or after issue date.");

        RuleFor(x => x.Currency)
            .NotEmpty()
            .Length(3).WithMessage("Currency must be a 3-letter ISO code (e.g. USD).");

        RuleFor(x => x.TaxPercent)
            .InclusiveBetween(0, 100).WithMessage("Tax percent must be between 0 and 100.");

        RuleFor(x => x.Discount)
            .GreaterThanOrEqualTo(0).WithMessage("Discount cannot be negative.");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("At least one line item is required.")
            .Must(items => items.Count <= 100).WithMessage("Maximum 100 line items per invoice.");

        RuleForEach(x => x.Items).SetValidator(new InvoiceItemValidator());
    }
}

public sealed class InvoiceItemValidator : AbstractValidator<CreateInvoiceItemDto>
{
    public InvoiceItemValidator()
    {
        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Item description is required.")
            .MaximumLength(200);

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be greater than 0.");

        RuleFor(x => x.UnitPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Unit price cannot be negative.");
    }
}
```

### MediatR Validation Pipeline Behaviour

```csharp
// Application/Common/Behaviours/ValidationBehaviour.cs
public sealed class ValidationBehaviour<TRequest, TResponse>
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehaviour(IEnumerable<IValidator<TRequest>> validators)
    {
        _validators = validators;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (!_validators.Any()) return await next();

        var context = new ValidationContext<TRequest>(request);

        var failures = _validators
            .Select(v => v.Validate(context))
            .SelectMany(r => r.Errors)
            .Where(e => e is not null)
            .ToList();

        if (failures.Count > 0)
            throw new ValidationException(failures);

        return await next();
    }
}
```

---

## PART 6 — SECURITY (ZERO TOLERANCE)

### JWT Configuration

```csharp
// Infrastructure/Identity/JwtSettings.cs
public sealed class JwtSettings
{
    public string Secret { get; init; } = string.Empty;      // min 32 chars
    public string Issuer { get; init; } = string.Empty;
    public string Audience { get; init; } = string.Empty;
    public int AccessTokenExpiryMinutes { get; init; } = 15;  // SHORT — 15 min
    public int RefreshTokenExpiryDays { get; init; } = 7;
}

// Tokens Claims — always include TenantId
private ClaimsPrincipal BuildClaims(User user)
{
    var claims = new[]
    {
        new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
        new Claim(JwtRegisteredClaimNames.Email, user.Email),
        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        new Claim("tenant_id", user.TenantId.ToString()),    // ← Multi-tenancy heartbeat
        new Claim("plan", user.Plan.ToString()),
        new Claim(ClaimTypes.Role, user.Role.ToString()),
    };
    // ...
}
```

### Security Rules — Non-Negotiable

```
❌ NEVER log: passwords, tokens, card numbers, personal data
❌ NEVER store plaintext passwords — always BCrypt (cost factor 12)
❌ NEVER return stack traces to clients — global exception handler only
❌ NEVER trust client-provided IDs without verifying tenant ownership
❌ NEVER expose internal error messages in production
❌ NEVER use magic strings — always constants/enums
❌ NEVER commit secrets to Git — always environment variables
❌ NEVER allow negative amounts — validate at application layer
❌ NEVER skip cancellation tokens on async methods
```

### Global Exception Middleware

```csharp
// API/Middlewares/ExceptionHandlingMiddleware.cs
public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ValidationException ex)
        {
            await WriteResponse(context, 400,
                ApiResponse<object>.Fail(ex.Errors.Select(e => e.ErrorMessage)));
        }
        catch (NotFoundException ex)
        {
            await WriteResponse(context, 404, ApiResponse<object>.Fail(ex.Message));
        }
        catch (ForbiddenException ex)
        {
            await WriteResponse(context, 403, ApiResponse<object>.Fail(ex.Message));
        }
        catch (Exception ex)
        {
            // Log the real error — but never send it to the client
            _logger.LogError(ex, "Unhandled exception on {Path}", context.Request.Path);
            await WriteResponse(context, 500, ApiResponse<object>.Fail("An unexpected error occurred."));
        }
    }

    private static async Task WriteResponse(HttpContext context, int statusCode, object body)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = statusCode;
        await context.Response.WriteAsJsonAsync(body);
    }
}
```

### IDOR Prevention (Object-Level Authorization)

```csharp
// ❌ IDOR Vulnerability — attacker passes any Guid, gets any invoice
public async Task<Invoice> GetInvoice(Guid id)
{
    return await _context.Invoices.FindAsync(id); // no tenant check!
}

// ✅ Safe — Global query filter + explicit ownership check
// The global EF query filter already adds WHERE TenantId = X
// But for write operations, be explicit:
public async Task DeleteInvoice(Guid id, CancellationToken ct)
{
    var invoice = await _context.Invoices
        .FirstOrDefaultAsync(i => i.Id == id, ct); // TenantId filter applied automatically

    if (invoice is null)
        throw new NotFoundException(nameof(Invoice), id);

    // Additional status check — business rule
    if (invoice.Status == InvoiceStatus.Paid)
        throw new ForbiddenException("Cannot delete a paid invoice.");

    _context.Invoices.Remove(invoice);
    await _context.SaveChangesAsync(ct);
}
```

---

## PART 7 — CUSTOM EXCEPTIONS

```csharp
// Shared/Exceptions/NotFoundException.cs
public sealed class NotFoundException : Exception
{
    public NotFoundException(string entityName, object key)
        : base($"{entityName} with id '{key}' was not found.") { }
}

// Shared/Exceptions/ForbiddenException.cs
public sealed class ForbiddenException : Exception
{
    public ForbiddenException(string message) : base(message) { }
}

// Shared/Exceptions/ValidationException.cs — wraps FluentValidation errors
public sealed class ValidationException : Exception
{
    public IReadOnlyList<ValidationFailure> Errors { get; }

    public ValidationException(IEnumerable<ValidationFailure> failures)
        : base("One or more validation failures occurred.")
    {
        Errors = failures.ToList().AsReadOnly();
    }
}

// Shared/Exceptions/ConflictException.cs
public sealed class ConflictException : Exception
{
    public ConflictException(string message) : base(message) { }
}
```

---

## PART 8 — DEPENDENCY INJECTION REGISTRATION

```csharp
// Application/DependencyInjection.cs
public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly);
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehaviour<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(LoggingBehaviour<,>));
        });

        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        return services;
    }
}

// Infrastructure/DependencyInjection.cs
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Database
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                npgsql => npgsql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)
            ));

        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        // Tenant
        services.AddHttpContextAccessor();
        services.AddScoped<ITenantContext, TenantContext>();

        // Redis
        services.AddStackExchangeRedisCache(options =>
            options.Configuration = configuration.GetConnectionString("Redis"));

        // Settings
        services.Configure<JwtSettings>(configuration.GetSection("Jwt"));
        services.Configure<SendGridSettings>(configuration.GetSection("SendGrid"));

        // Services
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IEmailService, SendGridEmailService>();
        services.AddScoped<IPdfService, DinkToPdfService>();
        services.AddScoped<IInvoiceNumberService, InvoiceNumberService>();

        return services;
    }
}
```

---

## PART 9 — PERFORMANCE RULES

### Async/Await — Always

```csharp
// ❌ Blocks the thread — kills throughput at scale
public Invoice GetInvoice(Guid id) => _context.Invoices.Find(id);

// ✅ Releases thread back to pool while waiting for DB
public async Task<InvoiceDetailDto?> GetInvoiceAsync(Guid id, CancellationToken ct)
    => await _context.Invoices.Where(...).Select(...).FirstOrDefaultAsync(ct);
```

### Cancellation Tokens — Every Async Method

```csharp
// Every handler method signature:
public async Task<T> Handle(TRequest request, CancellationToken cancellationToken)

// Every EF query:
await _context.Invoices.ToListAsync(cancellationToken);
await _context.SaveChangesAsync(cancellationToken);
```

When a user closes their browser, the CancellationToken fires. Without it, the server keeps running the query — wasting database connections and CPU for a result nobody will receive.

### Database Index Strategy

Every column used in WHERE, ORDER BY, or JOIN must have an index. Define in IEntityTypeConfiguration:

```csharp
// Standard indexes for every TenantEntity
builder.HasIndex(e => e.TenantId);                              // base filter
builder.HasIndex(e => e.CreationTime);                          // date sorting
builder.HasIndex(e => new { e.TenantId, e.CreationTime });      // filtered + sorted
builder.HasIndex(e => new { e.TenantId, e.Status });            // filtered lists
```

---

## PART 10 — CLEAN CODE LAWS

```
✅ Method names: verb + noun (CreateInvoice, GetClientById, SendReminderEmail)
✅ Class names: noun (InvoiceService, TenantContext, CreateInvoiceHandler)
✅ Interface names: I + noun (IInvoiceRepository, ITenantContext)
✅ Max method length: 30 lines — if longer, extract
✅ Max parameters: 4 — if more, use a record/object
✅ Constants, not magic strings: InvoiceStatus.Draft not "draft"
✅ Records for DTOs and Commands (immutable by default)
✅ Sealed classes by default — open only when designed for inheritance
✅ private init over public set on entity properties
✅ One class per file, always

❌ No abbreviations: usr, inv, ctx — use user, invoice, context
❌ No commented-out code in commits
❌ No TODO comments in production code — create a tracked issue
❌ No static methods that touch the database
❌ No public fields — always properties
❌ No business logic in constructors
❌ No exceptions for control flow — exceptions are for exceptional situations
```

---

## PART 11 — SOLID PRINCIPLES (APPLIED TO INVOMIR)

**S — Single Responsibility**
`InvoiceService` sends invoices. `InvoiceNumberService` generates numbers. `PdfService` generates PDFs. Never merge these.

**O — Open/Closed**
Add a new payment method by implementing `IPaymentGateway` — never modify existing payment code.

**L — Liskov Substitution**
Any `IEmailService` implementation (SendGrid, Mailgun, mock for tests) is substitutable without breaking the caller.

**I — Interface Segregation**
`IInvoiceReader` (get, list) is separate from `IInvoiceWriter` (create, update, delete). Readers don't need write methods.

**D — Dependency Inversion**
`CreateInvoiceCommandHandler` depends on `IAppDbContext` (interface) — never on `AppDbContext` (concrete class). Tests can inject a mock.

---

## PART 12 — WHAT TO CHECK BEFORE EVERY CODE COMMIT

Before pushing any code, run through this checklist:

```
Security:
  □ Does every endpoint have [Authorize]? Is any intentionally public?
  □ Is TenantId filtering guaranteed by query filter or explicit check?
  □ Are all inputs validated by FluentValidation?
  □ Are secrets in environment variables, not appsettings.json?
  □ Are error messages generic (no stack traces, no schema info)?

Performance:
  □ Is AsNoTracking() on every read query?
  □ Is .Select() used instead of .Include()?
  □ Is pagination applied to every list endpoint?
  □ Does every async method accept CancellationToken?
  □ Are indexes defined for all WHERE/ORDER BY columns?

Architecture:
  □ Does the controller contain zero business logic?
  □ Is business logic in the handler, not the service?
  □ Does the domain entity have zero dependencies on EF/infrastructure?
  □ Is the response always ApiResponse<T>, never a raw entity?

Clean Code:
  □ Are method names clear verbs (not GetData, DoStuff)?
  □ Is there any duplicate code that should be extracted?
  □ Are all magic strings replaced with constants/enums?
  □ Does every public method have a single responsibility?
```

---

## PART 13 — WHAT NEVER GOES IN APPSETTINGS.JSON

```json
// ❌ NEVER commit this
{
  "Jwt": { "Secret": "my-actual-secret" },
  "ConnectionStrings": { "DefaultConnection": "Host=...;Password=actual" },
  "Stripe": { "SecretKey": "sk_live_..." },
  "SendGrid": { "ApiKey": "SG.actual..." }
}

// ✅ appsettings.json has structure, not values
{
  "Jwt": { "Secret": "", "Issuer": "invomir", "Audience": "invomir-users" },
  "ConnectionStrings": { "DefaultConnection": "" },
  "Stripe": { "SecretKey": "" },
  "SendGrid": { "ApiKey": "" }
}
// Real values go in: Railway environment variables / Azure Key Vault / .env (gitignored)
```

---

## QUICK REFERENCE — InvoMir-Specific Patterns

| Scenario | Pattern |
|---|---|
| Read single record | `.Where().Select(dto).AsNoTracking().FirstOrDefaultAsync()` |
| Read list | `.Where().Select(dto).AsNoTracking().Skip().Take().ToListAsync()` |
| Write record | Handler: validate → build entity → `_context.Add()` → `SaveChangesAsync()` |
| Verify ownership | Trust global query filter + `NotFoundException` if null |
| Return shape | Always `ApiResponse<T>` or `ApiResponse<PagedResult<T>>` |
| Validation | FluentValidation via MediatR pipeline — never in controller |
| Error | Throw domain exception → caught by global middleware |
| Tenant context | Injected via `ITenantContext` — never passed as parameter |
| Invoice number | `IInvoiceNumberService` — sequential per tenant (INV-001...) |
| Audit fields | `CreationTime`, creator/modifier/delete fields, soft delete, and concurrency stamp are set automatically in `SaveChangesAsync` |
