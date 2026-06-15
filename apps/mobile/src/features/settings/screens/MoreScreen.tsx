import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ReactNode, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppBadge } from '@/src/components/common/AppBadge';
import { AppButton } from '@/src/components/common/AppButton';
import { AppCard } from '@/src/components/common/AppCard';
import { AppText } from '@/src/components/common/AppText';
import { UserAvatar } from '@/src/components/common/UserAvatar';
import { ErrorState } from '@/src/components/feedback/ErrorState';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { AppHeader } from '@/src/components/layout/AppHeader';
import { AppScreen } from '@/src/components/layout/AppScreen';
import { layout } from '@/src/constants/layout';
import { currencyHelpers, SupportedCurrency, supportedCurrencies } from '@/src/constants/currencies';
import { getLanguageOption, supportedLanguages } from '@/src/constants/languages';
import { authApi } from '@/src/features/auth/api/auth-api';
import { notificationsApi } from '@/src/features/notifications/api/notifications-api';
import { settingsApi } from '@/src/features/settings/api/settings-api';
import { teamApi } from '@/src/features/team/api/team-api';
import { queryKeys } from '@/src/services/api/query-keys';
import { useAuthStore } from '@/src/store/auth-store';
import { theme } from '@/src/theme/theme';
import { i18n } from '@/src/translations/i18n';
import { permissions } from '@/src/types/permissions';

type IconName = keyof typeof Ionicons.glyphMap;
type SelectorKind = 'language' | 'currency';

export function MoreScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selector, setSelector] = useState<SelectorKind | null>(null);
  const clearLocalSession = useAuthStore((state) => state.clearLocalSession);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const authUser = useAuthStore((state) => state.user);
  const canViewNotifications = hasPermission(permissions.notification.view);
  const canViewSubscription = hasPermission(permissions.subscription.view);
  const plan = authUser?.plan?.toString().toLowerCase() ?? 'free';
  const isBusinessPlan = plan === 'business';
  const profileQuery = useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: settingsApi.getCurrentUser,
  });
  const teamMembersQuery = useQuery({
    queryKey: queryKeys.teamMembers,
    queryFn: teamApi.listMembers,
    enabled: isBusinessPlan,
  });
  const teamInvitationsQuery = useQuery({
    queryKey: queryKeys.teamInvitations,
    queryFn: teamApi.listInvitations,
    enabled: isBusinessPlan,
  });
  const languageQuery = useQuery({
    queryKey: queryKeys.language,
    queryFn: settingsApi.getLanguage,
  });
  const unreadCountQuery = useQuery({
    queryKey: queryKeys.unreadNotificationCount,
    queryFn: notificationsApi.getUnreadCount,
    enabled: canViewNotifications,
  });
  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout({ allDevices: false }),
    async onSettled() {
      await clearLocalSession();
      queryClient.clear();
      router.replace('/welcome');
    },
  });
  const languageMutation = useMutation({
    mutationFn: settingsApi.updateLanguage,
    async onSuccess(preference) {
      queryClient.setQueryData(queryKeys.language, preference);
      await queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
      await i18n.changeLanguage(preference.language);
      setSelector(null);
    },
  });
  const currencyMutation = useMutation({
    mutationFn: (currency: SupportedCurrency) => {
      if (!profile) {
        throw new Error(t('more.profileUnavailable'));
      }

      return settingsApi.updateCurrentUser({
        businessName: profile.businessName,
        currency,
        taxPercent: profile.taxPercent,
      });
    },
    async onSuccess(updatedProfile) {
      queryClient.setQueryData(queryKeys.currentUser, updatedProfile);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: ['invoices'] }),
        queryClient.invalidateQueries({ queryKey: ['clients'] }),
        queryClient.invalidateQueries({ queryKey: ['reports'] }),
      ]);
      setSelector(null);
    },
  });

  const profile = profileQuery.data;
  const language = getLanguageOption(languageQuery.data?.language ?? profile?.preferredLanguage);
  const currentCurrency = normalizeCurrency(profile?.currency);
  const pendingInvitations = (teamInvitationsQuery.data ?? []).filter(
    (invitation) => invitation.status?.toString().toLowerCase() === 'pending',
  );
  const teamSeatsUsed = (teamMembersQuery.data ?? []).filter((member) => member.isActive).length + pendingInvitations.length;
  const teamRowValue = isBusinessPlan
    ? teamMembersQuery.isLoading || teamInvitationsQuery.isLoading
      ? t('common.loading')
      : `${teamSeatsUsed} / 3 seats`
    : 'Business plan only';
  const isSavingPreference = languageMutation.isPending || currencyMutation.isPending;

  return (
    <AppScreen>
      <AppHeader title={t('more.settings')} subtitle={profile?.businessName ?? t('more.workspace')} />
      {profileQuery.isLoading ? <LoadingState rows={4} /> : null}
      {profileQuery.isError ? (
        <ErrorState message={profileQuery.error.message} onRetry={() => profileQuery.refetch()} />
      ) : null}
      {languageMutation.isError ? <ErrorState message={languageMutation.error.message} /> : null}
      {currencyMutation.isError ? <ErrorState message={currencyMutation.error.message} /> : null}
      {profile ? (
        <>
          <AppCard style={styles.profileCard}>
            <UserAvatar
              firstName={profile.firstName}
              lastName={profile.lastName}
              imageUrl={profile.profilePictureUrl}
              cacheKey={`${profile.id}-${profile.profilePictureUrl ?? ''}`}
              size={42}
            />
            <View style={styles.profileCopy}>
              <AppText variant="label" numberOfLines={1}>
                {profile.firstName} {profile.lastName}
              </AppText>
              <AppText variant="caption" color={theme.colors.textSecondary} numberOfLines={1}>
                {profile.email}
              </AppText>
            </View>
            <AppBadge foreground={theme.colors.primaryDark} background={theme.colors.primaryLight}>
              {profile.plan}
            </AppBadge>
          </AppCard>

          <View style={styles.section}>
            <SettingsRow
              iconName="business-outline"
              title={t('more.companyProfile')}
              value={profile.businessName}
            />
            <SettingsRow
              iconName="card-outline"
              title={t('more.subscription')}
              value={profile.plan}
              onPress={canViewSubscription ? () => router.push('/subscriptions') : undefined}
            />
            <SettingsRow
              iconName={isBusinessPlan ? 'people-outline' : 'lock-closed-outline'}
              title="Team Members"
              value={teamRowValue}
              onPress={() => router.push('/settings-team')}
            />
            <SettingsRow
              iconName="language-outline"
              title={t('more.language')}
              value={languageQuery.isLoading || languageMutation.isPending ? t('common.loading') : language.label}
              onPress={() => setSelector('language')}
            />
            <SettingsRow
              iconName="cash-outline"
              title={t('more.currency')}
              value={currencyMutation.isPending ? t('common.loading') : currentCurrency}
              onPress={() => setSelector('currency')}
            />
            <SettingsRow
              iconName="calculator-outline"
              title={t('more.taxSettings')}
              value={t('more.taxValue', { value: profile.taxPercent })}
            />
            <SettingsRow
              iconName="notifications-outline"
              title={t('more.notifications')}
              value={
                canViewNotifications
                  ? t('more.unreadNotifications', { count: unreadCountQuery.data?.count ?? 0 })
                  : t('states.permissionTitle')
              }
              onPress={() => router.push('/notifications')}
            />
            <SettingsRow
              iconName="help-circle-outline"
              title={t('more.help')}
            />
          </View>
        </>
      ) : null}

      <AppButton
        title={t('common.logout')}
        iconName="log-out-outline"
        variant="danger"
        isLoading={logoutMutation.isPending}
        onPress={() => logoutMutation.mutate()}
      />

      <OptionSheet
        visible={selector === 'language'}
        title={t('more.chooseLanguage')}
        isSaving={isSavingPreference}
        onClose={() => setSelector(null)}
      >
        {supportedLanguages.map((option) => (
          <OptionRow
            key={option.code}
            label={option.label}
            helper={option.code}
            selected={language.code === option.code}
            disabled={isSavingPreference}
            onPress={() => languageMutation.mutate({ language: option.code })}
          />
        ))}
      </OptionSheet>

      <OptionSheet
        visible={selector === 'currency'}
        title={t('more.chooseCurrency')}
        isSaving={isSavingPreference}
        onClose={() => setSelector(null)}
      >
        {supportedCurrencies.map((currency) => (
          <OptionRow
            key={currency}
            label={currency}
            helper={currencyHelpers[currency]}
            selected={currentCurrency === currency}
            disabled={isSavingPreference}
            onPress={() => currencyMutation.mutate(currency)}
          />
        ))}
      </OptionSheet>
    </AppScreen>
  );
}

function OptionSheet({
  visible,
  title,
  isSaving,
  children,
  onClose,
}: {
  visible: boolean;
  title: string;
  isSaving: boolean;
  children: ReactNode;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={isSaving ? undefined : onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <AppText variant="h2">{title}</AppText>
            <Pressable
              accessibilityLabel={t('common.close')}
              accessibilityRole="button"
              disabled={isSaving}
              hitSlop={10}
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed ? styles.pressed : null]}
            >
              <Ionicons name="close" size={20} color={theme.colors.textPrimary} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.optionList}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function OptionRow({
  label,
  helper,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  helper: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={selected ? { selected: true } : undefined}
      disabled={disabled || selected}
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionRow,
        selected ? styles.optionRowSelected : null,
        pressed ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <View style={styles.optionCopy}>
        <AppText variant="label">{label}</AppText>
        <AppText variant="caption" color={theme.colors.textSecondary}>
          {helper}
        </AppText>
      </View>
      {selected ? (
        <View style={styles.selectedIcon}>
          <Ionicons name="checkmark" size={16} color={theme.colors.white} />
        </View>
      ) : null}
    </Pressable>
  );
}

function SettingsRow({
  iconName,
  title,
  value,
  onPress,
}: {
  iconName: IconName;
  title: string;
  value?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => (pressed && onPress ? styles.pressed : null)}
    >
      <AppCard style={styles.settingRow}>
        <View style={styles.settingIcon}>
          <Ionicons name={iconName} size={18} color={theme.colors.primary} />
        </View>
        <View style={styles.settingCopy}>
          <AppText variant="body">{title}</AppText>
          {value ? (
            <AppText variant="caption" color={theme.colors.textSecondary} numberOfLines={1}>
              {value}
            </AppText>
          ) : null}
        </View>
        {onPress ? <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} /> : null}
      </AppCard>
    </Pressable>
  );
}

function normalizeCurrency(value: string | null | undefined): SupportedCurrency {
  const normalized = value?.trim().toUpperCase();
  return supportedCurrencies.find((currency) => currency === normalized) ?? 'USD';
}

const styles = StyleSheet.create({
  profileCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  profileCopy: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  section: {
    gap: theme.spacing.sm,
  },
  settingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 58,
    padding: theme.spacing.sm,
  },
  settingIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.full,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  settingCopy: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.6,
  },
  modalOverlay: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    backgroundColor: theme.colors.overlay,
    flex: 1,
    width: '100%',
  },
  sheet: {
    alignSelf: 'center',
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxWidth: Platform.OS === 'web' ? layout.mobileShellMaxWidth : undefined,
    maxHeight: '82%',
    padding: theme.spacing.md,
    width: '100%',
    ...(theme.shadows.floating ?? {}),
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: theme.spacing.sm,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  optionList: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  optionRow: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.large,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
    minHeight: 62,
    padding: theme.spacing.md,
  },
  optionRowSelected: {
    borderColor: theme.colors.primary,
  },
  optionCopy: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  selectedIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
});
