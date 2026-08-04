import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart2, Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import StatCard from '../../components/StatCard';
import StarRating from '../../components/StarRating';
import * as db from '../../db/database';
import type { RatedBook } from '../../db/database';
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
  const [ratedBooks, setRatedBooks] = useState<RatedBook[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const data = await db.getStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
    try {
      const rated = await db.getRatedBooks();
      setRatedBooks(rated);
    } catch (e) {
      console.error('Failed to load rated books:', e);
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

        {/* Ratings overview */}
        <View style={styles.ratingsSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t('stats.ratings')}
          </Text>

          {ratedBooks.length === 0 ? (
            <View style={[styles.ratingsEmpty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Star size={28} color={colors.mutedFg} style={{ opacity: 0.4, marginBottom: 8 }} />
              <Text style={[styles.ratingsEmptyText, { color: colors.mutedFg }]}>
                {t('stats.noRatings')}
              </Text>
            </View>
          ) : (
            <View style={styles.ratingsList}>
              {ratedBooks.map((b) => (
                <View
                  key={b.id}
                  style={[styles.ratedItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  {b.cover ? (
                    <Image source={{ uri: b.cover }} style={styles.ratedCover} resizeMode="cover" />
                  ) : (
                    <View style={[styles.ratedCoverFallback, { backgroundColor: colors.surface3 }]}>
                      <Text style={[styles.ratedCoverFallbackText, { color: colors.primary }]}>
                        {(b.title || '?').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.ratedInfo}>
                    <Text style={[styles.ratedTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {b.title}
                    </Text>
                    <Text style={[styles.ratedAuthor, { color: colors.mutedFg }]} numberOfLines={1}>
                      {b.author}
                    </Text>
                    <View style={styles.ratedStars}>
                      <StarRating value={b.rating} onChange={() => {}} size={16} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
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
  ratingsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  ratingsEmpty: {
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    alignItems: 'center',
  },
  ratingsEmptyText: {
    fontSize: 12,
    textAlign: 'center',
  },
  ratingsList: {
    gap: 10,
  },
  ratedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 10,
  },
  ratedCover: {
    width: 44,
    height: 64,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  ratedCoverFallback: {
    width: 44,
    height: 64,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratedCoverFallbackText: {
    fontSize: 24,
    fontWeight: '900',
  },
  ratedInfo: {
    flex: 1,
    gap: 2,
  },
  ratedTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  ratedAuthor: {
    fontSize: 11,
  },
  ratedStars: {
    marginTop: 2,
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
