import { StyleSheet, Text, View } from 'react-native';

import { DetailLayout, Fonts, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PokemonDetailData } from '@/services/pokeapi';

export function PokemonStats({ stats }: { stats: PokemonDetailData['stats'] }) {
  const theme = useTheme();
  return <View style={styles.content}>{stats.map((stat) => <View key={stat.name} accessible accessibilityLabel={stat.name + ': ' + stat.value} style={styles.stat}>
    <View style={styles.row}><Text style={[styles.label, { color: theme.text }]}>{stat.name}</Text><Text style={[styles.value, { color: theme.textSecondary }]}>{stat.value}</Text></View>
    <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}><View style={[styles.bar, { backgroundColor: theme.badge, width: `${Math.min(stat.value / DetailLayout.statMaximum, 1) * 100}%` }]} /></View>
  </View>)}</View>;
}

const styles = StyleSheet.create({
  content: { gap: Spacing.four }, stat: { gap: Spacing.two },
  row: { flexDirection: 'row', gap: Spacing.three, alignItems: 'flex-start' },
  label: { flex: 1, fontFamily: Fonts.medium, fontSize: Typography.caption },
  value: { fontFamily: Fonts.sans, fontSize: Typography.caption },
  track: { height: DetailLayout.statHeight, borderRadius: Radius.xs, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: Radius.xs },
});
