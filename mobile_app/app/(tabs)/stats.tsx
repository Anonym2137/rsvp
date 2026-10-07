import { Design } from '../../constants/theme';
import StateAnimation from '../../components/StateAnimation';
import { ScreenHeader, Surface } from '../../components/DesignSystem';
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart2, Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import ReadingActivityChart from '../../components/ReadingActivityChart';
import { readingActivity } from '../../utils/readingActivity';
import { useFocusEffect } from 'expo-router';
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
  const [activity, setActivity] = useState(() => readingActivity([]));
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const data = await db.getStats();
      setStats(data);
      setActivity(readingActivity(await db.getRecentReadingSessions()));
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

  useFocusEffect(useCallback(() => {
    void loadStats();
  }, [loadStats]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, [loadStats]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 0 }}><ScreenHeader title={t('stats.title')} subtitle={t('stats.subtitle')} /></View>

        <Surface style={{ padding: 24, gap: 12, backgroundColor: colors.primaryMuted }}>
          <Text style={{ color: colors.mutedFg, fontSize: 15 }}>{t('stats.totalTime')}</Text>
          <Text style={{ color: colors.foreground, fontSize: 44, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
            {stats.totalMinutes.toLocaleString()} <Text style={{ fontSize: 18, fontWeight: '500' }}>{t('stats.unit.min')}</Text>
          </Text>
          <Text style={{ color: colors.primary, fontSize: 15 }}>{t('stats.words')}: {stats.totalWordsRead.toLocaleString()}</Text>
        </Surface>

        <Surface style={{ padding: 20, gap: 16 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 0 }]}>{t('stats.activity')}</Text>
          <Text style={{ color: colors.mutedFg, fontSize: 14 }}>{t('stats.activitySummary', { minutes: Math.round(activity.reduce((sum, day) => sum + day.seconds, 0) / 60) })}</Text>
          <ReadingActivityChart days={activity} />
        </Surface>

        <Surface style={{ paddingHorizontal: 20 }}>
          {[
            { label: t('stats.maxSpeed'), value: stats.maxWpm, unit: t('stats.unit.wpm'), color: colors.accentEmerald },
            { label: t('stats.streak'), value: stats.streak, unit: t('stats.unit.days'), color: colors.accentAmber },
            { label: t('stats.books'), value: stats.booksCount, unit: t('stats.unit.pcs'), color: colors.primary },
          ].map((metric, index) => <View key={metric.label} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, paddingVertical: 18, borderTopWidth: index ? 1 : 0, borderColor: colors.borderSubtle }}>
            <Text style={{ flexGrow: 1, flexShrink: 1, color: colors.mutedFg, fontSize: 15 }}>{metric.label}</Text>
            <Text style={{ color: metric.color, fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{metric.value.toLocaleString()} <Text style={{ fontSize: 13, fontWeight: '500' }}>{metric.unit}</Text></Text>
          </View>)}
        </Surface>

        {/* Ratings overview */}
        <View style={styles.ratingsSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t('stats.ratings')}
          </Text>

          {ratedBooks.length === 0 ? (
            <Surface style={[styles.ratingsEmpty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Star size={28} color={colors.mutedFg} style={{ opacity: 0.4, marginBottom: 8 }} />
              <Text style={[styles.ratingsEmptyText, { color: colors.mutedFg }]}>
                {t('stats.noRatings')}
              </Text>
            </Surface>
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
        {stats.totalWordsRead === 0 && (
          <Surface style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <StateAnimation kind="book" />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t('stats.noData')}</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedFg }]}>
              {t('stats.noDataDesc')}
            </Text>
          </Surface>
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
    padding: Design.spacing.lg,
    paddingBottom: 30,
    gap: 16,
  },
  header: {
    paddingTop: 12,
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
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
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    alignItems: 'center',
  },
  ratingsEmptyText: {
    fontSize: 14,
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
    fontSize: 30,
    fontWeight: '900',
  },
  ratedInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  ratedTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  ratedAuthor: {
    fontSize: 13,
  },
  ratedStars: {
    marginTop: 2,
  },
  emptyBox: {
    borderRadius: 32,
    padding: 32,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: 'center',
  },
});
