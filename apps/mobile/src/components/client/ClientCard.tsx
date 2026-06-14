import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppCard } from '@/src/components/common/AppCard';
import { AppText } from '@/src/components/common/AppText';
import { MoneyText } from '@/src/components/common/MoneyText';
import { ClientListItemDto } from '@/src/features/clients/types';
import { theme } from '@/src/theme/theme';
import { getInitials } from '@/src/utils/formatters';

interface ClientCardProps {
  client: ClientListItemDto;
  onPress: () => void;
}

export function ClientCard({ client, onPress }: ClientCardProps) {
  const { t } = useTranslation();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => (pressed ? styles.pressed : null)}>
      <AppCard style={styles.card}>
        <View style={styles.avatar}>
          <AppText variant="label" color={theme.colors.primaryDark}>
            {getInitials(client.name)}
          </AppText>
        </View>
        <View style={styles.copy}>
          <AppText variant="label" numberOfLines={1}>
            {client.name}
          </AppText>
          <AppText variant="bodySmall" color={theme.colors.textSecondary} numberOfLines={1}>
            {client.company ?? client.email}
          </AppText>
          <AppText variant="caption" color={theme.colors.textMuted}>
            {t('clients.invoices', { count: client.invoiceCount })}
          </AppText>
        </View>
        <MoneyText
          amount={client.totalRevenue}
          currency={client.currency}
          variant="label"
          numberOfLines={1}
          style={styles.amount}
        />
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
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.full,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  copy: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  amount: {
    flexShrink: 1,
    maxWidth: 112,
  },
});
