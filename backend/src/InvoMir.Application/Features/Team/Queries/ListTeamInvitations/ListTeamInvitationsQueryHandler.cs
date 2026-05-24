using InvoMir.Application.Features.Team.DTOs;

namespace InvoMir.Application.Features.Team.Queries.ListTeamInvitations;

public sealed class ListTeamInvitationsQueryHandler(IAppDbContext context)
    : IRequestHandler<ListTeamInvitationsQuery, IReadOnlyList<TeamInvitationDto>>
{
    public async Task<IReadOnlyList<TeamInvitationDto>> Handle(
        ListTeamInvitationsQuery request,
        CancellationToken cancellationToken)
    {
        var utcNow = DateTime.UtcNow;

        return await context.TeamInvitations
            .AsNoTracking()
            .Where(invitation =>
                invitation.Status == TeamConstants.InvitationStatuses.Pending &&
                invitation.ExpiresAt > utcNow)
            .OrderBy(invitation => invitation.ExpiresAt)
            .Select(invitation => new TeamInvitationDto(
                invitation.Id,
                invitation.InvitedByUserId,
                context.Users
                    .IgnoreQueryFilters()
                    .Where(user => user.Id == invitation.InvitedByUserId && !user.IsDeleted)
                    .Select(user => (user.FirstName + " " + user.LastName).Trim())
                    .FirstOrDefault() ?? "Unknown",
                invitation.Email,
                invitation.Role,
                invitation.Status,
                invitation.ExpiresAt,
                invitation.AcceptedAt,
                invitation.CreationTime))
            .ToListAsync(cancellationToken);
    }
}
