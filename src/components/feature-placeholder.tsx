import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Layout, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function FeaturePlaceholder({ feature }: { feature: 'Favorites' | 'Compare' }) {
  const theme = useTheme();
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <Text accessibilityRole="header" style={[styles.heading, { color: theme.text }]}>{feature}</Text>
      <ScrollView bounces={false} contentContainerStyle={styles.content}>
        <Image source={feature === 'Favorites' ? require('@/assets/images/favorite-tab-inactive.png') : require('@/assets/images/compare-tab.png')} tintColor={theme.badge} style={styles.icon} contentFit="contain" accessible={false} />
        <Text style={[styles.title, { color: theme.text }]}>{feature === 'Favorites' ? 'Your favorites, coming soon' : 'Compare Pokémon, coming soon'}</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>{feature === 'Favorites' ? 'Soon you can save your favorite Pokémon here.' : 'Soon you can choose two Pokémon and compare them here.'}</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>Explore the Pokémon tab in the meantime.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, padding: Spacing.four },
  heading: { fontFamily: Fonts.bold, fontSize: Typography.title },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, maxWidth: Layout.maxWidth, alignSelf: 'center' },
  icon: { width: Layout.touch, height: Layout.touch },
  title: { fontFamily: Fonts.medium, fontSize: Typography.subtitle, textAlign: 'center' },
  body: { fontFamily: Fonts.sans, fontSize: Typography.body, textAlign: 'center' },
});
