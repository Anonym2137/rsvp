import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, FlatList, Pressable, Image, StyleSheet,
  ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, BookOpen, Download, ChevronDown } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '../../hooks/useTheme';
import { useLibrary } from '../../hooks/useLibrary';
import { searchBooks } from '../../services/bookSearch';
import type { SearchResult } from '../../types';

export default function ExploreScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { books, selectBook } = useLibrary();

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search parameters states
  const [selectedSort, setSelectedSort] = useState('');
  const [selectedLang, setSelectedLang] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('epub');

  // Simple state toggles for filter menus
  const [activeMenu, setActiveMenu] = useState<'sort' | 'lang' | 'format' | null>(null);

  // Search debounce and query trigger
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchBooks(trimmed, selectedSort, selectedLang, selectedFormat);
        setSearchResults(results);
      } catch (e) {
        console.error('Online search failed:', e);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [query, selectedSort, selectedLang, selectedFormat]);

  // Local books matching query
  const filteredLocal = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return books.filter(
      (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
    );
  }, [books, query]);

  const handleSelectLocal = async (id: number) => {
    await selectBook(id);
    router.push(`/reader/${id}`);
  };

  const handleOpenDownloadPage = async (book: SearchResult) => {
    const slowDownloadUrl = `https://annas-archive.gl/slow_download/${book.id}/0/0`;

    Alert.alert(
      'Pobieranie książki',
      'Z powodu zabezpieczeń serwera pobierania (Cloudflare), otworzymy stronę w przeglądarce telefonu. \n\n1. Pobierz plik na telefon.\n2. Wróć do aplikacji i dodaj go w zakładce "Biblioteka" za pomocą "Wybierz plik".',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Otwórz pobieranie',
          onPress: async () => {
            try {
              await WebBrowser.openBrowserAsync(slowDownloadUrl);
            } catch (err) {
              console.error('Failed to open browser:', err);
              Alert.alert('Błąd', 'Nie można otworzyć przeglądarki.');
            }
          }
        }
      ]
    );
  };

  // Filter lists configuration
  const sortOptions = [
    { label: 'Trafność', value: '' },
    { label: 'Najnowsze', value: 'newest' },
    { label: 'Najstarsze', value: 'oldest' },
    { label: 'Największe', value: 'largest' },
    { label: 'Najmniejsze', value: 'smallest' }
  ];

  const langOptions = [
    { label: 'Język: Wszystkie', value: '' },
    { label: 'Polski (PL)', value: 'pl' },
    { label: 'Angielski (EN)', value: 'en' },
    { label: 'Niemiecki (DE)', value: 'de' },
    { label: 'Hiszpański (ES)', value: 'es' },
    { label: 'Francuski (FR)', value: 'fr' }
  ];

  const formatOptions = [
    { label: 'Format: EPUB', value: 'epub' },
    { label: 'Format: TXT', value: 'txt' },
    { label: 'Format: PDF', value: 'pdf' }
  ];

  const toggleMenu = (menu: 'sort' | 'lang' | 'format') => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Eksploruj</Text>
        <Text style={[styles.subtitle, { color: colors.mutedFg }]}>
          Wyszukaj darmowe teksty i książki w sieci.
        </Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Search size={18} color={colors.mutedFg} style={styles.searchIcon} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Tytuł, autor…"
            placeholderTextColor={colors.mutedFg}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      {/* Filter chips bar */}
      <View style={styles.filterBar}>
        {/* Sort select */}
        <Pressable
          onPress={() => toggleMenu('sort')}
          style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.filterChipText, { color: colors.foreground }]}>
            {sortOptions.find(o => o.value === selectedSort)?.label || 'Trafność'}
          </Text>
          <ChevronDown size={14} color={colors.mutedFg} />
        </Pressable>

        {/* Language select */}
        <Pressable
          onPress={() => toggleMenu('lang')}
          style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.filterChipText, { color: colors.foreground }]}>
            {langOptions.find(o => o.value === selectedLang)?.label.replace('Język: ', '') || 'Język'}
          </Text>
          <ChevronDown size={14} color={colors.mutedFg} />
        </Pressable>

        {/* Format select */}
        <Pressable
          onPress={() => toggleMenu('format')}
          style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.filterChipText, { color: colors.foreground }]}>
            {selectedFormat.toUpperCase()}
          </Text>
          <ChevronDown size={14} color={colors.mutedFg} />
        </Pressable>
      </View>

      {/* Dropdown Options overlay list */}
      {activeMenu && (
        <View style={[styles.dropdownOptions, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {activeMenu === 'sort' && sortOptions.map(opt => (
            <Pressable
              key={opt.value}
              onPress={() => { setSelectedSort(opt.value); setActiveMenu(null); }}
              style={styles.dropdownOptionItem}
            >
              <Text style={{ color: selectedSort === opt.value ? colors.primary : colors.foreground, fontWeight: selectedSort === opt.value ? '700' : '400' }}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
          {activeMenu === 'lang' && langOptions.map(opt => (
            <Pressable
              key={opt.value}
              onPress={() => { setSelectedLang(opt.value); setActiveMenu(null); }}
              style={styles.dropdownOptionItem}
            >
              <Text style={{ color: selectedLang === opt.value ? colors.primary : colors.foreground, fontWeight: selectedLang === opt.value ? '700' : '400' }}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
          {activeMenu === 'format' && formatOptions.map(opt => (
            <Pressable
              key={opt.value}
              onPress={() => { setSelectedFormat(opt.value); setActiveMenu(null); }}
              style={styles.dropdownOptionItem}
            >
              <Text style={{ color: selectedFormat === opt.value ? colors.primary : colors.foreground, fontWeight: selectedFormat === opt.value ? '700' : '400' }}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Book Search Results */}
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          query.trim() && filteredLocal.length > 0 ? (
            <View style={styles.localSection}>
              <Text style={[styles.sectionHeading, { color: colors.mutedFg }]}>TWOJA BIBLIOTEKA</Text>
              {filteredLocal.map((b) => (
                <Pressable
                  key={b.id}
                  onPress={() => handleSelectLocal(b.id)}
                  style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={[styles.coverBox, { backgroundColor: colors.surface3, borderColor: colors.border }]}>
                    {b.cover ? (
                      <Image source={{ uri: b.cover }} style={styles.coverImg} />
                    ) : (
                      <BookOpen size={20} color={colors.subtleFg} />
                    )}
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {b.title}
                    </Text>
                    <Text style={[styles.itemAuthor, { color: colors.mutedFg }]} numberOfLines={1}>
                      {b.author}
                    </Text>
                  </View>
                </Pressable>
              ))}
              <Text style={[styles.sectionHeading, { color: colors.mutedFg, marginTop: 16 }]}>WYNIKI ONLINE</Text>
            </View>
          ) : query.trim() ? (
            <Text style={[styles.sectionHeading, { color: colors.mutedFg }]}>WYNIKI ONLINE</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleOpenDownloadPage(item)}
            style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[styles.coverBox, { backgroundColor: colors.surface3, borderColor: colors.border }]}>
              {item.cover ? (
                <Image source={{ uri: item.cover }} style={styles.coverImg} />
              ) : (
                <BookOpen size={20} color={colors.subtleFg} />
              )}
            </View>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemTitle, { color: colors.foreground }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.itemAuthor, { color: colors.mutedFg }]} numberOfLines={1}>
                {item.author}
              </Text>
            </View>
            <View style={[styles.downloadIcon, { backgroundColor: colors.primary }]}>
              <Download size={14} color={colors.primaryFg} />
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.mutedFg }]}>Wyszukiwanie…</Text>
            </View>
          ) : !query.trim() ? (
            <View style={styles.emptyWrap}>
              <Search size={48} color={colors.mutedFg} style={{ opacity: 0.4, marginBottom: 12 }} />
              <Text style={[styles.emptyText, { color: colors.mutedFg }]}>
                Wpisz tytuł lub autora, aby wyszukać w darmowych książkach.
              </Text>
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyText, { color: colors.mutedFg }]}>Brak wyników dla „{query}”</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  searchWrap: {
    paddingHorizontal: 20,
    marginBottom: 12,
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
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dropdownOptions: {
    position: 'absolute',
    top: 200,
    left: 20,
    right: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 8,
    zIndex: 999,
    elevation: 5,
  },
  dropdownOptionItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  localSection: {
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
    gap: 14,
  },
  coverBox: {
    width: 48,
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemAuthor: {
    fontSize: 12,
    marginTop: 2,
  },
  downloadIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingWrap: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  emptyWrap: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
