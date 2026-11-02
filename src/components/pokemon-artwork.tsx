import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Layout, Spacing, Typography } from '@/constants/theme';
import { usePokemonArtwork } from '@/hooks/use-pokemon-artwork';
import { useTheme } from '@/hooks/use-theme';

type Props = { uri: string | null; name: string; size: number };

export function PokemonArtwork(props: Props) {
  return <Artwork key={props.uri ?? props.name} {...props} />;
}

function Artwork({ uri, name, size }: Props) {
  const theme = useTheme();
  const artwork = usePokemonArtwork();
  return (
    <View pointerEvents="box-none" style={[styles.frame, { width: size, minHeight: size }]}>
      {!uri ? <Text pointerEvents="none" style={[styles.message, { color: theme.textSecondary }]}>No artwork available</Text> : artwork.failed ? (
        <Pressable accessibilityRole="button" accessibilityLabel={'Retry artwork for ' + name} onPress={artwork.retry} style={({ pressed }) => [styles.retry, { opacity: pressed ? Layout.pressedOpacity : 1 }]}>
          <Text style={[styles.message, { color: theme.textSecondary }]}>Artwork unavailable</Text>
          <Text style={[styles.message, { color: theme.badge }]}>Retry image</Text>
        </Pressable>
      ) : <>
        <Image pointerEvents="none" key={artwork.attempt} source={{ uri }} style={{ width: size, height: size, maxWidth: '100%' }} contentFit="contain" cachePolicy={artwork.attempt ? 'none' : 'memory-disk'} accessibilityLabel={name + ' artwork'} onLoad={artwork.onLoad} onError={artwork.onError} />
        {artwork.loading ? <ActivityIndicator pointerEvents="none" accessibilityLabel={'Loading artwork for ' + name} color={theme.badge} style={styles.spinner} /> : null}
      </>}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { maxWidth: '100%', alignItems: 'center', justifyContent: 'center' },
  message: { fontFamily: Fonts.sans, fontSize: Typography.small, textAlign: 'center', flexShrink: 1 },
  retry: { minHeight: Layout.touch, justifyContent: 'center', gap: Spacing.one, padding: Spacing.one },
  spinner: { position: 'absolute', alignSelf: 'center' },
});
