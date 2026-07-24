import { initEpubFile } from "@lingo-reader/epub-parser";
import type { EpubMetadata, EpubToc } from "@lingo-reader/epub-parser";
import { NewBook, NewBookContent } from "~~/shared/types";
import { EpubBook } from "../types";
import { cleanHtmlToPlainText } from "./clean_html_to_plain_text";
import JSZip from "jszip";
import { readFileSync, writeFileSync, rmSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Normalize a (possibly malformed) EPUB so the strict @lingo-reader/epub-parser
 * can read it. Anna's EPUBs sometimes ship an empty self-closing <guide/> (or
 * multiple guides / references outside a guide), which makes parseGuide throw
 * "Within the package there may be one guide element...". A guide is OPTIONAL in
 * EPUB, so we collect every <reference> we can find into a single valid <guide>,
 * or drop the guide entirely when there are none.
 */
export async function normalizeEpub(buffer: Buffer): Promise<Buffer> {
  const zip = await JSZip.loadAsync(buffer);
  const opfName = Object.keys(zip.files).find((n) => n.toLowerCase().endsWith(".opf"));
  if (!opfName) return buffer;
  let opf = await zip.file(opfName)!.async("string");

  const refs = [...opf.matchAll(/<reference\b[^>]*\/?>/gi)].map((m) =>
    m[0].replace(/\/>$/, "></reference>"),
  );
  // Remove every existing <guide>...</guide> (incl. self-closing <guide/>).
  opf = opf.replace(/<guide\b[^>]*\/?>(?:<\/guide>)?/gi, "");
  if (refs.length > 0) {
    opf = opf.replace(
      /<\/manifest>/i,
      `</manifest>\n  <guide>\n    ${refs.join("\n    ")}\n  </guide>`,
    );
  }
  zip.file(opfName, opf);
  return (await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" })) as Buffer;
}

/**
 * Fallback, gdy epub nie ma <guide type="cover">: przeszukaj folder, do którego
 * parser zapisał zasoby (public/images/<fileName>/), i znajdź plik z "cover" w
 * nazwie (case-insensitive). Zwraca ścieżkę publiczną (bez "public") lub null.
 */
const COVER_IMAGE_RE = /\.(jpe?g|png|gif|webp|bmp)$/i;

/** Czy absolutna ścieżka wskazuje na istniejący plik będący obrazkiem. */
function isValidCoverFile(absPath: string): boolean {
  try {
    return existsSync(absPath) && COVER_IMAGE_RE.test(absPath);
  } catch {
    return false;
  }
}

function findCoverImage(dir: string): string | null {
  try {
    const entries = readdirSync(dir);
    const coverEntry = entries.find((name) => /cover/i.test(name));
    if (coverEntry) {
      return `/${dir}/${coverEntry}`.replace(/^\/public\//, "/");
    }
  } catch {
    // folder nie istnieje – brak okładki
  }
  return null;
}

/**
 * Zmniejsz okładkę (ścieżka publiczna, np. /images/<fileName>/cover.jpeg) do
 * max 400px szerokości, JPEG quality 80. UI wyświetla ją w ~64px, więc większe
 * rozdzielczości to tylko zmarnowane miejsce. Pomija brak pliku / błędy.
 */
async function optimizeCover(coverPublicPath: string): Promise<void> {
  const idx = coverPublicPath.indexOf("/images/");
  if (idx === -1) return;
  const rest = coverPublicPath.slice(idx + "/images/".length); // <fileName>/cover.jpeg
  const abs = join(process.cwd(), "public", "images", rest);
  try {
    const sharp = (await import("sharp")).default;
    await sharp(abs)
      .rotate() // respektuj orientację EXIF
      .resize({ width: 400, withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(`${abs}.opt`);
    rmSync(abs);
    // Zachowaj oryginalną nazwę, by ścieżka w bazie pozostała prawidłowa.
    const { renameSync } = await import("node:fs");
    renameSync(`${abs}.opt`, abs);
  } catch {
    // brak sharp / nieobrazek / błąd zapisu – zostaw oryginał
  }
}

/**
 * Po sparsowaniu zostaw w folderze zasobów TYLKO okładkę. Parser @lingo-reader
 * zapisuje tam też obrazy z rozdziałów i CSS, ale czytnik RSVP czyści HTML do
 * czystego tekstu i nie renderuje ich nigdzie — są to martwe pliki (nawet ~85%
 * rozmiaru folderu). Usuwamy wszystko poza plikiem cover.
 */
function cleanNonCoverAssets(dir: string, coverPublicPath: string | null) {
  let coverBase: string | null = null;
  if (coverPublicPath) {
    const idx = coverPublicPath.indexOf("/images/");
    if (idx !== -1) {
      // /images/<fileName>/cover.jpeg -> cover.jpeg
      const rest = coverPublicPath.slice(idx + "/images/".length);
      coverBase = rest.split("/").slice(1).join("/");
    }
  }
  try {
    for (const name of readdirSync(dir)) {
      if (name === coverBase) continue;
      try {
        rmSync(join(dir, name), { recursive: true, force: true });
      } catch {
        // ignore pojedynczy plik
      }
    }
  } catch {
    // folder nie istnieje – nic do czyszczenia
  }
}

export async function epubParser(filePath: string): Promise<EpubBook | null> {
  if (!filePath.toLowerCase().endsWith(".epub")) {
    return null;
  }

  const parsed = await parseEpubWithRetry(filePath);
  if (!parsed) return null;

  const { epub, fileName } = parsed;

  const metaData: EpubMetadata = epub.getMetadata();

  // Poprawna okładka: parser zapisuje obrazki do public/images/<fileName>/ i
  // udostępnia getCoverImage() (szuka <guide type="cover">). Niestety u niektórych
  // epubów (niektóre źródła) guide wskazuje na stronę HTML (np. titlepage.xhtml),
  // a nie na plik graficzny — wtedy getCoverImage() zwraca fałszywie nie-null.
  // Akceptujemy go tylko gdy plik istnieje i jest obrazkiem; w przeciwnym razie
  // używamy findCoverImage() (skanuje folder zasobów pod kątem "cover*").
  // Nie używamy metaData.metas["cover"] — to tylko ID/nazwa z tagu <meta>.
  let cover: string | null = null;
  try {
    const coverAbs = epub.getCoverImage?.();
    if (coverAbs && isValidCoverFile(coverAbs)) {
      cover = coverAbs.replace(/^.*?\/public\//, "/");
    }
  } catch {
    // guide wskazuje na nieistniejący zasób – zignoruj i użyj fallbaku
  }
  if (!cover) {
    cover = findCoverImage(`public/images/${fileName}`);
  }

  const bookMetaData: NewBook = {
    title: metaData.title,
    author: metaData.creator?.[0]?.contributor || "unknown",
    cover,
    progress: 0,
    wordIndex: 0, // TODO: get this from the epub file
  };

  const tableOfContents: EpubToc = epub.getToc();

  const bookContent = await Promise.all(
    tableOfContents.map(async (toc): Promise<Omit<NewBookContent, "bookId">> => {
      const chapter = await epub.loadChapter(toc.id);

      let href = null;

      const imgMatch = chapter.html.match(/<img[^>]+src=["']([^"']+)["']/);

      if (imgMatch) {
        const path = imgMatch[1];

        href = path?.substring(path.indexOf("/images"));
      }

      const content = cleanHtmlToPlainText(chapter.html);

      return {
        playOrder: parseInt(toc.playOrder),
        label: toc.label,
        href,
        content,
      };
    })
  );

  const book: EpubBook = {
    metaData: bookMetaData,
    chapters: bookContent,
  };

  // Zwolnij miejsce: w folderze zasobów zostaw tylko okładkę (reszta to martwe
  // pliki — obrazy z rozdziałów i CSS, których czytnik RSVP nie renderuje).
  cleanNonCoverAssets(`public/images/${fileName}`, cover);

  // Zmniejsz okładkę do rozsądnego rozmiaru (UI pokazuje ją w ~64px). Duże
  // okładki (nawet 450K) tylko zajmują miejsce w public/ i w buildzie.
  if (cover) {
    await optimizeCover(cover);
  }

  return book;
}

/**
 * Parse plain text (.txt) or pasted text into a single-chapter book.
 * Mirrors the mobile app's parsePlainText helper.
 */
export function parsePlainText(title: string, text: string, author = "Własny tekst"): EpubBook {
  return {
    metaData: {
      title,
      author,
      cover: null,
      progress: 0,
      wordIndex: 0,
    },
    chapters: [
      {
        playOrder: 1,
        label: title,
        href: null,
        content: text.replace(/\s+/g, " ").trim(),
      },
    ],
  };
}

/**
 * Call initEpubFile, retrying once with a normalized (guide-fixed) copy of the
 * EPUB when the strict parser rejects the OPF <guide> element.
 */
async function parseEpubWithRetry(filePath: string): Promise<{ epub: any; fileName: string } | null> {
  const fileNameId = filePath.lastIndexOf("/") + 1;
  const fileName = filePath.slice(fileNameId, filePath.length - 5);

  try {
    const epub = await initEpubFile(filePath, `public/images/${fileName}`);
    return { epub, fileName };
  } catch (err) {
    if (err instanceof Error && /guide element/.test(err.message)) {
      try {
        const fixed = await normalizeEpub(readFileSync(filePath));
        const tmp = `${filePath}.normalized.epub`;
        writeFileSync(tmp, fixed);
        try {
          const epub = await initEpubFile(tmp, `public/images/${fileName}`);
          return { epub, fileName };
        } finally {
          try {
            rmSync(tmp);
          } catch {
            /* ignore */
          }
        }
      } catch {
        // fall through to rethrow the original error
      }
    }
    throw err;
  }
}
