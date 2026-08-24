# Feature: [TECH-007] Build Pipeline + Ship
**Status:** done | **Priority:** P1 | **Date:** 2026-03-04

## Why
Yandex Games requires a ZIP file with index.html at root, all paths relative, no sourcemaps. The build pipeline ensures every submission passes moderation technical checks. Preflight fitness functions catch 9 categories of errors before wasting 3-5 days on moderation.

## Context
Depends on FTR-005 (playable game). This is the "last mile" — from source code to Yandex-ready ZIP.

---

## Scope
**In scope:** preflight.mjs (9 fitness checks), package.mjs (ZIP builder), .depcruise.json (import direction), npm scripts update
**Out of scope:** Game code changes, asset creation, Yandex console submission (manual)

---

## Blueprint Reference

**Domain:** scripts/, root config
**Cross-cutting:** Import direction enforcement, LOC limits, module header check, animal name isolation
**Data model:** N/A

---

## Allowed Files
**New files allowed:**
1. `scripts/preflight.mjs` — 9 pre-submit fitness checks
2. `scripts/package.mjs` — ZIP builder using archiver
3. `.depcruise.json` — import direction rules

**Modify:**
4. `package.json` — add scripts (check, package, ship), add devDependencies (archiver, dependency-cruiser)

**FORBIDDEN:** All src/ files.

---

## Environment

nodejs: true
docker: false
database: false

---

## Design

### preflight.mjs (~80 LOC)

Node.js script (ESM). Runs 9 checks on built dist/ and src/:

1. **No absolute paths in dist/index.html** — grep for `src="/` or `href="/`
2. **SDK script tag present** — grep for `yandex.ru/games/sdk/v2`
3. **No sourcemaps** — find `*.map` in dist/assets/
4. **No secrets** — grep for password/secret/token/api_key
5. **File LOC check** — all src/*.ts ≤ 400 LOC
6. **TypeScript compiles** — `tsc --noEmit` (already ran in build, but double-check)
7. **Import direction** — `depcruise --validate .depcruise.json src/`
8. **Animal names only in config/** — grep for animal names outside config/
9. **Module headers on files > 80 LOC** — grep for `Module:` comment

Exit code: 0 = all pass, 1 = any fail.

### package.mjs (~30 LOC)

Node.js script (ESM). Uses `archiver` npm package:

1. Create ZIP from dist/ directory
2. Output to `zverata.zip` in project root
3. Verify: index.html at ZIP root
4. Log: file size, file count

### .depcruise.json

```json
{
  "forbidden": [
    { "name": "config-no-import-scenes", "from": {"path":"src/config"}, "to": {"path":"src/scenes"} },
    { "name": "game-no-import-scenes",   "from": {"path":"src/game"},   "to": {"path":"src/scenes"} },
    { "name": "sdk-no-import-game",      "from": {"path":"src/sdk"},    "to": {"path":"src/game"} },
    { "name": "objects-no-import-scenes", "from": {"path":"src/objects"},"to": {"path":"src/scenes"} }
  ]
}
```

### package.json changes

```json
{
  "devDependencies": {
    "archiver": "^7.0.0",
    "dependency-cruiser": "^16.0.0"
  },
  "scripts": {
    "check": "node scripts/preflight.mjs",
    "package": "node scripts/package.mjs",
    "ship": "npm run build && npm run check && npm run package"
  }
}
```

---

## Implementation Plan

### Task 1: Create .depcruise.json
**Type:** code
**Files:**
  - create: `.depcruise.json`
**Acceptance:** `npx depcruise --validate .depcruise.json src/` passes (no violations)

### Task 2: Create preflight.mjs
**Type:** code
**Files:**
  - create: `scripts/preflight.mjs`
**Acceptance:** `node scripts/preflight.mjs` runs all 9 checks, exits 0 on clean build

### Task 3: Create package.mjs
**Type:** code
**Files:**
  - create: `scripts/package.mjs`
**Acceptance:** `node scripts/package.mjs` creates zverata.zip with index.html at root

### Task 4: Update package.json
**Type:** code
**Files:**
  - modify: `package.json`
**Acceptance:** `npm run ship` executes build → check → package in sequence

### Execution Order
1 → 2 → 3 → 4

---

## Tests

### What to test
- [ ] `npm run ship` completes without errors on clean build
- [ ] preflight.mjs catches absolute path in index.html (inject test case)
- [ ] preflight.mjs catches missing SDK script tag
- [ ] preflight.mjs catches file > 400 LOC
- [ ] package.mjs creates valid ZIP with index.html at root
- [ ] depcruise catches import from game/ to scenes/ (create test violation)

### How to test
- Integration: Run `npm run ship` end-to-end
- Manual: Inspect zverata.zip contents

### TDD Order
1. Run preflight on known-good build → PASS
2. Introduce violation → preflight catches → PASS
3. Package → verify ZIP structure

---

## Definition of Done

### Functional
- [ ] `npm run ship` produces zverata.zip
- [ ] ZIP has index.html at root
- [ ] All 9 preflight checks pass
- [ ] Import direction enforced by depcruise

### Tests
- [ ] Preflight catches injected violations
- [ ] Package creates valid ZIP

### Technical
- [ ] No new runtime dependencies (archiver + depcruise are devDependencies)
- [ ] Scripts are cross-platform (Node.js, not bash)

---

## Autopilot Log
