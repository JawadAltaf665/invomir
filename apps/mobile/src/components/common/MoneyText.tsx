import { StyleProp, TextProps, TextStyle } from 'react-native';

import { AppText } from '@/src/components/common/AppText';
import { theme } from '@/src/theme/theme';
import { formatMoney } from '@/src/utils/formatters';

interface MoneyTextProps extends TextProps {
  amount: number;
  currency: string;
  variant?: keyof typeof theme.typography;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export function MoneyText({ amount, currency, variant = 'body', color, style, ...props }: MoneyTextProps) {
  return (
    <AppText variant={variant} color={color} style={style} {...props}>
      {formatMoney(amount, currency)}
    </AppText>
  );
}
