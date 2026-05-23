using InvoMir.Application.Features.Team.DTOs;

namespace InvoMir.Application.Features.Team.Queries.ListTeamMembers;

public sealed record ListTeamMembersQuery : IRequest<IReadOnlyList<TeamMemberDto>>;
