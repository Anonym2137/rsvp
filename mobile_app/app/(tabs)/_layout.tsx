import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React from 'react';
import { Text, useWindowDimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, BookOpen, Search, BarChart2, Settings2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarLabel: ({ children, color }) => <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} maxFontSizeMultiplier={1.5} style={{ color, fontSize: 11, fontWeight: '600', textAlign: 'center', maxWidth: '100%' }}>{children}</Text>,
        tabBarInactiveTintColor: colors.mutedFg,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 68 + Math.min(fontScale, 1.5) * 12 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 12),
          paddingTop: 10,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.home'),
          tabBarIcon: ({ color, size }) => <Home size={size ?? 20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: t('nav.library'),
          tabBarIcon: ({ color, size }) => <BookOpen size={size ?? 20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: t('nav.explore'),
          tabBarIcon: ({ color, size }) => <Search size={size ?? 20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: t('nav.stats'),
          tabBarIcon: ({ color, size }) => <BarChart2 size={size ?? 20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('nav.settings'),
          tabBarIcon: ({ color, size }) => <Settings2 size={size ?? 20} color={color} />,
        }}
      />
    </Tabs>
  );
}
