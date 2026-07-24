import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, Pressable, StyleSheet, RefreshControl, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Plus, BookOpen } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { useLibrary } from '../../hooks/useLibrary';
import BookCard from '../../components/BookCard';
import AddBookModal from '../../components/AddBookModal';

export default function LibraryScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { books, selectBook, refreshBooks, removeBook, isLoading } = useLibrary();

  const [query, setQuery] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshBooks();
    setRefreshing(false);
  }, [refreshBooks]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>{t('library.title')}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedFg }]}>
            {books.length} {books.length === 1 ? t('library.book_one') : t('library.book_other')}
          </Text>
        </View>

        <Pressable
          onPress={() => setAddModalVisible(true)}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Plus size={22} color={colors.primaryFg} />
        </Pressable>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Search size={18} color={colors.mutedFg} style={styles.searchIcon} />
          <TextInput
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
            onDelete={handleDeleteBook}
          />
        )}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyWrap}>
              <View style={[styles.emptyIconBox, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                <BookOpen size={32} color={colors.mutedFg} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {query ? t('library.noResults') : t('library.empty')}
              </Text>
              <Text style={[styles.emptyDesc, { color: colors.mutedFg }]}>
                {query
                  ? t('library.noResultsDesc', { query })
                  : t('library.emptyDesc')}
              </Text>
              {!query && (
                <Pressable
                  onPress={() => setAddModalVisible(true)}
                  style={[styles.addTextBtn, { backgroundColor: colors.primary }]}
                >
                  <Plus size={16} color={colors.primaryFg} />
                  <Text style={[styles.addTextBtnLabel, { color: colors.primaryFg }]}>{t('library.discoverBooks')}</Text>
                </Pressable>
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
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
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 20,
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
    borderRadius: 20,
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
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  addTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  addTextBtnLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
});
