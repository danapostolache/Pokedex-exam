import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Fonts, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = { searchText: string; onSearchChange: (text: string) => void; searching: boolean };

export function PokemonHomeHeader({ searchText, onSearchChange, searching }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.header}>
      <View style={[styles.search, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
        <Image source={require('@/assets/images/pokemon-search.png')} tintColor={theme.textSecondary} style={styles.icon} contentFit="contain" accessible={false} />
        <TextInput
          accessibilityLabel="Search for Pokemon"
          accessibilityHint="Find Pokemon by any part of their name"
          placeholder="Search for Pokemon..."
          placeholderTextColor={theme.disabled}
          value={searchText}
          onChangeText={onSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          returnKeyType="search"
          style={[styles.input, { color: theme.text }]}
        />
        {searchText.length > 0 ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => onSearchChange('')} style={({ pressed }) => [styles.clear, { backgroundColor: pressed ? theme.backgroundSelected : undefined }]}>
            <Text style={[styles.clearLabel, { color: theme.textSecondary }]}>×</Text>
          </Pressable>
        ) : null}
      </View>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>{searching ? 'Search results' : 'All Pokémon'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: Spacing.three, paddingBottom: Spacing.three },
  search: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingLeft: Spacing.three, paddingRight: Spacing.one, minHeight: Layout.touch, marginHorizontal: -Spacing.two, borderRadius: Radius.s, shadowOpacity: Layout.shadowOpacity, shadowRadius: Layout.shadowRadius, shadowOffset: { width: 0, height: Layout.shadowOffset }, elevation: 2 },
  input: { flex: 1, minWidth: 0, minHeight: Layout.touch, paddingVertical: Spacing.twoHalf, fontFamily: Fonts.sans, fontSize: Typography.body },
  clear: { minWidth: Layout.touch, minHeight: Layout.touch, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.s },
  clearLabel: { fontFamily: Fonts.medium, fontSize: Typography.title },
  icon: { width: Layout.icon, height: Layout.icon },
  title: { fontFamily: Fonts.bold, fontSize: Typography.title, marginTop: Spacing.five },
});
