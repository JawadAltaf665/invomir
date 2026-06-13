import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

import { AppText } from '@/src/components/common/AppText';
import { theme } from '@/src/theme/theme';

type IconName = keyof typeof Ionicons.glyphMap;

interface AppInputProps extends TextInputProps {
  label: string;
  error?: string;
  leftIconName?: IconName;
  isPassword?: boolean;
}

export const AppInput = forwardRef<TextInput, AppInputProps>(function AppInput(
  { label, error, leftIconName, isPassword, style, secureTextEntry, ...props },
  ref,
) {
  const [isSecure, setIsSecure] = useState(Boolean(isPassword || secureTextEntry));

  return (
    <View style={styles.container}>
      <AppText variant="label" color={theme.colors.textSecondary}>
        {label}
      </AppText>
      <View style={[styles.inputShell, error ? styles.inputShellError : null]}>
        {leftIconName ? <Ionicons name={leftIconName} size={18} color={theme.colors.textMuted} /> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry={isSecure}
          style={[styles.input, style]}
          {...props}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setIsSecure((current) => !current)}
            hitSlop={10}
          >
            <Ionicons
              name={isSecure ? 'eye-outline' : 'eye-off-outline'}
              size={19}
              color={theme.colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText variant="caption" color={theme.colors.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xs,
    minWidth: 0,
    width: '100%',
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.medium,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.xs,
    minHeight: 50,
    minWidth: 0,
    paddingHorizontal: theme.spacing.md,
  },
  inputShellError: {
    borderColor: theme.colors.error,
  },
  input: {
    color: theme.colors.textPrimary,
    flex: 1,
    fontFamily: theme.fontFamily,
    fontSize: 15,
    minHeight: 48,
    minWidth: 0,
  },
});
