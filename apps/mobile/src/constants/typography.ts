import { Platform } from 'react-native';

export const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'system-ui',
});

export const typography = {
  display: { fontSize: 34, lineHeight: 42, fontWeight: '700' },
  h1: { fontSize: 28, lineHeight: 36, fontWeight: '700' },
  h2: { fontSize: 22, lineHeight: 30, fontWeight: '700' },
  h3: { fontSize: 18, lineHeight: 26, fontWeight: '700' },
  bodyLarge: { fontSize: 17, lineHeight: 26, fontWeight: '400' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodySmall: { fontSize: 13, lineHeight: 20, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 18, fontWeight: '500' },
  button: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
} as const;
