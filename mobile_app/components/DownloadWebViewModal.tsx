/** In-app browser that downloads EPUB/TXT into private storage and awaits import. */
import React, { useRef, useCallback, useState } from 'react'
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native'
import { WebView, WebViewMessageEvent, WebViewNavigation } from 'react-native-webview'
import * as FileSystem from 'expo-file-system/legacy'
import { X, Download } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../hooks/useTheme'

interface Props {
  visible: boolean
  url: string
  onClose: () => void
  /** Called with the local file URI after a successful download */
  onFileDownloaded: (localUri: string, filename: string) => Promise<void>
}

const DOWNLOADABLE_EXTENSIONS = ['.epub', '.txt']

function isDownloadableUrl(url: string): boolean {
  try { return DOWNLOADABLE_EXTENSIONS.some(ext => new URL(url).pathname.toLowerCase().endsWith(ext)) }
  catch { return false }
}

export default function DownloadWebViewModal({ visible, url, onClose, onFileDownloaded }: Props) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [pageTitle, setPageTitle] = useState('')
  const [browserUrl, setBrowserUrl] = useState(url)
  const interceptedRef = useRef(false)

  const downloadAndImport = useCallback(async (
    url: string, filename: string, headers: Record<string, string> = {},
  ) => {
    if (interceptedRef.current) return
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    if (!DOWNLOADABLE_EXTENSIONS.some(ext => safeName.toLowerCase().endsWith(ext))) {
      Alert.alert(t('common.error'), t('bookDownload.supportedFormats'))
      return
    }
    if (!/^https?:\/\//i.test(url)) {
      Alert.alert(t('common.error'), t('bookDownload.invalidUrl'))
      return
    }
    interceptedRef.current = true
    setIsDownloading(true)
    const localUri = `${FileSystem.cacheDirectory}book_${Date.now()}_${safeName}`
    try {
      const result = await FileSystem.downloadAsync(url, localUri, { headers })
      if (result.status < 200 || result.status >= 300) throw new Error(`HTTP ${result.status}`)
      const contentType = Object.entries(result.headers ?? {}).find(([key]) => key.toLowerCase() === 'content-type')?.[1] ?? ''
      if (/text\/html|application\/xhtml/i.test(contentType)) throw new Error(t('bookDownload.htmlResponse'))
      await onFileDownloaded(result.uri, safeName)
      onClose()
    } catch (error: any) {
      Alert.alert(t('common.error'), t('bookDownload.failed', { message: error?.message ?? '' }))
    } finally {
      await FileSystem.deleteAsync(localUri, { idempotent: true }).catch(() => {})
      interceptedRef.current = false
      setIsDownloading(false)
    }
  }, [onFileDownloaded, onClose, t])

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    // Android's download listener supplies the actual filename and browser session.
    let data
    try { data = JSON.parse(event.nativeEvent.data) } catch { return }
    if (data.type !== 'bookDownload' || typeof data.url !== 'string' || typeof data.filename !== 'string') return
    const headers: Record<string, string> = {}
    if (typeof data.cookie === 'string' && data.cookie) headers.Cookie = data.cookie
    if (typeof data.userAgent === 'string') headers['User-Agent'] = data.userAgent
    void downloadAndImport(data.url, data.filename, headers)
  }, [downloadAndImport])

  const handleNavigationStateChange = useCallback((nav: WebViewNavigation) => {
    setPageTitle(nav.title)
    if (Platform.OS !== 'android' && isDownloadableUrl(nav.url)) {
      const filename = decodeURIComponent(new URL(nav.url).pathname.split('/').pop()!)
      void downloadAndImport(nav.url, filename)
    }
  }, [downloadAndImport])

  const handleLoadEnd = useCallback(() => setIsLoading(false), [])
  const handleLoadStart = useCallback(() => setIsLoading(true), [])

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Top bar */}
        <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surface2 }]}>
            <X size={18} color={colors.mutedFg} />
          </Pressable>
          <View style={styles.titleWrap}>
            <Text style={[styles.topBarTitle, { color: colors.foreground }]} numberOfLines={1}>
              {pageTitle || 'Anna\'s Archive'}
            </Text>
            <Text style={[styles.topBarHint, { color: colors.mutedFg }]}>
              {t('bookDownload.hint')}
            </Text>
          </View>
          {isLoading && <ActivityIndicator size="small" color={colors.primary} style={styles.spinner} />}
        </View>

        {/* Download progress overlay */}
        {isDownloading && (
          <View style={[styles.downloadOverlay, { backgroundColor: colors.background }]}>
            <View style={[styles.downloadCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.downloadIconBox, { backgroundColor: colors.primary + '22' }]}>
                <Download size={28} color={colors.primary} />
              </View>
              <Text style={[styles.downloadTitle, { color: colors.foreground }]}>{t('bookDownload.progress')}</Text>
              <Text style={[styles.downloadDesc, { color: colors.mutedFg }]}>
                {t('bookDownload.importHint')}
              </Text>
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 8 }} />
            </View>
          </View>
        )}

        {/* Main WebView */}
        <WebView
          source={{ uri: browserUrl }}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onNavigationStateChange={handleNavigationStateChange}
          onMessage={handleMessage}
          webviewDebuggingEnabled={__DEV__}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          style={styles.webView}
          userAgent="Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36"
          javaScriptEnabled
          domStorageEnabled
          // Keep download links in this browser so Android can report them.
          setSupportMultipleWindows
          onOpenWindow={(event) => {
            const target = event.nativeEvent.targetUrl
            if (/^https?:\/\//i.test(target)) setBrowserUrl(target)
          }}
        />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
    paddingTop: 48, // safe area top approx
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
  },
  topBarTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  topBarHint: {
    fontSize: 10,
    marginTop: 1,
  },
  spinner: {
    marginLeft: 4,
  },
  webView: {
    flex: 1,
  },
  downloadOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  downloadCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },
  downloadIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  downloadTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  downloadDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
})
