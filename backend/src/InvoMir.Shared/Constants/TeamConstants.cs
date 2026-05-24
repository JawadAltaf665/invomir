namespace InvoMir.Shared.Constants;

public static class TeamConstants
{
    public const int InvitationExpiryDays = 7;
    public const int BusinessSeatLimit = 3;

    public static class InvitationStatuses
    {
        public const string Pending = "pending";
        public const string Accepted = "accepted";
        public const string Expired = "expired";
        public const string Cancelled = "cancelled";

        public static readonly string[] All =
        [
            Pending,
            Accepted,
            Expired,
            Cancelled
        ];
    }

    public static class Roles
    {
        public static readonly string[] Manageable =
        [
            AuthConstants.Roles.Owner,
            AuthConstants.Roles.Admin,
            AuthConstants.Roles.Member
        ];
    }
}
