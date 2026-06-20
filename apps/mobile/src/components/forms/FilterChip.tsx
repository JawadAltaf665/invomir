import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/src/components/common/AppText';
import { theme } from '@/src/theme/theme';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function FilterChip({ label, selected, onPress }: FilterChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.selected : styles.default,
        pressed ? { opacity: 0.82 } : null,
      ]}
    >
      <AppText variant="caption" color={selected ? theme.colors.white : theme.colors.textSecondary}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: theme.radius.full,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  default: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  selected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
});
