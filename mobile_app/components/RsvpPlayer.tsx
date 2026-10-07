import { Action } from './DesignSystem';
/**
 * RsvpPlayer — full RSVP reading widget with speed slider, word display, and controls.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Play, Pause, RotateCcw } from 'lucide-react-native';
import RsvpWord from './RsvpWord';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import type { FormattedWord } from '../types';

interface Props {
  speed: number;
  isPlaying: boolean;
  formattedWord: FormattedWord;
  onSpeedChange: (v: number) => void;
  onToggle: () => void;
  onReset: () => void;
}

export default function RsvpPlayer({
  speed,
  isPlaying,
  formattedWord,
  onSpeedChange,
  onToggle,
  onReset,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
      {/* Speed header */}
      <View style={styles.speedHeader}>
        <Text style={[styles.label, { color: colors.mutedFg }]}>{t('rsvpPlayer.preview')}</Text>
        <Text style={[styles.speedValue, { color: colors.primary }]}>{speed} {t('stats.unit.wpm')}</Text>
      </View>

      {/* Slider */}
      <View style={styles.sliderWrap}>
        <Slider
          value={speed}
          minimumValue={100}
          maximumValue={800}
          step={25}
          onValueChange={onSpeedChange}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.surface3}
          thumbTintColor={colors.primary}
          style={styles.slider}
        />
      </View>

      {/* Word display */}
      <View style={[styles.wordWindow, { backgroundColor: colors.background, borderColor: colors.border }]}>
        {/* ORP guides */}
        <View style={[styles.orpLine, { backgroundColor: colors.primaryMuted }]} />
        <View style={[styles.orpDot, styles.orpDotTop, { backgroundColor: colors.primaryMuted }]} />
        <View style={[styles.orpDot, styles.orpDotBottom, { backgroundColor: colors.primaryMuted }]} />

        <RsvpWord word={formattedWord} fontSize={22} />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Action
          onPress={onToggle}
          style={[styles.playBtn, { backgroundColor: colors.primary }]}
        >
          {isPlaying ? (
            <Pause size={18} color={colors.primaryFg} fill={colors.primaryFg} />
          ) : (
            <Play size={18} color={colors.primaryFg} fill={colors.primaryFg} />
          )}
          <Text style={[styles.playBtnText, { color: colors.primaryFg }]}>
            {isPlaying ? t('rsvpPlayer.pause') : t('rsvpPlayer.play')}
          </Text>
        </Action>

        <Action
          accessibilityLabel={t('rsvpPlayer.reset')} onPress={onReset}
          style={[styles.resetBtn, { backgroundColor: colors.surface3, borderColor: colors.border }]}
        >
          <RotateCcw size={18} color={colors.foreground} />
        </Action>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
  },
  speedHeader: {
    flexWrap: 'wrap',
    gap: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  speedValue: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  sliderWrap: {
    marginBottom: 16,
  },
  slider: {
    width: '100%',
    height: 32,
  },
  wordWindow: {
    height: 64,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  orpLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 1,
  },
  orpDot: {
    position: 'absolute',
    left: '50%',
    marginLeft: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  orpDotTop: {
    top: 6,
  },
  orpDotBottom: {
    bottom: 6,
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
  },
  playBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
  },
  playBtnText: {
    flexShrink: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
  },
  resetBtn: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
  },
});
