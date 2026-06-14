import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/src/components/common/AppText';
import { layout } from '@/src/constants/layout';
import { notificationsApi } from '@/src/features/notifications/api/notifications-api';
import { queryKeys } from '@/src/services/api/query-keys';
import { useAuthStore } from '@/src/store/auth-store';
import { theme } from '@/src/theme/theme';
import { permissions } from '@/src/types/permissions';

export function AppMainHeader() {
  const { t } = useTranslation();
  const canViewNotifications = useAuthStore((state) => state.hasPermission(permissions.notification.view));
  const unreadCountQuery = useQuery({
    queryKey: queryKeys.unreadNotificationCount,
    queryFn: notificationsApi.getUnreadCount,
    enabled: canViewNotifications,
    staleTime: 30_000,
  });
  const unreadCount = unreadCountQuery.data?.count ?? 0;
  const unreadCountLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel={t('navigation.createInvoice')}
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => router.push('/invoices/new')}
          style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}
        >
          <Ionicons name="add" size={25} color={theme.colors.textPrimary} />
        </Pressable>

        <Pressable
          accessibilityLabel={t('common.appName')}
          accessibilityRole="button"
          onPress={() => router.push('/dashboard')}
          style={styles.logoButton}
        >
          <AppText variant="h3" weight="800" style={styles.logoText}>
            {t('common.appName')}
          </AppText>
        </Pressable>

        <Pressable
          accessibilityLabel={
            unreadCount > 0
              ? `${t('navigation.notifications')}, ${unreadCountLabel} unread`
              : t('navigation.notifications')
          }
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => router.push('/notifications')}
          style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}
        >
          <Ionicons name="notifications-outline" size={23} color={theme.colors.textPrimary} />
          {unreadCount > 0 ? (
            <View style={styles.notificationBadge}>
              <AppText variant="caption" color={theme.colors.white} weight="800" style={styles.notificationBadgeText}>
                {unreadCountLabel}
              </AppText>
            </View>
          ) : null}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderBottomColor: theme.colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 52,
    justifyContent: 'space-between',
    maxWidth: Platform.OS === 'web' ? layout.mobileShellMaxWidth : undefined,
    paddingHorizontal: theme.spacing.md,
    width: '100%',
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.full,
    height: 38,
    justifyContent: 'center',
    position: 'relative',
    width: 38,
  },
  logoButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  logoText: {
    color: theme.colors.textPrimary,
    letterSpacing: 0,
  },
  notificationBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.error,
    borderColor: theme.colors.background,
    borderRadius: theme.radius.full,
    borderWidth: 2,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 4,
    position: 'absolute',
    right: -5,
    top: -5,
  },
  notificationBadgeText: {
    fontSize: 10,
    lineHeight: 12,
  },
  pressed: {
    backgroundColor: theme.colors.surfaceMuted,
    transform: [{ scale: 0.96 }],
  },
});
