namespace InvoMir.Application.Features.Team.DTOs;

public sealed record TeamMemberDto(
    Guid Id,
    string Email,
    string FirstName,
    string LastName,
    string Role,
    string Plan,
    bool IsActive,
    bool EmailVerified,
    DateTime? LastLoginAt,
    DateTime CreatedAt);

public sealed record TeamInvitationDto(
    Guid Id,
    Guid InvitedByUserId,
    string InvitedByName,
    string Email,
    string Role,
    string Status,
    DateTime ExpiresAt,
    DateTime? AcceptedAt,
    DateTime CreatedAt);

public sealed record TeamInvitationAcceptedDto(
    Guid UserId,
    Guid TenantId,
    string Email,
    string FirstName,
    string LastName,
    string Role);

public sealed record TeamMemberRoleUpdateDto(
    Guid Id,
    string Email,
    string FirstName,
    string LastName,
    string Role);
