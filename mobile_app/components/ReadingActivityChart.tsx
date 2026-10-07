import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import type { ActivityDay } from '../utils/readingActivity';

export default function ReadingActivityChart({ days }: { days: ActivityDay[] }) {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const max = Math.max(60, ...days.map(day => day.seconds));
  return <View style={styles.chart}>
    <View style={styles.columns}>
      {days.map((day, index) => {
        const height = day.seconds / max * 112;
        const label = day.date.toLocaleDateString(i18n.language, { weekday: 'short' });
        return <View key={day.date.getTime()} style={styles.column} accessible accessibilityLabel={t('stats.activityDay', { day: day.date.toLocaleDateString(i18n.language, { weekday: 'long' }), minutes: (day.seconds / 60).toLocaleString(i18n.language, { maximumFractionDigits: 1 }) })}>
          <Text style={[styles.amount, { color: colors.mutedFg }]}>{day.seconds ? Math.round(day.seconds / 60) || '<1' : '—'}</Text>
          <Svg width="100%" height={128} viewBox="0 0 32 128" {...(Platform.OS === 'web' ? { 'aria-hidden': true } : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const })}>
            <Rect x={4} y={8} width={24} height={112} rx={10} fill={colors.surface2} />
            {day.seconds > 0 && <Rect x={4} y={120 - Math.max(4, height)} width={24} height={Math.max(4, height)} rx={Math.min(10, Math.max(4, height) / 2)} fill={index === 6 ? colors.accentEmerald : colors.primary} />}
            <Line x1={0} x2={32} y1={127} y2={127} stroke={colors.border} />
          </Svg>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.day, { color: index === 6 ? colors.accentEmerald : colors.mutedFg }]}>{label}</Text>
        </View>;
      })}
    </View>
    {!days.some(day => day.seconds > 0) && <Text style={{ color: colors.mutedFg, fontSize: 14, lineHeight: 21 }}>{t('stats.weekEmpty')}</Text>}
  </View>;
}
const styles = StyleSheet.create({ chart: { gap: 16 }, columns: { flexDirection: 'row', gap: 6 }, column: { flex: 1, minWidth: 0, alignItems: 'center', gap: 8 }, amount: { fontSize: 11, fontVariant: ['tabular-nums'] }, day: { fontSize: 11, fontWeight: '600', maxWidth: '100%' } });
