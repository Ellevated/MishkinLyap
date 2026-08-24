# Feature: [FTR-018] Game Modes — Daily Challenge + Relaxation
**Status:** queued | **Priority:** P0 | **Date:** 2026-03-05

## Why
Daily Challenge (Score 2.40): одинаковый random seed для всех игроков каждый день. Честная конкуренция + причина вернуться завтра. Wordle-эффект: "я прошёл сегодняшний" создаёт ритуал. Критично для D7/D30 retention.
Relaxation Mode (Score 2.60): бесконечный режим без game over. Для ЦА 55+ — zen-опыт без стресса. Session length ×2-3 у старшей аудитории. Suika клоны с endless mode в топе на мобильных.

## Context
Depends on FTR-005 (GameScene), FTR-010 (ComboTracker). Currently: only one game mode. GameScene uses `AnimalSpawner.peekNextTier()` which calls `Phaser.Math.Between(1, GAME.SPAWN_MAX_TIER)` — non-deterministic. `ysdk.serverTime()` доступен для античит-защищённого серверного времени (верифицировано в SDK docs).

**Current GameScene LOC: 313** (well within 400 limit). Mode logic must be minimal in GameScene — delegate to manager class.

## Research Reference
- G9: Daily Challenge / Seed-of-the-Day (Score 2.40)
- G10: Relaxation Mode (Score 2.60)

## Verified APIs
- `ysdk.serverTime()` → returns timestamp (ms), server-side, tamper-proof
- `new Phaser.Math.RandomDataGenerator([seed])` → deterministic RNG with `.between(min, max)`
- Game-over check in GameScene.checkGameOver() at line 223

---

## Scope
**In scope:** Mode selection on menu, daily challenge with server-time seed + deterministic spawn, relaxation mode (no game-over), daily best tracking, mode indicator in gameplay
**Out of scope:** Daily leaderboard (separate from main), daily challenge rewards, relaxation mode cosmetics (different theme/music), daily challenge streak

---

## Allowed Files
**New files allowed:**
1. `src/game/GameModeManager.ts` — mode definitions, daily seed RNG, mode-specific config (~70 LOC)

**Modify:**
2. `src/scenes/MenuScene.ts` — add mode selection buttons (3 modes)
3. `src/scenes/GameScene.ts` — read mode from scene data, delegate to GameModeManager (~15 lines added)
4. `src/scenes/GameOverScene.ts` — show "Ежедневный рекорд" for daily mode, hide leaderboard save for relaxation
5. `src/game/AnimalSpawner.ts` — accept optional RNG source for deterministic spawning
6. `src/config/GameConfig.ts` — add MODES config, extend PersistedData with dailyChallenge field
7. `src/sdk/IGamePlatform.ts` — add getServerTime(): number
8. `src/sdk/YandexPlatform.ts` — implement getServerTime() via ysdk.serverTime()
9. `src/sdk/MockPlatform.ts` — mock getServerTime() with Date.now()
10. `src/game/ScoreManager.ts` — add dailyBest persistence, handle migration

**FORBIDDEN:** MergeDetector.ts, Animal.ts, PhysicsManager.ts, InputHandler.ts.

---

## Design

### Game Mode Definitions

```typescript
export type GameMode = 'classic' | 'daily' | 'relaxation';

export const MODES = {
  DAILY_SPAWN_QUEUE_SIZE: 200,  // pre-generate 200 tier values
  RELAXATION_GRAVITY_MULT: 0.7, // slightly slower feel
} as const;
```

### PersistedData Extension

```typescript
// Add to PersistedData
dailyChallenge: {
  date: string;         // 'YYYY-MM-DD' of last daily play
  bestScore: number;    // best score on today's daily
  completed: boolean;   // played at least once today
};
```

Migration: if `dailyChallenge` missing → `{ date: '', bestScore: 0, completed: false }`.

### IPlatformBridge Extension

```typescript
// Add to IPlatformBridge interface
/** Get server time (ms since epoch). Tamper-proof on Yandex. */
getServerTime(): number;
```

**YandexPlatform:**
```typescript
getServerTime(): number {
  try {
    return this.sdk?.serverTime?.() ?? Date.now();
  } catch {
    return Date.now();
  }
}
```

**MockPlatform:**
```typescript
getServerTime(): number {
  return Date.now();
}
```

### GameModeManager (~70 LOC)

```typescript
/**
 * Module: GameModeManager
 * Role: Creates mode-specific config — RNG for daily, gravity for relaxation
 * Uses: config/GameConfig (MODES), IPlatformBridge (getServerTime)
 * Used by: GameScene (creates on scene start, reads config)
 * Does NOT: Manage score, display UI, detect merges
 */
```

**Public API:**
- `constructor(mode: GameMode, bridge: IPlatformBridge)`
- `getSpawnTier(min: number, max: number): number` — deterministic for daily, random for others
- `hasGameOver(): boolean` — false for relaxation
- `getGravityMultiplier(): number` — 0.7 for relaxation, 1.0 for others
- `getDailyDateString(): string` — today's date from server time
- `getMode(): GameMode`

**Daily RNG implementation:**
```typescript
private dailyRng: Phaser.Math.RandomDataGenerator | null = null;

constructor(mode: GameMode, bridge: IPlatformBridge) {
  this.mode = mode;
  if (mode === 'daily') {
    const serverTime = bridge.getServerTime();
    const date = new Date(serverTime);
    const seed = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`;
    this.dailyRng = new Phaser.Math.RandomDataGenerator([seed]);
    this.dateString = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  }
}

getSpawnTier(min: number, max: number): number {
  if (this.dailyRng) {
    return this.dailyRng.between(min, max);
  }
  return Phaser.Math.Between(min, max);
}
```

### AnimalSpawner Changes

Current `rollNextTier()` at AnimalSpawner.ts:
```typescript
// Currently uses Phaser.Math.Between (non-deterministic)
private rollNextTier(): number {
  return Phaser.Math.Between(1, GAME.SPAWN_MAX_TIER);
}
```

Change to accept external RNG:
```typescript
private rngFn: ((min: number, max: number) => number) | null = null;

/** Set custom RNG function (for daily challenge deterministic mode) */
setRngFunction(fn: (min: number, max: number) => number): void {
  this.rngFn = fn;
}

private rollNextTier(): number {
  if (this.rngFn) {
    return this.rngFn(1, GAME.SPAWN_MAX_TIER);
  }
  return Phaser.Math.Between(1, GAME.SPAWN_MAX_TIER);
}
```

### GameScene Integration (~15 lines)

In `create(data)`:
```typescript
const mode: GameMode = data?.mode || 'classic';
this.modeManager = new GameModeManager(mode, this.bridge);

// Wire RNG to spawner
if (mode === 'daily') {
  this.spawner.setRngFunction((min, max) => this.modeManager.getSpawnTier(min, max));
}

// Adjust gravity for relaxation
if (mode === 'relaxation') {
  const grav = PHYSICS.GRAVITY_Y * this.modeManager.getGravityMultiplier();
  this.matter.world.setGravity(0, grav);
}
```

In `checkGameOver()`:
```typescript
private checkGameOver(delta: number): void {
  if (!this.modeManager.hasGameOver()) return; // relaxation = no game over
  // ... existing logic
}
```

In `triggerGameOver()` — pass mode to GameOverScene:
```typescript
this.scene.launch('GameOver', {
  score: this.score.getScore(),
  best: this.score.getBestScore(),
  mode: this.modeManager.getMode(),
  // ... other data
});
```

### MenuScene Mode Selection

Replace single "Играть" button with 3 mode buttons:

```
Current layout (height=854):
  Title: Y = 213.5 (height * 0.25)
  Best score: Y = 358.7 (height * 0.42)
  Play button: Y = 469.7 (height * 0.55)

New layout:
  Title: Y = 180 (height * 0.21)
  Best score: Y = 300 (height * 0.35)

  [  Играть  ]     Y = 400, 220x52, ochre (primary)
  [Ежедневная]     Y = 465, 220x52, surface + calendar icon
  [Без стресса]    Y = 530, 220x52, surface + zen indicator

  Daily sub-text: "Рекорд сегодня: {N}" or "Новый день!" (16px, secondary)
```

Button click handlers:
```typescript
playBtn.on('pointerup', () => this.scene.start('Game', { mode: 'classic' }));
dailyBtn.on('pointerup', () => this.scene.start('Game', { mode: 'daily' }));
relaxBtn.on('pointerup', () => this.scene.start('Game', { mode: 'relaxation' }));
```

### GameOverScene Mode Handling

- Daily mode: show "Ежедневный рекорд: {N}" instead of "Рекорд: {best}"
- Relaxation mode: hide "Рекорд" (no competitive scoring), show session duration or merge count
- Both modes: "Ещё разок" restarts with same mode

---

## Drift Log

**Checked:** 2026-03-05 UTC
**Result:** light_drift

### Changes Detected
| File | Change Type | Action Taken |
|------|-------------|--------------|
| `src/scenes/GameScene.ts` | LOC count wrong (spec: 416, actual: 313) | AUTO-FIX: updated spec context |
| `src/scenes/GameScene.ts` | checkGameOver() at line 223, not 195 | AUTO-FIX: updated reference |
| `src/game/AnimalSpawner.ts` | Method is `rollTier()` not `rollNextTier()` | AUTO-FIX: updated all references |
| `src/scenes/GameScene.ts` | `create()` has no `data` parameter yet | Noted: need to add parameter |
| `src/scenes/GameOverScene.ts` | `doRestart()` calls `scene.start('Game')` without data | Noted: need mode passthrough |
| `src/scenes/MenuScene.ts` | Streak popup also calls `scene.start('Game')` without data (line 178) | Noted: need mode passthrough |

### References Updated
- GameScene LOC: `416` -> `313`
- checkGameOver line: `195` -> `223`
- rollNextTier: `rollNextTier()` -> `rollTier()`
- GameOverScene doRestart: needs `mode` param passthrough

---

## Detailed Implementation Plan

### Task 1: Config + SDK + GameModeManager foundation

**Files:**
- Modify: `src/config/GameConfig.ts:52-60` (add MODES const), `:184-199` (extend PersistedData + DEFAULT_DATA)
- Modify: `src/sdk/IGamePlatform.ts:16-46` (add getServerTime to interface)
- Modify: `src/sdk/YandexPlatform.ts:29-58` (implement getServerTime)
- Modify: `src/sdk/MockPlatform.ts:11-15` (implement getServerTime)
- Create: `src/game/GameModeManager.ts`

**Context:**
Foundation layer: type definitions, config constants, SDK time API, and the core GameModeManager class. Everything else depends on these. GameModeManager encapsulates mode logic so GameScene stays thin.

**Step 1: Add GameMode type and MODES constants to GameConfig.ts**

Add after the `GAME` constant (after line 60):

```typescript
// In src/config/GameConfig.ts — add after GAME const (line 60)

export type GameMode = 'classic' | 'daily' | 'relaxation';

export const MODES = {
  RELAXATION_GRAVITY_MULT: 0.7,
} as const;
```

Extend `PersistedData` interface (add field after `unlockedAchievements`):

```typescript
// In src/config/GameConfig.ts — PersistedData interface, add after unlockedAchievements
  dailyChallenge: {
    date: string;
    bestScore: number;
    completed: boolean;
  };
```

Extend `DEFAULT_DATA` (add field after `unlockedAchievements`):

```typescript
// In src/config/GameConfig.ts — DEFAULT_DATA, add after unlockedAchievements: []
  dailyChallenge: { date: '', bestScore: 0, completed: false },
```

**Step 2: Add getServerTime() to IPlatformBridge**

```typescript
// In src/sdk/IGamePlatform.ts — add to IPlatformBridge interface before closing brace

  /** Get server time (ms since epoch). Tamper-proof on Yandex. */
  getServerTime(): number;
```

**Step 3: Implement getServerTime() in YandexPlatform**

```typescript
// In src/sdk/YandexPlatform.ts — add method before setPauseResumeCallbacks

  getServerTime(): number {
    try {
      return this.sdk?.serverTime?.() ?? Date.now();
    } catch {
      return Date.now();
    }
  }
```

**Step 4: Implement getServerTime() in MockPlatform**

```typescript
// In src/sdk/MockPlatform.ts — add method before private delay()

  getServerTime(): number {
    return Date.now();
  }
```

**Step 5: Create GameModeManager**

```typescript
// src/game/GameModeManager.ts (NEW FILE — ~65 LOC)

/**
 * Module: GameModeManager
 * Role: Creates mode-specific config — RNG for daily, gravity for relaxation
 * Uses: config/GameConfig (GameMode, MODES), sdk/IGamePlatform (getServerTime)
 * Used by: GameScene (creates on scene start, reads config)
 * Does NOT: Manage score, display UI, detect merges
 */

import Phaser from 'phaser';
import type { GameMode } from '../config/GameConfig';
import { MODES } from '../config/GameConfig';
import type { IPlatformBridge } from '../sdk/IGamePlatform';

export class GameModeManager {
  private mode: GameMode;
  private dailyRng: Phaser.Math.RandomDataGenerator | null = null;
  private dateString = '';

  constructor(mode: GameMode, bridge: IPlatformBridge) {
    this.mode = mode;
    if (mode === 'daily') {
      const serverTime = bridge.getServerTime();
      const date = new Date(serverTime);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      this.dateString = `${y}-${m}-${d}`;
      this.dailyRng = new Phaser.Math.RandomDataGenerator([`${y}${m}${d}`]);
    }
  }

  /** Get spawn tier — deterministic for daily, random for others */
  getSpawnTier(min: number, max: number): number {
    if (this.dailyRng) {
      return this.dailyRng.between(min, max);
    }
    return Phaser.Math.Between(min, max);
  }

  /** Whether this mode has game-over condition */
  hasGameOver(): boolean {
    return this.mode !== 'relaxation';
  }

  /** Gravity multiplier — 0.7 for relaxation, 1.0 for others */
  getGravityMultiplier(): number {
    return this.mode === 'relaxation' ? MODES.RELAXATION_GRAVITY_MULT : 1.0;
  }

  /** Get today's date string from server time (for daily challenge) */
  getDailyDateString(): string {
    return this.dateString;
  }

  /** Get current game mode */
  getMode(): GameMode {
    return this.mode;
  }
}
```

**Step 6: Verify build**

```bash
cd D:\dev\game && npx tsc --noEmit
```

Expected: No type errors. GameModeManager compiles. IPlatformBridge implementations satisfy new method.

**Acceptance Criteria:**
- [ ] `GameMode` type exported from GameConfig
- [ ] `MODES` constant exported from GameConfig
- [ ] `PersistedData.dailyChallenge` field exists with default
- [ ] `getServerTime()` on both platform implementations
- [ ] `GameModeManager` < 80 LOC, all methods typed
- [ ] `npx tsc --noEmit` passes

---

### Task 2: AnimalSpawner RNG injection + ScoreManager daily best

**Files:**
- Modify: `src/game/AnimalSpawner.ts:16-80` (add setRngFunction, modify rollTier)
- Modify: `src/game/ScoreManager.ts:22-128` (add dailyBest methods, migration patch)

**Context:**
Wire the RNG injection point into AnimalSpawner so daily mode gets deterministic spawns. Add daily best score tracking to ScoreManager with localStorage migration for the new `dailyChallenge` field.

**Step 1: Add RNG injection to AnimalSpawner**

Add property and setter after line 20 (after `private animals` declaration):

```typescript
// In src/game/AnimalSpawner.ts — add after line 20 (private animals)
  private rngFn: ((min: number, max: number) => number) | null = null;
```

Add setter method after `destroyAll()` (after line 74):

```typescript
// In src/game/AnimalSpawner.ts — add after destroyAll() method

  /** Set custom RNG function (for daily challenge deterministic mode) */
  setRngFunction(fn: (min: number, max: number) => number): void {
    this.rngFn = fn;
  }
```

Modify `rollTier()` at line 77 to use custom RNG:

```typescript
  /** Roll random tier for next drop (1 to SPAWN_MAX_TIER) */
  private rollTier(): number {
    if (this.rngFn) {
      return this.rngFn(1, GAME.SPAWN_MAX_TIER);
    }
    return Phaser.Math.Between(1, GAME.SPAWN_MAX_TIER);
  }
```

**Step 2: Add daily best to ScoreManager**

Add methods after `getDiscoveredTiers()` (after line 119):

```typescript
// In src/game/ScoreManager.ts — add after getDiscoveredTiers()

  /** Get today's daily best score */
  getDailyBest(dateString: string): number {
    const data = this.loadData();
    if (data.dailyChallenge.date === dateString) {
      return data.dailyChallenge.bestScore;
    }
    return 0;
  }

  /** Check and save daily best. Returns true if new daily record. */
  checkAndSaveDailyBest(dateString: string): boolean {
    const data = this.loadData();
    if (data.dailyChallenge.date !== dateString) {
      // New day — reset
      data.dailyChallenge = { date: dateString, bestScore: this.score, completed: true };
      this.saveData(data);
      return true;
    }
    if (this.score > data.dailyChallenge.bestScore) {
      data.dailyChallenge.bestScore = this.score;
      data.dailyChallenge.completed = true;
      this.saveData(data);
      return true;
    }
    data.dailyChallenge.completed = true;
    this.saveData(data);
    return false;
  }
```

Add migration patch in `loadData()` — add after line 99 (after `unlockedAchievements` patch):

```typescript
// In src/game/ScoreManager.ts loadData() — add after unlockedAchievements patch
      if (!parsed.dailyChallenge) parsed.dailyChallenge = { date: '', bestScore: 0, completed: false };
```

Also add to the version migration block (after line 90, after `unlockedAchievements`):

```typescript
          dailyChallenge: parsed.dailyChallenge ?? { date: '', bestScore: 0, completed: false },
```

**Step 3: Verify build**

```bash
cd D:\dev\game && npx tsc --noEmit
```

Expected: No type errors. AnimalSpawner still < 100 LOC. ScoreManager still < 160 LOC.

**Acceptance Criteria:**
- [ ] `AnimalSpawner.setRngFunction()` exists and `rollTier()` uses it
- [ ] `AnimalSpawner.ts` <= 100 LOC
- [ ] `ScoreManager.getDailyBest()` and `checkAndSaveDailyBest()` work
- [ ] Migration patch handles missing `dailyChallenge` field
- [ ] `npx tsc --noEmit` passes

---

### Task 3: GameScene mode integration

**Files:**
- Modify: `src/scenes/GameScene.ts:1-313` (add ~18 lines: import, property, create() wiring, checkGameOver guard, triggerGameOver mode pass)

**Context:**
Wire GameModeManager into GameScene. This is the thin orchestration layer — GameScene delegates to manager, adds no logic of its own. Must stay under 20 new lines. Key concern: `create()` currently takes no parameters; Phaser passes scene data as first arg to `create()`.

**Step 1: Add imports and property**

Add import at top (after line 20, after ComboTracker import):

```typescript
// In src/scenes/GameScene.ts — add after EffectsManager import (line 20)
import { GameModeManager } from '../game/GameModeManager';
import type { GameMode } from '../config/GameConfig';
```

Add to PHYSICS import (line 9):

```typescript
// Change line 9 from:
import { GAME, BRAND, ANIMALS, ADS } from '../config/GameConfig';
// To:
import { GAME, BRAND, ANIMALS, ADS, PHYSICS } from '../config/GameConfig';
```

Add property (after line 37, after `bridge!`):

```typescript
  private modeManager!: GameModeManager;
```

**Step 2: Modify create() to accept mode data**

Change `create(): void` signature at line 52:

```typescript
  // Change from:
  create(): void {
  // To:
  create(data?: { mode?: GameMode }): void {
```

Add mode initialization after `this.cameras.main.setBackgroundColor` (after line 59):

```typescript
    // Mode setup
    const mode: GameMode = data?.mode ?? 'classic';
    this.modeManager = new GameModeManager(mode, this.bridge);
    if (mode === 'daily') {
      this.spawner.setRngFunction((min, max) => this.modeManager.getSpawnTier(min, max));
    }
    if (mode === 'relaxation') {
      const gMult = this.modeManager.getGravityMultiplier();
      (this as any).matter.world.setGravity(0, PHYSICS.GRAVITY_Y * gMult);
    }
```

IMPORTANT: The `setRngFunction` call must happen AFTER `this.spawner` is created (line 66). So the mode wiring block goes after manager creation at line 73 (after `this.achievements = new AchievementManager()`). Reorder:

```typescript
    // After line 73 (this.achievements = new AchievementManager())
    // Mode setup (must be after spawner creation)
    const mode: GameMode = data?.mode ?? 'classic';
    this.modeManager = new GameModeManager(mode, this.bridge);
    if (mode === 'daily') {
      this.spawner.setRngFunction((min, max) => this.modeManager.getSpawnTier(min, max));
    }
    if (mode === 'relaxation') {
      (this as any).matter.world.setGravity(0, PHYSICS.GRAVITY_Y * this.modeManager.getGravityMultiplier());
    }
```

**Step 3: Add game-over guard in checkGameOver()**

At line 223, modify `checkGameOver`:

```typescript
  // Change from:
  private checkGameOver(delta: number): void {
    const animals = this.spawner.getAnimals();
  // To:
  private checkGameOver(delta: number): void {
    if (!this.modeManager.hasGameOver()) return;
    const animals = this.spawner.getAnimals();
```

**Step 4: Pass mode to GameOverScene in triggerGameOver()**

At line 250, modify the `scene.launch` call:

```typescript
  // Change from:
    this.scene.launch('GameOver', {
      score: this.score.getScore(), best: this.score.getBestScore(), ...this.sessionStats,
      canContinue: this.continuesUsed < ADS.MAX_CONTINUES_PER_GAME,
    });
  // To:
    const isDaily = this.modeManager.getMode() === 'daily';
    this.scene.launch('GameOver', {
      score: this.score.getScore(), best: this.score.getBestScore(), ...this.sessionStats,
      canContinue: this.continuesUsed < ADS.MAX_CONTINUES_PER_GAME,
      mode: this.modeManager.getMode(),
      dailyBest: isDaily ? this.score.getDailyBest(this.modeManager.getDailyDateString()) : 0,
    });
    if (isDaily) {
      this.score.checkAndSaveDailyBest(this.modeManager.getDailyDateString());
    }
```

**Step 5: Add mode indicator in UI (create method)**

After the game-over line drawing (after line 113), add a small mode label:

```typescript
    // Mode indicator (only for non-classic)
    if (mode !== 'classic') {
      const modeLabel = mode === 'daily' ? 'Ежедневная' : 'Без стресса';
      this.add.text(GAME.WIDTH / 2, 70, modeLabel, {
        fontSize: '16px', color: BRAND.TEXT_SECONDARY, fontFamily: BRAND.FONT_BODY,
      }).setOrigin(0.5).setDepth(10);
    }
```

**Step 6: Verify build**

```bash
cd D:\dev\game && npx tsc --noEmit
```

Expected: No type errors. GameScene total additions ~18 lines (well within 20 limit).

**Acceptance Criteria:**
- [ ] GameScene accepts `{ mode }` data from scene.start
- [ ] Daily mode wires deterministic RNG to spawner
- [ ] Relaxation mode sets reduced gravity
- [ ] Relaxation mode skips game-over check
- [ ] Mode + dailyBest passed to GameOverScene
- [ ] Mode indicator shows for daily/relaxation
- [ ] GameScene additions <= 20 lines of logic
- [ ] `npx tsc --noEmit` passes

---

### Task 4: MenuScene mode buttons + GameOverScene mode display

**Files:**
- Modify: `src/scenes/MenuScene.ts:23-149` (replace Play button with 3 mode buttons, adjust layout)
- Modify: `src/scenes/GameOverScene.ts:12-112` (add mode to data interface, adapt display, fix restart)

**Context:**
Replace the single "Играть" button with three mode buttons. Adjust vertical layout to fit. GameOverScene needs to show mode-specific content and pass mode back on restart.

CRITICAL concerns:
- MenuScene currently has "Играть" at Y=height*0.55, then 4 buttons below with 60-70px spacing
- Adding 2 more mode buttons means squeezing layout. Solution: keep "Играть" as-is but add subtitle "Ежедневная" and "Без стресса" as smaller buttons below it, push nav buttons down.
- GameOverScene.doRestart() calls `this.scene.start('Game')` — must pass mode
- MenuScene streak popup also calls `this.scene.start('Game')` — defaults to classic, acceptable

**Step 1: Modify MenuScene layout**

Import GameMode and ScoreManager (already imported). Add import for GameModeManager:

```typescript
// In src/scenes/MenuScene.ts — add import at top
import type { GameMode } from '../config/GameConfig';
```

Replace the Play button section (lines 49-70) and adjust layout. The current layout:
- Title at height * 0.25
- Best score at height * 0.42
- Play button at height * 0.55 (btnY)
- Bestiary at btnY + 70
- Leaderboard at btnY + 130
- Missions at btnY + 190
- Achievements at btnY + 250

New layout (3 play buttons, then nav buttons):
- Title at height * 0.21 (shift up slightly)
- Best score at height * 0.33
- "Играть" at height * 0.45 (primary, 220x52, ochre)
- "Ежедневная" at height * 0.45 + 62 (secondary, 220x48, surface)
- "Без стресса" at height * 0.45 + 118 (secondary, 220x48, surface)
- Nav buttons start at height * 0.45 + 185 with 56px spacing

Replace lines 30-70 (title + best + play button) with:

```typescript
    // Title (shifted up)
    this.add.text(width / 2, height * 0.21, 'Мишкин\nЛяп', {
      fontSize: '48px',
      color: BRAND.TEXT_INK,
      fontFamily: BRAND.FONT_DISPLAY,
      align: 'center',
    }).setOrigin(0.5);

    // Best score
    const scoreManager = new ScoreManager(this);
    const best = scoreManager.getBestScore();
    if (best > 0) {
      this.add.text(width / 2, height * 0.33, `Рекорд: ${best}`, {
        fontSize: '22px',
        color: BRAND.TEXT_SECONDARY,
        fontFamily: BRAND.FONT_BODY,
      }).setOrigin(0.5);
    }

    // === Mode buttons ===
    const modeY = height * 0.45;

    // Classic (primary)
    const playBtn = this.createBtn(width / 2, modeY, 220, 52, 0xd4a24c, 'Играть', '22px');
    playBtn.on('pointerup', () => { playBtn.setScale(1); this.startGame('classic'); });

    // Daily challenge
    const dailyY = modeY + 62;
    const dailyBtn = this.createBtn(width / 2, dailyY, 220, 48, 0xede0c4, 'Ежедневная', '20px');
    dailyBtn.on('pointerup', () => { dailyBtn.setScale(1); this.startGame('daily'); });

    // Daily sub-text (best score or "Новый день!")
    const dailyBest = scoreManager.getDailyBest(this.getTodayString());
    const dailySub = dailyBest > 0 ? `Рекорд: ${dailyBest}` : 'Новый день!';
    this.add.text(width / 2, dailyY + 30, dailySub, {
      fontSize: '14px', color: BRAND.TEXT_SECONDARY, fontFamily: BRAND.FONT_BODY,
    }).setOrigin(0.5);

    // Relaxation
    const relaxY = dailyY + 64;
    const relaxBtn = this.createBtn(width / 2, relaxY, 220, 48, 0xede0c4, 'Без стресса', '20px');
    relaxBtn.on('pointerup', () => { relaxBtn.setScale(1); this.startGame('relaxation'); });
```

Replace nav buttons (Bestiary, Leaderboard, Missions, Achievements) starting Y:

```typescript
    // === Nav buttons ===
    const navStartY = relaxY + 72;
    const navGap = 56;
```

Then keep Bestiary at `navStartY`, Leaderboard at `navStartY + navGap`, Missions at `navStartY + navGap * 2`, Achievements at `navStartY + navGap * 3`.

Add helper methods to MenuScene:

```typescript
  private startGame(mode: GameMode): void {
    this.scene.start('Game', { mode });
  }

  private getTodayString(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private createBtn(x: number, y: number, w: number, h: number, color: number, label: string, fontSize: string): Phaser.GameObjects.Rectangle {
    const btn = this.add.rectangle(x, y, w, h, color);
    btn.setStrokeStyle(2, 0x8a6420);
    btn.setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontSize, color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_BODY, fontStyle: 'bold',
    }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(0xe8c47a));
    btn.on('pointerout', () => btn.setFillStyle(color));
    btn.on('pointerdown', () => btn.setScale(0.95));
    return btn;
  }
```

Also update streak popup "Играть!" button (line 178):

```typescript
    // Change from:
    btn.on('pointerup', () => this.scene.start('Game'));
    // To:
    btn.on('pointerup', () => this.startGame('classic'));
```

**Step 2: Modify GameOverScene**

Update the `GameOverData` interface (line 12-15):

```typescript
// Change from:
interface GameOverData {
  score: number; best: number; mergeCount: number;
  highestTier: number; isNewRecord: boolean; canContinue: boolean;
}
// To:
interface GameOverData {
  score: number; best: number; mergeCount: number;
  highestTier: number; isNewRecord: boolean; canContinue: boolean;
  mode: import('../config/GameConfig').GameMode; dailyBest: number;
}
```

Add import for GameMode at top:

```typescript
import { BRAND, ANIMALS, ADS } from '../config/GameConfig';
import type { GameMode } from '../config/GameConfig';
```

In `create()`, after `Рекорд:` text (line 47), add daily-specific display:

```typescript
    // After line 47 (Рекорд display)
    if (data.mode === 'daily') {
      txt(this, w / 2, y, `Ежедневный рекорд: ${Math.max(data.score, data.dailyBest)}`, '16px', '#D4A24C');
      y += 24;
    }
```

For relaxation mode, hide "Рекорд" line and "canContinue". Actually, relaxation has no game over, so GameOverScene won't show for relaxation. However, if we ever change this, guard it. For now, relaxation never reaches triggerGameOver, so no changes needed for relaxation display.

Fix `doRestart` to pass mode (line 99):

```typescript
    // Change from:
    this.scene.stop(); this.scene.stop('Game'); this.scene.start('Game');
    // To:
    const mode = (this.scene.settings.data as GameOverData)?.mode ?? 'classic';
    this.scene.stop(); this.scene.stop('Game'); this.scene.start('Game', { mode });
```

Fix "Ещё разок" button to also pass mode. The `doRestart` already handles this since it reads from scene data.

Fix "Меню" button — no change needed (goes back to Menu).

**Step 3: Verify build**

```bash
cd D:\dev\game && npx tsc --noEmit
```

**Step 4: Manual test**

1. Start game, see 3 mode buttons on menu
2. Click "Играть" -> classic mode, no mode indicator, game over works normally
3. Click "Ежедневная" -> daily mode, "Ежедневная" indicator visible, deterministic spawns
4. Click "Без стресса" -> relaxation mode, "Без стресса" indicator, no game over
5. In daily game over, see "Ежедневный рекорд" text
6. Click "Ещё разок" from game over -> restarts in same mode
7. Verify daily best persists: play daily, get score, restart, check menu shows daily best

**Acceptance Criteria:**
- [ ] 3 mode buttons visible on menu with correct layout
- [ ] Daily sub-text shows daily best or "Новый день!"
- [ ] Game over shows daily record for daily mode
- [ ] "Ещё разок" preserves game mode
- [ ] Streak popup defaults to classic
- [ ] MenuScene still <= 250 LOC
- [ ] GameOverScene still <= 140 LOC
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` succeeds

---

### Execution Order

Task 1 (config + SDK + manager) -> Task 2 (AnimalSpawner + ScoreManager) -> Task 3 (GameScene wiring) -> Task 4 (MenuScene + GameOverScene)

```
Task 1 → Task 2 → Task 3 → Task 4
```

All tasks are sequential: each depends on the previous.

### Dependencies

- Task 2 depends on Task 1 (needs GameMode type + GameModeManager class)
- Task 3 depends on Task 2 (needs AnimalSpawner.setRngFunction + ScoreManager daily methods)
- Task 4 depends on Task 3 (needs GameScene mode data passthrough to GameOverScene)

### Critical Implementation Notes

1. **`(this as any).matter.world.setGravity(x, y)`** — GameScene accesses Matter through `this.matter` which Phaser provides to scenes with Matter physics. TypeScript doesn't type this well, so cast via `any`. The API is `setGravity(x: number, y: number, scale?: number)` where default scale is 0.001. We pass `(0, PHYSICS.GRAVITY_Y * 0.7)` to reduce Y gravity.

2. **`Phaser.Math.RandomDataGenerator([seed])`** — constructor takes an array of strings as seeds. The `between(min, max)` method returns integer in [min, max] inclusive. Same seed = same sequence, guaranteed.

3. **`scene.start('Game', { mode })`** — Phaser passes the second argument as `data` parameter to the target scene's `create(data)`. Currently GameScene.create() takes no params; we add `data?: { mode?: GameMode }`.

4. **GameOverScene data access** — `this.scene.settings.data` contains the data passed to `scene.launch()`. The `create(data)` parameter also receives it. For `doRestart`, we read mode from `this.scene.settings.data` since `create` parameter is scoped to that method.

5. **Relaxation gravity reset** — When switching from relaxation back to classic via menu, `scene.start('Game', { mode: 'classic' })` destroys and recreates the scene, which re-initializes Matter with original config gravity. No manual gravity reset needed.

6. **Daily seed format** — `YYYYMMDD` as string, e.g., `"20260305"`. All players on the same calendar day (server time) get the same seed, therefore the same spawn sequence.

---

## Tests

### What to test
- [ ] Daily mode: same spawn sequence when restarting on same day
- [ ] Daily mode: different sequence on different day (change mock time)
- [ ] Daily mode: "Ежедневный рекорд" shows on game over
- [ ] Relaxation mode: game never triggers game over
- [ ] Relaxation mode: reduced gravity (animals fall slightly slower)
- [ ] Classic mode: unchanged behavior
- [ ] Mode selection buttons on menu all work
- [ ] "Ещё разок" restarts with same mode
- [ ] Mock platform uses Date.now() for server time

### How to test
- Manual: Play daily mode, note first 5 animals, restart → same sequence
- Manual: Play relaxation mode, fill container past line → no game over
- Manual: Verify classic mode unchanged

---

## Definition of Done

### Functional
- [ ] 3 game modes selectable from menu
- [ ] Daily challenge: deterministic spawn sequence from server-time seed
- [ ] Daily challenge: daily best score tracked separately
- [ ] Relaxation: no game-over, slightly reduced gravity
- [ ] Mode indicator visible during gameplay
- [ ] Game over screen adapts per mode

### Technical
- [ ] `npm run build` succeeds
- [ ] GameModeManager.ts ≤ 80 LOC
- [ ] GameScene.ts additions ≤ 20 lines (delegate to manager)
- [ ] AnimalSpawner.ts ≤ 100 LOC after changes
- [ ] No console errors
