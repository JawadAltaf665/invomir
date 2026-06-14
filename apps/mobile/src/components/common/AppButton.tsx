import { Ionicons } from '@expo/vector-icons';
import { PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { AppText } from '@/src/components/common/AppText';
import { theme } from '@/src/theme/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type IconName = keyof typeof Ionicons.glyphMap;

interface AppButtonProps extends Omit<PressableProps, 'style'> {
  title?: string;
  variant?: ButtonVariant;
  iconName?: IconName;
  isLoading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function AppButton({
  title,
  children,
  variant = 'primary',
  iconName,
  isLoading,
  disabled,
  fullWidth = true,
  style,
  ...props
}: PropsWithChildren<AppButtonProps>) {
  const palette = getPalette(variant);
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
          opacity: isDisabled ? 0.58 : pressed ? 0.86 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          transform: [{ scale: pressed && !isDisabled ? 0.98 : 1 }],
        },
        style,
      ]}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={palette.foreground} />
      ) : (
        <View style={styles.content}>
          {iconName ? <Ionicons name={iconName} size={18} color={palette.foreground} /> : null}
          {title ? (
            <AppText variant="button" color={palette.foreground}>
              {title}
            </AppText>
          ) : (
            children
          )}
        </View>
      )}
    </Pressable>
  );
}

function getPalette(variant: ButtonVariant) {
  if (variant === 'secondary') {
    return {
      background: theme.colors.primaryLight,
      foreground: theme.colors.primaryDark,
      border: theme.colors.primaryLight,
    };
  }

  if (variant === 'ghost') {
    return {
      background: 'transparent',
      foreground: theme.colors.primary,
      border: theme.colors.border,
    };
  }

  if (variant === 'danger') {
    return {
      background: theme.colors.errorLight,
      foreground: theme.colors.error,
      border: theme.colors.errorLight,
    };
  }

  if (variant === 'success') {
    return {
      background: theme.colors.success,
      foreground: theme.colors.white,
      border: theme.colors.success,
    };
  }

  return {
    background: theme.colors.primary,
    foreground: theme.colors.white,
    border: theme.colors.primary,
  };
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: theme.radius.medium,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
    justifyContent: 'center',
  },
});
