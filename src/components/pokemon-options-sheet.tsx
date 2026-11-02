import { Image } from 'expo-image';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PokemonSummary } from '@/services/pokeapi';

type Props = {
  pokemon: PokemonSummary | null;
  sharing: boolean;
  error: string | null;
  onCancel: () => void;
  onShare: () => void;
  onOpen: () => void;
  onDismiss: () => void;
};

export function PokemonOptionsSheet({ pokemon, sharing, error, onCancel, onShare, onOpen, onDismiss }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const android = Platform.OS === 'android';
  return (
    <Modal visible={pokemon !== null} transparent animationType="fade" onRequestClose={onCancel} onDismiss={onDismiss} statusBarTranslucent>
      <View style={[styles.backdrop, { backgroundColor: theme.backdrop }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss Pokemon options" disabled={sharing} onPress={onCancel} style={StyleSheet.absoluteFill} />
        <View accessibilityViewIsModal onAccessibilityEscape={onCancel} style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.twoHalf), paddingTop: insets.top, paddingHorizontal: android ? 0 : Spacing.twoHalf }]}>
          <ScrollView bounces={false} contentContainerStyle={styles.content}>
            <View style={[styles.group, { backgroundColor: android ? theme.card : theme.sheet, borderRadius: android ? 0 : Radius.l }]}>
              <Text accessibilityRole="header" style={[styles.heading, { color: theme.text, borderColor: theme.border }]}>{pokemon?.displayName}</Text>
              <Pressable disabled={sharing} onPress={onOpen} accessibilityRole="button" accessibilityState={{ disabled: sharing }} accessibilityLabel={'Open ' + (pokemon?.displayName ?? 'Pokemon')} style={({ pressed }) => [styles.row, { borderColor: theme.border, backgroundColor: pressed ? theme.backgroundSelected : undefined }]}>
                <Image source={require('@/assets/images/pokemon-open.png')} tintColor={theme.action} style={styles.icon} contentFit="contain" accessible={false} />
                <View style={styles.labelGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Open Pokémon</Text>
                </View>
              </Pressable>
              <Pressable disabled accessibilityRole="button" accessibilityState={{ disabled: true }} accessibilityLabel="Favorite. Saving favorites is not available yet." style={[styles.row, styles.disabled, { borderColor: theme.border }]}>
                <Image source={require('@/assets/images/favorite-tab-inactive.png')} tintColor={theme.disabled} style={styles.icon} contentFit="contain" accessible={false} />
                <View style={styles.labelGroup}>
                  <Text style={[styles.label, { color: theme.disabled }]}>Favorite</Text>
                  <Text style={[styles.hint, { color: theme.disabled }]}>Saving favorites is coming soon</Text>
                </View>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={'Share ' + (pokemon?.displayName ?? 'Pokemon')} accessibilityState={{ disabled: sharing, busy: sharing }} disabled={sharing} onPress={onShare} style={({ pressed }) => [styles.row, { borderColor: theme.border, backgroundColor: pressed ? theme.backgroundSelected : undefined }]}>
                {sharing ? <ActivityIndicator color={theme.action} style={styles.icon} /> : <Image source={android ? require('@/assets/images/pokemon-share-android.png') : require('@/assets/images/pokemon-share-ios.png')} tintColor={theme.action} style={styles.icon} contentFit="contain" accessible={false} />}
                <Text style={[styles.label, { color: theme.text }]}>{sharing ? 'Opening share sheet…' : 'Share'}</Text>
              </Pressable>
              {error ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Cancel Pokemon options" accessibilityState={{ disabled: sharing }} disabled={sharing} onPress={onCancel} style={({ pressed }) => [styles.cancel, { borderRadius: android ? 0 : Radius.l, backgroundColor: pressed ? theme.backgroundSelected : theme.card, opacity: sharing ? Layout.disabledOpacity : 1 }]}>
              <Text style={[styles.cancelText, { color: theme.action }]}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: { width: '100%', maxWidth: Layout.sheetMaxWidth, maxHeight: '100%' },
  content: { gap: Spacing.twoHalf },
  group: { overflow: 'hidden' },
  heading: { fontFamily: Fonts.medium, fontSize: Typography.caption, textAlign: 'center', padding: Spacing.twoHalf, borderBottomWidth: Layout.border },
  row: { minHeight: Layout.touch + Spacing.twoHalf, flexDirection: 'row', gap: Spacing.threeHalf, alignItems: 'center', padding: Spacing.three, paddingHorizontal: Spacing.threeHalf, borderBottomWidth: StyleSheet.hairlineWidth },
  disabled: { opacity: Layout.disabledOpacity },
  icon: { width: Layout.icon, height: Layout.icon },
  labelGroup: { flex: 1, gap: Spacing.one },
  label: { flexShrink: 1, fontFamily: Fonts.sans, fontSize: Typography.action },
  hint: { fontFamily: Fonts.sans, fontSize: Typography.small },
  error: { fontFamily: Fonts.sans, fontSize: Typography.caption, padding: Spacing.three },
  cancel: { minHeight: Layout.touch, alignItems: 'center', justifyContent: 'center', padding: Spacing.three },
  cancelText: { fontFamily: Fonts.bold, fontSize: Typography.subtitle },
});
