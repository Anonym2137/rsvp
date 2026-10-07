import { Action, Sheet } from './DesignSystem';
/**
 * BookActionSheet — bottom sheet shown when a book in the library is tapped.
 * Offers: Read, Share to Stories (ShareStorySheet), Change rating, Delete.
 * For rated books this is the primary entry point; for unrated books it is
 * reached via long-press (configured by the parent).
 */
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BookOpen, Share2, Star, Trash2, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import StarRating from './StarRating';
import ShareStorySheet from './ShareStorySheet';
import type { Book } from '../types';

interface Props {
  book: Book | null;
  visible: boolean;
  onClose: () => void;
  onRead: (id: number) => void;
  onChangeRating: (id: number, rating: number) => void;
  onDelete: (id: number) => void;
}

export default function BookActionSheet({
  book,
  visible,
  onClose,
  onRead,
  onChangeRating,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [shareOpen, setShareOpen] = useState(false);
  const [editingRating, setEditingRating] = useState(false);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    if (visible && book) {
      setRating(book.rating);
      setEditingRating(false);
      setShareOpen(false);
    }
  }, [visible, book]);

  const handleRate = useCallback((value: number) => {
    setRating(value);
    if (book) onChangeRating(book.id, value);
  }, [book, onChangeRating]);

  const handleDelete = useCallback(() => {
    if (!book) return;
    onClose();
    onDelete(book.id);
  }, [book, onClose, onDelete]);

  if (!visible || !book) return null;

  return (
    <>
      <Sheet visible={visible && !shareOpen} onClose={onClose}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
                {book.title}
              </Text>
              <Text style={[styles.author, { color: colors.mutedFg }]} numberOfLines={1}>
                {book.author}
              </Text>
            </View>
            <Action accessibilityLabel={t('common.cancel')} onPress={onClose} style={styles.closeIcon}>
              <X size={18} color={colors.mutedFg} />
            </Action>
          </View>

          {editingRating ? (
            <View style={styles.ratingEdit}>
              <Text style={[styles.ratingLabel, { color: colors.mutedFg }]}>
                {t('book.changeRating')}
              </Text>
              <StarRating value={rating} onChange={handleRate} size={34} />
              <Action onPress={() => setEditingRating(false)} style={[styles.doneBtn, { borderColor: colors.border }]}>
                <Text style={[styles.doneText, { color: colors.foreground }]}>{t('common.done')}</Text>
              </Action>
            </View>
          ) : (
            <View style={styles.actions}>
              <Action
                onPress={() => { onClose(); onRead(book.id); }}
                style={[styles.action, { backgroundColor: colors.primary }]}
              >
                <BookOpen size={18} color={colors.primaryFg} />
                <Text style={[styles.actionText, { color: colors.primaryFg }]}>{t('book.read')}</Text>
              </Action>

              <Action
                onPress={() => setShareOpen(true)}
                style={[styles.action, { backgroundColor: colors.surface3, borderColor: colors.border }]}
              >
                <Share2 size={18} color={colors.foreground} />
                <Text style={[styles.actionText, { color: colors.foreground }]}>{t('book.share')}</Text>
              </Action>

              <Action
                onPress={() => setEditingRating(true)}
                style={[styles.action, { backgroundColor: colors.surface3, borderColor: colors.border }]}
              >
                <Star size={18} color={colors.foreground} fill={rating > 0 ? '#fbbf24' : 'transparent'} />
                <Text style={[styles.actionText, { color: colors.foreground }]}>{t('book.changeRating')}</Text>
              </Action>

              <Action
                onPress={handleDelete}
                style={[styles.action, { backgroundColor: colors.accentRedMuted, borderColor: colors.accentRed }]}
              >
                <Trash2 size={18} color={colors.accentRed} />
                <Text style={[styles.actionText, { color: colors.accentRed }]}>{t('book.delete')}</Text>
              </Action>
            </View>
          )}
      </Sheet>

      <ShareStorySheet
        visible={shareOpen}
        bookTitle={book.title}
        bookAuthor={book.author}
        bookCover={book.cover}
        initialRating={rating}
        onClose={() => setShareOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(9, 13, 22, 0.72)',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  author: {
    fontSize: 14,
    marginTop: 2,
  },
  closeIcon: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(148,163,184,0.12)',
  },
  actions: {
    gap: 10,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '700',
  },
  ratingEdit: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 8,
  },
  ratingLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  doneBtn: {
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 14,
    borderWidth: 1,
  },
  doneText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
