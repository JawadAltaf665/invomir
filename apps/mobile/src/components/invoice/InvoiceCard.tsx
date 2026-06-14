import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppCard } from '@/src/components/common/AppCard';
import { AppText } from '@/src/components/common/AppText';
import { MoneyText } from '@/src/components/common/MoneyText';
import { StatusBadge } from '@/src/components/common/StatusBadge';
import { InvoiceListItemDto } from '@/src/features/invoices/types';
import { theme } from '@/src/theme/theme';
import { formatDate } from '@/src/utils/formatters';

interface InvoiceCardProps {
  invoice: InvoiceListItemDto;
  selectable?: boolean;
  selected?: boolean;
  selectionDisabled?: boolean;
  onPress: () => void;
}

export function InvoiceCard({ invoice, selectable, selected, selectionDisabled, onPress }: InvoiceCardProps) {
  const { t } = useTranslation();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => (pressed ? styles.pressed : null)}>
      <AppCard style={[styles.card, selected ? styles.selectedCard : null, selectionDisabled ? styles.disabledCard : null]}>
        <View style={styles.header}>
          {selectable ? (
            <View
              style={[
                styles.checkCircle,
                selected ? styles.checkCircleSelected : null,
                selectionDisabled ? styles.checkCircleDisabled : null,
              ]}
            >
              {selected ? <Ionicons name="checkmark" size={15} color={theme.colors.white} /> : null}
              {!selected && selectionDisabled ? <Ionicons name="remove" size={14} color={theme.colors.textMuted} /> : null}
            </View>
          ) : null}
          <View style={styles.titleGroup}>
            <AppText variant="label" numberOfLines={1}>
              {invoice.invoiceNumber}
            </AppText>
            <AppText variant="bodySmall" color={theme.colors.textSecondary} numberOfLines={1}>
              {invoice.clientName}
            </AppText>
          </View>
          <StatusBadge status={invoice.status} />
        </View>
        <View style={styles.footer}>
          <MoneyText amount={invoice.total} currency={invoice.currency} variant="label" />
          <AppText variant="caption" color={theme.colors.textMuted} numberOfLines={1}>
            {t('invoices.due', { date: formatDate(invoice.dueDate) })}
          </AppText>
        </View>
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  card: {
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  selectedCard: {
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  disabledCard: {
    opacity: 0.62,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  titleGroup: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  checkCircle: {
    alignItems: 'center',
    borderColor: theme.colors.border,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  checkCircleSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkCircleDisabled: {
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.border,
  },
  footer: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
});
