# Contributing to RSVP Speed Reader

Thanks for contributing! This repository is a monorepo with two independent apps:

- `web_app/` — Nuxt 3 (Vue 3) web reader + Drizzle/SQLite backend.
- `mobile_app/` — React Native (Expo Router) standalone reader + expo-sqlite.

Both apps share the same RSVP reading engine and i18n conventions (English default, Polish available). Please read this guide before opening a pull request.

---

## 🌿 Branch Naming

We use **version-based branches** off `main`. Create a branch named after the target release:

```bash
git switch -c v1.1.0        # a feature release
git switch -c v1.0.1        # a patch/hotfix
```

For urgent hotfixes you may also use a descriptive prefix:

```bash
git switch -c fix/reader-crash
git switch -c feat/export-notes
```

Keep branches focused — one logical change per branch.

---

## 📝 Commit Messages (Conventional Commits)

All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) spec:

```
<type>(optional scope): <subject>

<body — optional>
<footer — optional>
```

**Types:**

| Type | Use for |
|------|---------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `style` | Formatting, missing semicolons, etc. (no code change) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or correcting tests |
| `chore` | Build process, tooling, dependencies |

**Examples:**

```
feat(web): add language switcher to settings
fix(mobile): resolve curly-quote crash in library search
docs: add CONTRIBUTING.md
```

---

## 🐛 Referencing and Closing Issues

Reference issues so they are linked automatically, and close them when the work is merged. Put the keyword in the **PR description** or the **commit footer**:

```
Closes #123
Fixes #123
Resolves #123
```

You may reference without closing using `See #123` / `Related to #123`.

---

## 🎨 Code Formatting & Linting

- **Web (`web_app`):** [Prettier](https://prettier.io/) + ESLint (Nuxt defaults). Run `bun run dev` lint via your editor; ensure CI passes.
- **Mobile (`mobile_app`):** Prettier + `tsc --noEmit` type-check. Do not disable TypeScript errors to make a build pass.

Configuration lives in each sub-project (`.prettierrc`, `eslint` config, `tsconfig.json`).

---

## ✅ Pull Request Checklist

Before requesting review, confirm:

- [ ] Branch is up to date with `main` (rebased or merged).
- [ ] Commit messages follow Conventional Commits.
- [ ] Related issue is referenced (`Closes #…`) where applicable.
- [ ] **Web tests pass:** `cd web_app && bun test`
- [ ] **Mobile tests pass:** `cd mobile_app && npm test`
- [ ] **Mobile type-check passes:** `cd mobile_app && npx tsc --noEmit`
- [ ] **Web builds:** `cd web_app && bun run build`
- [ ] New user-visible strings use the i18n system (`$t()` on web, `t()` on mobile) and are added to **both** `en.json` and `pl.json` locale files.
- [ ] Documentation updated where needed (README, this file, code comments).

Use the PR template (`.github/pull_request_template.md`) when opening the request.

---

## 🧪 Running Tests Locally

```bash
# Web (Bun's native test runner)
cd web_app
bun test

# Mobile (Jest + ts-jest)
cd mobile_app
npm test
```

See [`web_app/README.md`](./web_app/README.md) and [`mobile_app/README.md`](./mobile_app/README.md) for full setup, build, and run instructions.
