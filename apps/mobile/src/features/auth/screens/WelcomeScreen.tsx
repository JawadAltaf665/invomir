import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/src/components/common/AppButton';
import { AppCard } from '@/src/components/common/AppCard';
import { AppText } from '@/src/components/common/AppText';
import { AppScreen } from '@/src/components/layout/AppScreen';
import { GoogleAuthButton } from '@/src/features/auth/components/GoogleAuthButton';
import { theme } from '@/src/theme/theme';

export function WelcomeScreen() {
  const { t } = useTranslation();

  return (
    <AppScreen contentStyle={styles.content}>
      <View style={styles.brandBlock}>
        <View style={styles.logo}>
          <AppText variant="h2" color={theme.colors.white}>
            IM
          </AppText>
        </View>
        <View style={styles.brandCopy}>
          <AppText variant="display">{t('common.appName')}</AppText>
          <AppText variant="caption" color={theme.colors.textMuted}>
            {t('auth.onboardingKicker')}
          </AppText>
        </View>
      </View>
      <View style={styles.copy}>
        <AppText variant="h1" align="center">
          {t('auth.welcomeTitle')}
        </AppText>
        <AppText variant="bodyLarge" color={theme.colors.textSecondary} align="center">
          {t('auth.welcomeSubtitle')}
        </AppText>
      </View>
      <AppCard style={styles.previewCard}>
        <View style={styles.featureGrid}>
          <FeaturePill iconName="flash-outline" label={t('auth.onboardingFeatureFast')} />
          <FeaturePill iconName="shield-checkmark-outline" label={t('auth.onboardingFeatureSecure')} />
          <FeaturePill iconName="analytics-outline" label={t('auth.onboardingFeatureInsight')} />
        </View>
      </AppCard>
      <View style={styles.actions}>
        <GoogleAuthButton titleKey="auth.continueWithGoogle" />
        <AppButton title={t('auth.login')} iconName="log-in-outline" onPress={() => router.push('/login')} />
        <AppButton
          title={t('auth.register')}
          variant="secondary"
          iconName="person-add-outline"
          onPress={() => router.push('/register')}
        />
      </View>
    </AppScreen>
  );
}

function FeaturePill({ iconName, label }: { iconName: keyof typeof Ionicons.glyphMap; label: string }) {
  const shimmerProgress = useSharedValue(-1);
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerProgress.value * 360 }, { skewX: '-16deg' }],
  }));

  useEffect(() => {
    shimmerProgress.value = withRepeat(
      withTiming(1, {
        duration: 1700,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      false,
    );
  }, [shimmerProgress]);

  return (
    <View style={styles.featurePill}>
      <Animated.View pointerEvents="none" style={[styles.featurePillShimmer, shimmerStyle]} />
      <View style={styles.featurePillContent}>
        <Ionicons name={iconName} size={14} color={theme.colors.primary} />
        <AppText variant="caption" color={theme.colors.textSecondary}>
          {label}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xxl,
  },
  brandBlock: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  logo: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.xl,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  brandCopy: {
    alignItems: 'center',
    gap: theme.spacing.xxs,
  },
  copy: {
    gap: theme.spacing.sm,
  },
  previewCard: {
    gap: theme.spacing.md,
  },
  featureGrid: {
    gap: theme.spacing.xs,
  },
  featurePill: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    position: 'relative',
  },
  featurePillShimmer: {
    backgroundColor: 'rgba(79, 70, 229, 0.10)',
    bottom: 0,
    position: 'absolute',
    top: 0,
    width: 86,
  },
  featurePillContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  actions: {
    gap: theme.spacing.sm,
  },
});
