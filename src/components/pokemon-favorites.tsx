import { Image } from 'expo-image';
import { ActivityIndicator, FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorView } from '@/components/error-view';
import { PokemonCard } from '@/components/pokemon-card';
import { PokemonOptionsSheet } from '@/components/pokemon-options-sheet';
import { Fonts, Layout, Spacing, Typography } from '@/constants/theme';
import { usePokemonActions } from '@/hooks/use-pokemon-actions';
import { usePokemonFavorites } from '@/hooks/use-pokemon-favorites';
import { useTheme } from '@/hooks/use-theme';

const viewabilityConfig = { itemVisiblePercentThreshold: 1, minimumViewTime: 80 };
function RowSeparator() { return <View style={styles.separator} />; }

export function PokemonFavorites() {
  const theme = useTheme();
  const favorites = usePokemonFavorites();
  const actions = usePokemonActions();
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentWidth = Math.min(width - insets.left - insets.right, Layout.maxWidth) - Spacing.four * 2;
  const twoColumnWidth = (contentWidth - Spacing.three) / 2;
  const columns = fontScale > 1 && twoColumnWidth / fontScale < Layout.minReadableCardWidth ? 1 : 2;
  const cardWidth = Math.floor((contentWidth - Spacing.three * (columns - 1)) / columns);
  return <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { backgroundColor: theme.background }]}>
    <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>My favorites</Text>
    <FlatList
      key={'favorites-columns-' + columns}
      data={favorites.pokemon}
      keyExtractor={({ id }) => String(id)}
      numColumns={columns}
      renderItem={({ item, index }) => <PokemonCard pokemon={item} width={cardWidth} active={favorites.visibleIds ? favorites.visibleIds.has(item.id) : index < 6} onOptions={actions.openOptions} onOpen={actions.open} />}
      extraData={favorites.visibleIds}
      columnWrapperStyle={columns > 1 ? styles.row : undefined}
      ItemSeparatorComponent={RowSeparator}
      contentContainerStyle={styles.content}
      style={styles.list}
      initialNumToRender={6}
      maxToRenderPerBatch={6}
      windowSize={5}
      onViewableItemsChanged={favorites.onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      ListHeaderComponent={favorites.isError && favorites.pokemon.length > 0 ? <ErrorView message={favorites.error.message} onRetry={favorites.retry} loading={favorites.isFetching || favorites.writing} /> : undefined}
      ListEmptyComponent={favorites.isError ? <ErrorView message={favorites.error.message} onRetry={favorites.retry} loading={favorites.isFetching || favorites.writing} /> : favorites.data === undefined ? (
        <View style={styles.state} accessibilityState={{ busy: true }}><ActivityIndicator color={theme.badge} /><Text style={[styles.body, { color: theme.textSecondary }]}>Loading favorites…</Text></View>
      ) : (
        <View style={styles.state}>
          <Image source={require('@/assets/images/favorite-tab-inactive.png')} tintColor={theme.badge} style={styles.heart} contentFit="contain" accessible={false} />
          <Text accessibilityRole="header" style={[styles.emptyTitle, { color: theme.text }]}>No favorites yet</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>Tap the heart on a Pokémon’s detail page or choose Favorite from a card’s options to save it here.</Text>
        </View>
      )}
    />
    <PokemonOptionsSheet pokemon={actions.selected} sharing={actions.sharing} error={actions.shareError} favorite={actions.favorite} onCancel={actions.dismiss} onShare={actions.share} onOpen={() => { if (actions.selected) actions.open(actions.selected); }} onDismiss={actions.finishOpen} />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  title: { width: '100%', maxWidth: Layout.maxWidth, alignSelf: 'center', paddingHorizontal: Spacing.four, paddingTop: Spacing.four, paddingBottom: Spacing.three, fontFamily: Fonts.bold, fontSize: Typography.title },
  list: { width: '100%', maxWidth: Layout.maxWidth, alignSelf: 'center' },
  content: { flexGrow: 1, paddingHorizontal: Spacing.four, paddingBottom: Spacing.three },
  row: { gap: Spacing.three }, separator: { height: Spacing.three },
  state: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.five },
  emptyTitle: { fontFamily: Fonts.medium, fontSize: Typography.subtitle, textAlign: 'center' },
  body: { fontFamily: Fonts.sans, fontSize: Typography.body, textAlign: 'center' },
  heart: { width: Layout.touch, height: Layout.touch },
});
