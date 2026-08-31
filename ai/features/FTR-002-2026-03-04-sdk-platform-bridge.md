# Feature: [FTR-002] SDK Platform Bridge + Boot Sequence
**Status:** done | **Priority:** P0 | **Date:** 2026-03-04

## Why
The game runs inside Yandex Games iframe. SDK init MUST happen before Phaser boots (Pitfall #1). Ad callbacks MUST always resolve (Pitfall #4). Mock bridge is needed for local development. This is the critical path — everything else depends on the bridge being passed through scenes.

## Context
Depends on FTR-001 (project scaffold). IPlatformBridge is the Published Language — all game code depends on this interface, never on Yandex SDK directly.

---

## Scope
**In scope:** IGamePlatform.ts (interface), YandexPlatform.ts (real SDK), MockPlatform.ts (dev mock), main.ts (boot sequence + bridge factory + global error handlers)
**Out of scope:** Game objects (FTR-003), scenes other than minimal PreloadScene stub (FTR-005)

---

## Blueprint Reference

**Domain:** sdk/, main.ts
**Cross-cutting:** Error handling (never throw), ad watchdog (10s timeout), logError utility
**Data model:** IPlatformBridge interface, ad result types

---

## Allowed Files
**New files allowed:**
1. `src/sdk/IGamePlatform.ts` — interface + result types
2. `src/sdk/YandexPlatform.ts` — real Yandex SDK wrapper
3. `src/sdk/MockPlatform.ts` — dev mock with delays
4. `src/main.ts` — boot sequence, bridge factory, global error handlers

**FORBIDDEN:** All other files.

---

## Environment

nodejs: false
docker: false
database: false

---

## Design

### IGamePlatform.ts (~50 LOC)

```typescript
export interface IPlatformBridge {
  init(): Promise<void>;
  gameplayStart(): void;
  gameplayStop(): void;
  showInterstitial(): Promise<{ shown: boolean }>;
  showRewarded(): Promise<{ rewarded: boolean }>;
  showBanner(): void;
  hideBanner(): void;
  saveHighScore(score: number): Promise<void>;
  loadHighScore(): Promise<number>;
}
```

### YandexPlatform.ts (~150 LOC) — 7 pitfalls handled

Key patterns:
- `init()`: `YaGames.init()` → `getPlayer({ scopes: false })` → register `game_api_pause/resume`
- `showInterstitial()`: Promise wrapping `showFullscreenAdv()` with `onClose` + `onError` callbacks
- `showRewarded()`: Promise wrapping `showRewardedVideo()` with `onRewarded` + `onClose` + `onError`
- `showBanner()`/`hideBanner()`: fire-and-forget with `.catch(() => {})`
- `saveHighScore()`: `player.setData()` + `leaderboards.setScore()` both in try/catch
- `loadHighScore()`: `player.getData()` with fallback to 0

### MockPlatform.ts (~70 LOC)

- `init()`: `console.warn('[SDK Mock] Initialized')`
- `showInterstitial()`: 1.5s delay → `{ shown: true }`
- `showRewarded()`: 2.0s delay → `{ rewarded: true }`
- All methods log to console with `[SDK Mock]` prefix

### main.ts (~50 LOC) — boot sequence

```
1. window.onerror + window.onunhandledrejection (global error capture)
2. logError utility function
3. createBridge() factory (typeof YaGames check)
4. await bridge.init()
5. new Phaser.Game(config) with scene list
```

Phaser config uses constants from GameConfig.ts. Scene list will reference PreloadScene (stubbed initially).

---

## Implementation Plan

### Task 1: Create IGamePlatform.ts
**Type:** code
**Files:**
  - create: `src/sdk/IGamePlatform.ts`
**Acceptance:** Interface exported, tsc passes

### Task 2: Create MockPlatform.ts
**Type:** code
**Files:**
  - create: `src/sdk/MockPlatform.ts`
**Acceptance:** Implements IPlatformBridge, all methods log with [SDK Mock]

### Task 3: Create YandexPlatform.ts
**Type:** code
**Files:**
  - create: `src/sdk/YandexPlatform.ts`
**Acceptance:** All 7 pitfalls handled, every ad call has onError callback

### Task 4: Create main.ts with boot sequence
**Type:** code
**Files:**
  - create: `src/main.ts`
**Acceptance:** bridge.init() called before Phaser.Game, global error handlers set

### Execution Order
1 → 2 → 3 → 4

---

## Tests

### What to test
- [ ] MockPlatform.init() resolves without error
- [ ] MockPlatform.showInterstitial() resolves with `{ shown: true }` after delay
- [ ] MockPlatform.showRewarded() resolves with `{ rewarded: true }` after delay
- [ ] createBridge() returns MockPlatform when YaGames undefined
- [ ] YandexPlatform.showInterstitial() resolves `{ shown: false }` on SDK error

### How to test
- Unit: Mock tests (no real SDK needed)
- Integration: Manual test — `npm run dev` shows game without errors

### TDD Order
1. Write MockPlatform tests → FAIL → Implement → PASS

---

## Definition of Done

### Functional
- [ ] `npm run dev` boots game with MockPlatform (console shows [SDK Mock] messages)
- [ ] No JS errors in browser console
- [ ] Bridge factory selects Mock when not in Yandex iframe

### Tests
- [ ] MockPlatform unit tests pass

### Technical
- [ ] `npx tsc --noEmit` passes
- [ ] Module header on YandexPlatform.ts and MockPlatform.ts (>80 LOC)

---

## Autopilot Log
