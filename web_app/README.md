# RSVP Reader — Web App

A web-based **RSVP (Rapid Serial Visual Presentation)** speed reader. Text is shown
word-by-word at up to 1000 WPM with an **Optimal Recognition Point (ORP)**
highlight to maximize retention. Built with **Nuxt 4** (Vue 3) and **Drizzle ORM** over
**SQLite**.

This folder is one of two apps in the monorepo. For the big picture, conventions,
and how the two apps relate, see the [root README](../README.md) and
[root CONTRIBUTING](../CONTRIBUTING.md).

---

## Prerequisites

- **Node.js** 20+ (check with `node -v`)
- **Bun** (package manager + test runner) — https://bun.sh

```bash
# verify
node -v   # >= 20
bun -v     # any recent 1.x
```

---

## Setup (monorepo — clone once at the root)

```bash
# from the repository root (NOT from inside web_app)
git clone https://github.com/Anonym2137/rsvp.git
cd rsvp/web_app

# install dependencies
bun install
```

`bun install` also runs `nuxt prepare`, which generates the `.nuxt/`
type declarations used by the editor and the test runner.

---

## Database

The app uses a local SQLite database managed by Drizzle. Apply the schema
(currently pushed via the Drizzle Kit CLI):

```bash
bunx drizzle-kit push
```

> If your `package.json` does not define a `db:push` script, the command
> above is the canonical equivalent. Adjust if a project script exists.

---

## Development server

```bash
bun run dev
```

The app is served at **http://localhost:3000**.

---

## Production build

```bash
# build the optimized server bundle
bun run build

# preview the production build locally
bun run preview
# or run the built Nitro server directly
node .output/server/index.mjs
```

The production server listens on the port configured by Nuxt (default 3000).

---

## Tests

Unit tests use **Bun's native test runner** and cover the backend HTML
parsers, cleaners, and validation pipelines:

```bash
bun test
```

Type-checking:

```bash
bunx nuxt typecheck
```

---

## Internationalization (i18n)

The UI is localized with [`@nuxtjs/i18n`](https://i18n.nuxtjs.org/):

- **Default locale:** English (`en`).
- **Available locales:** English, Polish (`pl`).
- **Strategy:** `no_prefix` — URLs are locale-agnostic; the choice is kept in the
  `rsvp-locale` cookie.
- **Locale files:** `web_app/locales/en.json` and `web_app/locales/pl.json`
  (kept in key parity).
- **Usage:** components call `useI18n()` and render with `$t('key')`.

Add any new user-visible string to **both** locale files.

---

## Project layout (high level)

```
web_app/
├── app/            # Nuxt app (pages, components, composables)
│   ├── pages/        # routes: index, library, explore, stats, settings, reader/[id]
│   ├── components/   # UI (BottomNav, BookCard, RsvpPlayer, …)
│   └── composables/  # useLibrary, useRsvp, useTheme, …
├── server/         # Nitro server (API routes, EPUB/HTML utilities)
├── locales/        # i18n message catalogs (en.json, pl.json)
├── tests/          # Bun unit tests
├── nuxt.config.ts  # Nuxt + @nuxtjs/i18n configuration
└── tsconfig.json   # TS config (references tests/tsconfig.json)
```

---

## Contributing

Follow the [root CONTRIBUTING guide](../CONTRIBUTING.md): version-based branch
names, Conventional Commits, and issue/PR conventions. Ensure `bun test`
passes before opening a pull request.
