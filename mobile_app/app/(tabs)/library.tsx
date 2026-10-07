import { Design } from '../../constants/theme';
import StateAnimation from '../../components/StateAnimation';
import { ScreenHeader, Action, Field } from '../../components/DesignSystem';
import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, FlatList,  StyleSheet, RefreshControl, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Plus, BookOpen } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { useLibrary } from '../../hooks/useLibrary';
import BookCard from '../../components/BookCard';
import BookActionSheet from '../../components/BookActionSheet';
import AddBookModal from '../../components/AddBookModal';
import * as db from '../../db/database';
import type { Book } from '../../types';

export default function LibraryScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { books, selectBook, refreshBooks, removeBook, isLoading } = useLibrary();

  const [query, setQuery] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionBook, setActionBook] = useState<Book | null>(null);
  const [actionVisible, setActionVisible] = useState(false);

  const filteredBooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return books;
    return books.filter(
      (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
    );
  }, [books, query]);

  const handleSelect = useCallback(async (id: number) => {
    await selectBook(id);
    router.push(`/reader/${id}`);
  }, [selectBook, router]);

  const handleOpenActions = useCallback((id: number) => {
    const book = books.find((b) => b.id === id) ?? null;
    setActionBook(book);
    setActionVisible(true);
  }, [books]);

  const handleDeleteBook = useCallback((id: number) => {
    Alert.alert(
      t('library.deleteTitle'),
      t('library.deleteBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('library.delete'), style: 'destructive', onPress: () => removeBook(id) },
      ]
    );
  }, [removeBook, t]);

  const handleChangeRating = useCallback(async (id: number, rating: number) => {
    try {
      await db.updateBookRating(id, rating);
      await refreshBooks();
    } catch (e) {
      console.error('Failed to update rating:', e);
    }
  }, [refreshBooks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshBooks();
    setRefreshing(false);
  }, [refreshBooks]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <ScreenHeader title={t('library.title')}
          subtitle={`${books.length} ${books.length === 1 ? t('library.book_one') : t('library.book_other')}`}
          action={<Action accessibilityLabel={t('addBook.title')} onPress={() => setAddModalVisible(true)}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}><Plus size={22} color={colors.primaryFg} /></Action>} />
      </View>

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Search size={18} color={colors.mutedFg} style={styles.searchIcon} />
          <Field
            style={[styles.input, { color: colors.foreground }]}
            placeholder={t('library.searchPlaceholder')}
            placeholderTextColor={colors.mutedFg}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      {/* Book List */}
      <FlatList
        data={filteredBooks}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <BookCard
            book={item}
            onSelect={handleSelect}
            onOpenActions={handleOpenActions}
          />
        )}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyWrap}>
              <StateAnimation kind="book" />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {query ? t('library.noResults') : t('library.empty')}
              </Text>
              <Text style={[styles.emptyDesc, { color: colors.mutedFg }]}>
                {query
                  ? t('library.noResultsDesc', { query })
                  : t('library.emptyDesc')}
              </Text>
              {!query && (
                <Action
                  onPress={() => setAddModalVisible(true)}
                  style={[styles.addTextBtn, { backgroundColor: colors.primary }]}
                >
                  <Plus size={16} color={colors.primaryFg} />
                  <Text style={[styles.addTextBtnLabel, { color: colors.primaryFg }]}>{t('library.discoverBooks')}</Text>
                </Action>
              )}
            </View>
          ) : null
        }
      />

      <AddBookModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdded={async (id) => {
          setAddModalVisible(false);
          await selectBook(id);
          router.push(`/reader/${id}`);
        }}
      />

      <BookActionSheet
        book={actionBook}
        visible={actionVisible}
        onClose={() => setActionVisible(false)}
        onRead={handleSelect}
        onChangeRating={handleChangeRating}
        onDelete={handleDeleteBook}
      />
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
    justifyContent: 'space-between',
    paddingHorizontal: Design.spacing.lg,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    paddingHorizontal: Design.spacing.lg,
    marginBottom: 16,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: Design.spacing.lg,
    paddingBottom: 30,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
  },
  addTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Design.spacing.lg,
    paddingVertical: 12,
    borderRadius: 16,
  },
  addTextBtnLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
});
