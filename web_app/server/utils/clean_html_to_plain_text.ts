

export function cleanHtmlToPlainText(html: string): string {
  return html
    // 1. Usuwa całą zawartość sekcji <style>, <script> oraz <head>
    .replace(/<(style|script|head)\b[^>]*>([\s\S]*?)<\/\1>/gi, '')
    // 2. Usuwa wszystkie pozostałe tagi HTML
    .replace(/<[^>]*>/g, ' ')
    // 3. Dekoduje najczęstsze encje HTML na zwykłe znaki
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // 4. Zamienia wielokrotne spacje i znaki nowej linii na jedną spację
    .replace(/\s+/g, ' ')
    .trim();
}