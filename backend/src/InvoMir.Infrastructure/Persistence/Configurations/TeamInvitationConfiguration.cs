namespace InvoMir.Infrastructure.Persistence.Configurations;

public sealed class TeamInvitationConfiguration : IEntityTypeConfiguration<TeamInvitation>
{
    public void Configure(EntityTypeBuilder<TeamInvitation> builder)
    {
        builder.ToTable("team_invitations");
        builder.HasKey(invitation => invitation.Id);
        builder.ConfigureTenantEntity();

        builder.Property(invitation => invitation.InvitedByUserId).IsRequired();
        builder.Property(invitation => invitation.Email).HasMaxLength(255).IsRequired();
        builder.Property(invitation => invitation.Role).HasMaxLength(20).IsRequired();
        builder.Property(invitation => invitation.TokenHash).HasMaxLength(128).IsRequired();
        builder.Property(invitation => invitation.Status).HasMaxLength(30).IsRequired();
        builder.Property(invitation => invitation.ExpiresAt).IsRequired();
        builder.Property(invitation => invitation.AcceptedAt);

        builder.HasIndex(invitation => invitation.TokenHash).IsUnique();
        builder.HasIndex(invitation => invitation.TenantId);
        builder.HasIndex(invitation => new { invitation.TenantId, invitation.Email, invitation.Status });
        builder.HasIndex(invitation => new { invitation.TenantId, invitation.Status, invitation.ExpiresAt });
        builder.HasIndex(invitation => new { invitation.TenantId, invitation.InvitedByUserId });

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(invitation => invitation.InvitedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
