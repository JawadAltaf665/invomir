using InvoMir.Application.Features.Admin.DTOs;

namespace InvoMir.Application.Features.Admin.Users.Queries.GetAdminUser;

public sealed record GetAdminUserQuery(Guid Id) : IRequest<AdminUserDetailDto>;
