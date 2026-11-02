import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ErrorView } from '@/components/error-view';
import { useAppFonts } from '@/hooks/use-app-fonts';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);
const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const fonts = useAppFonts();
  const navigationTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  return (
    <ThemeProvider value={{ ...navigationTheme, colors: { ...navigationTheme.colors, background: theme.background, card: theme.card, text: theme.text, primary: theme.badge, border: theme.border } }}>
      <QueryClientProvider client={queryClient}>
        <View style={[styles.root, { backgroundColor: theme.background }]}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          {fonts.loaded ? <Stack screenOptions={{ headerShown: false }}><Stack.Screen name="(tabs)" /><Stack.Screen name="pokemon/[id]" options={{ gestureEnabled: true }} /></Stack> :
            fonts.error ? <SafeAreaView style={styles.root}><ErrorView message="The app fonts could not load. Please retry." loading={fonts.retrying} onRetry={fonts.retry} useSystemFont /></SafeAreaView> : null}
          <AnimatedSplashOverlay ready={fonts.loaded || Boolean(fonts.error)} />
        </View>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
const styles = StyleSheet.create({ root: { flex: 1 } });
