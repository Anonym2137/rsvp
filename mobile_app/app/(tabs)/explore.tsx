import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, Pressable, Image, StyleSheet,
  ActivityIndicator, Alert
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, BookOpen, Download, ChevronDown } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useLibrary } from '../../hooks/useLibrary';
import { parseAnnaSearchResults, buildSearchUrl, buildBookUrl, ANNA_MIRRORS } from '../../services/annaSearch';
import { parseEpubFile, parsePlainText } from '../../services/epubParser';
import AnnaWebViewBridge from '../../components/AnnaWebViewBridge';
import DownloadWebViewModal from '../../components/DownloadWebViewModal';
import * as db from '../../db/database';
import * as FileSystem from 'expo-file-system/legacy';
import type { SearchResult } from '../../types';

export default function ExploreScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { books, selectBook, refreshBooks } = useLibrary();

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter states
  const [selectedSort, setSelectedSort] = useState('');
  const [selectedLang, setSelectedLang] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('epub');
  const [activeMenu, setActiveMenu] = useState<'sort' | 'lang' | 'format' | null>(null);

  // WebView bridge state
  const [bridgeUrl, setBridgeUrl] = useState<string | null>(null);
  // Which Anna's Archive mirror we're currently trying (index into ANNA_MIRRORS)
  const [mirrorIdx, setMirrorIdx] = useState(0);
  const pendingQueryRef = useRef<string>('');

  // Download modal state
  const downloadBookRef = useRef<SearchResult | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Importing state
  const [isImporting, setIsImporting] = useState(false);

  // ── Search flow ──────────────────────────────────────────────────

  // Debounce: when query changes, trigger a WebView load
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsLoading(false);
      setBridgeUrl(null);
      return;
    }

    setBridgeUrl(null);
    setIsLoading(true);
    setSearchResults([]);
    pendingQueryRef.current = trimmed;

    const timer = setTimeout(() => {
      const url = buildSearchUrl(trimmed, selectedFormat, selectedLang, selectedSort, ANNA_MIRRORS[mirrorIdx]);
      setBridgeUrl(url);
    }, 600);

    return () => clearTimeout(timer);
  }, [query, selectedSort, selectedLang, selectedFormat, mirrorIdx]);

  const handleBridgeHtml = useCallback((html: string) => {
    const results = parseAnnaSearchResults(html);
    setSearchResults(results);
    setIsLoading(false);
    // Keep bridge mounted so cookies/clearance are preserved for next search
  }, []);

  const handleBridgeError = useCallback((msg: string) => {
    console.warn('AnnaWebViewBridge error:', msg);
    // Try the next mirror if the current one failed to load.
    const next = mirrorIdx + 1;
    if (next < ANNA_MIRRORS.length) {
      console.warn(`Anna mirror ${ANNA_MIRRORS[mirrorIdx]} failed; trying ${ANNA_MIRRORS[next]}`);
      // Retrigger the same query against the next mirror.
      if (pendingQueryRef.current) {
        const url = buildSearchUrl(
          pendingQueryRef.current,
          selectedFormat,
          selectedLang,
          selectedSort,
          ANNA_MIRRORS[next],
        );
        setBridgeUrl(url);
      }
      setMirrorIdx(next);
    } else {
      // All mirrors exhausted.
      Alert.alert(
        t('explore.unavailableTitle'),
        t('explore.unavailableBody'),
      );
    }
    setIsLoading(next < ANNA_MIRRORS.length);
    setSearchResults([]);
  }, [mirrorIdx, selectedFormat, selectedLang, selectedSort, t]);

  // ── Local library match ─────────────────────────────────────────

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

  // ── Download & import ───────────────────────────────────────────

  const handlePressResult = useCallback((book: SearchResult) => {
    downloadBookRef.current = book;
    const bookUrl = buildBookUrl(book.id, ANNA_MIRRORS[mirrorIdx]);
    setDownloadUrl(bookUrl);
  }, [mirrorIdx]);

  const handleFileDownloaded = useCallback(async (localUri: string, filename: string) => {
    setIsImporting(true);
    try {
      const isEpub = filename.toLowerCase().endsWith('.epub');
      let parsed;

      if (isEpub) {
        parsed = await parseEpubFile(localUri);
      } else {
        const text = await FileSystem.readAsStringAsync(localUri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        parsed = parsePlainText(filename.replace(/\.[^.]+$/, ''), text);
      }

      const bookId = await db.insertBook(parsed.title, parsed.author, parsed.cover ?? downloadBookRef.current?.cover ?? null);
      try {
        await db.insertChapters(bookId, parsed.chapters);
      } catch (error) {
        await db.deleteBook(bookId);
        throw error;
      }
      await refreshBooks();

      Alert.alert(
        t('explore.importSuccessTitle'),
        t('explore.importSuccessBody', { title: parsed.title }),
        [
          { text: t('common.ok') },
          {
            text: t('explore.readNow'),
            onPress: async () => {
              await selectBook(bookId);
              router.push(`/reader/${bookId}`);
            },
          },
        ]
      );
    } catch (err: any) {
      console.error('Import after download failed:', err);
      throw err;
    } finally {
      setIsImporting(false);
    }
  }, [refreshBooks, selectBook, router, t]);

  // ── Filter config ───────────────────────────────────────────────

  const sortOptions = [
    { label: t('explore.sortRelevance'), value: '' },
    { label: t('explore.sortNewest'), value: 'newest' },
    { label: t('explore.sortOldest'), value: 'oldest' },
    { label: t('explore.sortLargest'), value: 'largest' },
    { label: t('explore.sortSmallest'), value: 'smallest' },
  ];

  const langOptions = [
    { label: t('explore.langAll'), value: '' },
    { label: t('explore.langPl'), value: 'pl' },
    { label: t('explore.langEn'), value: 'en' },
    { label: t('explore.langDe'), value: 'de' },
    { label: t('explore.langEs'), value: 'es' },
    { label: t('explore.langFr'), value: 'fr' },
  ];

  const formatOptions = [
    { label: 'EPUB', value: 'epub' },
    { label: 'TXT', value: 'txt' },
  ];

  const toggleMenu = (menu: 'sort' | 'lang' | 'format') => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Invisible WebView bridge — resolves JS challenge */}
      {bridgeUrl && (
        <AnnaWebViewBridge
          key={bridgeUrl}
          url={bridgeUrl}
          onHtml={handleBridgeHtml}
          onError={handleBridgeError}
          waitMs={3500}
        />
      )}

      {/* Download modal */}
      {downloadUrl && (
        <DownloadWebViewModal
          visible={!!downloadUrl}
          url={downloadUrl}
          onClose={() => setDownloadUrl(null)}
          onFileDownloaded={handleFileDownloaded}
        />
      )}

      {/* Importing overlay */}
      {isImporting && (
        <View style={[styles.importingOverlay, { backgroundColor: colors.background + 'EE' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.importingText, { color: colors.foreground }]}>{t('explore.importing')}</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>{t('explore.title')}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedFg }]}>
          {t('explore.subtitle')}
        </Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Search size={18} color={colors.mutedFg} style={styles.searchIcon} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder={t('explore.searchPlaceholder')}
            placeholderTextColor={colors.mutedFg}
            value={query}
            onChangeText={setQuery}
          />
          {isLoading && <ActivityIndicator size="small" color={colors.primary} />}
        </View>
      </View>

      {/* Filter chips bar */}
      <View style={styles.filterBar}>
        <Pressable
          onPress={() => toggleMenu('sort')}
          style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.filterChipText, { color: colors.foreground }]}>
            {sortOptions.find(o => o.value === selectedSort)?.label || t('explore.sortRelevance')}
          </Text>
          <ChevronDown size={14} color={colors.mutedFg} />
        </Pressable>

        <Pressable
          onPress={() => toggleMenu('lang')}
          style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.filterChipText, { color: colors.foreground }]}>
            {langOptions.find(o => o.value === selectedLang)?.label || t('explore.langAll')}
          </Text>
          <ChevronDown size={14} color={colors.mutedFg} />
        </Pressable>

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

      {/* Dropdown overlay */}
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

      {/* Results list */}
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          query.trim() && filteredLocal.length > 0 ? (
            <View style={styles.localSection}>
              <Text style={[styles.sectionHeading, { color: colors.mutedFg }]}>{t('explore.yourLibrary').toUpperCase()}</Text>
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
                    <Text style={[styles.itemTitle, { color: colors.foreground }]} numberOfLines={1}>{b.title}</Text>
                    <Text style={[styles.itemAuthor, { color: colors.mutedFg }]} numberOfLines={1}>{b.author}</Text>
                  </View>
                </Pressable>
              ))}
              {searchResults.length > 0 && (
                <Text style={[styles.sectionHeading, { color: colors.mutedFg, marginTop: 16 }]}>{t('explore.onlineResults').toUpperCase()}</Text>
              )}
            </View>
          ) : query.trim() && searchResults.length > 0 ? (
            <Text style={[styles.sectionHeading, { color: colors.mutedFg }]}>{t('explore.onlineResults').toUpperCase()}</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handlePressResult(item)}
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
              {item.details && (
                <Text style={[styles.itemDetails, { color: colors.subtleFg }]} numberOfLines={1}>
                  {item.details}
                </Text>
              )}
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
              <Text style={[styles.loadingText, { color: colors.mutedFg }]}>{t('explore.loading')}</Text>
              <Text style={[styles.loadingSubText, { color: colors.subtleFg }]}>{t('explore.loadingHint')}</Text>
            </View>
          ) : !query.trim() ? (
            <View style={styles.emptyWrap}>
              <Search size={48} color={colors.mutedFg} style={{ opacity: 0.4, marginBottom: 12 }} />
              <Text style={[styles.emptyText, { color: colors.mutedFg }]}>
                {t('explore.noQuery')}
              </Text>
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyText, { color: colors.mutedFg }]}>{t('explore.noResults', { query })}</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  importingOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  importingText: { fontSize: 16, fontWeight: '600' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 2 },
  searchWrap: { paddingHorizontal: 20, marginBottom: 12 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
  },
  searchIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14 },
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
  filterChipText: { fontSize: 11, fontWeight: '600' },
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
  dropdownOptionItem: { paddingVertical: 10, paddingHorizontal: 12 },
  listContainer: { paddingHorizontal: 20, paddingBottom: 30 },
  localSection: { marginBottom: 8 },
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
  coverImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: '700' },
  itemAuthor: { fontSize: 12, marginTop: 2 },
  itemDetails: { fontSize: 10, marginTop: 3 },
  downloadIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingWrap: { paddingVertical: 40, alignItems: 'center', gap: 8 },
  loadingText: { fontSize: 13 },
  loadingSubText: { fontSize: 11 },
  emptyWrap: { paddingVertical: 60, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 13, textAlign: 'center' },
});
