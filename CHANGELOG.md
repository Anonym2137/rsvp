# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.0.0] - 2026-10-07

### Added
- Gluestack UI v5 with NativeWind and shared theme tokens for the mobile interface.
- Original Lottie animations for loading, empty states, and book completion, with reduced-motion fallbacks.
- A seven-day reading activity chart based on saved sessions, plus a reading-time summary and clearer speed, streak, and book counts.
- English and Polish translations for the new interface copy.

### Changed
- Redesign all five mobile tabs, the full-screen reader, import dialogs, book actions, and sharing sheets with violet, mint, and amber accents, rounded surfaces, and consistent typography in both themes.
- Refresh statistics when returning to the Stats tab.
- Preserve existing books, reading progress, ratings, preferences, import/search integrations, and share-card capture without a data migration.

---

## [2.1.0] - 2026-10-06

### Added
- In-app browser verification and mirror fallback for Anna’s Archive searches on mobile.
- Direct EPUB/TXT downloads into the mobile library, with a Read now action after import.
- An Expo config plugin that preserves the Android download handler when regenerating the native project.
- Regression tests for the current search-result layout and EPUB cover extraction.

### Fixed
- Translate mobile search and import messages in English and Polish.
- Display the configured app version in Settings and correct the local release build instructions.
- Parse Anna’s Archive’s current result layout to show book titles, authors, and file details.
- Handle download links that open new tabs, preserve EPUB filenames, and reuse browser-session cookies for downloads.
- Restore EPUB/TXT import from phone storage through Android’s system file picker.
- Correct EPUB 2 cover metadata matching, EPUB 3 attribute-order handling, relative cover paths, and XHTML cover-page image extraction.
- Use the selected search thumbnail when an online import has no embedded cover.
- Await import completion, remove temporary download files, and remove incomplete book records if chapter saving fails.

### Changed
- Set Android app version to 2.1.0 and version code to 3.
- Update the existing README disclaimer to describe educational use, user responsibility, and the actual in-app download behavior.
- Clarify that phone libraries and SQLite databases are not included in release APKs.
- Exclude SQLite sidecars, signing keystores, and network capture files from Git.
- Web book search now uses Z-Library.

---

## [2.0.0] - 2026-08-03

### Added
- **Book Ratings**: Star ratings + optional review text stored per book (web `books/custom.post.ts`, `server/db/schema.ts`; mobile `db/database.ts`).
- **Custom Text / Article Import**: Paste articles or custom text clips directly into the library (web `AddBookModal.vue`, mobile `AddBookModal.tsx`).
- **Improved EPUB + HTML pipeline**: `clean_html_to_plain_text.ts` HTML sanitizer/cleaner with dedicated unit tests; EPUB guide normalization.
- **Test coverage**: `clean_html_to_plain_text.test.ts`, `epub_guide_normalize.test.ts`, `import_transaction.test.ts` (web, bun); `database.test.ts` + `epubParser.test.ts` (mobile, jest).

### Changed
- README "Online Search" description corrected to reflect server-side metadata query (no file hosting/redistribution).
- Added Legal & Disclaimer section to README.

### Housekeeping
- Publication hygiene: removed stray debug scripts, unused test fixtures, copyrighted book downloads, and a browser `.har` archive from the working tree; reconciled mobile lockfile with the npm-based setup.

---

## [1.0.0] - 2026-07-21

Initial release of the RSVP Speed Reader ecosystem (Web & Mobile).

### Added
- **RSVP Reading Engine**: Core playback controller displaying words sequentially with optimal recognition point (ORP) highlight in red.
- **Offline SQLite DB**: Implemented database schemas for books, chapters, and reading sessions on both web (Drizzle + SQLite) and mobile (expo-sqlite).
- **Web App (`web_app`)**:
  - Full Nuxt 3 web speed reader with dark-mode optimized styling.
  - Interactive charts displaying words read per day, active streaks, and reading history.
  - Text insertion and local book import (EPUB/TXT) capability.
- **Mobile App (`mobile_app`)**:
  - Standalone Expo application with smooth tab navigation (Home, Library, Explore, Stats, Settings).
  - Web fallback to `AsyncStorage` when testing the app in web mode to prevent database crashes.
  - Fast forward & WPM-based **15-second rewind** functionality to easily go back if focus is lost.
  - Redesigned Explore screen: live **online search** (Anna's Archive) with Language / Format / Sort filters, plus a local on-device library filter. Search results open the book's download page in the browser so the file is fetched and imported locally (no server-side download).
  - USB Debugging/ADB support: Configured Metro start scripts in `package.json` to automatically configure ADB reverse proxies.
  - Automated Jest unit tests covering search queries, HTML parsers, and local file scheme routing.

### Fixed
- **Mobile File Import**: Fixed `IOException: Location isn't readable` on Android by moving selected content files to the app's sandboxed document directory before parsing.
- **Fetch Polyfill Bug**: Removed the standard `fetch().blob()` call on local URIs, which crashed Expo Go with a `TypeError`, replacing it with native base64 FileSystem reading.
- **Sync Pause Loop**: Fixed a bug where saving reading progress to SQLite triggered a state refresh that reset WPM speed and paused the reader after every single word.
- **Boilerplate Cleanup**: Deleted all unused Expo template screens and components (`EditScreenInfo`, `Themed`, `two.tsx`, etc.) to minimize codebase size.
