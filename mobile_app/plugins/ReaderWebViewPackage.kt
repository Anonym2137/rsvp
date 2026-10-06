package com.anonym.rsvpreader

import android.net.Uri
import android.webkit.CookieManager
import android.webkit.URLUtil
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManager
import com.reactnativecommunity.webview.RNCWebViewManager
import com.reactnativecommunity.webview.RNCWebViewPackage
import com.reactnativecommunity.webview.RNCWebViewWrapper
import org.json.JSONObject

/** Keep browser downloads inside the reader rather than the public Downloads folder. */
class ReaderWebViewPackage : RNCWebViewPackage() {
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> =
    listOf(ReaderWebViewManager())
}

class ReaderWebViewManager : RNCWebViewManager() {
  override fun createViewInstance(context: ThemedReactContext): RNCWebViewWrapper {
    val wrapper = super.createViewInstance(context)
    val browser = wrapper.webView
    browser.setDownloadListener { url, userAgent, contentDisposition, mimeType, _ ->
      val guessedName = URLUtil.guessFileName(url, contentDisposition, mimeType)
      val pathName = Uri.parse(url).lastPathSegment ?: ""
      val filename = when {
        guessedName.endsWith(".epub", true) || guessedName.endsWith(".txt", true) -> guessedName
        pathName.endsWith(".epub", true) || pathName.endsWith(".txt", true) -> pathName
        mimeType == "application/epub+zip" -> "$guessedName.epub"
        mimeType == "text/plain" -> "$guessedName.txt"
        else -> guessedName
      }
      val message = JSONObject()
        .put("type", "bookDownload")
        .put("url", url)
        .put("filename", filename)
        .put("mimeType", mimeType)
        .put("userAgent", userAgent)
        .put("cookie", CookieManager.getInstance().getCookie(url) ?: "")
      browser.onMessage(message.toString(), browser.url ?: url)
    }
    return wrapper
  }
}
