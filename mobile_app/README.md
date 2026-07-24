# RSVP Reader — Mobile App

A fully **standalone** mobile **RSVP (Rapid Serial Visual Presentation)**
speed reader built with **React Native** via the **Expo Router** framework and
**expo-sqlite**. Like the web app, it presents text word-by-word at up to 1000 WPM
with an **Optimal Recognition Point (ORP)** highlight. All books and progress are
stored locally on the device.

This folder is one of two apps in the monorepo. For the big picture, conventions,
and how the two apps relate, see the [root README](../README.md) and
[root CONTRIBUTING](../CONTRIBUTING.md).

---

## Prerequisites

- **Node.js** 20+ (`node -v`)
- **Expo CLI** (provided locally via `npx expo` / `npm start`)
- For device/emulator runs:
  - **Android Studio** (emulator) and/or a phone with **Expo Go** or a dev build.
  - **Android SDK platform-tools** on your `PATH` (for `expo run:android`).

---

## Setup (monorepo — clone once at the root)

```bash
# from the repository root (NOT from inside mobile_app)
git clone https://github.com/Anonym2137/rsvp.git
cd rsvp/mobile_app

# install dependencies
npm install
```

---

## Running in development

```bash
# start the Expo dev server (Metro)
npm start
# → opens a QR code; scan with Expo Go, or press 'a' / 'i' for emulator
```

The script expands to `expo start --host localhost` (with the Android
`platform-tools` prepended to `PATH` on this setup). Use `npm run android` /
`npm run ios` / `npm run web` to target a specific platform directly.

---

## Type-check & tests

```bash
# TypeScript type-check (no emit)
npx tsc --noEmit

# Unit tests (Jest + ts-jest): URL parsing, HTML search parsing, file scheme routing
npm test
```

---

## Building a standalone app

### Option A — Local USB install (fastest for a connected phone)

With **USB debugging** enabled on an Android phone:

```bash
npm run android
# equivalent to:
npx expo run:android --variant release
```

This compiles and installs the standalone app directly onto the device; no Metro
server is needed afterwards.

### Option B — Cloud build via EAS (shareable APK / AAB)

To produce a standalone `.apk` you can distribute:

```bash
# one-time: install and log in to EAS
npm install -g eas-cli
eas login

# build a standalone installer
eas build --platform android --profile preview
```

When the build finishes, EAS provides a **download link** or **QR code**.
Transfer/install the APK on any compatible phone.

---

## Internationalization (i18n)

The UI is localized with **i18next** + **react-i18next**:

- **Default locale:** English (`en`).
- **Available locales:** English, Polish (`pl`).
- **Persistence:** the selection is saved to `AsyncStorage` (`rsvp-mobile-locale`)
  and restored on launch; falls back to the device locale via `expo-localization`.
- **Configuration:** `mobile_app/services/i18n.ts`.
- **Locale files:** `mobile_app/locales/en.json` and `mobile_app/locales/pl.json`
  (kept in key parity).
- **Usage:** screens call `const { t } = useTranslation()` and render `t('key')`.
  A language toggle lives in **Settings**.

Add any new user-visible string to **both** locale files.

---

## Project layout (high level)

```
mobile_app/
├── app/
│   ├── (tabs)/     # tab screens: index, library, explore, stats, settings
│   ├── reader/[id].tsx  # full-screen RSVP reader
│   └── _layout.tsx        # root stack + i18n bootstrap
├── components/     # BookCard, AddBookModal, RsvpPlayer, StatCard, …
├── hooks/          # useTheme, useLibrary, useRsvp
├── services/       # i18n config, book search, EPUB parser
├── db/            # expo-sqlite database layer
├── locales/       # i18n message catalogs (en.json, pl.json)
└── package.json
```

---

## Contributing

Follow the [root CONTRIBUTING guide](../CONTRIBUTING.md): version-based branch
names, Conventional Commits, and issue/PR conventions. Ensure `npm test` and
`npx tsc --noEmit` pass before opening a pull request.
