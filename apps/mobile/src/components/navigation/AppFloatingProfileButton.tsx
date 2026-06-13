import { Pressable, StyleSheet, View } from 'react-native';

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
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed ? styles.pressed : null]}
    >
      <View style={[styles.button, focused ? styles.buttonFocused : null]}>
        <UserAvatar
          firstName={firstName}
          lastName={lastName}
          imageUrl={imageUrl}
          cacheKey={cacheKey}
          size={38}
          borderColor={theme.colors.white}
          borderWidth={2}
        />
      </View>
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
