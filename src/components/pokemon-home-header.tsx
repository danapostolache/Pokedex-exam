import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function PokemonHomeHeader() {
  const theme = useTheme();
  return (
    <View style={styles.header}>
      <View
        accessibilityRole="search"
        accessibilityLabel="Search for Pokemon. Search is not available yet."
        accessibilityState={{ disabled: true }}
        style={[styles.search, { backgroundColor: theme.card, shadowColor: theme.shadow }]}
      >
        <Image source={require('@/assets/images/pokemon-search.png')} tintColor={theme.textSecondary} style={styles.icon} contentFit="contain" accessible={false} />
        <Text style={[styles.placeholder, { color: theme.disabled }]}>Search for Pokémon…</Text>
      </View>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>All Pokémon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: Spacing.three, paddingBottom: Spacing.three },
  search: { flexDirection: 'row', alignItems: 'center', gap: Spacing.twoHalf, padding: Spacing.twoHalf, paddingHorizontal: Spacing.three, minHeight: Layout.touch, marginHorizontal: -Spacing.two, borderRadius: Radius.s, shadowOpacity: Layout.shadowOpacity, shadowRadius: Layout.shadowRadius, shadowOffset: { width: 0, height: Layout.shadowOffset }, elevation: 2 },
  placeholder: { flex: 1, fontFamily: Fonts.sans, fontSize: Typography.body },
  icon: { width: Layout.icon, height: Layout.icon },
  title: { fontFamily: Fonts.bold, fontSize: Typography.title, marginTop: Spacing.five },
});
