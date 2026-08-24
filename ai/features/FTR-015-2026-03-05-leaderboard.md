# Feature: [FTR-015] Leaderboard
**Status:** queued | **Priority:** P0 | **Date:** 2026-03-05

## Why
Leaderboard (Score 3.00): Imagined competition — сравнение с "Мария П." мотивирует ЦА 55+. Yandex Games SDK имеет встроенный Leaderboard API, уже инициализирован в YandexPlatform. Fake/post-level leaderboards — мягкая конкуренция без агрессии. Bracket leaderboard (50-100 игроков) — реалистичная конкуренция, где можно быть в топ-10.

## Context
Depends on FTR-002 (SDK bridge). YandexPlatform already initializes `this.lb = await this.sdk.getLeaderboards()` and has `saveHighScore()` that calls `this.lb.setLeaderboardScore('score', score)`. Need to add: read leaderboard entries, display in UI, call saveHighScore at game end.

## Research Reference
- M3: Leaderboards (Score 3.00)

---

## Scope
**In scope:** Leaderboard scene showing top-10 scores, player's rank, access from menu + game over, save score to Yandex leaderboard on game end
**Out of scope:** Weekly reset, bracket/group leaderboards, friends-only leaderboard, social features

---

## Allowed Files
**New files allowed:**
1. `src/scenes/LeaderboardScene.ts` — leaderboard display (~100 LOC)

**Modify:**
2. `src/sdk/IGamePlatform.ts` — add getLeaderboardEntries() to interface
3. `src/sdk/YandexPlatform.ts` — implement getLeaderboardEntries()
4. `src/sdk/MockPlatform.ts` — mock getLeaderboardEntries() with fake data
5. `src/scenes/MenuScene.ts` — add "Рейтинг" button
6. `src/scenes/GameOverScene.ts` — add "Рейтинг" button
7. `src/scenes/GameScene.ts` — call saveHighScore on game over (if new record)
8. `src/main.ts` — register LeaderboardScene

**FORBIDDEN:** MergeDetector.ts, Animal.ts, PhysicsManager.ts, GameConfig.ts (no config needed).

---

## Design

### IPlatformBridge Extension

```typescript
export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  isPlayer: boolean;  // highlight current player
}

export interface IPlatformBridge {
  // ... existing methods ...

  /** Get top leaderboard entries + player's entry */
  getLeaderboardEntries(count: number): Promise<LeaderboardEntry[]>;
}
```

### YandexPlatform Implementation

```typescript
async getLeaderboardEntries(count: number): Promise<LeaderboardEntry[]> {
  try {
    if (!this.lb) return [];
    const res = await this.lb.getLeaderboardEntries('score', {
      quantityTop: count,
      includeUser: true,
    });
    const entries: LeaderboardEntry[] = [];
    for (const e of res.entries) {
      entries.push({
        rank: e.rank,
        name: e.player.publicName || `Игрок ${e.rank}`,
        score: e.score,
        isPlayer: e.player.uniqueID === this.player?.getUniqueID(),
      });
    }
    return entries;
  } catch (e) {
    logError('getLeaderboardEntries', e);
    return [];
  }
}
```

### MockPlatform Implementation

```typescript
async getLeaderboardEntries(count: number): Promise<LeaderboardEntry[]> {
  const names = ['Мария П.', 'Ольга С.', 'Татьяна К.', 'Елена В.', 'Наталья Б.',
                 'Людмила Г.', 'Светлана Д.', 'Ирина М.', 'Вы', 'Нина Л.'];
  return names.slice(0, count).map((name, i) => ({
    rank: i + 1,
    name,
    score: Math.max(10000 - i * 800 + Math.floor(Math.random() * 200), 100),
    isPlayer: name === 'Вы',
  }));
}
```

### LeaderboardScene (~100 LOC)

```
Layout (480x854):
┌──────────────────────────┐
│       Рейтинг            │  ← Title, Marmelad 36px
│                          │
│  1.  Мария П.     12,450 │  ← Row, alternating bg
│  2.  Ольга С.     11,200 │
│  3.  Татьяна К.   10,800 │
│  ★4. Вы            9,300 │  ← Player row highlighted
│  5.  Елена В.      8,700 │
│  6.  Наталья Б.    7,900 │
│  ...                     │
│ 10.  Нина Л.       3,200 │
│                          │
│       [ Назад ]          │  ← Back button
└──────────────────────────┘
```

**Row styling:**
- Normal: Nunito 18px, TEXT_INK
- Player: Nunito 18px Bold, ochre highlight bg, star prefix
- Even rows: slight tint for readability
- Row height: 44px (comfortable for 55+ tap targets)

**Loading state:**
- Show "Загрузка..." while fetching
- If empty/error: show "Рейтинг пока пуст" with current player score

### GameScene Integration

In `triggerGameOver()`, after `checkAndSaveBest()`:
```typescript
if (this.score.checkAndSaveBest()) {
  this.bridge.saveHighScore(this.score.getBestScore());
}
```

Note: `saveHighScore()` already exists and sends to Yandex leaderboard.

---

## Drift Log

**Checked:** 2026-03-05 UTC
**Result:** light_drift

### Changes Detected
| File | Change Type | Action Taken |
|------|-------------|--------------|
| `src/scenes/GameScene.ts` | `saveHighScore` not called anywhere (spec assumed it might exist) | AUTO-FIX: confirmed gap, plan adds the call |
| `src/sdk/YandexPlatform.ts` | Uses legacy `getLeaderboards()` API (deprecated by Yandex) | No change: keep legacy pattern for consistency with existing `setLeaderboardScore` call |
| `src/scenes/GameOverScene.ts` | 110 LOC, button pattern uses private `btn()` helper | AUTO-FIX: plan uses existing `btn()` helper |

### References Updated
- Task 2: GameScene `triggerGameOver()` is at lines 225-238 (confirmed)
- Task 2: GameOverScene buttons section is at lines 67-77 (confirmed)
- Task 2: MenuScene bestiary button is at lines 72-82, new button goes after it

### Research Verified
- Yandex SDK: `ysdk.getLeaderboards()` is deprecated, new API is `ysdk.leaderboards.getEntries()`. However, codebase already uses legacy pattern (`this.lb`). Legacy `lb.getLeaderboardEntries()` still works. Keeping legacy for consistency.
- Legacy response format: `res.entries[].player.publicName`, `res.entries[].player.uniqueID` (capital ID) — spec code is correct.
- `checkAndSaveBest()` returns `boolean` (ScoreManager.ts:49) — confirmed.

---

## Detailed Implementation Plan

### Task 1: Extend SDK bridge with getLeaderboardEntries

**Files:**
- Modify: `src/sdk/IGamePlatform.ts:1-36` — add LeaderboardEntry type + method
- Modify: `src/sdk/YandexPlatform.ts:132-166` — add implementation after saveHighScore
- Modify: `src/sdk/MockPlatform.ts:46-59` — add mock implementation

**Context:**
The platform bridge needs a new method to fetch leaderboard entries. YandexPlatform already has `this.lb` initialized (line 50) via `getLeaderboards()`. MockPlatform needs fake data with Russian names for dev mode testing.

**Step 1: Add LeaderboardEntry type and method to IGamePlatform.ts**

Add the `LeaderboardEntry` export interface BEFORE the `IPlatformBridge` interface, and add the method to the interface:

```typescript
// src/sdk/IGamePlatform.ts — COMPLETE FILE after changes

/**
 * Module: IGamePlatform
 * Role: Platform bridge interface — Published Language for all game<->SDK communication
 * Uses: nothing (pure interface)
 * Used by: YandexPlatform, MockPlatform, main.ts, scenes/
 * Does NOT: contain implementation, import game modules
 */

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  isPlayer: boolean;
}

export interface IPlatformBridge {
  /** Initialize SDK. Must complete before Phaser boots. */
  init(): Promise<void>;

  /** Signal to platform: gameplay session started */
  gameplayStart(): void;

  /** Signal to platform: gameplay session stopped */
  gameplayStop(): void;

  /** Show fullscreen interstitial ad. Returns whether it was actually shown. */
  showInterstitial(): Promise<{ shown: boolean }>;

  /** Show rewarded video ad. Returns whether user watched and earned reward. */
  showRewarded(): Promise<{ rewarded: boolean }>;

  /** Show sticky banner ad */
  showBanner(): void;

  /** Hide sticky banner ad */
  hideBanner(): void;

  /** Persist high score to platform storage + leaderboard */
  saveHighScore(score: number): Promise<void>;

  /** Load high score from platform storage */
  loadHighScore(): Promise<number>;

  /** Get top leaderboard entries + player's entry */
  getLeaderboardEntries(count: number): Promise<LeaderboardEntry[]>;
}
```

**Step 2: Implement in YandexPlatform.ts**

Add the `getLeaderboardEntries` method BEFORE the `setPauseResumeCallbacks` method (before line 162). Import `LeaderboardEntry` type:

```typescript
// Add to import at line 18:
import type { IPlatformBridge, LeaderboardEntry } from './IGamePlatform';

// Add method before setPauseResumeCallbacks (insert at line 160):
  async getLeaderboardEntries(count: number): Promise<LeaderboardEntry[]> {
    try {
      if (!this.lb) return [];
      const res = await this.lb.getLeaderboardEntries('score', {
        quantityTop: count,
        includeUser: true,
      });
      const entries: LeaderboardEntry[] = [];
      for (const e of res.entries) {
        entries.push({
          rank: e.rank,
          name: e.player.publicName || `Игрок ${e.rank}`,
          score: e.score,
          isPlayer: e.player.uniqueID === this.player?.getUniqueID(),
        });
      }
      return entries;
    } catch (e) {
      logError('getLeaderboardEntries', e);
      return [];
    }
  }
```

**Step 3: Implement mock in MockPlatform.ts**

Add the `getLeaderboardEntries` method and import `LeaderboardEntry`:

```typescript
// Update import at line 9:
import type { IPlatformBridge, LeaderboardEntry } from './IGamePlatform';

// Add method before the private delay() method (insert before line 56):
  async getLeaderboardEntries(count: number): Promise<LeaderboardEntry[]> {
    console.warn('[SDK Mock] getLeaderboardEntries');
    const names = [
      'Мария П.', 'Ольга С.', 'Татьяна К.', 'Елена В.', 'Наталья Б.',
      'Людмила Г.', 'Светлана Д.', 'Ирина М.', 'Вы', 'Нина Л.',
    ];
    await this.delay(300);
    return names.slice(0, count).map((name, i) => ({
      rank: i + 1,
      name,
      score: Math.max(10000 - i * 800 + Math.floor(Math.random() * 200), 100),
      isPlayer: name === 'Вы',
    }));
  }
```

**Step 4: Verify**

```bash
cd D:/dev/game && npx tsc --noEmit
```

Expected: No type errors. All three files implement the interface correctly.

**Acceptance Criteria:**
- [ ] `LeaderboardEntry` type exported from `IGamePlatform.ts`
- [ ] `getLeaderboardEntries()` in `IPlatformBridge` interface
- [ ] `YandexPlatform` implements with real SDK call using `this.lb`
- [ ] `MockPlatform` returns 10 fake entries with Russian names, 300ms delay
- [ ] `npx tsc --noEmit` passes

---

### Task 2: Create LeaderboardScene + register in main.ts

**Files:**
- Create: `src/scenes/LeaderboardScene.ts` (~110 LOC)
- Modify: `src/main.ts:18,64` — import and register scene

**Context:**
New scene that fetches leaderboard entries via bridge, displays top-10 with loading/empty states. Receives `{ returnTo: string }` data to know where the back button navigates. Follows existing scene patterns (BestiaryScene as reference for layout, GameOverScene for data passing).

**Step 1: Create LeaderboardScene.ts**

```typescript
// src/scenes/LeaderboardScene.ts — COMPLETE FILE

/**
 * Module: LeaderboardScene
 * Role: Displays top-10 leaderboard with player highlight
 * Uses: config/GameConfig (BRAND, GAME), sdk/IGamePlatform (IPlatformBridge, LeaderboardEntry)
 * Used by: MenuScene, GameOverScene (navigation)
 * Does NOT: Contain game logic, modify scores
 */

import Phaser from 'phaser';
import { BRAND, GAME } from '../config/GameConfig';
import type { IPlatformBridge, LeaderboardEntry } from '../sdk/IGamePlatform';

interface LeaderboardData {
  returnTo: string;
}

export class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super('Leaderboard');
  }

  create(data: LeaderboardData): void {
    const bridge = this.registry.get('bridge') as IPlatformBridge;
    const { width, height } = this.scale;
    const returnTo = data?.returnTo || 'Menu';

    this.cameras.main.setBackgroundColor(BRAND.BG_CREAM);

    // Title
    this.add.text(width / 2, 40, 'Рейтинг', {
      fontSize: '36px',
      color: BRAND.TEXT_INK,
      fontFamily: BRAND.FONT_DISPLAY,
    }).setOrigin(0.5);

    // Loading text
    const loadingText = this.add.text(width / 2, height * 0.45, 'Загрузка...', {
      fontSize: '20px',
      color: BRAND.TEXT_SECONDARY,
      fontFamily: BRAND.FONT_BODY,
    }).setOrigin(0.5);

    // Back button (always visible)
    const btnY = height - 60;
    const btn = this.add.rectangle(width / 2, btnY, 180, 48, 0xede0c4);
    btn.setStrokeStyle(2, 0x8a6420);
    btn.setInteractive({ useHandCursor: true });
    this.add.text(width / 2, btnY, 'Назад', {
      fontSize: '20px',
      color: BRAND.TEXT_INK,
      fontFamily: BRAND.FONT_BODY,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(0xe8c47a));
    btn.on('pointerout', () => btn.setFillStyle(0xede0c4));
    btn.on('pointerup', () => this.scene.start(returnTo));

    // Fetch entries
    bridge.getLeaderboardEntries(10).then((entries) => {
      loadingText.destroy();
      if (entries.length === 0) {
        this.showEmpty(width, height);
      } else {
        this.showEntries(entries, width);
      }
    }).catch(() => {
      loadingText.destroy();
      this.showEmpty(width, height);
    });
  }

  private showEntries(entries: LeaderboardEntry[], width: number): void {
    const startY = 90;
    const rowH = 44;
    const padX = 30;

    entries.forEach((entry, i) => {
      const y = startY + i * rowH;

      // Alternating row background
      if (entry.isPlayer) {
        this.add.rectangle(width / 2, y, width - 20, rowH, 0xd4a24c, 0.2);
      } else if (i % 2 === 0) {
        this.add.rectangle(width / 2, y, width - 20, rowH, 0xede0c4, 0.4);
      }

      // Rank
      const prefix = entry.isPlayer ? '\u2605' : '';
      const rankStr = `${prefix}${entry.rank}.`;
      this.add.text(padX, y, rankStr, {
        fontSize: '18px',
        color: entry.isPlayer ? '#D4A24C' : BRAND.TEXT_INK,
        fontFamily: BRAND.FONT_BODY,
        fontStyle: entry.isPlayer ? 'bold' : '',
      }).setOrigin(0, 0.5);

      // Name
      this.add.text(padX + 50, y, entry.name, {
        fontSize: '18px',
        color: entry.isPlayer ? BRAND.TEXT_INK : BRAND.TEXT_INK,
        fontFamily: BRAND.FONT_BODY,
        fontStyle: entry.isPlayer ? 'bold' : '',
      }).setOrigin(0, 0.5);

      // Score (right-aligned)
      this.add.text(width - padX, y, entry.score.toLocaleString('ru-RU'), {
        fontSize: '18px',
        color: entry.isPlayer ? '#D4A24C' : BRAND.TEXT_SECONDARY,
        fontFamily: BRAND.FONT_BODY,
        fontStyle: entry.isPlayer ? 'bold' : '',
      }).setOrigin(1, 0.5);
    });
  }

  private showEmpty(width: number, height: number): void {
    this.add.text(width / 2, height * 0.4, 'Рейтинг пока пуст', {
      fontSize: '20px',
      color: BRAND.TEXT_SECONDARY,
      fontFamily: BRAND.FONT_BODY,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.48, 'Сыграйте партию,\nчтобы попасть в рейтинг!', {
      fontSize: '16px',
      color: BRAND.TEXT_SECONDARY,
      fontFamily: BRAND.FONT_BODY,
      align: 'center',
    }).setOrigin(0.5);
  }
}
```

**Step 2: Register in main.ts**

Add import after BestiaryScene import (line 18):

```typescript
// Add at line 19 (after BestiaryScene import):
import { LeaderboardScene } from './scenes/LeaderboardScene';
```

Add to scene array (line 64):

```typescript
// Change line 64 from:
    scene: [PreloadScene, MenuScene, GameScene, GameOverScene, BestiaryScene],
// To:
    scene: [PreloadScene, MenuScene, GameScene, GameOverScene, BestiaryScene, LeaderboardScene],
```

**Step 3: Verify**

```bash
cd D:/dev/game && npx tsc --noEmit
```

Expected: No type errors. LeaderboardScene registered.

**Acceptance Criteria:**
- [ ] `LeaderboardScene.ts` exists, <= 120 LOC
- [ ] Scene receives `returnTo` data param
- [ ] Shows "Загрузка..." while fetching
- [ ] Shows entries with rank, name, score after fetch
- [ ] Player row has ochre highlight and star prefix
- [ ] Even rows have alternating background
- [ ] Empty state shows "Рейтинг пока пуст"
- [ ] "Назад" button navigates to `returnTo` scene
- [ ] Scene registered in `main.ts`
- [ ] `npx tsc --noEmit` passes

---

### Task 3: Wire leaderboard access from Menu, GameOver + save score

**Files:**
- Modify: `src/scenes/MenuScene.ts:72-82` — add "Рейтинг" button after Bestiary button
- Modify: `src/scenes/GameOverScene.ts:73-77` — add "Рейтинг" button before "Меню" button
- Modify: `src/scenes/GameScene.ts:225-238` — add saveHighScore call in triggerGameOver

**Context:**
Final wiring: navigation buttons to LeaderboardScene from two entry points, and saving score to platform on game over. MenuScene gets a third button below "Зверята". GameOverScene gets a button between "Ещё разок" and "Меню". GameScene calls `bridge.saveHighScore()` when a new record is set.

**Step 1: Add "Рейтинг" button to MenuScene**

Insert a new button block AFTER the bestiary button block (after line 82), following the exact same pattern:

```typescript
// Insert after line 82 (after bestBtn.on('pointerup', () => this.scene.start('Bestiary'));)

    // Leaderboard button
    const lbBtnY = bestBtnY + 58;
    const lbBtn = this.add.rectangle(width / 2, lbBtnY, 200, 52, 0xede0c4);
    lbBtn.setStrokeStyle(2, 0x8a6420);
    lbBtn.setInteractive({ useHandCursor: true });
    this.add.text(width / 2, lbBtnY, 'Рейтинг', {
      fontSize: '20px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_BODY, fontStyle: 'bold',
    }).setOrigin(0.5);
    lbBtn.on('pointerover', () => lbBtn.setFillStyle(0xe8c47a));
    lbBtn.on('pointerout', () => lbBtn.setFillStyle(0xede0c4));
    lbBtn.on('pointerup', () => this.scene.start('Leaderboard', { returnTo: 'Menu' }));
```

**Step 2: Add "Рейтинг" button to GameOverScene**

In GameOverScene, insert a new button BEFORE the "Меню" button (before line 77). The existing pattern uses the private `btn()` helper. Add after the "Ещё разок" button block:

```typescript
// Insert after line 75 (after the 'Ещё разок' button tweens line) and before line 77 (Меню button):

    this.btn(w / 2, y, 'Рейтинг', 0xede0c4, () => {
      this.scene.stop();
      this.scene.stop('Game');
      this.scene.start('Leaderboard', { returnTo: 'Menu' });
    });
    y += 60;
```

Note: When navigating from GameOver to Leaderboard, we stop both GameOver and Game scenes (same as the existing "Меню" button pattern on line 77). The returnTo is 'Menu' because GameOver+Game are stopped.

**Step 3: Add saveHighScore call in GameScene.triggerGameOver**

In `triggerGameOver()`, replace the standalone `this.score.checkAndSaveBest()` call (line 232) with a version that also calls `bridge.saveHighScore()`:

```typescript
// Replace line 232:
//   this.score.checkAndSaveBest();
// With:
    const isNewRecord = this.score.checkAndSaveBest();
    if (isNewRecord) {
      this.bridge?.saveHighScore(this.score.getBestScore());
    }
```

The `sessionStats.isNewRecord` is already set earlier via live score comparison in `onScoreUpdated` (line 188). The `checkAndSaveBest()` call persists to localStorage and its return value triggers the platform leaderboard save.

**Step 4: Verify**

```bash
cd D:/dev/game && npx tsc --noEmit
```

Then run dev server and test manually:

```bash
cd D:/dev/game && npm run dev -- --port 3002
```

Test checklist:
1. Menu shows three buttons: "Играть", "Зверята", "Рейтинг" — all fit on screen
2. Click "Рейтинг" from menu -> LeaderboardScene shows mock data -> "Назад" returns to Menu
3. Play a game, lose -> GameOver shows buttons: Продолжить (if eligible), Ещё разок, Рейтинг, Меню
4. Click "Рейтинг" from GameOver -> LeaderboardScene shows mock data -> "Назад" returns to Menu
5. Verify mock leaderboard shows 10 entries with "Вы" highlighted

**Acceptance Criteria:**
- [ ] MenuScene has "Рейтинг" button below "Зверята", navigates to Leaderboard with returnTo='Menu'
- [ ] GameOverScene has "Рейтинг" button between "Ещё разок" and "Меню"
- [ ] GameScene calls `bridge.saveHighScore()` when checkAndSaveBest returns true
- [ ] All navigation flows work: Menu->Leaderboard->Menu, GameOver->Leaderboard->Menu
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` succeeds
- [ ] No console errors

---

### Execution Order

Task 1 → Task 2 → Task 3

Each task builds on the previous:
- Task 1: SDK interface + implementations (no UI)
- Task 2: LeaderboardScene + main.ts registration (needs Task 1 types)
- Task 3: Wiring from existing scenes + score saving (needs Task 2 scene)

### Dependencies

- Task 2 depends on Task 1 (needs `LeaderboardEntry` type and `getLeaderboardEntries` method)
- Task 3 depends on Task 2 (needs `LeaderboardScene` registered to navigate to)

### Research Sources

- [Yandex Games SDK Leaderboard docs](https://yandex.com/dev/games/doc/en/sdk/sdk-leaderboard) — confirmed legacy `lb.getLeaderboardEntries()` still works, response has `entries[].player.publicName` and `entries[].player.uniqueID`
- [Yandex TypeScript types](https://www.npmjs.com/package/@types/ysdk) — `@types/ysdk` v1.2.0 available but not required (codebase uses `any` for SDK)
- Note: `ysdk.getLeaderboards()` is officially deprecated in favor of `ysdk.leaderboards.*` but codebase already uses legacy pattern for `setLeaderboardScore`. Keeping legacy for consistency. Migration to new API can be a separate TECH task.

---

## Tests

### What to test
- [ ] LeaderboardScene displays top-10 entries with rank, name, score
- [ ] Current player's row is highlighted
- [ ] Loading state shows while fetching
- [ ] Empty/error state shows fallback message
- [ ] MockPlatform returns realistic fake data in dev mode
- [ ] "Рейтинг" button accessible from menu and game over
- [ ] New high score saved to platform on game over
- [ ] "Назад" returns to previous scene (menu or game over)

### How to test
- Manual: Play in dev mode, verify mock leaderboard displays
- Manual: Deploy to Yandex Games sandbox, verify real leaderboard

---

## Definition of Done

### Functional
- [ ] Top-10 leaderboard displays correctly
- [ ] Player's entry highlighted with star
- [ ] Accessible from menu and game over
- [ ] High scores saved to Yandex leaderboard
- [ ] Graceful error/empty state handling

### Technical
- [ ] `npm run build` succeeds
- [ ] LeaderboardScene.ts ≤ 120 LOC
- [ ] No console errors
