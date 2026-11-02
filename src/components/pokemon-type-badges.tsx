import { StyleSheet, Text, View } from 'react-native';

import { DetailLayout, Fonts, Radius, Spacing, TypeColors, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatPokemonName } from '@/services/pokeapi';

export function PokemonTypeBadges({ types }: { types: string[] }) {
  const theme = useTheme();
  return <View style={styles.types}>{types.map((type) => <View key={type} style={[styles.type, { backgroundColor: theme.backgroundSelected }]}>
    <View style={[styles.dot, { backgroundColor: TypeColors[type] ?? theme.badge }]} />
    <Text style={[styles.label, { color: theme.text }]}>{formatPokemonName(type)}</Text>
  </View>)}</View>;
}

const styles = StyleSheet.create({
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  type: { maxWidth: '100%', borderRadius: DetailLayout.pill, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.one, paddingHorizontal: Spacing.twoHalf },
  dot: { width: Spacing.twoHalf, height: Spacing.twoHalf, borderRadius: Radius.m },
  label: { flexShrink: 1, fontFamily: Fonts.medium, fontSize: Typography.body },
});
