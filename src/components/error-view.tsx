import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = { message: string; onRetry: () => void; loading?: boolean; useSystemFont?: boolean };

export function ErrorView({ message, onRetry, loading = false, useSystemFont = false }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <Text accessibilityRole="alert" style={[styles.message, { color: theme.text, fontFamily: useSystemFont ? undefined : Fonts.sans }]}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retry"
        accessibilityState={{ disabled: loading, busy: loading }}
        disabled={loading}
        onPress={onRetry}
        style={({ pressed }) => [styles.button, { backgroundColor: theme.badge, opacity: pressed || loading ? Layout.pressedOpacity : 1 }]}
      >
        {loading ? <ActivityIndicator color={theme.badgeText} /> : <Text style={[styles.label, { color: theme.badgeText, fontFamily: useSystemFont ? undefined : Fonts.medium }]}>Retry</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, padding: Spacing.four },
  message: { textAlign: 'center', fontSize: Typography.body },
  button: { minWidth: Layout.touch * 2, minHeight: Layout.touch, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: Radius.s },
  label: { fontSize: Typography.body },
});
