using InvoMir.Application.Features.Team.DTOs;

namespace InvoMir.Application.Features.Team.Queries.ListTeamMembers;

public sealed class ListTeamMembersQueryHandler(IAppDbContext context)
    : IRequestHandler<ListTeamMembersQuery, IReadOnlyList<TeamMemberDto>>
{
    public async Task<IReadOnlyList<TeamMemberDto>> Handle(
        ListTeamMembersQuery request,
        CancellationToken cancellationToken)
    {
        return await context.Users
            .AsNoTracking()
            .Where(user => user.IsActive)
            .OrderBy(user => user.Role == AuthConstants.Roles.Owner
                ? 0
                : user.Role == AuthConstants.Roles.Admin
                    ? 1
                    : 2)
            .ThenBy(user => user.CreationTime)
            .Select(user => new TeamMemberDto(
                user.Id,
                user.Email,
                user.FirstName,
                user.LastName,
                user.Role,
                user.Plan,
                user.IsActive,
                user.EmailVerified,
                user.LastLoginAt,
                user.CreationTime))
            .ToListAsync(cancellationToken);
    }
}
