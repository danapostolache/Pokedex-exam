import { StyleSheet, Text, View } from 'react-native';

import { CompareLayout, DetailLayout, Fonts, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import type { ComparisonRow } from '@/hooks/use-pokemon-compare';
import { useTheme } from '@/hooks/use-theme';

export function PokemonCompareStats({ rows, names }: { rows: ComparisonRow[]; names: [string, string] }) {
  const theme = useTheme();
  return <View style={styles.content}>
    <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>Base stats</Text>
    <Text style={[styles.hint, { color: theme.textSecondary }]}>Higher values are highlighted. Equal values are marked equally.</Text>
    <View style={styles.values}>{names.map((name, index) => <Text key={index} style={[styles.column, styles.columnName, { color: theme.text }]}>{name}</Text>)}</View>
    {rows.map((row) => <View key={row.name} accessible accessibilityLabel={row.name + '. ' + names[0] + ': ' + row.left + '. ' + names[1] + ': ' + row.right + '. ' + (row.higher === null ? 'Equal values.' : names[row.higher === 'left' ? 0 : 1] + ' has the higher value.')} style={[styles.row, { borderColor: theme.border }]}>
      <Text style={[styles.label, { color: theme.text }]}>{row.name}</Text>
      <View style={styles.values}>{(['left', 'right'] as const).map((side) => {
        const higher = row.higher === side;
        return <View key={side} style={[styles.column, styles.valueGroup, { backgroundColor: higher ? theme.backgroundSelected : theme.backgroundElement }]}>
          <Text style={[styles.value, { color: higher ? theme.badge : theme.text, fontFamily: higher ? Fonts.bold : Fonts.sans }]}>{row[side]}</Text>
          <Text style={[styles.marker, { color: higher ? theme.badge : theme.textSecondary }]}>{higher ? 'Higher' : row.higher === null ? 'Equal' : 'Lower'}</Text>
          <View style={[styles.track, { backgroundColor: theme.border }]}><View style={[styles.bar, { width: `${Math.min(row[side] / DetailLayout.statMaximum, 1) * 100}%`, backgroundColor: higher ? theme.badge : theme.textSecondary }]} /></View>
        </View>;
      })}</View>
    </View>)}
  </View>;
}

const styles = StyleSheet.create({
  content: { gap: Spacing.three }, title: { fontFamily: Fonts.bold, fontSize: Typography.subtitle },
  hint: { fontFamily: Fonts.sans, fontSize: Typography.caption },
  row: { gap: Spacing.two, borderTopWidth: Layout.border, paddingTop: Spacing.three }, label: { fontFamily: Fonts.medium, fontSize: Typography.body, textAlign: 'center' },
  values: { flexDirection: 'row', gap: Spacing.two }, column: { flex: 1, minWidth: 0 },
  columnName: { fontFamily: Fonts.medium, fontSize: Typography.caption, textAlign: 'center' },
  valueGroup: { padding: Spacing.twoHalf, borderRadius: Radius.s, alignItems: 'center', gap: Spacing.one },
  value: { fontSize: Typography.title }, marker: { fontFamily: Fonts.medium, fontSize: Typography.small, textAlign: 'center' },
  track: { width: '100%', height: CompareLayout.statHeight, borderRadius: Radius.xs, overflow: 'hidden', marginTop: Spacing.one }, bar: { height: '100%' },
});
