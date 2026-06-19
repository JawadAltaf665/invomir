import { DimensionValue, StyleSheet, View } from 'react-native';

import { theme } from '@/src/theme/theme';

interface LoadingSkeletonProps {
  height?: number;
  width?: DimensionValue;
}

export function LoadingSkeleton({ height = 18, width = '100%' }: LoadingSkeletonProps) {
  return <View style={[styles.skeleton, { height, width }]} />;
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.medium,
  },
});
