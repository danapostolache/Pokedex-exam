import { Image } from 'expo-image';
import { Tabs } from 'expo-router';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, Layout, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function TabLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: theme.badge,
      tabBarInactiveTintColor: theme.text,
      tabBarLabelStyle: { fontFamily: Fonts.medium, fontSize: Typography.small },
      tabBarStyle: { backgroundColor: theme.background, borderTopWidth: 0, height: Layout.tabHeight + insets.bottom + Math.max(0, fontScale - 1) * Typography.subtitle, paddingBottom: Math.max(insets.bottom, Spacing.one), paddingTop: Spacing.one },
      tabBarItemStyle: { minHeight: Layout.touch },
      tabBarLabelPosition: 'below-icon',
      tabBarHideOnKeyboard: true,
    }}>
      <Tabs.Screen name="index" options={{
        title: 'Pokemon', tabBarAccessibilityLabel: 'Pokemon list',
        tabBarIcon: ({ focused }) => <Image source={focused ? require('@/assets/images/pokemon-tab-active.png') : require('@/assets/images/pokemon-tab-inactive.png')} tintColor={focused ? theme.badge : theme.text} style={styles.icon} contentFit="contain" accessible={false} />,
      }} />
      <Tabs.Screen name="favorites" options={{
        title: 'Favorites', tabBarAccessibilityLabel: 'Favorites',
        tabBarIcon: ({ focused }) => <Image source={focused ? require('@/assets/images/favorite-tab-active.png') : require('@/assets/images/favorite-tab-inactive.png')} tintColor={focused ? theme.badge : theme.text} style={styles.icon} contentFit="contain" accessible={false} />,
      }} />
      <Tabs.Screen name="compare" options={{
        title: 'Compare', tabBarAccessibilityLabel: 'Compare',
        tabBarIcon: ({ focused }) => <Image source={require('@/assets/images/compare-tab.png')} tintColor={focused ? theme.badge : theme.text} style={styles.icon} contentFit="contain" accessible={false} />,
      }} />
    </Tabs>
  );
}
const styles = StyleSheet.create({ icon: { width: Layout.icon, height: Layout.icon } });
