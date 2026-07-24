import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import StatCard from '../../components/StatCard';
import * as db from '../../db/database';
import type { Stats } from '../../types';

export default function StatsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [stats, setStats] = useState<Stats>({
    totalMinutes: 0,
    maxWpm: 0,
    booksCount: 0,
    streak: 0,
    totalWordsRead: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const data = await db.getStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, [loadStats]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>{t('stats.title')}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedFg }]}>
            {t('stats.subtitle')}
          </Text>
        </View>

        {/* 2x2 Grid */}
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <StatCard
              label={t('stats.totalTime')}
              value={String(stats.totalMinutes)}
              unit={t('stats.unit.min')}
              icon="Timer"
              accent="indigo"
            />
          </View>
          <View style={styles.gridItem}>
            <StatCard
              label={t('stats.maxSpeed')}
              value={String(stats.maxWpm)}
              unit={t('stats.unit.wpm')}
              icon="Gauge"
              accent="emerald"
            />
          </View>
          <View style={styles.gridItem}>
            <StatCard
              label={t('stats.books')}
              value={String(stats.booksCount)}
              unit={t('stats.unit.pcs')}
              icon="BookOpen"
              accent="indigo"
            />
          </View>
          <View style={styles.gridItem}>
            <StatCard
              label={t('stats.streak')}
              value={String(stats.streak)}
              unit={t('stats.unit.days')}
              icon="Flame"
              accent="amber"
            />
          </View>
        </View>

        {/* Empty state when no reading time */}
        {stats.totalMinutes === 0 && (
          <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <BarChart2 size={40} color={colors.mutedFg} style={{ opacity: 0.4, marginBottom: 12 }} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t('stats.noData')}</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedFg }]}>
              {t('stats.noDataDesc')}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 30,
    gap: 16,
  },
  header: {
    paddingTop: 12,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '48%',
  },
  emptyBox: {
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 12,
    textAlign: 'center',
  },
});
