/**
 * AddBookModal — dialog for adding books via phone storage, online search, or pasting text.
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, Modal, StyleSheet,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import { X, Search, Type, Upload } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import { parseEpubFile, parsePlainText } from '../services/epubParser';
import * as db from '../db/database';
interface Props {
  visible: boolean;
  onClose: () => void;
  onAdded: (bookId: number) => void;
}

type Tab = 'file' | 'search' | 'text';

export default function AddBookModal({ visible, onClose, onAdded }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const [tab, setTab] = useState<Tab>('file');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const reset = () => {
    setTitle('');
    setContent('');
    setIsLoading(false);
    setLoadingMessage('');
    setTab('file');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePickFile = async () => {
    let temporaryUri: string | undefined;
    let bookId: number | undefined;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/epub+zip', 'application/epub', 'text/plain', 'application/octet-stream'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      temporaryUri = asset.uri;
      const isEpub = /\.epub$/i.test(asset.name) || asset.mimeType?.includes('epub');
      if (!isEpub && !/\.txt$/i.test(asset.name) && asset.mimeType !== 'text/plain') {
        Alert.alert(t('common.error'), t('bookDownload.supportedFormats'));
        return;
      }
      setIsLoading(true);
      setLoadingMessage(t('addBook.parsing'));
      const parsed = isEpub
        ? await parseEpubFile(asset.uri)
        : parsePlainText(asset.name.replace(/\.[^.]+$/, ''), await FileSystem.readAsStringAsync(asset.uri));
      setLoadingMessage(t('addBook.saving'));
      bookId = await db.insertBook(parsed.title, parsed.author, parsed.cover);
      try { await db.insertChapters(bookId, parsed.chapters); }
      catch (error) { await db.deleteBook(bookId); throw error; }
      reset();
      onAdded(bookId);
    } catch (error: any) {
      Alert.alert(t('common.error'), t('addBook.importError', { message: error?.message ?? t('addBook.unknownError') }));
    } finally {
      setIsLoading(false);
      if (temporaryUri && FileSystem.cacheDirectory && temporaryUri.startsWith(FileSystem.cacheDirectory)) {
        await FileSystem.deleteAsync(temporaryUri, { idempotent: true }).catch(() => {});
      }
    }
  };

  // ── Add custom text ────────────────────────────────────────────
  const handleAddText = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert(t('common.error'), t('addBook.titleContentRequired'));
      return;
    }

    setIsLoading(true);
    setLoadingMessage(t('addBook.saving'));

    try {
      const parsed = parsePlainText(title.trim(), content.trim());
      const bookId = await db.insertBook(parsed.title, parsed.author, null);
      await db.insertChapters(bookId, parsed.chapters);
      reset();
      onAdded(bookId);
    } catch (e: any) {
      console.error('Failed to add text:', e);
      Alert.alert(t('common.error'), t('addBook.textError', { message: e?.message ?? '' }));
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={[styles.sheet, { backgroundColor: colors.surface }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{tab === 'search' ? t('addBook.onlineTab') : tab === 'file' ? t('addBook.epubTab') : t('addBook.title')}</Text>
          <Pressable onPress={handleClose} style={[styles.closeBtn, { backgroundColor: colors.surface3 }]}>
            <X size={18} color={colors.mutedFg} />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedFg }]}>{loadingMessage}</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {/* Tab selector */}
            <View style={[styles.tabs, { backgroundColor: colors.surface2 }]}>
              <Pressable onPress={() => setTab('file')} style={[styles.tabBtn, tab === 'file' && { backgroundColor: colors.surface }]}>
                <Upload size={15} color={tab === 'file' ? colors.primary : colors.mutedFg} />
                <Text style={[styles.tabLabel, { color: tab === 'file' ? colors.primary : colors.mutedFg }]}>{t('addBook.epubTab')}</Text>
              </Pressable>
              <Pressable
                onPress={() => setTab('search')}
                style={[styles.tabBtn, tab === 'search' && { backgroundColor: colors.surface }]}
              >
                <Search size={15} color={tab === 'search' ? colors.primary : colors.mutedFg} />
                <Text style={[styles.tabLabel, { color: tab === 'search' ? colors.primary : colors.mutedFg }]}>
                  {t('addBook.onlineTab')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setTab('text')}
                style={[styles.tabBtn, tab === 'text' && { backgroundColor: colors.surface }]}
              >
                <Type size={15} color={tab === 'text' ? colors.primary : colors.mutedFg} />
                <Text style={[styles.tabLabel, { color: tab === 'text' ? colors.primary : colors.mutedFg }]}>
                  {t('addBook.textTab')}
                </Text>
              </Pressable>
            </View>

            {tab === 'file' ? (
              <View style={styles.tabContent}>
                <Text style={[styles.desc, { color: colors.mutedFg }]}>{t('addBook.fileDesc')}</Text>
                <Pressable onPress={handlePickFile} style={[styles.pickBtn, { backgroundColor: colors.primary }]}>
                  <Upload size={20} color={colors.primaryFg} />
                  <Text style={[styles.pickBtnText, { color: colors.primaryFg }]}>{t('addBook.chooseFile')}</Text>
                </Pressable>
              </View>
            ) : tab === 'search' ? (
              <View style={styles.tabContent}>
                <Text style={[styles.desc, { color: colors.mutedFg }]}>
                  {t('addBook.onlineDesc')}
                </Text>
                <Pressable
                  onPress={() => { handleClose(); router.push('/(tabs)/explore'); }}
                  style={[styles.pickBtn, { backgroundColor: colors.primary }]}
                >
                  <Search size={20} color={colors.primaryFg} />
                  <Text style={[styles.pickBtnText, { color: colors.primaryFg }]}>{t('addBook.searchBooks')}</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.tabContent}>
                <Text style={[styles.inputLabel, { color: colors.mutedFg }]}>{t('addBook.bookTitle')}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.foreground }]}
                  placeholder={t('addBook.bookTitlePlaceholder')}
                  placeholderTextColor={colors.mutedFg}
                  value={title}
                  onChangeText={setTitle}
                />
                <Text style={[styles.inputLabel, { color: colors.mutedFg, marginTop: 12 }]}>{t('addBook.content')}</Text>
                <TextInput
                  style={[styles.textarea, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.foreground }]}
                  placeholder={t('addBook.contentPlaceholder')}
                  placeholderTextColor={colors.mutedFg}
                  value={content}
                  onChangeText={setContent}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
                <Pressable
                  onPress={handleAddText}
                  style={[styles.pickBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.pickBtnText, { color: colors.primaryFg }]}>{t('addBook.submit')}</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
  },
  body: {
    padding: 20,
    gap: 16,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabContent: {
    gap: 12,
  },
  desc: {
    fontSize: 13,
    lineHeight: 20,
  },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  pickBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    height: 140,
  },
});
