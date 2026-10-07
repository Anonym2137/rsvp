import { Action } from './DesignSystem';
/**
 * BookCard — compact book entry for list views.
 * Shows cover, title, author, progress bar, and (when rated) a star badge.
 * Tapping a rated book opens the action sheet; long-pressing any book does too.
 * Unrated books open the reader directly on tap.
 */
import React from 'react';
import { View, Text, Image,  StyleSheet } from 'react-native';
import { BookOpen, Star } from 'lucide-react-native';
import ProgressBar from './ProgressBar';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import type { Book } from '../types';

interface Props {
  book: Book;
  onSelect: (id: number) => void;
  onOpenActions: (id: number) => void;
}

export default function BookCard({ book, onSelect, onOpenActions }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const rated = book.rating > 0;

  const handlePress = () => {
    if (rated) onOpenActions(book.id);
    else onSelect(book.id);
  };

  return (
    <View style={styles.cardWrapper}>
      <Action
        onPress={handlePress}
        onLongPress={() => onOpenActions(book.id)}
        style={({ pressed }) => [
          styles.container,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: pressed ? 0.92 : 1,
            transform: [{ scale: pressed ? 0.99 : 1 }],
          },
        ]}
      >
        {/* Cover */}
        <View style={[styles.coverWrap, { backgroundColor: colors.surface3, borderColor: colors.border }]}>
          {book.cover ? (
            <Image source={{ uri: book.cover }} style={styles.coverImg} />
          ) : (
            <BookOpen size={24} color={colors.subtleFg} />
          )}
          {rated && (
            <View style={[styles.ratedBadge, { backgroundColor: colors.primary }]}>
              <Star size={10} color={colors.primaryFg} fill={colors.primaryFg} />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
              {book.title}
            </Text>
            <Text style={[styles.author, { color: colors.mutedFg }]} numberOfLines={1}>
              {book.author}
            </Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressRow}>
              <Text style={[styles.progressLabel, { color: colors.mutedFg }]}>
                {rated ? `${t('library.completed')} · ${book.rating}/5` : t('library.completed')}
              </Text>
              <Text style={[styles.progressValue, { color: colors.foreground }]}>
                {book.progress}%
              </Text>
            </View>
            <ProgressBar value={book.progress} height={6} />
          </View>
        </View>
      </Action>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  container: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 28,
    borderWidth: 1,
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
  ratedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  textContainer: {
    paddingRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  author: {
    fontSize: 14,
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressRow: {
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
});
