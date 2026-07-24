## Description

<!-- Summarize the change. Link the issue: `Closes #123`. -->

Closes #

## Type of change

- [ ] `feat` — new feature
- [ ] `fix` — bug fix
- [ ] `docs` — documentation only
- [ ] `refactor` — code change, no behavior change
- [ ] `perf` — performance
- [ ] `style` / `chore` — formatting, tooling, deps

## Affected apps

- [ ] `web_app` (Nuxt / Vue)
- [ ] `mobile_app` (React Native / Expo)

## Testing performed

<!-- Show the commands you ran and their results. -->

```bash
# Web
cd web_app && bun test

# Mobile
cd mobile_app && npm test && npx tsc --noEmit
```

- [ ] Web tests pass (`bun test`)
- [ ] Mobile tests pass (`npm test`)
- [ ] Mobile type-check passes (`npx tsc --noEmit`)
- [ ] Web build succeeds (`bun run build`)

## Internationalization

- [ ] Any new user-visible string uses `$t()` (web) / `t()` (mobile).
- [ ] New keys added to **both** `en.json` and `pl.json` (locale files kept in parity).

## Checklist

- [ ] Branch named per CONTRIBUTING (e.g. `v1.1.0`, `fix/...`).
- [ ] Commits follow Conventional Commits (`feat:`, `fix:`, …).
- [ ] Self-review done; no leftover `console.log` / debug code.
- [ ] Docs updated where needed.
