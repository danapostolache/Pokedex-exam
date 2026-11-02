import { ActivityIndicator, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { ErrorView } from '@/components/error-view';
import { DetailLayout, Fonts, Spacing, Typography } from '@/constants/theme';
import type { usePokemonDetail } from '@/hooks/use-pokemon-detail';
import { useTheme } from '@/hooks/use-theme';
import { formatPokemonName, type PokemonDetailData } from '@/services/pokeapi';

type Props = { pokemon: PokemonDetailData; species: ReturnType<typeof usePokemonDetail>['species'] };

export function PokemonAbout({ pokemon, species }: Props) {
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const rows = [
    ['Name', pokemon.displayName], ['ID', String(pokemon.id).padStart(3, '0')],
    ['Base experience', pokemon.baseExperience === null ? 'Not available' : pokemon.baseExperience + ' XP'],
    ['Weight', pokemon.weight === null ? 'Not available' : pokemon.weight.toFixed(1) + ' kg'],
    ['Height', pokemon.height === null ? 'Not available' : pokemon.height.toFixed(1) + ' m'],
    ['Types', pokemon.types.map(formatPokemonName).join(', ') || 'Not available'],
    ['Abilities', pokemon.abilities.join(', ') || 'Not available'],
  ];
  return <View style={styles.content}>
    {rows.map(([label, value]) => <View key={label} style={[styles.row, fontScale > 1.3 && styles.stacked]}>
      <Text style={[styles.label, fontScale <= 1.3 && styles.labelWidth, { color: theme.text }]}>{label}</Text>
      <Text style={[styles.value, { color: theme.textSecondary }]}>{value}</Text>
    </View>)}
    <Text accessibilityRole="header" style={[styles.label, { color: theme.text }]}>Description</Text>
    {species.isPending ? <ActivityIndicator accessibilityLabel="Loading description" color={theme.badge} /> : species.isError ?
      <ErrorView message="The description could not load. Please try again." loading={species.isFetching} onRetry={() => { void species.refetch(); }} /> : null}
    {species.data ? <Text style={[styles.value, { color: theme.textSecondary }]}>{species.data.description ?? 'No English description available.'}</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  content: { gap: Spacing.three },
  row: { flexDirection: 'row', gap: Spacing.three },
  stacked: { flexDirection: 'column', gap: Spacing.one },
  labelWidth: { width: DetailLayout.labelWidth },
  label: { fontFamily: Fonts.medium, fontSize: Typography.caption },
  value: { flex: 1, fontFamily: Fonts.sans, fontSize: Typography.caption, lineHeight: Typography.subtitle },
});
