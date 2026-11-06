import { Image } from 'expo-image';
import { memo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Fonts, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import { usePokemonCard } from '@/hooks/use-pokemon-card';
import { useFavorites } from '@/hooks/use-favorites';
import { useTheme } from '@/hooks/use-theme';
import type { PokemonSummary } from '@/services/pokeapi';

type Props = { pokemon: PokemonSummary | Pick<PokemonSummary, 'id'>; width: number; active: boolean; onOptions: (pokemon: PokemonSummary) => void; onOpen: (pokemon: PokemonSummary) => void };

export const PokemonCard = memo(function PokemonCard({ pokemon, width, active, onOptions, onOpen }: Props) {
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const card = usePokemonCard(pokemon.id, active);
  const favorites = useFavorites();
  const summary = card.data ?? ('name' in pokemon ? pokemon : { id: pokemon.id, name: String(pokemon.id), displayName: 'Pokémon #' + pokemon.id });
  const saved = favorites.ids.has(pokemon.id);
  const failed = card.isError || card.imageFailed;
  const artwork = card.data?.artwork;
  const spaciousFooter = fontScale > 1 || width < Layout.minReadableCardWidth;
  const optionsButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={'Options for ' + summary.displayName}
      accessibilityHint={saved ? 'Saved to favorites. Opens Pokemon actions.' : 'Opens sharing and favorite actions'}
      onPress={() => onOptions(summary)}
      style={({ pressed }) => [
        styles.options,
        spaciousFooter ? styles.floatingOptions : styles.footerOptions,
        { backgroundColor: pressed ? theme.backgroundSelected : theme.card },
      ]}
    >
      <Image source={require('@/assets/images/pokemon-options.png')} tintColor={theme.text} style={styles.icon} contentFit="contain" accessible={false} />
    </Pressable>
  );
  return (
    <View style={[styles.card, { width, backgroundColor: theme.card, shadowColor: theme.shadow }]}>
      {failed ? (
        <View>
          <View style={[styles.artwork, { backgroundColor: theme.backgroundElement }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={'Retry Pokemon data or artwork for ' + summary.displayName}
              disabled={card.isFetching}
              onPress={card.retryArtwork}
              style={({ pressed }) => [styles.fallback, { opacity: pressed ? Layout.pressedOpacity : 1 }]}
            >
              <Text style={[styles.fallbackText, { color: theme.textSecondary }]}>{card.isError ? 'Pokémon data unavailable' : 'Artwork unavailable'}</Text>
              {card.isFetching ? <ActivityIndicator color={theme.badge} /> : <Text style={[styles.retry, { color: theme.badge }]}>{card.isError ? 'Retry' : 'Retry image'}</Text>}
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={'Open ' + summary.displayName}
            onPress={() => onOpen(summary)}
            style={({ pressed }) => [styles.footer, { backgroundColor: pressed ? theme.backgroundSelected : undefined }]}
          >
            <Text pointerEvents="none" style={[styles.name, spaciousFooter ? styles.spaciousName : styles.nameWithOptions, { color: theme.text }]}>{summary.displayName}</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'Open ' + summary.displayName}
          onPress={() => onOpen(summary)}
          style={({ pressed }) => [styles.main, { opacity: pressed ? Layout.pressedOpacity : 1 }]}
        >
          <View pointerEvents="none" style={[styles.artwork, { backgroundColor: theme.backgroundElement }]}>
            {artwork ? (
              <Image
                pointerEvents="none"
                key={card.imageAttempt}
                source={{ uri: artwork }}
                style={StyleSheet.absoluteFill}
                contentFit="contain"
                cachePolicy="memory-disk"
                recyclingKey={String(pokemon.id) + '-' + card.imageAttempt}
                accessibilityLabel={summary.displayName + ' artwork'}
                onError={card.onImageError}
              />
            ) : (
              <View pointerEvents="none" style={styles.fallback}>
                {card.isPending ? <ActivityIndicator accessibilityLabel={'Loading artwork for ' + summary.displayName} color={theme.badge} /> :
                  <Text style={[styles.fallbackText, { color: theme.textSecondary }]}>No artwork available</Text>}
              </View>
            )}
          </View>
          <View pointerEvents="none" style={styles.footer}>
            <Text style={[styles.name, spaciousFooter ? styles.spaciousName : styles.nameWithOptions, { color: theme.text }]}>{summary.displayName}</Text>
          </View>
        </Pressable>
      )}
      <View style={[styles.number, { backgroundColor: theme.badge }]} pointerEvents="none">
        <Text accessibilityLabel={'Pokemon number ' + pokemon.id} style={[styles.numberText, { color: theme.badgeText }]}>
          {String(pokemon.id).padStart(3, '0')}
        </Text>
      </View>
      {optionsButton}
    </View>
  );
});

const styles = StyleSheet.create({
  card: { borderRadius: Radius.s, shadowOpacity: Layout.shadowOpacity, shadowRadius: Layout.shadowRadius, shadowOffset: { width: 0, height: Layout.shadowOffset }, elevation: 3 },
  main: { borderRadius: Radius.s, overflow: 'hidden' },
  artwork: { width: '100%', aspectRatio: Layout.imageRatio, borderTopLeftRadius: Radius.s, borderTopRightRadius: Radius.s, overflow: 'hidden' },
  number: { position: 'absolute', top: Spacing.two, left: Spacing.two, paddingHorizontal: Spacing.oneHalf, paddingVertical: Spacing.half, borderRadius: Radius.xs },
  numberText: { fontFamily: Fonts.medium, fontSize: Typography.tiny },
  footer: { minHeight: Layout.touch, justifyContent: 'center', borderBottomLeftRadius: Radius.s, borderBottomRightRadius: Radius.s, overflow: 'hidden' },
  name: { paddingLeft: Spacing.twoHalf, paddingVertical: Spacing.two, fontFamily: Fonts.medium, fontSize: Typography.body, lineHeight: Typography.subtitle },
  nameWithOptions: { paddingRight: Layout.touch + Spacing.one },
  spaciousName: { paddingRight: Spacing.twoHalf },
  options: { position: 'absolute', zIndex: 1, width: Layout.touch, minHeight: Layout.touch, alignItems: 'center', justifyContent: 'center' },
  footerOptions: { right: 0, bottom: 0 },
  floatingOptions: { top: Spacing.two, right: Spacing.two, borderRadius: Radius.s },
  icon: { width: Layout.icon, height: Layout.icon },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, padding: Spacing.twoHalf, paddingTop: Spacing.five },
  fallbackText: { textAlign: 'center', fontFamily: Fonts.sans, fontSize: Typography.small },
  retry: { textAlign: 'center', fontFamily: Fonts.medium, fontSize: Typography.caption },
});
