namespace InvoMir.Application.Features.Team;

internal static class TeamAccess
{
    public static async Task<User> GetCurrentActiveUserAsync(
        IAppDbContext context,
        ICurrentUserContext currentUserContext,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var user = await context.Users
            .FirstOrDefaultAsync(currentUser =>
                currentUser.Id == userId &&
                currentUser.IsActive,
                cancellationToken);

        return user ?? throw new UnauthorizedAccessException("User context is not available.");
    }

    public static void EnsureOwner(User user)
    {
        if (user.Role != AuthConstants.Roles.Owner)
            throw new ForbiddenException("Only the workspace owner can manage team members.");
    }
}
