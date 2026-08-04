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

test('cleanHtmlToPlainText - removes non-breaking space (U+00A0, znak 160) and other special chars', () => {
  // U+00A0 między słowami -> spacja; U+200B / U+00AD wewnątrz słów -> usunięte (bez rozcinania tokenu)
  const html = `<p>Warszawa${' '}jest sto${'​'}lic${'­'}ą cza${'­'}sem</p>`;
  const plainText = cleanHtmlToPlainText(html);
  expect(plainText).toBe('Warszawa jest stolicą czasem');
  expect(plainText).not.toContain(' ');
  expect(plainText).not.toContain('​');
  expect(plainText).not.toContain('­');
  // tokenizacja RSVP nie może rozciąć "stolicą"/"czasem" na dwa słowa
  expect(plainText.split(/\s+/).filter(Boolean)).toEqual(['Warszawa', 'jest', 'stolicą', 'czasem']);
});

test('cleanHtmlToPlainText - decodes numeric HTML entities like &#160; / &#x00A0;', () => {
  const html = `<p>To&#160;jest&#x00A0;test.</p>`;
  const plainText = cleanHtmlToPlainText(html);
  expect(plainText).toBe('To jest test.');
  expect(plainText).not.toContain('\u00a0');
});

test('cleanHtmlToPlainText - collapses multiple spaces left after sanitization', () => {
  const html = `<p>a${'\u00a0'}${'\u00a0'}b</p>`;
  const plainText = cleanHtmlToPlainText(html);
  expect(plainText).toBe('a b');
});
