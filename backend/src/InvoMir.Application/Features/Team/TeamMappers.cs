using InvoMir.Application.Features.Team.DTOs;

namespace InvoMir.Application.Features.Team;

internal static class TeamMappers
{
    public static TeamMemberDto ToMemberDto(User user)
    {
        return new TeamMemberDto(
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            user.Role,
            user.Plan,
            user.IsActive,
            user.EmailVerified,
            user.LastLoginAt,
            user.CreationTime);
    }

    public static TeamInvitationDto ToInvitationDto(
        TeamInvitation invitation,
        string? invitedByName)
    {
        return new TeamInvitationDto(
            invitation.Id,
            invitation.InvitedByUserId,
            string.IsNullOrWhiteSpace(invitedByName) ? "Unknown" : invitedByName,
            invitation.Email,
            invitation.Role,
            invitation.Status,
            invitation.ExpiresAt,
            invitation.AcceptedAt,
            invitation.CreationTime);
    }
}
