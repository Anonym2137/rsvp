# RSVP Speed Reader 🚀

A modern speed reading ecosystem consisting of a web application and a standalone native mobile app. Both apps use the **RSVP (Rapid Serial Visual Presentation)** reading technique to display text word-by-word at a speed of up to 1000 WPM, complete with an **Optimal Recognition Point (ORP)** visual indicator to maximize reading retention and speed.

---

## 📁 Project Structure

This repository is organized as a monorepo containing two independent applications:

*   **[`web_app/`](./web_app)**: Web speed reader built with **Nuxt 3** and **SQLite (Drizzle ORM)**.
*   **[`mobile_app/`](./mobile_app)**: Fully standalone mobile app built with **React Native (Expo Router)** and **SQLite (expo-sqlite)**.

---

## 📸 Screenshots

| Web Reader | Mobile Reader | Stats Dashboard |
|---|---|---|
| ![Web Reader](./assets/web_reader.png) | ![Mobile Reader](./assets/mobile_reader.png) | ![Stats Dashboard](./assets/stats_dashboard.png) |

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for branch naming, commit message format, issue/PR conventions, and local testing instructions.

---

## ✨ Features

### RSVP Reading Engine
*   **Adjustable Reading Speed**: From 100 to 1000 Words Per Minute (WPM).
*   **Optimal Recognition Point (ORP)**: Highlights the focus letter of each word in red, aligning it to the center for faster comprehension.
*   **Reading Progress Bar**: Visual indication of progress inside chapters.
*   **Quick Rewind**: A dedicated button to rewind exactly **15 seconds** of reading time (dynamically calculated based on WPM) if you lose focus.

### Book Search & Import
*   **Online Search**: Search Anna's Archive directly from the app by **title, author, language, format, and sort options**. The **mobile app** loads Anna's Archive in an in-app browser and imports user-selected EPUB/TXT downloads into its local library. The **web app** currently searches Z-Library through its backend.
*   **On-Device File Parser**: Import local `.epub` and `.txt` files directly. The files are parsed entirely on-device (no servers required!).
*   **Manual Text Entry**: Paste articles or custom text clips directly into the library.

### Library & Statistics
*   **Offline Storage**: All books, parsed chapters, reading history, and progress are stored locally on the device (SQLite).
*   **Interactive Stats Dashboard**: Tracks daily active streaks, total read words, active sessions, and average reading speed (WPM).
*   **Progress Synchronization**: Resumes reading exactly where you left off when entering the reader screen.

---

## 🛠️ Production Build & Installation

### 1. Web Application (`web_app`)

To build and run the web application in a production-ready mode (using Nuxt's high-performance server bundle and SQLite):

```bash
# Navigate to web directory
cd web_app

# Install dependencies
bun install

# Push database migrations and build schema
bun run db:push

# Build the optimized production bundle
bun run build

# Start the production server
bun run start
```

The web app will run continuously and be available at `http://localhost:3000`.

---

### 2. Standalone Mobile App (`mobile_app`)

To install and make the application permanently available on your mobile phone, choose one of the following production methods:

#### Method A: Direct Release Install via USB Debugging (Fastest local install)
If you have your Android phone connected with **USB Debugging** enabled:

```bash
# Navigate to mobile directory
cd mobile_app

# Install dependencies
npm install

# Compile the release build locally and install it directly on the connected phone
npx expo run:android --variant release
```
This builds and installs the standalone, independent app directly onto your phone without requiring Metro server to be running afterwards.

#### Method B: Standalone APK Compilation (EAS Cloud Build)
If you want to compile a standalone `.apk` file that you can share or download and install on any phone:

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Log in to your Expo account (creates one if needed)
eas login

# Build a standalone installer APK
eas build --platform android --profile preview
```
Once the build completes, EAS will provide a direct **download link** or **QR code**. Scan it or download the `.apk` file, transfer it to your phone, and install it.

---

## 🧪 Running Tests

### Mobile App (`mobile_app`)
Unit tests are written using **Jest** and **ts-jest** to verify URL queries, HTML search parsers, and local file scheme routing.

```bash
cd mobile_app
npm test
```

### Web App (`web_app`)
Unit tests are written using **Bun's native test runner** to verify backend HTML parsers, cleaners, and validation pipelines.

```bash
cd web_app
bun test
```

---

## ⚠️ Educational Use & Legal Disclaimer

This project is provided for educational and research purposes, including learning about speed reading, on-device document parsing, and application development. It is not affiliated with or endorsed by Anna’s Archive, Z-Library, or other third-party services.

Only access, download, import, or use material you are legally entitled to use. Users are solely responsible for their use of this software and for complying with applicable laws, copyright restrictions, and third-party terms. The authors and maintainers do not authorize or endorse unlawful use and, to the extent permitted by applicable law, accept no responsibility or liability for users’ actions, legal claims, penalties, or other consequences arising from use of the software. The software is provided “as is”, without warranty, under the MIT License.

The mobile app can download user-selected EPUB/TXT files from third-party services and import them locally. This repository and its release APKs do not include users’ downloaded books, phone SQLite databases, reading history, or personal libraries.

### Local data and release contents

The mobile library is stored in the app’s private SQLite database on the phone. Building an APK does not copy that database from an installed app. Published releases contain the application code and bundled application assets; local databases, signing keystores, credentials, and network capture files are excluded from Git. Online searches and downloads contact third-party websites, which receive those requests.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
