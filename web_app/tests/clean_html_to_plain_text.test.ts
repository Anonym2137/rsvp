import { expect, test } from 'bun:test';
import { cleanHtmlToPlainText } from '../server/utils/clean_html_to_plain_text';

test('cleanHtmlToPlainText - removes style, script, head tags and decodes entities', () => {
  const html = `
    <html>
      <head>
        <title>Test Page</title>
        <style>body { color: red; }</style>
      </head>
      <body>
        <script>console.log("hello");</script>
        <h1>Hello World &amp; welcome!</h1>
        <p>This is a paragraph&nbsp;with entities and &lt;tag&gt; structures.</p>
      </body>
    </html>
  `;
  const plainText = cleanHtmlToPlainText(html);
  expect(plainText).toBe('Hello World & welcome! This is a paragraph with entities and <tag> structures.');
});
