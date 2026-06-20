import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppFloatingProfileButton } from '@/src/components/navigation/AppFloatingProfileButton';
import { layout } from '@/src/constants/layout';
import { settingsApi } from '@/src/features/settings/api/settings-api';
import { queryKeys } from '@/src/services/api/query-keys';
import { useAuthStore } from '@/src/store/auth-store';
import { useShellChromeStore } from '@/src/store/shell-chrome-store';
import { theme } from '@/src/theme/theme';

type TabName = 'dashboard' | 'invoices' | 'settings' | 'clients' | 'reports';
type IconName = keyof typeof Ionicons.glyphMap;

const visibleTabs: readonly TabName[] = ['dashboard', 'invoices', 'settings', 'clients', 'reports'];
const metrics = {
  barHeight: 46,
  barMinHeight: 46,
  barPadding: 5,
  tabHeight: 36,
  iconSize: 20,
} as const;
const springConfig = {
  damping: 18,
  stiffness: 220,
  mass: 0.72,
} as const;

const tabIcons: Record<TabName, { active: IconName; inactive: IconName; labelKey: string }> = {
  dashboard: {
    active: 'home',
    inactive: 'home-outline',
    labelKey: 'tabs.home',
  },
  invoices: {
    active: 'document-text',
    inactive: 'document-text-outline',
    labelKey: 'tabs.invoices',
  },
  clients: {
    active: 'people',
    inactive: 'people-outline',
    labelKey: 'tabs.clients',
  },
  settings: {
    active: 'person-circle',
    inactive: 'person-circle-outline',
    labelKey: 'tabs.profile',
  },
  reports: {
    active: 'bar-chart',
    inactive: 'bar-chart-outline',
    labelKey: 'tabs.reports',
  },
};

export function AppBottomTabs({ state, descriptors, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const authUser = useAuthStore((store) => store.user);
  const isCompact = useShellChromeStore((store) => store.isBottomTabCompact);
  const setBottomTabCompact = useShellChromeStore((store) => store.setBottomTabCompact);
  const isDark = colorScheme === 'dark';
  const palette = getPalette(isDark);
  const [barWidth, setBarWidth] = useState(0);
  const compactProgress = useSharedValue(isCompact ? 1 : 0);
  const activeIndexProgress = useSharedValue(-1);
  const indicatorOpacity = useSharedValue(0);
  const profileQuery = useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: settingsApi.getCurrentUser,
    staleTime: 60_000,
  });
  const routes = state.routes
    .filter((route) => visibleTabs.includes(route.name as TabName))
    .sort((left, right) => visibleTabs.indexOf(left.name as TabName) - visibleTabs.indexOf(right.name as TabName));
  const activeTabName = getActiveTabName(state.routes[state.index]?.name);
  const activeVisibleIndex = activeTabName ? visibleTabs.indexOf(activeTabName) : -1;
  const profile = profileQuery.data;
  const profileCacheKey = profile ? `${profile.id}-${profile.profilePictureUrl ?? ''}` : undefined;
  const innerBarWidth = Math.max(0, barWidth - metrics.barPadding * 2);
  const slotWidth = routes.length > 0 && innerBarWidth > 0 ? innerBarWidth / routes.length : 0;
  const indicatorWidth = slotWidth > 0 ? Math.min(70, Math.max(48, slotWidth - 20)) : 0;

  useEffect(() => {
    setBottomTabCompact(false);
  }, [setBottomTabCompact, state.index]);

  useEffect(() => {
    compactProgress.value = withSpring(isCompact ? 1 : 0, springConfig);
  }, [compactProgress, isCompact]);

  useEffect(() => {
    activeIndexProgress.value = withSpring(activeVisibleIndex, springConfig);
    indicatorOpacity.value = withTiming(activeVisibleIndex >= 0 && activeTabName !== 'settings' && indicatorWidth > 0 ? 1 : 0, {
      duration: 160,
    });
  }, [activeIndexProgress, activeTabName, activeVisibleIndex, indicatorOpacity, indicatorWidth]);

  const tabBarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 - compactProgress.value * 0.06 },
      { translateY: compactProgress.value * 4 },
    ],
  }));

  const indicatorAnimatedStyle = useAnimatedStyle(() => ({
    opacity: indicatorOpacity.value,
    transform: [
      {
        translateX: metrics.barPadding + activeIndexProgress.value * slotWidth + (slotWidth - indicatorWidth) / 2,
      },
    ],
    width: indicatorWidth,
  }), [indicatorWidth, slotWidth]);

  return (
    <View pointerEvents="box-none" style={[styles.safeArea, { paddingBottom: Math.max(insets.bottom, theme.spacing.xs) }]}>
      <View style={styles.frame}>
        <Animated.View
          onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
          style={[
            styles.tabBar,
            tabBarAnimatedStyle,
            {
              backgroundColor: palette.barBackground,
              borderColor: palette.border,
            },
          ]}
        >
          <Animated.View
            pointerEvents="none"
            style={[styles.activePill, { backgroundColor: palette.activeBackground }, indicatorAnimatedStyle]}
          />
          {routes.map((route) => {
            const routeName = route.name as TabName;
            const isFocused = activeTabName === routeName;
            const tab = tabIcons[routeName];
            const label = t(tab.labelKey);
            const isCenterProfile = routeName === 'settings';

            if (isCenterProfile) {
              return (
                <View key={route.key} style={styles.createSlot}>
                  <AppFloatingProfileButton
                    accessibilityLabel={descriptors[route.key]?.options.tabBarAccessibilityLabel ?? label}
                    focused={isFocused}
                    firstName={profile?.firstName ?? authUser?.firstName}
                    lastName={profile?.lastName}
                    imageUrl={profile?.profilePictureUrl}
                    cacheKey={profileCacheKey}
                    onPress={() => {
                      const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                      });

                      if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name, route.params);
                      }
                    }}
                  />
                </View>
              );
            }

            return (
              <Pressable
                accessibilityLabel={descriptors[route.key]?.options.tabBarAccessibilityLabel ?? label}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                hitSlop={8}
                key={route.key}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });

                  if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name, route.params);
                  }
                }}
                onLongPress={() => {
                  navigation.emit({
                    type: 'tabLongPress',
                    target: route.key,
                  });
                }}
                style={({ pressed }) => [
                  styles.tabButton,
                  pressed ? styles.pressed : null,
                ]}
              >
                <AnimatedTabIcon
                  activeIcon={tab.active}
                  inactiveIcon={tab.inactive}
                  activeIndexProgress={activeIndexProgress}
                  index={visibleTabs.indexOf(routeName)}
                  palette={palette}
                />
              </Pressable>
            );
          })}
        </Animated.View>
      </View>
    </View>
  );
}

function AnimatedTabIcon({
  activeIcon,
  inactiveIcon,
  activeIndexProgress,
  index,
  palette,
}: {
  activeIcon: IconName;
  inactiveIcon: IconName;
  activeIndexProgress: SharedValue<number>;
  index: number;
  palette: ReturnType<typeof getPalette>;
}) {
  const iconScaleStyle = useAnimatedStyle(() => {
    const distance = Math.abs(activeIndexProgress.value - index);
    const selected = Math.max(0, 1 - Math.min(distance, 1));

    return {
      transform: [{ scale: 1 + selected * 0.1 }],
    };
  });
  const activeIconStyle = useAnimatedStyle(() => {
    const distance = Math.abs(activeIndexProgress.value - index);
    const selected = Math.max(0, 1 - Math.min(distance, 1));

    return { opacity: selected };
  });
  const inactiveIconStyle = useAnimatedStyle(() => {
    const distance = Math.abs(activeIndexProgress.value - index);
    const selected = Math.max(0, 1 - Math.min(distance, 1));

    return { opacity: 1 - selected };
  });

  return (
    <Animated.View style={[styles.iconStack, iconScaleStyle]}>
      <Animated.View style={[styles.iconLayer, inactiveIconStyle]}>
        <Ionicons name={inactiveIcon} size={metrics.iconSize} color={palette.inactiveForeground} />
      </Animated.View>
      <Animated.View style={[styles.iconLayer, activeIconStyle]}>
        <Ionicons name={activeIcon} size={metrics.iconSize} color={palette.activeForeground} />
      </Animated.View>
    </Animated.View>
  );
}

function getActiveTabName(routeName: string | undefined): TabName | null {
  if (!routeName) {
    return null;
  }

  if (routeName.startsWith('invoices')) {
    return 'invoices';
  }

  if (routeName.startsWith('clients')) {
    return 'clients';
  }

  if (routeName.startsWith('subscriptions')) {
    return 'settings';
  }

  if (visibleTabs.includes(routeName as TabName)) {
    return routeName as TabName;
  }

  return null;
}

function getPalette(isDark: boolean) {
  return {
    barBackground: isDark ? theme.colors.darkSurface : theme.colors.surfaceOverlay,
    border: isDark ? theme.colors.darkBorder : theme.colors.border,
    activeBackground: isDark ? theme.colors.darkBorder : theme.colors.black,
    activeForeground: theme.colors.white,
    inactiveForeground: isDark ? theme.colors.darkMuted : theme.colors.textSecondary,
  };
}

const styles = StyleSheet.create({
  safeArea: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    bottom: 0,
    elevation: 30,
    left: 0,
    paddingHorizontal: theme.spacing.md,
    position: 'absolute',
    right: 0,
    zIndex: 30,
  },
  frame: {
    alignItems: 'center',
    maxWidth: Platform.OS === 'web' ? layout.mobileShellMaxWidth : undefined,
    width: '100%',
  },
  activePill: {
    borderRadius: theme.radius.full,
    height: metrics.tabHeight,
    left: 0,
    position: 'absolute',
    top: (metrics.barHeight - metrics.tabHeight) / 2,
  },
  tabBar: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: theme.radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    height: metrics.barHeight,
    minHeight: metrics.barMinHeight,
    overflow: 'visible',
    padding: metrics.barPadding,
    width: '96%',
    ...(theme.shadows.floating ?? {}),
  },
  tabButton: {
    alignItems: 'center',
    borderRadius: theme.radius.full,
    flex: 1,
    flexDirection: 'row',
    height: metrics.tabHeight,
    justifyContent: 'center',
    minWidth: 46,
    paddingHorizontal: theme.spacing.xs,
  },
  iconStack: {
    alignItems: 'center',
    height: metrics.iconSize,
    justifyContent: 'center',
    width: metrics.iconSize,
  },
  iconLayer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  createSlot: {
    alignItems: 'center',
    flex: 1,
    height: metrics.tabHeight,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
});
