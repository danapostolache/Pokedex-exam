import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PokemonArtwork } from '@/components/pokemon-artwork';
import { PokemonCompareStats } from '@/components/pokemon-compare-stats';
import { PokemonPicker } from '@/components/pokemon-picker';
import { PokemonTypeBadges } from '@/components/pokemon-type-badges';
import { CompareLayout, Fonts, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import { usePokemonCompare } from '@/hooks/use-pokemon-compare';
import { useTheme } from '@/hooks/use-theme';

export function PokemonCompare() {
  const theme = useTheme();
  const compare = usePokemonCompare();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const artworkSize = Math.max(Spacing.three, Math.min(CompareLayout.artwork, (Math.min(width - insets.left - insets.right, Layout.maxWidth) - Spacing.three * 2 - Spacing.two) / 2 - Spacing.twoHalf * 2));
  const missing = compare.selections[0] === null ? compare.selections[1] === null ? 'Choose two different Pokémon to compare their base stats.' : 'Choose Pokémon 1 to complete your comparison.' : 'Choose Pokémon 2 to complete your comparison.';
  return <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { backgroundColor: theme.background }]}>
    <ScrollView contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>Compare Pokémon</Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>Choose two Pokémon and compare their strengths, stat by stat.</Text>
      <View style={styles.slots}>{([0, 1] as const).map((slot) => {
        const selection = compare.selections[slot];
        const query = slot === 0 ? compare.left : compare.right;
        const data = query.data;
        return <View key={slot} style={[styles.slot, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Pressable accessibilityRole="button" accessibilityLabel={(selection ? 'Replace ' + selection.displayName : 'Choose Pokemon') + ' in slot ' + (slot + 1)} accessibilityHint="Opens the complete searchable catalogue" onPress={() => compare.openPicker(slot)} style={({ pressed }) => [styles.selection, { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement }]}>
            <Text style={[styles.slotLabel, { color: theme.textSecondary }]}>Pokémon {slot + 1}</Text>
            {selection ? <><Text accessibilityRole="header" style={[styles.name, { color: theme.text }]}>{selection.displayName}</Text><Text style={[styles.number, { color: theme.textSecondary }]}>#{String(selection.id).padStart(3, '0')}</Text></> : <Text style={[styles.plus, { color: theme.badge }]}>＋</Text>}
            <Text style={[styles.action, { color: theme.badge }]}>{selection ? 'Replace' : 'Choose Pokémon'}</Text>
          </Pressable>
          {selection ? <>
            {data ? <View style={styles.loaded}><PokemonArtwork uri={data.artwork} name={data.displayName} size={artworkSize} /><PokemonTypeBadges types={data.types} /></View> : !query.isError ? <View style={styles.state} accessibilityState={{ busy: true }}><ActivityIndicator color={theme.badge} /><Text style={[styles.hint, { color: theme.textSecondary }]}>Loading {selection.displayName}…</Text></View> : null}
            {query.isError ? <View style={styles.state}>
              <Text accessibilityRole="alert" style={[styles.hint, { color: theme.text }]}>{data ? 'Updated details could not load. Showing session data.' : query.error.message}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={'Retry details for ' + selection.displayName} accessibilityState={{ disabled: query.isFetching, busy: query.isFetching }} disabled={query.isFetching} onPress={() => { void query.refetch(); }} style={({ pressed }) => [styles.retry, { backgroundColor: theme.badge, opacity: pressed || query.isFetching ? Layout.pressedOpacity : 1 }]}>
                {query.isFetching ? <ActivityIndicator color={theme.badgeText} /> : <Text style={[styles.action, { color: theme.badgeText }]}>Retry</Text>}
              </Pressable>
            </View> : null}
          </> : null}
        </View>;
      })}</View>
      {compare.rows.length === 6 && compare.left.data && compare.right.data ? <PokemonCompareStats rows={compare.rows} names={[compare.left.data.displayName, compare.right.data.displayName]} /> : <View style={styles.guidance}><Text accessibilityLiveRegion="polite" style={[styles.body, { color: theme.textSecondary }]}>{compare.selections.every(Boolean) ? compare.left.isError || compare.right.isError ? 'Retry the unavailable Pokémon or replace it to complete your comparison.' : 'Loading both Pokémon before comparing their stats…' : missing}</Text></View>}
    </ScrollView>
    <PokemonPicker compare={compare} />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { flexGrow: 1, width: '100%', maxWidth: Layout.maxWidth, alignSelf: 'center', padding: Spacing.three, paddingBottom: Spacing.five, gap: Spacing.three },
  title: { fontFamily: Fonts.bold, fontSize: Typography.title }, body: { fontFamily: Fonts.sans, fontSize: Typography.body },
  slots: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  slot: { flex: 1, minWidth: 0, borderRadius: Radius.m, borderWidth: Layout.border, overflow: 'hidden' },
  selection: { minHeight: Layout.touch, padding: Spacing.twoHalf, gap: Spacing.two },
  slotLabel: { fontFamily: Fonts.sans, fontSize: Typography.small }, name: { fontFamily: Fonts.bold, fontSize: Typography.body }, number: { fontFamily: Fonts.sans, fontSize: Typography.caption },
  plus: { fontFamily: Fonts.sans, fontSize: Typography.title, textAlign: 'center', paddingVertical: Spacing.three }, action: { fontFamily: Fonts.medium, fontSize: Typography.caption },
  loaded: { padding: Spacing.twoHalf, alignItems: 'center', gap: Spacing.twoHalf },
  state: { padding: Spacing.twoHalf, alignItems: 'center', gap: Spacing.twoHalf }, hint: { fontFamily: Fonts.sans, fontSize: Typography.caption, textAlign: 'center' },
  retry: { minHeight: Layout.touch, minWidth: Layout.touch, padding: Spacing.twoHalf, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.s },
  guidance: { paddingVertical: Spacing.four },
});
