import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { UserAvatar } from '@/src/components/common/UserAvatar';
import { theme } from '@/src/theme/theme';

interface AppFloatingProfileButtonProps {
  accessibilityLabel: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  cacheKey?: string | number | null;
  focused?: boolean;
  onPress: () => void;
}

export function AppFloatingProfileButton({
  accessibilityLabel,
  firstName,
  lastName,
  imageUrl,
  cacheKey,
  focused,
  onPress,
}: AppFloatingProfileButtonProps) {
  const focusProgress = useSharedValue(focused ? 1 : 0);
  const focusStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + focusProgress.value * 0.07 }],
  }));

  useEffect(() => {
    focusProgress.value = withSpring(focused ? 1 : 0, {
      damping: 18,
      stiffness: 220,
      mass: 0.72,
    });
  }, [focusProgress, focused]);

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed ? styles.pressed : null]}
    >
      <Animated.View style={[styles.button, focused ? styles.buttonFocused : null, focusStyle]}>
        <UserAvatar
          firstName={firstName}
          lastName={lastName}
          imageUrl={imageUrl}
          cacheKey={cacheKey}
          size={38}
          borderColor={theme.colors.white}
          borderWidth={2}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    marginTop: -19,
  },
  button: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.surface,
    borderRadius: theme.radius.full,
    borderWidth: 4,
    height: 52,
    justifyContent: 'center',
    width: 52,
    ...(theme.shadows.floating ?? {}),
  },
  buttonFocused: {
    backgroundColor: theme.colors.primaryHover,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.94 }],
  },
});
