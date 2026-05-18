namespace InvoMir.Application.Features.Admin.DTOs;

public sealed record AdminUserListItemDto(
    Guid Id,
    Guid TenantId,
    string TenantName,
    string Email,
    string FirstName,
    string LastName,
    string Role,
    string Plan,
    bool IsTrialActive,
    DateTime? TrialEndsAt,
    DateTime? LastLoginAt,
    bool EmailVerified,
    bool IsActive,
    DateTime CreatedAt,
    int InvoiceCount,
    int PaidInvoiceCount,
    decimal TotalRevenue,
    string? StripeCustomerId);

public sealed record AdminUserDetailDto(
    Guid Id,
    Guid TenantId,
    string TenantName,
    string Email,
    string FirstName,
    string LastName,
    string Role,
    string Plan,
    bool IsTrialActive,
    DateTime? TrialEndsAt,
    DateTime? LastLoginAt,
    bool EmailVerified,
    bool IsActive,
    DateTime CreatedAt,
    string? StripeCustomerId,
    string? StripeCustomerUrl,
    string? StripeAccountId,
    AdminUserStatsDto Stats,
    IReadOnlyList<AdminUserInvoiceDto> Invoices,
    IReadOnlyList<AdminUserPlanHistoryDto> PlanHistory);

public sealed record AdminUserStatsDto(
    int InvoiceCount,
    int PaidInvoiceCount,
    int OverdueInvoiceCount,
    decimal TotalRevenue,
    decimal OutstandingAmount);

public sealed record AdminUserInvoiceDto(
    Guid Id,
    string InvoiceNumber,
    string ClientName,
    string Status,
    decimal Total,
    string Currency,
    DateOnly IssueDate,
    DateOnly DueDate,
    DateTime? SentAt,
    DateTime? PaidAt,
    DateTime CreatedAt);

public sealed record AdminUserPlanHistoryDto(
    string Source,
    string Plan,
    string Status,
    string? Interval,
    decimal? Amount,
    string? Currency,
    DateTime? CurrentPeriodStart,
    DateTime? CurrentPeriodEnd,
    string? StripeSubscriptionId,
    DateTime ChangedAt);

public sealed record AdminUserPlanUpdateDto(
    Guid Id,
    Guid TenantId,
    string Plan,
    string TenantPlan);

public sealed record AdminUserTrialUpdateDto(
    Guid Id,
    Guid TenantId,
    DateTime TrialEndsAt,
    DateTime? TenantTrialEndsAt,
    bool IsTrialActive);
