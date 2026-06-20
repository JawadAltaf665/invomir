import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/src/components/common/AppText';
import { layout } from '@/src/constants/layout';
import { theme } from '@/src/theme/theme';

interface DatePickerFieldProps {
  label: string;
  value: string;
  placeholder: string;
  sheetTitle?: string;
  onSelect: (value: string) => void;
}

export function DatePickerField({
  label,
  value,
  placeholder,
  sheetTitle,
  onSelect,
}: DatePickerFieldProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.fieldContainer}>
      <AppText variant="label" color={theme.colors.textSecondary}>
        {label}
      </AppText>
      <Pressable
        accessibilityRole="button"
        onPress={() => setIsOpen(true)}
        style={({ pressed }) => [styles.field, pressed ? styles.pressed : null]}
      >
        <Ionicons name="calendar-outline" size={18} color={theme.colors.textMuted} />
        <AppText color={value ? theme.colors.textPrimary : theme.colors.textMuted}>
          {value ? formatIsoForDisplay(value) : placeholder}
        </AppText>
      </Pressable>

      <DatePickerSheet
        visible={isOpen}
        title={sheetTitle}
        value={value}
        onClose={() => setIsOpen(false)}
        onSelect={(nextValue) => {
          onSelect(nextValue);
          setIsOpen(false);
        }}
      />
    </View>
  );
}

function DatePickerSheet({
  visible,
  title,
  value,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title?: string;
  value: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(parseIsoDate(value) ?? new Date()));

  useEffect(() => {
    if (visible) {
      setVisibleMonth(startOfMonth(parseIsoDate(value) ?? new Date()));
    }
  }, [value, visible]);

  const selectedDate = parseIsoDate(value);
  const calendarDays = buildCalendarDays(visibleMonth);
  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(visibleMonth);

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <AppText variant="h2">{title ?? t('common.selectDate')}</AppText>
            <Pressable accessibilityRole="button" onPress={onClose} hitSlop={10} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={theme.colors.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.monthHeader}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setVisibleMonth((current) => addMonths(current, -1))}
              style={styles.monthButton}
            >
              <Ionicons name="chevron-back" size={20} color={theme.colors.textPrimary} />
            </Pressable>
            <AppText variant="h3">{monthLabel}</AppText>
            <Pressable
              accessibilityRole="button"
              onPress={() => setVisibleMonth((current) => addMonths(current, 1))}
              style={styles.monthButton}
            >
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.weekGrid}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <AppText
                key={`${day}-${index}`}
                variant="caption"
                color={theme.colors.textMuted}
                align="center"
                style={styles.dayCell}
              >
                {day}
              </AppText>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarDays.map((day) => {
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const isOutsideMonth = day.getMonth() !== visibleMonth.getMonth();

              return (
                <Pressable
                  key={day.toISOString()}
                  accessibilityRole="button"
                  accessibilityState={isSelected ? { selected: true } : undefined}
                  onPress={() => onSelect(toIsoDate(day))}
                  style={({ pressed }) => [
                    styles.dayButton,
                    isSelected ? styles.dayButtonSelected : null,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <AppText
                    variant="label"
                    align="center"
                    color={isSelected ? theme.colors.white : isOutsideMonth ? theme.colors.textMuted : theme.colors.textPrimary}
                  >
                    {day.getDate()}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function formatIsoForDisplay(value: string): string {
  const parsed = parseIsoDate(value);

  if (!parsed) {
    return value;
  }

  return [
    String(parsed.getDate()).padStart(2, '0'),
    String(parsed.getMonth() + 1).padStart(2, '0'),
    parsed.getFullYear(),
  ].join('-');
}

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toIsoDate(value: Date): string {
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, '0'),
    String(value.getDate()).padStart(2, '0'),
  ].join('-');
}

function startOfMonth(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function addMonths(value: Date, count: number): Date {
  return new Date(value.getFullYear(), value.getMonth() + count, 1);
}

function buildCalendarDays(month: Date): Date[] {
  const first = startOfMonth(month);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function isSameDay(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();
}

const styles = StyleSheet.create({
  fieldContainer: {
    gap: theme.spacing.xs,
  },
  field: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.medium,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.xs,
    minHeight: 50,
    paddingHorizontal: theme.spacing.md,
  },
  modalOverlay: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    backgroundColor: theme.colors.overlay,
    flex: 1,
    width: '100%',
  },
  sheet: {
    alignSelf: 'center',
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    gap: theme.spacing.md,
    maxWidth: Platform.OS === 'web' ? layout.mobileShellMaxWidth : undefined,
    padding: theme.spacing.md,
    width: '100%',
    ...(theme.shadows.floating ?? {}),
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  monthHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  weekGrid: {
    flexDirection: 'row',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
  },
  dayButton: {
    alignItems: 'center',
    borderRadius: theme.radius.full,
    height: 42,
    justifyContent: 'center',
    width: `${100 / 7}%`,
  },
  dayButtonSelected: {
    backgroundColor: theme.colors.primary,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});
