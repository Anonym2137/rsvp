import { useFonts } from 'expo-font';
import { Stack, ThemeProvider as NavigationThemeProvider, DarkTheme, DefaultTheme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../hooks/useTheme';
import '../services/i18n';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/globals.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) {
      console.warn('Font load error:', error);
      SplashScreen.hideAsync();
    }
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded && !error) return null;

  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const { isDark, theme, colors } = useTheme();
  const navigationTheme = { ...(isDark ? DarkTheme : DefaultTheme), colors: { ...(isDark ? DarkTheme : DefaultTheme).colors, background: colors.background, card: colors.surface, text: colors.foreground, border: colors.border, primary: colors.primary } };

  return (
    <NavigationThemeProvider value={navigationTheme}>
    <GluestackUIProvider mode={theme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="reader/[id]"
          options={{
            headerShown: false,
            animation: 'slide_from_bottom',
            presentation: 'fullScreenModal',
          }}
        />
      </Stack>
    </GluestackUIProvider>
    </NavigationThemeProvider>
  );
}
