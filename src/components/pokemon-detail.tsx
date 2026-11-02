import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorView } from '@/components/error-view';
import { PokemonAbout } from '@/components/pokemon-about';
import { PokemonArtwork } from '@/components/pokemon-artwork';
import { PokemonEvolution } from '@/components/pokemon-evolution';
import { PokemonStats } from '@/components/pokemon-stats';
import { PokemonTypeBadges } from '@/components/pokemon-type-badges';
import { DetailLayout, Fonts, Layout, Spacing, TypeHeaderColors, Typography } from '@/constants/theme';
import type { DetailSection, usePokemonDetail } from '@/hooks/use-pokemon-detail';
import type { usePokemonEvolution } from '@/hooks/use-pokemon-evolution';
import { useTheme } from '@/hooks/use-theme';

const sections: DetailSection[] = ['About', 'Stats', 'Evolution'];
type Props = { detail: ReturnType<typeof usePokemonDetail>; evolution: ReturnType<typeof usePokemonEvolution> };

export function PokemonDetail({ detail, evolution }: Props) {
  const theme = useTheme();
  const { pokemon, species, favorite, section, setSection, back, notFound } = detail;
  const data = pokemon.data;
  return <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { backgroundColor: data ? TypeHeaderColors[data.types[0]] ?? theme.background : theme.background }]}>
    <View style={styles.toolbar}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={back} style={({ pressed }) => [styles.back, { opacity: pressed ? Layout.pressedOpacity : 1 }]}>
        <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={theme.text} size={Layout.icon} />
        <Text style={[styles.backLabel, { color: theme.text }]}>Back</Text>
      </Pressable>
      <Pressable disabled={favorite.disabled} onPress={favorite.toggle} accessibilityRole="button" accessibilityState={{ disabled: favorite.disabled, busy: favorite.loading || favorite.pending, selected: favorite.saved }} accessibilityLabel={favorite.saved === undefined ? favorite.loading ? 'Loading favorite state' : 'Favorite state unavailable' : (favorite.saved ? 'Remove ' : 'Save ') + (data?.displayName ?? 'Pokemon') + (favorite.saved ? ' from favorites' : ' to favorites')} style={({ pressed }) => [styles.heart, { opacity: pressed || favorite.disabled ? Layout.disabledOpacity : 1 }]}>
        {data && (favorite.loading || favorite.pending) ? <ActivityIndicator color={theme.badge} /> : <Image source={favorite.saved ? require('@/assets/images/favorite-tab-active.png') : require('@/assets/images/favorite-tab-inactive.png')} tintColor={favorite.saved ? theme.badge : theme.text} style={styles.icon} contentFit="contain" accessible={false} />}
      </Pressable>
    </View>
    {notFound ? <View style={styles.state}><Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>Pokémon not found</Text><Text style={[styles.body, { color: theme.textSecondary }]}>Check the name or number, or go back to the list.</Text></View> : !data ? (
      pokemon.isError ? <ErrorView message={pokemon.error.message} loading={pokemon.isFetching} onRetry={() => { void pokemon.refetch(); }} /> : <View style={styles.state}><ActivityIndicator color={theme.badge} accessibilityLabel="Loading Pokemon details" /><Text style={[styles.body, { color: theme.textSecondary }]}>Loading Pokémon…</Text></View>
    ) : <ScrollView contentContainerStyle={styles.scroll}>
      {favorite.error ? <ErrorView message={favorite.error} onRetry={favorite.retry} loading={favorite.retrying} /> : null}
      <View style={styles.header}>
        <View style={styles.heading}><Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>{data.displayName}</Text><Text accessibilityLabel={'Pokemon number ' + data.id} style={[styles.number, { color: theme.textSecondary }]}>#{String(data.id).padStart(3, '0')}</Text></View>
        <PokemonTypeBadges types={data.types} />
      </View>
      <View style={styles.artwork}><PokemonArtwork uri={data.artwork} name={data.displayName} size={DetailLayout.artwork} /></View>
      <View style={[styles.panel, { backgroundColor: theme.card }]}>
        <View accessibilityRole="tablist" style={styles.tabs}>{sections.map((label) => <Pressable key={label} accessibilityRole="tab" accessibilityState={{ selected: section === label }} aria-selected={section === label} accessibilityLabel={label} onPress={() => setSection(label)} style={({ pressed }) => [styles.tab, { borderColor: section === label ? theme.badge : theme.border, backgroundColor: pressed ? theme.backgroundSelected : undefined }]}><Text style={[styles.tabLabel, { color: section === label ? theme.text : theme.textSecondary }]}>{label}</Text></Pressable>)}</View>
        {pokemon.isError ? <ErrorView message="Updated details could not load. Showing the saved session data." loading={pokemon.isFetching} onRetry={() => { void pokemon.refetch(); }} /> : null}
        {section === 'About' ? <PokemonAbout pokemon={data} species={species} /> : section === 'Stats' ? <PokemonStats stats={data.stats} /> : <PokemonEvolution species={species} evolution={evolution} onOpen={detail.openPokemon} />}
      </View>
    </ScrollView>}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, toolbar: { width: '100%', maxWidth: Layout.maxWidth, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.two },
  back: { minHeight: Layout.touch, flexDirection: 'row', alignItems: 'center', gap: Spacing.one, paddingHorizontal: Spacing.two },
  backLabel: { fontFamily: Fonts.sans, fontSize: Typography.body },
  heart: { minHeight: Layout.touch, minWidth: Layout.touch, alignItems: 'center', justifyContent: 'center' },
  icon: { width: Layout.icon, height: Layout.icon },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, gap: Spacing.three },
  body: { fontFamily: Fonts.sans, fontSize: Typography.body, textAlign: 'center' },
  scroll: { flexGrow: 1, width: '100%', maxWidth: Layout.maxWidth, alignSelf: 'center' },
  header: { padding: Spacing.four, gap: Spacing.twoHalf }, heading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  title: { flexShrink: 1, fontFamily: Fonts.bold, fontSize: DetailLayout.title },
  number: { fontFamily: Fonts.sans, fontSize: Typography.title },
  artwork: { alignItems: 'center', zIndex: 1, marginBottom: -DetailLayout.artworkOverlap },
  panel: { flexGrow: 1, paddingTop: DetailLayout.artworkOverlap + Spacing.four, paddingHorizontal: Spacing.four, paddingBottom: Spacing.six, gap: Spacing.four },
  tabs: { flexDirection: 'row' }, tab: { flex: 1, minHeight: Layout.touch, justifyContent: 'center', paddingVertical: Spacing.two, borderBottomWidth: DetailLayout.tabBorder },
  tabLabel: { fontFamily: Fonts.medium, fontSize: Typography.caption, textAlign: 'center' },
});
