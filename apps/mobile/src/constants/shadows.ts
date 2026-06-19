import { Platform } from 'react-native';

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#101828',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
    },
    android: { elevation: 2 },
    default: {
      shadowColor: '#101828',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
    },
  }),
  floating: Platform.select({
    ios: {
      shadowColor: '#101828',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 18,
    },
    android: { elevation: 4 },
    default: {
      shadowColor: '#101828',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 18,
    },
  }),
} as const;
