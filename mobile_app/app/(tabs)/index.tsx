import { Design } from '../../constants/theme';
import StateAnimation from '../../components/StateAnimation';
import { ScreenHeader, StatusBadge, Action, Surface } from '../../components/DesignSystem';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, Image, StyleSheet, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings2, Timer, Gauge, BookOpen, Search, Zap, Maximize2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { useLibrary } from '../../hooks/useLibrary';
import { useRsvp } from '../../hooks/useRsvp';
import RsvpPlayer from '../../components/RsvpPlayer';
import ProgressBar from '../../components/ProgressBar';
import AddBookModal from '../../components/AddBookModal';
import * as db from '../../db/database';
import type { Stats } from '../../types';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { books, currentBook, currentText, settings, selectBook, updateProgress, refreshBooks } = useLibrary();

  const [stats, setStats] = useState<Stats>({ totalMinutes: 0, maxWpm: 0, booksCount: 0, streak: 0, totalWordsRead: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const s = await db.getStats();
      setStats(s);
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshBooks(), loadStats()]);
    setRefreshing(false);
  }, [refreshBooks, loadStats]);

  const rsvp = useRsvp({
    currentText,
    currentBookId: currentBook?.id ?? null,
    initialWordIndex: currentBook?.wordIndex ?? 0,
    initialSpeed: settings?.readingSpeed ?? 300,
    initialShowFixation: settings?.showFixation ?? true,
    onProgressUpdate: updateProgress,
  });

  const recommended = (books ?? []).filter((b) => !currentBook || b.id !== currentBook.id).slice(0, 5);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <ScreenHeader title="RSVP Reader" subtitle={t('home.welcome')}
          action={<Action accessibilityLabel={t('settings.title')} onPress={() => router.push('/settings')}
            style={[styles.iconBtn, { backgroundColor: colors.primaryMuted }]}><Settings2 size={20} color={colors.primary} /></Action>} />

        {/* Today's Stats */}
        <View style={styles.statsRow}>
          <Surface style={[styles.statBox, { backgroundColor: colors.accentEmeraldMuted, borderColor: colors.accentEmeraldMuted }]}>
            <View style={styles.statBoxHeader}>
              <Text style={[styles.statBoxLabel, { color: colors.mutedFg }]}>{t('home.timeToday')}</Text>
              <View style={[styles.iconBadge, { backgroundColor: colors.accentEmeraldMuted }]}>
                <Timer size={16} color={colors.accentEmerald} />
              </View>
            </View>
            <Text style={[styles.statBoxVal, { color: colors.foreground }]}>
              {stats.totalMinutes} <Text style={[styles.statBoxUnit, { color: colors.mutedFg }]}>{t('stats.unit.min')}</Text>
            </Text>
          </Surface>

          <Surface style={[styles.statBox, { backgroundColor: colors.primaryMuted, borderColor: colors.primaryMuted }]}>
            <View style={styles.statBoxHeader}>
              <Text style={[styles.statBoxLabel, { color: colors.mutedFg }]}>{t('home.maxWpm')}</Text>
              <View style={[styles.iconBadge, { backgroundColor: colors.primaryMuted }]}>
                <Gauge size={16} color={colors.primary} />
              </View>
            </View>
            <Text style={[styles.statBoxVal, { color: colors.foreground }]}>
              {stats.maxWpm} <Text style={[styles.statBoxUnit, { color: colors.mutedFg }]}>{t('stats.unit.wpm')}</Text>
            </Text>
          </Surface>
        </View>

        {/* Currently Reading Section */}
        <View style={styles.section}>
          {!currentBook ? (
            <Surface style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <StateAnimation kind="book" />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t('home.noBooks')}</Text>
              <Text style={[styles.emptyDesc, { color: colors.mutedFg }]}>
                {t('home.noBooksDesc')}
              </Text>
              <Action
                onPress={() => setAddModalVisible(true)}
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              >
                <Search size={16} color={colors.primaryFg} />
                <Text style={[styles.primaryBtnText, { color: colors.primaryFg }]}>{t('library.discoverBooks')}</Text>
              </Action>
            </Surface>
          ) : (
            <Surface style={[styles.currentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Info Header */}
              <View style={styles.bookInfoHeader}>
                <View style={[styles.coverWrap, { backgroundColor: colors.surface3, borderColor: colors.border }]}>
                  {currentBook.cover ? (
                    <Image source={{ uri: currentBook.cover }} style={styles.coverImg} />
                  ) : (
                    <BookOpen size={24} color={colors.subtleFg} />
                  )}
                </View>

                <View style={styles.bookMeta}>
                  <StatusBadge>
                    <Zap size={12} color={colors.primary} />
                    <Text style={[styles.badgeText, { color: colors.primary }]}>{t('home.readingNow')}</Text>
                  </StatusBadge>
                  <Text style={[styles.bookTitle, { color: colors.foreground }]} numberOfLines={2}>
                    {currentBook.title}
                  </Text>
                  <Text style={[styles.bookAuthor, { color: colors.mutedFg }]} numberOfLines={1}>
                    {currentBook.author}
                  </Text>

                  <View style={styles.progressWrap}>
                    <View style={styles.progressTextRow}>
                      <Text style={[styles.progressLabel, { color: colors.mutedFg }]}>{t('home.progress')}</Text>
                      <Text style={[styles.progressValue, { color: colors.foreground }]}>
                        {Math.round(rsvp.progress)}%
                      </Text>
                    </View>
                    <ProgressBar value={rsvp.progress} height={6} />
                  </View>
                </View>
              </View>

              {/* RSVP Player */}
              <View style={styles.playerPadding}>
                <RsvpPlayer
                  speed={rsvp.speed}
                  isPlaying={rsvp.isPlaying}
                  formattedWord={rsvp.formattedWord}
                  onSpeedChange={rsvp.setSpeed}
                  onToggle={rsvp.toggle}
                  onReset={rsvp.reset}
                />
              </View>

              {/* Open full reader */}
              <Action
                onPress={() => router.push(`/reader/${currentBook.id}`)}
                style={[styles.openReaderBtn, { borderTopColor: colors.border }]}
              >
                <Maximize2 size={16} color={colors.primary} />
                <Text style={[styles.openReaderText, { color: colors.primary }]}>{t('home.openReader')}</Text>
              </Action>
            </Surface>
          )}
        </View>

        {/* From Your Library Horizontal Scroll */}
        {recommended.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('home.fromLibrary')}</Text>
              <Action onPress={() => router.push('/library')}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>{t('home.allBooks')}</Text>
              </Action>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollList}>
              {recommended.map((b) => (
                <Action
                  key={b.id}
                  onPress={async () => {
                    await selectBook(b.id);
                    router.push(`/reader/${b.id}`);
                  }}
                  style={styles.recItem}
                >
                  <View style={[styles.recCover, { backgroundColor: colors.surface3, borderColor: colors.border }]}>
                    {b.cover ? (
                      <Image source={{ uri: b.cover }} style={styles.coverImg} />
                    ) : (
                      <BookOpen size={24} color={colors.subtleFg} />
                    )}
                  </View>
                  <Text style={[styles.recTitle, { color: colors.foreground }]} numberOfLines={1}>
                    {b.title}
                  </Text>
                  <Text style={[styles.recAuthor, { color: colors.mutedFg }]} numberOfLines={1}>
                    {b.author}
                  </Text>
                </Action>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      <AddBookModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdded={async (id) => {
          setAddModalVisible(false);
          await selectBook(id);
          router.push(`/reader/${id}`);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: Design.spacing.lg,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    borderRadius: 28,
    padding: 14,
    borderWidth: 1,
  },
  statBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statBoxLabel: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  iconBadge: {
    padding: 6,
    borderRadius: 10,
  },
  statBoxVal: {
    fontSize: 22,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  statBoxUnit: {
    fontSize: 14,
    fontWeight: '400',
  },
  section: {
    marginTop: 4,
  },
  emptyCard: {
    borderRadius: 32,
    padding: 32,
    borderWidth: 1,
    alignItems: 'center',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Design.spacing.lg,
    paddingVertical: 12,
    borderRadius: 16,
  },
  primaryBtnText: {
    flexShrink: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
  currentCard: {
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
  },
  bookInfoHeader: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  coverWrap: {
    width: 64,
    height: 96,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bookMeta: {
    minWidth: 0,
    flex: 1,
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 4,
  },
  badgeText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 23,
  },
  bookAuthor: {
    fontSize: 14,
    marginTop: 2,
  },
  progressWrap: {
    marginTop: 8,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  playerPadding: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  openReaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  openReaderText: {
    flexShrink: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollList: {
    gap: 12,
  },
  recItem: {
    width: 112,
  },
  recCover: {
    width: 112,
    height: 144,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  recTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  recAuthor: {
    fontSize: 12,
    marginTop: 2,
  },
});
