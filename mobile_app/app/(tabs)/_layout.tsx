import React from 'react';
import { Tabs } from 'expo-router';
import { Home, BookOpen, Search, BarChart2, Settings2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';

export default function TabLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedFg,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          textTransform: 'uppercase',
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
