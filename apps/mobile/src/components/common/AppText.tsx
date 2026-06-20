import { PropsWithChildren } from 'react';
import { StyleProp, Text, TextProps, TextStyle } from 'react-native';

import { theme } from '@/src/theme/theme';

type TextVariant = keyof typeof theme.typography;

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
  align?: TextStyle['textAlign'];
  weight?: TextStyle['fontWeight'];
  style?: StyleProp<TextStyle>;
}

export function AppText({
  variant = 'body',
  color = theme.colors.textPrimary,
  align,
  weight,
  style,
  children,
  ...props
}: PropsWithChildren<AppTextProps>) {
  const textStyle = theme.typography[variant] as TextStyle;

  return (
    <Text
      {...props}
      style={[
        {
          color,
          fontFamily: theme.fontFamily,
          textAlign: align,
        },
        textStyle,
        weight ? { fontWeight: weight } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}
