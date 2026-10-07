import { Surface } from './DesignSystem';
/**
 * StatCard — a metric tile for the Stats page.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Timer, Gauge, BookOpen, Flame } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';

const iconMap: Record<string, React.ComponentType<any>> = {
  Timer,
  Gauge,
  BookOpen,
  Flame,
};

interface Props {
  label: string;
  value: string;
  unit?: string;
  icon: string;
  accent?: 'indigo' | 'emerald' | 'amber';
}

export default function StatCard({ label, value, unit, icon, accent = 'indigo' }: Props) {
  const { colors } = useTheme();

  const IconComponent = iconMap[icon] || BookOpen;

  const accentColor =
    accent === 'emerald'
      ? colors.accentEmerald
      : accent === 'amber'
      ? colors.accentAmber
      : colors.primary;

  const accentBg =
    accent === 'emerald'
      ? colors.accentEmeraldMuted
      : accent === 'amber'
      ? colors.accentAmberMuted
      : colors.primaryMuted;

  const valueColor = accent === 'indigo' ? colors.foreground : accentColor;

  return (
    <Surface style={[styles.container, { backgroundColor: accentBg, borderColor: accentColor + '44' }]}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.mutedFg }]}>{label}</Text>
        <View style={[styles.iconWrap, { backgroundColor: accentBg }]}>
          <IconComponent size={16} color={accentColor} />
        </View>
      </View>
      <Text style={[styles.value, { color: valueColor }]}>
        {value}
        {unit ? (
          <Text style={[styles.unit, { color: colors.mutedFg }]}> {unit}</Text>
        ) : null}
      </Text>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontSize: 14,
    fontWeight: '400',
  },
});
