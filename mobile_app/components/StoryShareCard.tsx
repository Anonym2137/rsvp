import { useTheme } from '../hooks/useTheme';
import { type ThemeColors } from '../constants/theme';
import { useTranslation } from 'react-i18next';
/**
 * StoryShareCard — the visual card captured and shared to Instagram Stories.
 * Rendered off-screen (opacity 0) inside CompletionCelebration; we snapshot
 * it with react-native-view-shot and pass the image to Share.shareSingle.
 */
import React, { forwardRef, useMemo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Star } from 'lucide-react-native';

interface Props {
  title: string;
  author: string;
  rating: number;
  cover: string | null;
}

const CARD_W = 1080;
const CARD_H = 1920;

const StoryShareCard = forwardRef<View, Props>(({ title, author, rating, cover }, ref) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View ref={ref} style={styles.card} collapsable={false}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <View style={styles.inner}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={styles.coverFallback}>
            <Text allowFontScaling={false} style={styles.coverFallbackText}>{title.charAt(0).toUpperCase()}</Text>
          </View>
        )}

        <Text allowFontScaling={false} style={styles.badge}>{t('shareCard.completed')}</Text>

        <Text allowFontScaling={false} style={styles.title} numberOfLines={3}>{title}</Text>
        <Text allowFontScaling={false} style={styles.author} numberOfLines={1}>{author}</Text>

        <View style={styles.stars}>
          {Array.from({ length: 5 }).map((_, i) => {
            const filled = i < rating;
            return (
              <Star
                key={i}
                size={48}
                color={filled ? colors.accentAmber : colors.border}
                fill={filled ? colors.accentAmber : 'transparent'}
                strokeWidth={2}
              />
            );
          })}
        </View>

        <View style={styles.footer}>
          <View style={styles.logoDot} />
          <Text allowFontScaling={false} style={styles.footerText}>RSVP Reader</Text>
        </View>
      </View>
    </View>
  );
});

export default StoryShareCard;
export { CARD_W, CARD_H };

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glowTop: {
    position: 'absolute',
    top: -300,
    width: 700,
    height: 700,
    borderRadius: 350,
    backgroundColor: colors.primaryMuted,
    opacity: 0.6,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -360,
    width: 800,
    height: 800,
    borderRadius: 400,
    backgroundColor: colors.accentEmeraldMuted,
    opacity: 0.5,
  },
  inner: {
    width: CARD_W - 160,
    alignItems: 'center',
  },
  cover: {
    width: 360,
    height: 540,
    borderRadius: 48,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: colors.border,
  },
  coverFallback: {
    width: 360,
    height: 540,
    borderRadius: 48,
    marginBottom: 40,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  coverFallbackText: {
    color: colors.primary,
    fontSize: 160,
    fontWeight: '900',
  },
  badge: {
    color: colors.accentEmerald,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 6,
    marginBottom: 18,
  },
  title: {
    color: colors.foreground,
    fontSize: 56,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  author: {
    color: colors.mutedFg,
    fontSize: 30,
    textAlign: 'center',
    marginBottom: 36,
  },
  stars: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 64,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
  },
  footerText: {
    color: colors.foreground,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
