import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { layout } from '@/src/constants/layout';
import { teamApi } from '@/src/features/team/api/team-api';
import { TeamInvitationDto, TeamMemberDto, TeamRole } from '@/src/features/team/types';
import { queryKeys } from '@/src/services/api/query-keys';
import { useAuthStore } from '@/src/store/auth-store';
import { theme } from '@/src/theme/theme';

const businessSeatLimit = 3;
const roleOptions: readonly TeamRole[] = ['member', 'admin', 'owner'];
const emptyMembers: readonly TeamMemberDto[] = [];
const emptyInvitations: readonly TeamInvitationDto[] = [];

type TeamRow =
  | { kind: 'section'; key: string; title: string }
  | { kind: 'empty'; key: string; message: string }
  | { kind: 'member'; key: string; member: TeamMemberDto }
  | { kind: 'invitation'; key: string; invitation: TeamInvitationDto };

export default function SettingsTeamScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);
  const plan = authUser?.plan?.toString().toLowerCase() ?? 'free';
  const isBusinessPlan = plan === 'business';
  const [inviteFormVisible, setInviteFormVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('member');
  const [localError, setLocalError] = useState('');

  const membersQuery = useQuery({
    queryKey: queryKeys.teamMembers,
    queryFn: teamApi.listMembers,
    enabled: isBusinessPlan,
  });
  const invitationsQuery = useQuery({
    queryKey: queryKeys.teamInvitations,
    queryFn: teamApi.listInvitations,
    enabled: isBusinessPlan,
  });

  const members = membersQuery.data ?? emptyMembers;
  const pendingInvitations = (invitationsQuery.data ?? emptyInvitations).filter(
    (invitation) => invitation.status?.toString().toLowerCase() === 'pending',
  );
  const usedSeats = members.filter((member) => member.isActive).length + pendingInvitations.length;
  const remainingSeats = Math.max(0, businessSeatLimit - usedSeats);
  const seatsFull = remainingSeats <= 0;
  const isLoading = membersQuery.isLoading || invitationsQuery.isLoading;
  const queryError =
    membersQuery.isError || invitationsQuery.isError
      ? getErrorMessage(membersQuery.error ?? invitationsQuery.error)
      : '';

  const rows = useMemo<TeamRow[]>(() => {
    const memberRows: TeamRow[] = members.length
      ? members.map((member) => ({ kind: 'member', key: `member-${member.id}`, member }))
      : [{ kind: 'empty', key: 'members-empty', message: 'No active members found.' }];
    const invitationRows: TeamRow[] = pendingInvitations.length
      ? pendingInvitations.map((invitation) => ({
          kind: 'invitation',
          key: `invitation-${invitation.id}`,
          invitation,
        }))
      : [{ kind: 'empty', key: 'invitations-empty', message: 'No pending invitations.' }];

    return [
      { kind: 'section', key: 'members-heading', title: 'Active Members' },
      ...memberRows,
      { kind: 'section', key: 'invitations-heading', title: 'Pending Invitations' },
      ...invitationRows,
    ];
  }, [members, pendingInvitations]);

  const refreshTeam = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.teamMembers }),
      queryClient.invalidateQueries({ queryKey: queryKeys.teamInvitations }),
    ]);
  };

  const inviteMutation = useMutation({
    mutationFn: teamApi.inviteMember,
    async onSuccess() {
      setInviteEmail('');
      setInviteRole('member');
      setInviteFormVisible(false);
      await refreshTeam();
    },
  });
  const removeMutation = useMutation({
    mutationFn: teamApi.removeMember,
    onSuccess: refreshTeam,
  });
  const cancelMutation = useMutation({
    mutationFn: teamApi.cancelInvitation,
    onSuccess: refreshTeam,
  });

  const inviteMember = () => {
    const email = inviteEmail.trim().toLowerCase();
    setLocalError('');

    if (!email || !email.includes('@')) {
      setLocalError('Enter a valid email address.');
      return;
    }

    if (seatsFull) {
      setLocalError('All 3 seats are used. Remove a member to invite someone new.');
      return;
    }

    inviteMutation.mutate({ email, role: inviteRole });
  };

  const removeMember = (member: TeamMemberDto) => {
    confirmAction(`Remove ${formatMemberName(member)} from this workspace?`, () => {
      removeMutation.mutate(member.id);
    });
  };

  const cancelInvitation = (invitation: TeamInvitationDto) => {
    confirmAction(`Cancel invitation for ${invitation.email}?`, () => {
      cancelMutation.mutate(invitation.id);
    });
  };

  if (!isBusinessPlan) {
    return (
      <View style={styles.screenShell}>
        <View style={styles.screen}>
          <View style={styles.upgradeWall}>
            <View style={styles.upgradeIcon}>
              <Ionicons name="lock-closed-outline" size={19} color={theme.colors.textPrimary} />
            </View>
            <Text style={styles.title}>Team Collaboration</Text>
            <Text style={styles.subtitle}>Invite team members and manage access together.</Text>
            <Text style={styles.planNote}>Available on the Business plan ($49/mo)</Text>
            <View style={styles.featureList}>
              <UpgradeFeature label="3 team seats included" />
              <UpgradeFeature label="Role-based access" />
              <UpgradeFeature label="Invite members by email" />
              <UpgradeFeature label="Revoke access anytime" />
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => router.push('/subscriptions')}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Upgrade to Business</Text>
            </TouchableOpacity>
            <Text style={styles.currentPlan}>Current plan: {formatPlanLabel(plan)}</Text>
          </View>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.screenShell}>
        <View style={[styles.screen, styles.centeredState]}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={styles.stateText}>Loading team members...</Text>
        </View>
      </View>
    );
  }

  if (queryError) {
    return (
      <View style={styles.screenShell}>
        <View style={[styles.screen, styles.centeredState]}>
          <Text style={styles.title}>Team Members</Text>
          <Text style={styles.errorText}>{queryError}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => {
              void membersQuery.refetch();
              void invitationsQuery.refetch();
            }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screenShell}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.key}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.headingRow}>
              <View style={styles.headingCopy}>
                <Text style={styles.title}>Team Members</Text>
                <Text style={styles.subtitle}>Manage workspace access for your team.</Text>
              </View>
              <View style={styles.seatBadge}>
                <Text style={styles.seatBadgeText}>
                  {usedSeats} / {businessSeatLimit} seats
                </Text>
              </View>
            </View>

            {seatsFull ? (
              <View style={styles.warningBanner}>
                <Text style={styles.warningText}>
                  All 3 seats are used. Remove a member to invite someone new.
                </Text>
              </View>
            ) : null}

            {(localError || inviteMutation.isError || removeMutation.isError || cancelMutation.isError) ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>
                  {localError ||
                    getErrorMessage(inviteMutation.error) ||
                    getErrorMessage(removeMutation.error) ||
                    getErrorMessage(cancelMutation.error)}
                </Text>
              </View>
            ) : null}

            {inviteFormVisible ? (
              <View style={styles.inviteForm}>
                <Text style={styles.cardTitle}>Invite Member</Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!inviteMutation.isPending}
                  keyboardType="email-address"
                  onChangeText={setInviteEmail}
                  placeholder="member@company.com"
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.input}
                  value={inviteEmail}
                />
                <View style={styles.roleRow}>
                  {roleOptions.map((role) => (
                    <TouchableOpacity
                      accessibilityRole="button"
                      key={role}
                      disabled={inviteMutation.isPending}
                      onPress={() => setInviteRole(role)}
                      style={[styles.roleButton, inviteRole === role ? styles.roleButtonActive : null]}
                    >
                      <Text
                        style={[
                          styles.roleButtonText,
                          inviteRole === role ? styles.roleButtonTextActive : null,
                        ]}
                      >
                        {formatPlanLabel(role)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.formActions}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    disabled={inviteMutation.isPending}
                    onPress={() => setInviteFormVisible(false)}
                    style={styles.secondaryButton}
                  >
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    disabled={inviteMutation.isPending || seatsFull}
                    onPress={inviteMember}
                    style={[
                      styles.primaryButton,
                      styles.formSubmitButton,
                      (inviteMutation.isPending || seatsFull) ? styles.disabledButton : null,
                    ]}
                  >
                    {inviteMutation.isPending ? (
                      <ActivityIndicator color={theme.colors.white} />
                    ) : (
                      <Text style={styles.primaryButtonText}>Send Invite</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                accessibilityRole="button"
                disabled={seatsFull}
                onPress={() => setInviteFormVisible(true)}
                style={[styles.primaryButton, seatsFull ? styles.disabledButton : null]}
              >
                <Text style={styles.primaryButtonText}>Invite Member</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => {
          if (item.kind === 'section') {
            return <Text style={styles.sectionTitle}>{item.title}</Text>;
          }

          if (item.kind === 'empty') {
            return <Text style={styles.emptyText}>{item.message}</Text>;
          }

          if (item.kind === 'member') {
            return (
              <TeamCard
                title={formatMemberName(item.member)}
                subtitle={item.member.email}
                badge={formatPlanLabel(item.member.role)}
                actionLabel={canRemoveMember(item.member) ? 'Remove' : undefined}
                destructive
                disabled={removeMutation.isPending}
                onAction={() => removeMember(item.member)}
              />
            );
          }

          return (
            <TeamCard
              title={item.invitation.email}
              subtitle={`Invited as ${formatPlanLabel(item.invitation.role)}`}
              badge="Pending"
              actionLabel="Cancel"
              destructive
              disabled={cancelMutation.isPending}
              onAction={() => cancelInvitation(item.invitation)}
            />
          );
        }}
        style={styles.screen}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

function UpgradeFeature({ label }: { label: string }) {
  return (
    <View style={styles.featureItem}>
      <Ionicons name="checkmark" size={16} color={theme.colors.textPrimary} />
      <Text style={styles.featureText}>{label}</Text>
    </View>
  );
}

function TeamCard({
  title,
  subtitle,
  badge,
  actionLabel,
  destructive = false,
  disabled = false,
  onAction,
}: {
  title: string;
  subtitle: string;
  badge: string;
  actionLabel?: string;
  destructive?: boolean;
  disabled?: boolean;
  onAction?: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardCopy}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <View style={styles.cardMeta}>
        <View style={styles.smallBadge}>
          <Text style={styles.smallBadgeText}>{badge}</Text>
        </View>
        {actionLabel && onAction ? (
          <TouchableOpacity
            accessibilityRole="button"
            disabled={disabled}
            onPress={onAction}
            style={[styles.actionButton, destructive ? styles.actionButtonDanger : null]}
          >
            <Text style={[styles.actionButtonText, destructive ? styles.actionButtonTextDanger : null]}>
              {actionLabel}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

function confirmAction(message: string, onConfirm: () => void) {
  Alert.alert('Confirm Action', message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Confirm', style: 'destructive', onPress: onConfirm },
  ]);
}

function formatMemberName(member: TeamMemberDto): string {
  const fullName = `${member.firstName} ${member.lastName}`.trim();
  return fullName || member.email;
}

function formatPlanLabel(value: string): string {
  if (!value) {
    return 'Free';
  }

  return value
    .split('_')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function canRemoveMember(member: TeamMemberDto): boolean {
  const role = member.role?.toString().toLowerCase();
  return role !== 'owner' && role !== 'system_admin';
}

function getErrorMessage(error: unknown): string {
  if (!error) {
    return '';
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message ?? 'Team request failed.');
  }

  return 'Team request failed.';
}

const styles = StyleSheet.create({
  screenShell: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  screen: {
    flex: 1,
    maxWidth: Platform.OS === 'web' ? layout.mobileShellMaxWidth : undefined,
    width: '100%',
  },
  listContent: {
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    paddingBottom: layout.bottomTabOverlayHeight + theme.spacing.lg,
  },
  listHeader: {
    gap: theme.spacing.sm,
  },
  headingRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  headingCopy: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  planNote: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: theme.spacing.xs,
  },
  seatBadge: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  seatBadgeText: {
    color: theme.colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  upgradeWall: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  upgradeIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.xl,
    height: 42,
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    width: 52,
  },
  featureList: {
    alignSelf: 'stretch',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    gap: theme.spacing.xs,
    marginVertical: theme.spacing.md,
    padding: theme.spacing.md,
  },
  featureItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  featureText: {
    color: theme.colors.textPrimary,
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  currentPlan: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: theme.spacing.sm,
  },
  centeredState: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  stateText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: theme.spacing.md,
  },
  card: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    ...theme.shadows.card,
  },
  cardCopy: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  cardTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  cardMeta: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  smallBadge: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
  },
  smallBadgeText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  actionButton: {
    borderColor: theme.colors.border,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  actionButtonDanger: {
    backgroundColor: theme.colors.errorLight,
    borderColor: theme.colors.errorLight,
  },
  actionButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  actionButtonTextDanger: {
    color: theme.colors.error,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.large,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.large,
    borderWidth: 1,
    flex: 1,
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  secondaryButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  disabledButton: {
    backgroundColor: theme.colors.disabled,
  },
  warningBanner: {
    backgroundColor: theme.colors.warningLight,
    borderColor: theme.colors.warning,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    padding: theme.spacing.md,
  },
  warningText: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  errorBanner: {
    backgroundColor: theme.colors.errorLight,
    borderColor: theme.colors.error,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    padding: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    textAlign: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    padding: theme.spacing.md,
    textAlign: 'center',
  },
  inviteForm: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.large,
    borderWidth: 1,
    color: theme.colors.textPrimary,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
  },
  roleRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  roleButton: {
    alignItems: 'center',
    borderColor: theme.colors.border,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    flex: 1,
    minHeight: 38,
    justifyContent: 'center',
  },
  roleButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  roleButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  roleButtonTextActive: {
    color: theme.colors.white,
  },
  formActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  formSubmitButton: {
    flex: 1,
  },
});
