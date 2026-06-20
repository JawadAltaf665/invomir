import { useNetInfo } from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/src/components/common/AppText';
import { layout } from '@/src/constants/layout';
import { useSyncQueueStore } from '@/src/store/sync-queue-store';
import { theme } from '@/src/theme/theme';

export function OfflineSyncBanner() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const netInfo = useNetInfo();
  const queuedCount = useSyncQueueStore((state) => state.items.length);
  const isOffline = netInfo.isConnected === false || netInfo.isInternetReachable === false;

  if (!isOffline && queuedCount === 0) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={[styles.safeArea, { top: Math.max(insets.top + theme.spacing.xs, theme.spacing.md) }]}>
      <View style={styles.banner}>
        <Ionicons
          name={isOffline ? 'cloud-offline-outline' : 'sync-outline'}
          size={17}
          color={isOffline ? theme.colors.warning : theme.colors.info}
        />
        <AppText variant="caption" color={theme.colors.textPrimary} style={styles.copy}>
          {isOffline
            ? t('offline.offlineMessage', { count: queuedCount })
            : t('offline.syncQueued', { count: queuedCount })}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    alignItems: 'center',
    left: 0,
    paddingHorizontal: theme.spacing.md,
    position: 'absolute',
    right: 0,
    zIndex: 50,
  },
  banner: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceOverlay,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.xs,
    maxWidth: Platform.OS === 'web' ? layout.mobileShellMaxWidth : undefined,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    width: '100%',
    ...(theme.shadows.floating ?? {}),
  },
  copy: {
    flex: 1,
  },
});
