/**
 * BookCard — compact book entry for list views.
 * Shows cover, title, author, progress bar, and delete button.
 */
import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { BookOpen, Trash2 } from 'lucide-react-native';
import ProgressBar from './ProgressBar';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import type { Book } from '../types';

interface Props {
  book: Book;
  onSelect: (id: number) => void;
  onDelete?: (id: number) => void;
}

export default function BookCard({ book, onSelect, onDelete }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.cardWrapper}>
      <Pressable
        onPress={() => onSelect(book.id)}
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
              <Text style={[styles.progressLabel, { color: colors.mutedFg }]}>{t('library.completed')}</Text>
              <Text style={[styles.progressValue, { color: colors.foreground }]}>
                {book.progress}%
              </Text>
            </View>
            <ProgressBar value={book.progress} height={6} />
          </View>
        </View>
      </Pressable>

      {/* Delete Button */}
      {onDelete && (
        <Pressable
          onPress={() => onDelete(book.id)}
          style={({ pressed }) => [
            styles.deleteBtn,
            {
              backgroundColor: colors.surface2,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Trash2 size={16} color={colors.accentRed} />
        </Pressable>
      )}
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
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
    paddingRight: 50, // leave space for delete button
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
  info: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  textContainer: {
    paddingRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  author: {
    fontSize: 12,
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
    fontSize: 10,
  },
  progressValue: {
    fontSize: 10,
    fontWeight: '600',
  },
  deleteBtn: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
