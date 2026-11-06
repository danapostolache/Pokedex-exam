import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ErrorView } from '@/components/error-view';
import { PokemonArtwork } from '@/components/pokemon-artwork';
import { DetailLayout, Fonts, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import type { usePokemonDetail } from '@/hooks/use-pokemon-detail';
import type { usePokemonEvolution } from '@/hooks/use-pokemon-evolution';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  species: ReturnType<typeof usePokemonDetail>['species'];
  evolution: ReturnType<typeof usePokemonEvolution>; onOpen: (identifier: string | number) => void;
};

export function PokemonEvolution({ species, evolution, onOpen }: Props) {
  const theme = useTheme();
  const { chain, members } = evolution;
  if (species.isError) return <ErrorView message="Species information needed for evolution could not load." loading={species.isFetching} onRetry={() => { void species.refetch(); }} />;
  if (species.isPending) return <ActivityIndicator accessibilityLabel="Loading evolution species" color={theme.badge} />;
  if (!species.data?.evolutionUrl) return <Text style={[styles.message, { color: theme.textSecondary }]}>No evolution information available.</Text>;
  if (chain.isError) return <ErrorView message="The evolution chain could not load. Please try again." loading={chain.isFetching} onRetry={() => { void chain.refetch(); }} />;
  if (chain.isPending) return <ActivityIndicator accessibilityLabel="Loading evolution chain" color={theme.badge} />;
  return <View style={styles.content}>
    {members.length === 1 ? <Text style={[styles.message, { color: theme.textSecondary }]}>This Pokémon has no further evolutions.</Text> : null}
    {members.map(({ entry, query }) => <View key={entry.speciesUrl} style={styles.member}>
      {entry.parent ? <View style={styles.connection}>
        <Image source={require('@/assets/images/evolution-connector.svg')} style={styles.connector} tintColor={theme.textSecondary} contentFit="contain" accessible={false} />
        <Text style={[styles.relationship, { color: theme.textSecondary }]}>Evolves from {entry.parent}</Text>
      </View> : null}
      {query.isError ? <View style={[styles.failure, { backgroundColor: theme.card }]}><Text style={[styles.name, { color: theme.text }]}>{entry.displayName}</Text><ErrorView message="This evolution member could not load." loading={query.isFetching} onRetry={() => { void query.refetch(); }} /></View> : query.data ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'Open ' + query.data.displayName + ', Pokemon number ' + query.data.id}
          onPress={() => onOpen(query.data.id)}
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: pressed ? theme.backgroundSelected : theme.card,
              shadowColor: theme.shadow,
              opacity: pressed ? Layout.pressedOpacity : 1,
            },
          ]}
        >
          <View pointerEvents="box-none" style={[styles.artwork, { backgroundColor: theme.backgroundElement }]}><PokemonArtwork uri={query.data.cardArtwork} name={query.data.displayName} size={DetailLayout.evolutionArtwork} /></View>
          <View pointerEvents="none" style={styles.identity}>
            <View style={[styles.number, { backgroundColor: theme.badge }]}><Text style={[styles.numberText, { color: theme.badgeText }]}>{String(query.data.id).padStart(3, '0')}</Text></View>
            <Text style={[styles.name, { color: theme.text }]}>{query.data.displayName}</Text>
          </View>
        </Pressable>
      ) : <View style={styles.loading}><ActivityIndicator color={theme.badge} accessibilityLabel={'Loading ' + entry.displayName} /><Text style={[styles.message, { color: theme.textSecondary }]}>{entry.displayName}</Text></View>}
    </View>)}
  </View>;
}

const styles = StyleSheet.create({
  content: { gap: Spacing.twoHalf }, member: { gap: Spacing.twoHalf },
  connection: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  connector: { width: DetailLayout.connectorWidth, height: DetailLayout.connectorHeight },
  relationship: { flex: 1, fontFamily: Fonts.sans, fontSize: Typography.small },
  card: { flexDirection: 'row', minHeight: DetailLayout.evolutionArtwork, borderRadius: Radius.s, shadowOpacity: Layout.shadowOpacity, shadowRadius: Layout.shadowRadius, shadowOffset: { width: 0, height: Layout.shadowOffset }, elevation: 3 },
  identity: { flex: 1, justifyContent: 'center', gap: Spacing.two, padding: Spacing.twoHalf },
  artwork: { borderTopLeftRadius: Radius.s, borderBottomLeftRadius: Radius.s, overflow: 'hidden' },
  number: { alignSelf: 'flex-start', borderRadius: Radius.xs, paddingHorizontal: Spacing.oneHalf, paddingVertical: Spacing.half },
  numberText: { fontFamily: Fonts.medium, fontSize: Typography.tiny },
  name: { fontFamily: Fonts.medium, fontSize: Typography.body, flexShrink: 1 },
  message: { fontFamily: Fonts.sans, fontSize: Typography.caption },
  loading: { minHeight: DetailLayout.evolutionArtwork, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  failure: { padding: Spacing.twoHalf, borderRadius: Radius.s },
});
