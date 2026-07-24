import React, { useMemo } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { ArrowLeft, Play, Pause, RotateCcw, Rewind } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { useLibrary } from '../../hooks/useLibrary';
import { useRsvp } from '../../hooks/useRsvp';
import RsvpWord from '../../components/RsvpWord';

export default function ReaderScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();

  const { currentBook, chapters, isLoadingChapters, updateProgress, settings } = useLibrary();

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#090d16' }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <ArrowLeft size={20} color="#94a3b8" />
        </Pressable>
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
          <ActivityIndicator size="large" color="#6366f1" />
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
                    <Pressable
                      key={ch.id}
                      onPress={() => jumpToChapter(chapterWordOffsets[idx])}
                      style={[
                        styles.chip,
                        { backgroundColor: isActive ? '#4f46e5' : '#1e293b' },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: isActive ? '#ffffff' : '#94a3b8' }]}>
                        {ch.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* RSVP Reader Main Area */}
          <View style={styles.mainArea}>
            {/* Progress bar info */}
            <View style={styles.progressInfoWrap}>
              <View style={styles.progressInfoRow}>
                <Text style={styles.wordCounter}>
                  {t('reader.word', { current: Math.min(rsvp.wordIndex + 1, rsvp.words.length), total: rsvp.words.length })}
                </Text>
                <Text style={styles.wpmCounter}>{rsvp.speed} WPM</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${rsvp.progress}%` }]} />
              </View>
            </View>

            {/* RSVP Word Display Box */}
            <View style={styles.wordDisplayWindow}>
              <View style={styles.orpGuideLine} />
              <View style={[styles.orpDot, styles.orpDotTop]} />
              <View style={[styles.orpDot, styles.orpDotBottom]} />

              <RsvpWord word={rsvp.formattedWord} fontSize={32} />
            </View>

            {/* Speed slider */}
            <View style={styles.sliderWrap}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>{t('reader.speed')}</Text>
                <Text style={styles.sliderValue}>{rsvp.speed} WPM</Text>
              </View>
              <Slider
                value={rsvp.speed}
                minimumValue={100}
                maximumValue={1000}
                step={25}
                onValueChange={rsvp.setSpeed}
                minimumTrackTintColor="#6366f1"
                maximumTrackTintColor="#334155"
                thumbTintColor="#6366f1"
                style={styles.slider}
              />
            </View>

            {/* Play/Pause/Reset Controls */}
            <View style={styles.controlsRow}>
              <Pressable
                onPress={rsvp.rewind}
                style={styles.rewindBtn}
              >
                <Rewind size={18} color="#cbd5e1" fill="#cbd5e1" />
                <Text style={styles.rewindBtnText}>{t('reader.rewind')}</Text>
              </Pressable>

              <Pressable
                onPress={rsvp.toggle}
                style={styles.playBtn}
              >
                {rsvp.isPlaying ? (
                  <Pause size={20} color="#ffffff" fill="#ffffff" />
                ) : (
                  <Play size={20} color="#ffffff" fill="#ffffff" />
                )}
                <Text style={styles.playBtnText}>{rsvp.isPlaying ? t('reader.pause') : t('reader.play')}</Text>
              </Pressable>

              <Pressable
                onPress={rsvp.reset}
                style={styles.resetBtn}
              >
                <RotateCcw size={20} color="#cbd5e1" />
              </Pressable>
            </View>

            {/* Fixation point toggle */}
            <View style={styles.fixationRow}>
              <Text style={styles.fixationLabel}>{t('reader.fixation')}</Text>
              <Pressable
                onPress={() => rsvp.setShowFixation(!rsvp.showFixation)}
                style={[styles.toggleBg, { backgroundColor: rsvp.showFixation ? '#4f46e5' : '#334155' }]}
              >
                <View
                  style={[
                    styles.toggleKnob,
                    { transform: [{ translateX: rsvp.showFixation ? 20 : 2 }] },
                  ]}
                />
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    gap: 12,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#1e293b',
  },
  headerInfo: {
    flex: 1,
  },
  bookTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  bookAuthor: {
    color: '#94a3b8',
    fontSize: 11,
  },
  progressPct: {
    color: '#818cf8',
    fontSize: 13,
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
    color: '#94a3b8',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  chaptersBar: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 41, 59, 0.4)',
  },
  chaptersList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mainArea: {
    flex: 1,
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
    color: '#64748b',
    fontSize: 11,
  },
  wpmCounter: {
    color: '#64748b',
    fontSize: 11,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#1e293b',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  wordDisplayWindow: {
    width: '100%',
    maxWidth: 340,
    height: 120,
    backgroundColor: '#0f172a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
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
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  orpDot: {
    position: 'absolute',
    left: '50%',
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
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
    color: '#94a3b8',
    fontSize: 12,
  },
  sliderValue: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '700',
  },
  slider: {
    width: '100%',
    height: 32,
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
    backgroundColor: '#1e293b',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  rewindBtnText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  playBtn: {
    flex: 1,
    height: 54,
    backgroundColor: '#4f46e5',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  playBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  resetBtn: {
    width: 54,
    height: 54,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fixationLabel: {
    color: '#94a3b8',
    fontSize: 12,
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
    backgroundColor: '#ffffff',
  },
});
