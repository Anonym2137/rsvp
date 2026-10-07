import StateAnimation from '../../components/StateAnimation';
import { Action } from '../../components/DesignSystem';
import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Switch,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { ArrowLeft, Play, Pause, RotateCcw, Rewind } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useLibrary } from '../../hooks/useLibrary';
import { useRsvp } from '../../hooks/useRsvp';
import * as db from '../../db/database';
import RsvpWord from '../../components/RsvpWord';
import CompletionCelebration from '../../components/CompletionCelebration';

export default function ReaderScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();

  const { currentBook, chapters, isLoadingChapters, updateProgress, settings } = useLibrary();

  const handleRate = (rating: number) => {
    if (currentBook) {
      db.updateBookRating(currentBook.id, rating).catch((e) =>
        console.error('Failed to save rating:', e)
      );
    }
  };

  const rsvp = useRsvp({
    currentText: chapters.map((c) => c.content).join(' '),
    currentBookId: currentBook?.id ?? null,
    initialWordIndex: currentBook?.wordIndex ?? 0,
    initialSpeed: settings?.readingSpeed ?? 300,
    initialShowFixation: settings?.showFixation ?? true,
    onProgressUpdate: updateProgress,
  });

  // Calculate chapter word offsets
  const chapterWordOffsets = useMemo(() => {
    let offset = 0;
    return chapters.map((ch) => {
      const start = offset;
      const chWords = ch.content ? ch.content.split(/\s+/).filter(Boolean).length : 0;
      offset += chWords;
      return { ...ch, startWord: start, endWord: offset - 1 };
    });
  }, [chapters]);

  const currentChapterIndex = useMemo(() => {
    const idx = chapterWordOffsets.findLastIndex((c) => rsvp.wordIndex >= c.startWord);
    return idx >= 0 ? idx : 0;
  }, [chapterWordOffsets, rsvp.wordIndex]);

  const jumpToChapter = (ch: typeof chapterWordOffsets[0]) => {
    rsvp.setWordIndex(ch.startWord);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Action
          accessibilityLabel={t('accessibility.back')} onPress={() => router.back()}
          style={styles.backBtn}
        >
          <ArrowLeft size={20} color={colors.mutedFg} />
        </Action>
        <View style={styles.headerInfo}>
          <Text style={styles.bookTitle} numberOfLines={1}>
            {currentBook?.title ?? t('reader.noBook')}
          </Text>
          <Text style={styles.bookAuthor} numberOfLines={1}>
            {currentBook?.author ?? ''}
          </Text>
        </View>
        <Text style={styles.progressPct}>{Math.round(rsvp.progress)}%</Text>
      </View>

      {isLoadingChapters ? (
        <View style={styles.loadingCenter}>
          <StateAnimation kind="loading" size={80} />
          <Text style={styles.loadingText}>{t('reader.loadingChapters')}</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {/* Chapter selector */}
          {chapters.length > 0 && (
            <View style={styles.chaptersBar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chaptersList}>
                {chapters.map((ch, idx) => {
                  const isActive = idx === currentChapterIndex;
                  return (
                    <Action
                      key={ch.id}
                      onPress={() => jumpToChapter(chapterWordOffsets[idx])}
                      style={[
                        styles.chip,
                        { backgroundColor: isActive ? colors.primary : colors.surface2 },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: isActive ? colors.primaryFg : colors.mutedFg }]}>
                        {ch.label}
                      </Text>
                    </Action>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* RSVP Reader Main Area */}
          <ScrollView contentContainerStyle={styles.mainArea}>
            {/* Progress bar info */}
            <View style={styles.progressInfoWrap}>
              <View style={styles.progressInfoRow}>
                <Text style={styles.wordCounter}>
                  {t('reader.word', { current: Math.min(rsvp.wordIndex + 1, rsvp.words.length), total: rsvp.words.length })}
                </Text>
                <Text style={styles.wpmCounter}>{rsvp.speed} {t('stats.unit.wpm')}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${rsvp.progress}%` }]} />
              </View>
            </View>

            {/* RSVP Word Display Box */}
            <View style={styles.wordDisplayWindow}>
              {rsvp.showFixation && <View style={styles.orpGuideLine} />}
              {rsvp.showFixation && <View style={[styles.orpDot, styles.orpDotTop]} />}
              {rsvp.showFixation && <View style={[styles.orpDot, styles.orpDotBottom]} />}

              <RsvpWord word={rsvp.formattedWord} fontSize={32} />
            </View>

            {/* Speed slider */}
            <View style={styles.sliderWrap}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>{t('reader.speed')}</Text>
                <Text style={styles.sliderValue}>{rsvp.speed} {t('stats.unit.wpm')}</Text>
              </View>
              <Slider
                value={rsvp.speed}
                minimumValue={100}
                maximumValue={1000}
                step={25}
                onValueChange={rsvp.setSpeed}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.surface3}
                thumbTintColor={colors.primary}
                style={styles.slider}
              />
            </View>

            {/* Play/Pause/Reset Controls */}
            <View style={styles.controlsRow}>
              <Action
                onPress={rsvp.rewind}
                style={styles.rewindBtn}
              >
                <Rewind size={18} color={colors.foreground} fill={colors.foreground} />
                <Text style={styles.rewindBtnText}>{t('reader.rewind')}</Text>
              </Action>

              <Action
                onPress={rsvp.toggle}
                style={styles.playBtn}
              >
                {rsvp.isPlaying ? (
                  <Pause size={20} color={colors.primaryFg} fill={colors.primaryFg} />
                ) : (
                  <Play size={20} color={colors.primaryFg} fill={colors.primaryFg} />
                )}
                <Text style={styles.playBtnText}>{rsvp.isPlaying ? t('reader.pause') : t('reader.play')}</Text>
              </Action>

              <Action
                accessibilityLabel={t('rsvpPlayer.reset')} onPress={rsvp.reset}
                style={styles.resetBtn}
              >
                <RotateCcw size={20} color={colors.foreground} />
              </Action>
            </View>

            {/* Fixation point toggle */}
            <View style={styles.fixationRow}>
              <Text style={styles.fixationLabel}>{t('reader.fixation')}</Text>
              <Switch value={rsvp.showFixation}
                accessibilityLabel={t('reader.fixation')}
                onValueChange={rsvp.setShowFixation}
                trackColor={{ false: colors.surface3, true: colors.primary }}
                thumbColor={colors.primaryFg} />
            </View>
          </ScrollView>
        </View>
      )}

      <CompletionCelebration
        visible={rsvp.isFinished}
        bookId={currentBook?.id ?? null}
        bookTitle={currentBook?.title ?? ''}
        bookAuthor={currentBook?.author ?? ''}
        bookCover={currentBook?.cover ?? null}
        initialRating={currentBook?.rating ?? 0}
        onRate={handleRate}
        onRestart={rsvp.restart}
        onClose={rsvp.dismissFinish}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface2,
    gap: 12,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: colors.surface2,
  },
  headerInfo: {
    flex: 1,
  },
  bookTitle: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '700',
  },
  bookAuthor: {
    color: colors.mutedFg,
    fontSize: 13,
  },
  progressPct: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.mutedFg,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  chaptersBar: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  chaptersList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 28,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  mainArea: {
    flexGrow: 1,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 24,
  },
  progressInfoWrap: {
    width: '100%',
    maxWidth: 340,
  },
  progressInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  wordCounter: {
    color: colors.mutedFg,
    fontSize: 13,
  },
  wpmCounter: {
    color: colors.mutedFg,
    fontSize: 13,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.surface2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  wordDisplayWindow: {
    width: '100%',
    maxWidth: 340,
    height: 120,
    backgroundColor: colors.surface,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  orpGuideLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 1,
    backgroundColor: colors.primaryMuted,
  },
  orpDot: {
    position: 'absolute',
    left: '50%',
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryMuted,
  },
  orpDotTop: {
    top: 8,
  },
  orpDotBottom: {
    bottom: 8,
  },
  sliderWrap: {
    width: '100%',
    maxWidth: 340,
    gap: 4,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    color: colors.mutedFg,
    fontSize: 14,
  },
  sliderValue: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  slider: {
    width: '100%',
    height: 32,
    zIndex: 1,
  },
  controlsRow: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 340,
    gap: 12,
  },
  rewindBtn: {
    width: 74,
    height: 54,
    backgroundColor: colors.surface2,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  rewindBtnText: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '700',
  },
  playBtn: {
    flex: 1,
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  playBtnText: {
    color: colors.primaryFg,
    fontSize: 15,
    fontWeight: '700',
  },
  resetBtn: {
    width: 54,
    height: 54,
    backgroundColor: colors.surface2,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fixationLabel: {
    color: colors.mutedFg,
    fontSize: 14,
  },
  toggleBg: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primaryFg,
  },
});
