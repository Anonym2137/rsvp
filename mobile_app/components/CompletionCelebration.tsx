import StateAnimation from './StateAnimation';
import { Action, Surface } from './DesignSystem';
/**
 * CompletionCelebration — full-screen overlay shown when a book finishes.
 * Renders a reduced-motion-aware celebration, a celebratory card, a star rating,
 * a "Share to Stories" action (delegated to ShareStorySheet), and restart.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, StatusBar,
} from 'react-native';
import { X, Share2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import StarRating from './StarRating';
import ShareStorySheet from './ShareStorySheet';

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

  const [rating, setRating] = useState(initialRating);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (visible) { setRating(initialRating); setShareOpen(false); }
  }, [visible, initialRating]);

  const handleRate = useCallback((value: number) => {
    setRating(value);
    onRate(value);
  }, [onRate]);

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]} pointerEvents="box-none">
      <StatusBar hidden />
      {/* Backdrop + card */}
      <ScrollView contentContainerStyle={styles.backdrop}>
        <Surface
          style={[
            styles.card,
            {
              backgroundColor: colors.surface2,
              borderColor: colors.border,
              shadowColor: colors.primary,
            },

          ]}
        >
          <StateAnimation kind="completion" size={120} visible={!shareOpen} />

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
            <Action
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
              </Action>

            <Action
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
            </Action>
          </View>

          <Action onPress={onRestart} style={styles.restartLink}>
            <Text style={[styles.restartLinkText, { color: colors.primary }]}>
              {t('completion.restart')}
            </Text>
          </Action>
        </Surface>
      </ScrollView>

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
    flexGrow: 1,
    paddingVertical: 24,
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
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
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
    fontSize: 15,
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
    fontSize: 15,
    fontWeight: '700',
  },
  actionText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
