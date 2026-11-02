import { useRef } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorView } from '@/components/error-view';
import { PokemonCard } from '@/components/pokemon-card';
import { PokemonHomeHeader } from '@/components/pokemon-home-header';
import { PokemonOptionsSheet } from '@/components/pokemon-options-sheet';
import { Fonts, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import { usePokemonActions } from '@/hooks/use-pokemon-actions';
import { usePokemonList } from '@/hooks/use-pokemon-list';
import { useTheme } from '@/hooks/use-theme';
import type { PokemonSummary } from '@/services/pokeapi';

const viewabilityConfig = { itemVisiblePercentThreshold: 1, minimumViewTime: 80 };

function CardRowSeparator() {
  return <View style={styles.separator} />;
}

export function PokemonList() {
  const theme = useTheme();
  const list = usePokemonList();
  const grid = useRef<FlatList<PokemonSummary>>(null);
  const searching = list.search.active;
  const displayedQuery = searching ? list.search : list;
  const actions = usePokemonActions();
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentWidth = Math.min(width - insets.left - insets.right, Layout.maxWidth) - Spacing.four * 2;
  const twoColumnWidth = (contentWidth - Spacing.three) / 2;
  const columns = fontScale > 1 && twoColumnWidth / fontScale < Layout.minReadableCardWidth ? 1 : 2;
  const cardWidth = Math.floor((contentWidth - Spacing.three * (columns - 1)) / columns);
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <PokemonHomeHeader searchText={list.searchText} searching={searching} onSearchChange={(text) => {
          list.setSearchText(text);
          grid.current?.scrollToOffset({ offset: 0, animated: false });
        }} />
      </View>
      <FlatList
        ref={grid}
        key={'pokemon-columns-' + columns}
        data={list.pokemon}
        keyExtractor={(pokemon) => String(pokemon.id)}
        numColumns={columns}
        renderItem={({ item, index }) => <PokemonCard pokemon={item} width={cardWidth} active={list.visibleIds ? list.visibleIds.has(item.id) : index < 6} onOptions={actions.openOptions} onOpen={actions.open} />}
        extraData={list.visibleIds}
        columnWrapperStyle={columns > 1 ? styles.row : undefined}
        ItemSeparatorComponent={CardRowSeparator}
        contentContainerStyle={styles.content}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        onViewableItemsChanged={list.onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={() => { if (!list.isFetchNextPageError) list.loadMore(); }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          displayedQuery.isPending ? (
            <View accessibilityLabel={searching ? 'Loading searchable catalogue' : 'Loading Pokemon'} accessibilityState={{ busy: true }}>
              <View style={styles.loadingLabel}><ActivityIndicator color={theme.badge} /><Text style={[styles.body, { color: theme.textSecondary }]}>{searching ? 'Loading searchable catalogue…' : 'Loading Pokémon…'}</Text></View>
              <View style={styles.skeletonGrid}>{Array.from({ length: 6 }, (_, index) => <View key={index} style={[styles.skeleton, { width: cardWidth, backgroundColor: theme.card }]}><View style={[styles.skeletonImage, { backgroundColor: theme.backgroundElement }]} /><View style={[styles.skeletonLabel, { backgroundColor: theme.backgroundSelected }]} /></View>)}</View>
            </View>
          ) : displayedQuery.isError ? (
            <ErrorView message={displayedQuery.error?.message ?? 'The catalogue could not load. Please try again.'} loading={displayedQuery.isFetching} onRetry={() => { void displayedQuery.refetch(); }} />
          ) : searching ? (
            <View style={styles.empty}><Text accessibilityRole="header" style={[styles.emptyTitle, { color: theme.text }]}>No Pokémon found</Text><Text style={[styles.body, { color: theme.textSecondary }]}>Try another name or clear your search.</Text></View>
          ) : (
            <View style={styles.empty}><Text accessibilityRole="header" style={[styles.emptyTitle, { color: theme.text }]}>No Pokémon found</Text><Text style={[styles.body, { color: theme.textSecondary }]}>The catalogue is empty. Try loading it again.</Text><ErrorView message="Reload the catalogue" onRetry={() => { void list.refetch(); }} loading={list.isFetching} /></View>
          )
        }
        ListFooterComponent={list.pokemon.length ? (
          <View style={styles.footer}>
            {searching ? <Text accessibilityLiveRegion="polite" style={[styles.body, { color: theme.textSecondary }]}>{list.pokemon.length} {list.pokemon.length === 1 ? 'match' : 'matches'}</Text> :
              list.isFetchNextPageError ? <ErrorView message="More Pokémon could not load. Your loaded cards are still here." loading={list.isFetchingNextPage} onRetry={list.loadMore} /> :
              list.isFetchingNextPage ? <View style={styles.loadingLabel}><ActivityIndicator color={theme.badge} /><Text style={[styles.body, { color: theme.textSecondary }]}>Loading more Pokémon…</Text></View> :
                <Text style={[styles.body, { color: theme.textSecondary }]}>{list.pokemon.length} of {list.total} Pokémon{list.hasNextPage ? '' : ' · You’ve seen them all'}</Text>}
          </View>
        ) : undefined}
      />
      <PokemonOptionsSheet pokemon={actions.selected} sharing={actions.sharing} error={actions.shareError} onCancel={actions.dismiss} onShare={actions.share} onOpen={() => { if (actions.selected) actions.open(actions.selected); }} onDismiss={actions.finishOpen} />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { width: '100%', maxWidth: Layout.maxWidth, alignSelf: 'center', paddingHorizontal: Spacing.four },
  list: { width: '100%', maxWidth: Layout.maxWidth, alignSelf: 'center' },
  content: { flexGrow: 1, paddingHorizontal: Spacing.four, paddingBottom: Spacing.three },
  row: { gap: Spacing.three },
  separator: { height: Spacing.three },
  footer: { paddingVertical: Spacing.three, alignItems: 'center' },
  loadingLabel: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.three },
  body: { fontFamily: Fonts.sans, fontSize: Typography.caption, textAlign: 'center' },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  skeleton: { borderRadius: Radius.s, overflow: 'hidden' },
  skeletonImage: { width: '100%', aspectRatio: Layout.imageRatio },
  skeletonLabel: { height: Spacing.three, margin: Spacing.three, borderRadius: Radius.xs },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: Spacing.five, gap: Spacing.three },
  emptyTitle: { fontFamily: Fonts.medium, fontSize: Typography.subtitle },
});
