import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { WebView, WebViewMessageEvent } from 'react-native-webview'
import { useTranslation } from 'react-i18next'

interface Props {
  url: string
  onHtml: (html: string) => void
  onError?: (message: string) => void
  waitMs?: number
}

export default function AnnaWebViewBridge({ url, onHtml, onError, waitMs = 3500 }: Props) {
  const { t } = useTranslation()
  const [challenge, setChallenge] = useState(false)
  const finished = useRef(false)
  const fail = useCallback(() => {
    if (finished.current) return
    finished.current = true
    onError?.('Search page unavailable or verification timed out')
  }, [onError])

  useEffect(() => {
    finished.current = false
    setChallenge(false)
    const timer = setTimeout(fail, 90000)
    return () => clearTimeout(timer)
  }, [url, fail])

  const injectedJs = `
    (function() {
      if (window.__annaPoll) clearInterval(window.__annaPoll);
      var sent = false;
      function extract() {
        if (sent) return;
        var blocked = /ddos-guard|checking your browser|just a moment|verify you are human/i.test(document.title + document.body.innerText) ||
          !!document.querySelector('script[src*="ddos-guard"], script[src*="challenge-platform"]');
        if (blocked) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'challenge' }));
          return;
        }
        if (!document.querySelector('a[href^="/md5/"], form[action*="search"], input[name="q"]')) return;
        sent = true;
        clearInterval(window.__annaPoll);
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'html', payload: document.documentElement.outerHTML }));
      }
      setTimeout(extract, ${waitMs});
      window.__annaPoll = setInterval(extract, 1000);
    })(); true;
  `

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    if (finished.current) return
    try {
      const data = JSON.parse(event.nativeEvent.data)
      if (data.type === 'challenge') setChallenge(true)
      if (data.type === 'html' && typeof data.payload === 'string') {
        finished.current = true
        setChallenge(false)
        onHtml(data.payload)
      }
    } catch { fail() }
  }, [onHtml, fail])

  return (
    <View style={challenge ? styles.challenge : styles.hidden}>
      {challenge && <View style={styles.header}>
        <Text style={styles.label}>{t('searchVerification.wait')}</Text>
        <Pressable onPress={fail}><Text style={styles.label}>{t('searchVerification.nextMirror')}</Text></Pressable>
      </View>}
      <WebView
        source={{ uri: url }}
        injectedJavaScript={injectedJs}
        onMessage={handleMessage}
        onError={fail}
        style={styles.browser}
        webviewDebuggingEnabled={__DEV__}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        accessible={challenge}
        importantForAccessibility={challenge ? 'auto' : 'no-hide-descendants'}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  challenge: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 2000, elevation: 20, backgroundColor: '#fff' },
  header: { padding: 16, gap: 12 },
  label: { color: '#111' },
  browser: { flex: 1 },
  hidden: { width: 1, height: 1, opacity: 0, position: 'absolute' },
})
