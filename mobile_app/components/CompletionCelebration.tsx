/**
 * CompletionCelebration — full-screen overlay shown when a book finishes.
 * Renders an animated confetti burst, a celebratory card, a star rating,
 * a "Share to Stories" action (delegated to ShareStorySheet), and restart.
 */
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, Dimensions, Vibration, StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
  interpolate, Easing,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { Check, RotateCcw, X, Share2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import StarRating from './StarRating';
import ShareStorySheet from './ShareStorySheet';

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');

const CONFETTI_COLORS = [
  '#6366f1', '#818cf8', '#34d399', '#fbbf24', '#f472b6',
  '#38bdf8', '#a78bfa', '#fb7185',
];

interface Particle {
  id: number;
  color: string;
  startX: number;      // percentage 0-100
  endX: number;        // percentage 0-100
  size: number;
  delay: number;       // fraction of total duration 0-0.4
  spin: number;        // total rotation in degrees
  round: boolean;
}

interface Props {
  visible: boolean;
  bookId: number | null;
  bookTitle: string;
  bookAuthor: string;
  bookCover: string | null;
  initialRating: number;
  onRate: (rating: number) => void;
  onRestart: () => void;
  onClose: () => void;
}

function buildParticles(count: number): Particle[] {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    startX: Math.random() * 100,
    endX: Math.random() * 100,
    size: 8 + Math.random() * 8,
    delay: Math.random() * 0.4,
    spin: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 540),
    round: Math.random() > 0.6,
  }));
}

function ConfettiPiece({ p, t }: { p: Particle; t: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const local = interpolate(t.value, [p.delay, 1], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const fallDist = SCREEN_H + 80;
    const y = interpolate(local, [0, 1], [-40, fallDist]);
    const x = interpolate(local, [0, 1], [p.startX, p.endX]) * (SCREEN_W / 100);
    const rotate = interpolate(local, [0, 1], [0, p.spin]);
    const opacity = interpolate(local, [0, 0.08, 0.8, 1], [0, 1, 1, 0]);
    return {
      opacity,
      transform: [{ translateX: x - SCREEN_W / 2 }, { translateY: y }, { rotate: `${rotate}deg` }],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: 0,
          left: SCREEN_W / 2,
          width: p.size,
          height: p.size,
          backgroundColor: p.color,
          borderRadius: p.round ? p.size / 2 : 2,
        },
        style,
      ]}
    />
  );
}

export default function CompletionCelebration({
  visible,
  bookId,
  bookTitle,
  bookAuthor,
  bookCover,
  initialRating,
  onRate,
  onRestart,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const particles = useMemo(() => buildParticles(28), []);
  const burst = useSharedValue(0);
  const cardScale = useSharedValue(0.85);
  const cardOpacity = useSharedValue(0);

  const [rating, setRating] = useState(initialRating);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (visible) {
      setRating(initialRating);
      setShareOpen(false);
      burst.value = 0;
      burst.value = withTiming(1, { duration: 2600, easing: Easing.linear });
      cardScale.value = withSpring(1, { damping: 14, stiffness: 180 });
      cardOpacity.value = withTiming(1, { duration: 260 });
      Vibration.vibrate([0, 70, 40, 130]);
    } else {
      cardScale.value = 0.85;
      cardOpacity.value = 0;
    }
  }, [visible, initialRating, burst, cardScale, cardOpacity]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const handleRate = useCallback((value: number) => {
    setRating(value);
    onRate(value);
  }, [onRate]);

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]} pointerEvents="box-none">
      <StatusBar hidden />
      {/* Confetti layer */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {particles.map((p) => (
          <ConfettiPiece key={p.id} p={p} t={burst} />
        ))}
      </View>

      {/* Backdrop + card */}
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface2,
              borderColor: colors.border,
              shadowColor: colors.primary,
            },
            cardStyle,
          ]}
        >
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Check size={34} color={colors.primaryFg} strokeWidth={3} />
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>
            {t('completion.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedFg }]}>
            {t('completion.body', { title: bookTitle })}
          </Text>

          {/* Star rating */}
          <View style={styles.ratingWrap}>
            <Text style={[styles.ratingPrompt, { color: colors.mutedFg }]}>
              {t('completion.ratePrompt')}
            </Text>
            <StarRating value={rating} onChange={handleRate} size={32} />
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={() => setShareOpen(true)}
              style={[
                styles.actionBtn,
                styles.shareBtn,
                { backgroundColor: '#E1306C' },
              ]}
            >
                <Share2 size={16} color="#ffffff" />
                <Text style={[styles.actionText, { color: '#ffffff' }]}>
                  {t('completion.shareStory')}
                </Text>
              </Pressable>

            <Pressable
              onPress={onClose}
              style={[
                styles.actionBtn,
                styles.closeBtn,
                { backgroundColor: colors.surface3, borderColor: colors.border },
              ]}
            >
              <X size={16} color={colors.foreground} />
              <Text style={[styles.actionText, { color: colors.foreground }]}>
                {t('completion.close')}
              </Text>
            </Pressable>
          </View>

          <Pressable onPress={onRestart} style={styles.restartLink}>
            <Text style={[styles.restartLinkText, { color: colors.primary }]}>
              {t('completion.restart')}
            </Text>
          </Pressable>
        </Animated.View>
      </View>

      <ShareStorySheet
        visible={shareOpen}
        bookTitle={bookTitle}
        bookAuthor={bookAuthor}
        bookCover={bookCover}
        initialRating={rating}
        onClose={() => setShareOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(9, 13, 22, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 1,
    paddingVertical: 32,
    paddingHorizontal: 24,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 12,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  ratingWrap: {
    alignItems: 'center',
    marginBottom: 18,
    gap: 10,
  },
  ratingPrompt: {
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  shareBtn: {
    borderWidth: 0,
  },
  disabled: {
    opacity: 0.6,
  },
  closeBtn: {},
  restartLink: {
    marginTop: 16,
  },
  restartLinkText: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
