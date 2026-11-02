import { Image } from 'expo-image';
import { memo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Fonts, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import { usePokemonCard } from '@/hooks/use-pokemon-card';
import { useTheme } from '@/hooks/use-theme';
import type { PokemonSummary } from '@/services/pokeapi';

type Props = { pokemon: PokemonSummary; width: number; active: boolean; onOptions: (pokemon: PokemonSummary) => void; onOpen: (pokemon: PokemonSummary) => void };

export const PokemonCard = memo(function PokemonCard({ pokemon, width, active, onOptions, onOpen }: Props) {
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const card = usePokemonCard(pokemon.id, active);
  const failed = card.isError || card.imageFailed;
  const artwork = card.data?.artwork;
  const spaciousFooter = fontScale > 1 || width < Layout.minReadableCardWidth;
  const optionsButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={'Options for ' + pokemon.displayName}
      accessibilityHint="Opens sharing and other Pokemon actions"
      onPress={() => onOptions(pokemon)}
      style={({ pressed }) => [
        styles.options,
        spaciousFooter && styles.floatingOptions,
        { backgroundColor: pressed ? theme.backgroundSelected : theme.card },
      ]}
    >
      <Image source={require('@/assets/images/pokemon-options.png')} tintColor={theme.text} style={styles.icon} contentFit="contain" accessible={false} />
    </Pressable>
  );
  return (
    <View style={[styles.card, { width, backgroundColor: theme.card, shadowColor: theme.shadow }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={'Open ' + pokemon.displayName} onPress={() => onOpen(pokemon)} style={({ pressed }) => [StyleSheet.absoluteFill, { backgroundColor: pressed ? theme.backgroundSelected : undefined }]} />
      <View pointerEvents="box-none" style={[styles.artwork, { backgroundColor: theme.backgroundElement }]}>
        {failed ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={'Retry artwork for ' + pokemon.displayName}
            disabled={card.isFetching}
            onPress={card.retryArtwork}
            style={({ pressed }) => [styles.fallback, { opacity: pressed ? Layout.pressedOpacity : 1 }]}
          >
            <Text style={[styles.fallbackText, { color: theme.textSecondary }]}>Artwork unavailable</Text>
            {card.isFetching ? <ActivityIndicator color={theme.badge} /> : <Text style={[styles.retry, { color: theme.badge }]}>Retry image</Text>}
          </Pressable>
        ) : artwork ? (
          <Image
            pointerEvents="none"
            key={card.imageAttempt}
            source={{ uri: artwork }}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
            cachePolicy="memory-disk"
            recyclingKey={String(pokemon.id) + '-' + card.imageAttempt}
            accessibilityLabel={pokemon.displayName + ' artwork'}
            onError={card.onImageError}
          />
        ) : (
          <View pointerEvents="none" style={styles.fallback}>
            {card.isPending ? <ActivityIndicator accessibilityLabel={'Loading artwork for ' + pokemon.displayName} color={theme.badge} /> :
              <Text style={[styles.fallbackText, { color: theme.textSecondary }]}>No artwork available</Text>}
          </View>
        )}
        <View style={[styles.number, { backgroundColor: theme.badge }]} pointerEvents="none">
          <Text accessibilityLabel={'Pokemon number ' + pokemon.id} style={[styles.numberText, { color: theme.badgeText }]}>
            {String(pokemon.id).padStart(3, '0')}
          </Text>
        </View>
        {spaciousFooter ? optionsButton : null}
      </View>
      <View pointerEvents="box-none" style={[styles.footer, spaciousFooter && styles.spaciousFooter]}>
        <Text pointerEvents="none" accessible={false} style={[styles.name, { color: theme.text }]}>{pokemon.displayName}</Text>
        {spaciousFooter ? null : optionsButton}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { borderRadius: Radius.s, shadowOpacity: Layout.shadowOpacity, shadowRadius: Layout.shadowRadius, shadowOffset: { width: 0, height: Layout.shadowOffset }, elevation: 3 },
  artwork: { width: '100%', aspectRatio: Layout.imageRatio, borderTopLeftRadius: Radius.s, borderTopRightRadius: Radius.s, overflow: 'hidden' },
  number: { position: 'absolute', top: Spacing.two, left: Spacing.two, paddingHorizontal: Spacing.oneHalf, paddingVertical: Spacing.half, borderRadius: Radius.xs },
  numberText: { fontFamily: Fonts.medium, fontSize: Typography.tiny },
  footer: { flexDirection: 'row', alignItems: 'center', minHeight: Layout.touch, paddingLeft: Spacing.twoHalf, borderBottomLeftRadius: Radius.s, borderBottomRightRadius: Radius.s },
  spaciousFooter: { paddingRight: Spacing.twoHalf },
  name: { flex: 1, paddingVertical: Spacing.two, fontFamily: Fonts.medium, fontSize: Typography.body, lineHeight: Typography.subtitle },
  options: { width: Layout.touch, minHeight: Layout.touch, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  floatingOptions: { position: 'absolute', top: Spacing.two, right: Spacing.two, borderRadius: Radius.s },
  icon: { width: Layout.icon, height: Layout.icon },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, padding: Spacing.twoHalf, paddingTop: Spacing.five },
  fallbackText: { textAlign: 'center', fontFamily: Fonts.sans, fontSize: Typography.small },
  retry: { textAlign: 'center', fontFamily: Fonts.medium, fontSize: Typography.caption },
});
