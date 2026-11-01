import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';

import { Brand, Layout, Motion } from '@/constants/theme';

/** The app's single Pokemon splash overlay, shared by mobile and web. */
export function AnimatedSplashOverlay({ ready }: { ready: boolean }) {
  const [imageReady, setImageReady] = useState(false);
  const [visible, setVisible] = useState(true);
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (imageReady) void SplashScreen.hideAsync().catch(() => undefined);
  }, [imageReady]);
  useEffect(() => {
    if (!ready || !imageReady) return;
    const animation = Animated.sequence([
      Animated.delay(Motion.splashHold),
      Animated.timing(opacity, { toValue: 0, duration: Motion.splashFade, useNativeDriver: Platform.OS !== 'web' }),
    ]);
    animation.start(({ finished }) => { if (finished) setVisible(false); });
    return () => animation.stop();
  }, [ready, imageReady, opacity]);

  if (!visible) return null;
  return (
    <Animated.View accessibilityLabel="Pokemon is starting" accessibilityRole="progressbar" accessibilityState={{ busy: true }} style={[styles.overlay, { opacity }]}>
      <View style={styles.logo}>
        <Image source={require('@/assets/images/pokemon-logo.png')} style={StyleSheet.absoluteFill} contentFit="contain" onLoadEnd={() => setImageReady(true)} accessible={false} />
      </View>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: Brand.splash, alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  logo: { width: Layout.logoWidth, height: Layout.logoHeight, maxWidth: '80%' },
});
