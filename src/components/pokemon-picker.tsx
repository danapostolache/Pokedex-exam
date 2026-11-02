import { useRef } from 'react';
import { ActivityIndicator, FlatList, Keyboard, Modal, Pressable, StyleSheet, Text, TextInput, View, type TextInputInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorView } from '@/components/error-view';
import { Fonts, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import type { usePokemonCompare } from '@/hooks/use-pokemon-compare';
import { useTheme } from '@/hooks/use-theme';

type Props = { compare: ReturnType<typeof usePokemonCompare> };

export function PokemonPicker({ compare }: Props) {
  const theme = useTheme();
  const input = useRef<TextInputInstance>(null);
  const list = useRef<FlatList>(null);
  const { catalogue, opposite, picker } = compare;
  const close = () => { Keyboard.dismiss(); compare.closePicker(); };
  return <Modal visible={picker !== null} animationType="slide" presentationStyle="pageSheet" allowSwipeDismissal onRequestClose={close} onShow={() => input.current?.focus()}>
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <View accessibilityViewIsModal onAccessibilityEscape={close} style={styles.content}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>Choose Pokémon {picker === 1 ? '2' : '1'}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Cancel Pokemon selection" onPress={close} style={({ pressed }) => [styles.cancel, { backgroundColor: pressed ? theme.backgroundSelected : theme.card }]}>
            <Text style={[styles.action, { color: theme.badge }]}>Cancel</Text>
          </Pressable>
        </View>
        <View style={[styles.search, { backgroundColor: theme.card }]}>
          <TextInput ref={input} value={compare.searchText} onChangeText={(text) => { compare.setSearchText(text); list.current?.scrollToOffset({ offset: 0, animated: false }); }} accessibilityLabel="Search complete Pokemon catalogue" accessibilityHint="Search by any part of a Pokemon name" placeholder="Search all Pokémon…" placeholderTextColor={theme.disabled} autoCapitalize="none" autoCorrect={false} spellCheck={false} returnKeyType="search" onSubmitEditing={Keyboard.dismiss} style={[styles.input, { color: theme.text }]} />
          {compare.searchText.length > 0 ? <Pressable accessibilityRole="button" accessibilityLabel="Clear picker search" onPress={() => { compare.setSearchText(''); list.current?.scrollToOffset({ offset: 0, animated: false }); }} style={({ pressed }) => [styles.clear, { backgroundColor: pressed ? theme.backgroundSelected : undefined }]}><Text style={[styles.action, { color: theme.badge }]}>×</Text></Pressable> : null}
        </View>
        {opposite ? <Text style={[styles.hint, { color: theme.textSecondary }]}>{opposite.displayName} is selected in the other slot. Choose a different Pokémon.</Text> : null}
        <FlatList
          ref={list}
          data={catalogue.pokemon}
          keyExtractor={(item) => String(item.id)}
          extraData={opposite?.id}
          style={styles.list}
          contentContainerStyle={styles.results}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          initialNumToRender={16}
          maxToRenderPerBatch={16}
          windowSize={5}
          ListHeaderComponent={catalogue.isError && catalogue.pokemon.length > 0 ? <ErrorView message="The catalogue could not refresh. Available names are still shown." loading={catalogue.isFetching} onRetry={() => { void catalogue.refetch(); }} /> : undefined}
          renderItem={({ item }) => {
            const unavailable = item.id === opposite?.id;
            return <Pressable disabled={unavailable} accessibilityRole="button" accessibilityState={{ disabled: unavailable }} accessibilityLabel={item.displayName + ', number ' + item.id + (unavailable ? ', already selected in the other slot. Choose a different Pokemon.' : '')} onPress={() => { Keyboard.dismiss(); compare.select(item); }} style={({ pressed }) => [styles.result, { borderColor: theme.border, backgroundColor: unavailable ? theme.backgroundElement : pressed ? theme.backgroundSelected : theme.card }]}>
              <View style={styles.nameGroup}><Text style={[styles.name, { color: unavailable ? theme.textSecondary : theme.text }]}>{item.displayName}</Text>{unavailable ? <Text style={[styles.hint, { color: theme.textSecondary }]}>Already selected</Text> : null}</View>
              <Text style={[styles.number, { color: theme.textSecondary }]}>#{String(item.id).padStart(3, '0')}</Text>
            </Pressable>;
          }}
          ListEmptyComponent={catalogue.isPending ? <View style={styles.state} accessibilityState={{ busy: true }}><ActivityIndicator color={theme.badge} /><Text style={[styles.message, { color: theme.textSecondary }]}>Loading complete catalogue…</Text></View> : catalogue.isError ? <ErrorView message={catalogue.error.message} loading={catalogue.isFetching} onRetry={() => { void catalogue.refetch(); }} /> : catalogue.data?.length === 0 ? <ErrorView message="The catalogue is empty. Try loading it again." loading={catalogue.isFetching} onRetry={() => { void catalogue.refetch(); }} /> : <View style={styles.state}><Text accessibilityRole="header" style={[styles.name, { color: theme.text }]}>No Pokémon found</Text><Text style={[styles.message, { color: theme.textSecondary }]}>Try another name or clear your search.</Text></View>}
          ListFooterComponent={catalogue.pokemon.length ? <Text accessibilityLiveRegion="polite" style={[styles.count, { color: theme.textSecondary }]}>{catalogue.pokemon.length} {catalogue.active ? catalogue.pokemon.length === 1 ? 'match' : 'matches' : 'Pokémon'}</Text> : undefined}
        />
      </View>
    </SafeAreaView>
  </Modal>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { flex: 1, width: '100%', maxWidth: Layout.maxWidth, alignSelf: 'center', paddingHorizontal: Spacing.three, gap: Spacing.three },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, paddingTop: Spacing.two },
  title: { flexShrink: 1, fontFamily: Fonts.bold, fontSize: Typography.title },
  cancel: { minHeight: Layout.touch, justifyContent: 'center', paddingHorizontal: Spacing.three, borderRadius: Radius.s },
  action: { fontFamily: Fonts.medium, fontSize: Typography.body },
  search: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.s },
  input: { flex: 1, minWidth: 0, minHeight: Layout.touch, padding: Spacing.twoHalf, fontFamily: Fonts.sans, fontSize: Typography.body },
  clear: { minHeight: Layout.touch, minWidth: Layout.touch, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.s },
  hint: { fontFamily: Fonts.sans, fontSize: Typography.caption },
  list: { flex: 1 }, results: { flexGrow: 1, paddingBottom: Spacing.three },
  result: { minHeight: Layout.touch, flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, alignItems: 'center', padding: Spacing.three, borderBottomWidth: Layout.border },
  nameGroup: { flex: 1, minWidth: 0, gap: Spacing.one }, name: { fontFamily: Fonts.medium, fontSize: Typography.body },
  number: { fontFamily: Fonts.sans, fontSize: Typography.caption },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, gap: Spacing.three },
  message: { fontFamily: Fonts.sans, fontSize: Typography.body, textAlign: 'center' },
  count: { fontFamily: Fonts.sans, fontSize: Typography.caption, textAlign: 'center', padding: Spacing.three },
});
