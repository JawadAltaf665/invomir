using System.Text.Json.Serialization;

namespace InvoMir.Application.Features.Admin.DTOs;

public sealed record AdminUserListItemDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("tenantId")] Guid TenantId,
    [property: JsonPropertyName("tenantName")] string TenantName,
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("firstName")] string FirstName,
    [property: JsonPropertyName("lastName")] string LastName,
    [property: JsonPropertyName("role")] string Role,
    [property: JsonPropertyName("plan")] string Plan,
    [property: JsonPropertyName("isTrialActive")] bool IsTrialActive,
    [property: JsonPropertyName("trialEndsAt")] DateTime? TrialEndsAt,
    [property: JsonPropertyName("lastLoginAt")] DateTime? LastLoginAt,
    [property: JsonPropertyName("emailVerified")] bool EmailVerified,
    [property: JsonPropertyName("isActive")] bool IsActive,
    [property: JsonPropertyName("createdAt")] DateTime CreatedAt,
    [property: JsonPropertyName("invoiceCount")] int InvoiceCount,
    [property: JsonPropertyName("paidInvoiceCount")] int PaidInvoiceCount,
    [property: JsonPropertyName("totalRevenue")] decimal TotalRevenue,
    [property: JsonPropertyName("stripeCustomerId")] string? StripeCustomerId);

public sealed record AdminUserDetailDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("tenantId")] Guid TenantId,
    [property: JsonPropertyName("tenantName")] string TenantName,
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("firstName")] string FirstName,
    [property: JsonPropertyName("lastName")] string LastName,
    [property: JsonPropertyName("role")] string Role,
    [property: JsonPropertyName("plan")] string Plan,
    [property: JsonPropertyName("isTrialActive")] bool IsTrialActive,
    [property: JsonPropertyName("trialEndsAt")] DateTime? TrialEndsAt,
    [property: JsonPropertyName("lastLoginAt")] DateTime? LastLoginAt,
    [property: JsonPropertyName("emailVerified")] bool EmailVerified,
    [property: JsonPropertyName("isActive")] bool IsActive,
    [property: JsonPropertyName("createdAt")] DateTime CreatedAt,
    [property: JsonPropertyName("stripeCustomerId")] string? StripeCustomerId,
    [property: JsonPropertyName("stripeCustomerUrl")] string? StripeCustomerUrl,
    [property: JsonPropertyName("stripeAccountId")] string? StripeAccountId,
    [property: JsonPropertyName("stats")] AdminUserStatsDto Stats,
    [property: JsonPropertyName("invoices")] IReadOnlyList<AdminUserInvoiceDto> Invoices,
    [property: JsonPropertyName("planHistory")] IReadOnlyList<AdminUserPlanHistoryDto> PlanHistory);

public sealed record AdminUserStatsDto(
    [property: JsonPropertyName("invoiceCount")] int InvoiceCount,
    [property: JsonPropertyName("paidInvoiceCount")] int PaidInvoiceCount,
    [property: JsonPropertyName("overdueInvoiceCount")] int OverdueInvoiceCount,
    [property: JsonPropertyName("totalRevenue")] decimal TotalRevenue,
    [property: JsonPropertyName("outstandingAmount")] decimal OutstandingAmount);

public sealed record AdminUserInvoiceDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("invoiceNumber")] string InvoiceNumber,
    [property: JsonPropertyName("clientName")] string ClientName,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("total")] decimal Total,
    [property: JsonPropertyName("currency")] string Currency,
    [property: JsonPropertyName("issueDate")] DateOnly IssueDate,
    [property: JsonPropertyName("dueDate")] DateOnly DueDate,
    [property: JsonPropertyName("sentAt")] DateTime? SentAt,
    [property: JsonPropertyName("paidAt")] DateTime? PaidAt,
    [property: JsonPropertyName("createdAt")] DateTime CreatedAt);

public sealed record AdminUserPlanHistoryDto(
    [property: JsonPropertyName("source")] string Source,
    [property: JsonPropertyName("plan")] string Plan,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("interval")] string? Interval,
    [property: JsonPropertyName("amount")] decimal? Amount,
    [property: JsonPropertyName("currency")] string? Currency,
    [property: JsonPropertyName("currentPeriodStart")] DateTime? CurrentPeriodStart,
    [property: JsonPropertyName("currentPeriodEnd")] DateTime? CurrentPeriodEnd,
    [property: JsonPropertyName("stripeSubscriptionId")] string? StripeSubscriptionId,
    [property: JsonPropertyName("changedAt")] DateTime ChangedAt);

public sealed record AdminUserPlanUpdateDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("tenantId")] Guid TenantId,
    [property: JsonPropertyName("plan")] string Plan,
    [property: JsonPropertyName("tenantPlan")] string TenantPlan);

public sealed record AdminUserTrialUpdateDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("tenantId")] Guid TenantId,
    [property: JsonPropertyName("trialEndsAt")] DateTime TrialEndsAt,
    [property: JsonPropertyName("tenantTrialEndsAt")] DateTime? TenantTrialEndsAt,
    [property: JsonPropertyName("isTrialActive")] bool IsTrialActive);
