import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, useColorScheme, View } from 'react-native';
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
  barMinHeight: 46,
  tabHeight: 36,
  iconSize: 20,
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
  const compactProgress = useRef(new Animated.Value(isCompact ? 1 : 0)).current;
  const profileQuery = useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: settingsApi.getCurrentUser,
    staleTime: 60_000,
  });
  const routes = state.routes
    .filter((route) => visibleTabs.includes(route.name as TabName))
    .sort((left, right) => visibleTabs.indexOf(left.name as TabName) - visibleTabs.indexOf(right.name as TabName));
  const activeTabName = getActiveTabName(state.routes[state.index]?.name);
  const profile = profileQuery.data;
  const profileCacheKey = profile ? `${profile.id}-${profile.profilePictureUrl ?? ''}` : undefined;

  useEffect(() => {
    setBottomTabCompact(false);
  }, [setBottomTabCompact, state.index]);

  useEffect(() => {
    Animated.spring(compactProgress, {
      toValue: isCompact ? 1 : 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 220,
      mass: 0.7,
    }).start();
  }, [compactProgress, isCompact]);

  const tabBarScale = compactProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.94],
  });
  const tabBarTranslateY = compactProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 4],
  });

  return (
    <View pointerEvents="box-none" style={[styles.safeArea, { paddingBottom: Math.max(insets.bottom, theme.spacing.xs) }]}>
      <View style={styles.frame}>
        <Animated.View
          style={[
            styles.tabBar,
            {
              backgroundColor: palette.barBackground,
              borderColor: palette.border,
              transform: [{ scale: tabBarScale }, { translateY: tabBarTranslateY }],
            },
          ]}
        >
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
                  isFocused ? { backgroundColor: palette.activeBackground } : null,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Ionicons
                  name={isFocused ? tab.active : tab.inactive}
                  size={metrics.iconSize}
                  color={getIconColor(isFocused, palette)}
                />
              </Pressable>
            );
          })}
        </Animated.View>
      </View>
    </View>
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

  if (visibleTabs.includes(routeName as TabName)) {
    return routeName as TabName;
  }

  return null;
}

function getIconColor(isFocused: boolean, palette: ReturnType<typeof getPalette>): string {
  return isFocused ? palette.activeForeground : palette.inactiveForeground;
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
  tabBar: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: theme.radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.xs,
    minHeight: metrics.barMinHeight,
    overflow: 'visible',
    padding: theme.spacing.xxs,
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
