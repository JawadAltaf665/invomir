import { PropsWithChildren } from 'react';
import { useSegments } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { layout } from '@/src/constants/layout';
import { useBottomTabScrollChrome } from '@/src/hooks/useBottomTabScrollChrome';
import { theme } from '@/src/theme/theme';

interface AppScreenProps {
  scroll?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export function AppScreen({
  children,
  scroll = true,
  padded = true,
  style,
  contentStyle,
}: PropsWithChildren<AppScreenProps>) {
  const segments = useSegments();
  const handleBottomTabScroll = useBottomTabScrollChrome();
  const hasFloatingTabs = segments[0] === '(tabs)';
  const safeAreaEdges = hasFloatingTabs ? (['left', 'right'] as const) : undefined;
  const tabInsetStyle = hasFloatingTabs ? styles.floatingTabInset : null;
  const content = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      onScroll={handleBottomTabScroll}
      scrollEventThrottle={16}
      contentContainerStyle={[styles.content, padded ? styles.padded : null, tabInsetStyle, contentStyle]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, padded ? styles.padded : null, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView edges={safeAreaEdges} style={[styles.safeArea, style]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoider}
      >
        <View style={styles.frame}>{content}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  keyboardAvoider: {
    alignItems: 'center',
    flex: 1,
  },
  frame: {
    flex: 1,
    maxWidth: Platform.OS === 'web' ? layout.mobileShellMaxWidth : undefined,
    width: '100%',
  },
  content: {
    flexGrow: 1,
    gap: theme.spacing.sm,
  },
  padded: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  floatingTabInset: {
    paddingBottom: layout.bottomTabOverlayHeight,
  },
});
