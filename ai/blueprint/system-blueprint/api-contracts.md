# API Contracts — Zverata

**Date:** 2026-03-04
**Architecture:** B — Modular Standard
**Source:** ai/architect/architectures.md

---

## No External API. No Backend. No HTTP Endpoints.

This is a pure client-side game. "API" here = module interfaces and SDK contracts.

---

## 1. Platform Bridge Interface (Published Language)

The single most important contract in the codebase. All game code depends on this interface, never on Yandex SDK directly.

```typescript
// sdk/IGamePlatform.ts

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

  /** Show sticky banner ad in score area */
  showBanner(): void;

  /** Hide sticky banner ad */
  hideBanner(): void;

  /** Persist high score to platform storage + leaderboard */
  saveHighScore(score: number): Promise<void>;

  /** Load high score from platform storage */
  loadHighScore(): Promise<number>;
}
```

### Implementations

| Class | File | When Used |
|-------|------|-----------|
| `YandexPlatform` | `sdk/YandexPlatform.ts` | Production (Yandex Games iframe) |
| `MockPlatform` | `sdk/MockPlatform.ts` | Local dev (`typeof YaGames === 'undefined'`) |

### Factory (in main.ts)

```typescript
import { YandexPlatform } from './sdk/YandexPlatform';
import { MockPlatform } from './sdk/MockPlatform';

const bridge: IPlatformBridge = typeof (window as any).YaGames !== 'undefined'
  ? new YandexPlatform()
  : new MockPlatform();

await bridge.init();
// then pass bridge to Phaser game config as scene data
```

---

## 2. Game Manager Interfaces

### PhysicsManager

```typescript
// game/PhysicsManager.ts

class PhysicsManager {
  constructor(scene: Phaser.Scene);

  /** Create container walls (left, right, bottom) */
  createWalls(): void;

  /** Add an Animal's Matter body to the world */
  addBody(body: MatterJS.BodyType): void;

  /** Remove an Animal's Matter body from the world */
  removeBody(body: MatterJS.BodyType): void;

  /** Get all active bodies count (for physics stability check) */
  getBodyCount(): number;
}
```

### MergeDetector

```typescript
// game/MergeDetector.ts

class MergeDetector {
  constructor(scene: Phaser.Scene);

  /** Start listening for collision events. Emits EVENTS.ANIMAL_MERGED on valid merge. */
  enable(): void;

  /** Stop listening (during game over, ads). */
  disable(): void;
}

// Emitted event payload:
interface MergeResult {
  removedA: Animal;
  removedB: Animal;
  created: Animal;
  scoreAwarded: number;
  isFinalTier: boolean;
}
```

**5-Guard Pattern (invariant):**
1. Both bodies are Animals (not walls)
2. Both have the same tier
3. Neither has `isMerging === true`
4. Neither tier is 8 (Bear, final)
5. Both have `isSettled === true`

### ScoreManager

```typescript
// game/ScoreManager.ts

class ScoreManager {
  constructor(scene: Phaser.Scene);

  /** Add score from merge. Emits EVENTS.SCORE_UPDATED. */
  addScore(points: number): void;

  /** Get current session score */
  getScore(): number;

  /** Get all-time best score (from localStorage) */
  getBestScore(): number;

  /** Check if current score beats best, save if yes */
  checkAndSaveBest(): boolean;

  /** Reset current session score to 0 */
  reset(): void;

  /** Load persisted data from localStorage */
  loadData(): PersistedData;

  /** Save persisted data to localStorage */
  saveData(data: PersistedData): void;
}
```

### InputHandler

```typescript
// game/InputHandler.ts

class InputHandler {
  constructor(scene: Phaser.Scene);

  /** Enable pointer/touch input. Emits EVENTS.DROP_REQUESTED with x position. */
  enable(): void;

  /** Disable input (during cooldown, game over, ads). */
  disable(): void;
}
```

### AnimalSpawner

```typescript
// game/AnimalSpawner.ts

class AnimalSpawner {
  constructor(scene: Phaser.Scene);

  /** Create an Animal at the given position with a random tier (1-5). */
  spawnAtDrop(x: number): Animal;

  /** Create an Animal at merge position with the given tier. */
  spawnAtMerge(x: number, y: number, tier: number): Animal;

  /** Remove an Animal from the scene and physics world. */
  destroy(animal: Animal): void;

  /** Get the next animal tier for preview display. */
  peekNextTier(): number;
}
```

---

## 3. Event Catalog

All event names are constants in `GameEvents.ts`. No string literals in game code.

```typescript
// config/GameEvents.ts

export const EVENTS = {
  // Game logic events (scene-scoped: this.events)
  ANIMAL_MERGED: 'animal-merged',       // payload: MergeResult
  ANIMAL_DROPPED: 'animal-dropped',     // payload: { animal: Animal }
  DROP_REQUESTED: 'drop-requested',     // payload: { x: number }
  SCORE_UPDATED: 'score-updated',       // payload: { score: number, best: number }
  GAME_OVER: 'game-over',              // payload: { score: number, best: number }

  // Cross-scene events (game-scoped: this.game.events)
  SCENE_GAME_OVER: 'scene-game-over',   // GameScene -> GameOverScene
  SCENE_RESTART: 'scene-restart',       // GameOverScene -> GameScene
  SCENE_MENU: 'scene-menu',             // GameOverScene -> MenuScene

  // SDK events
  AD_STARTED: 'ad-started',             // pause game
  AD_ENDED: 'ad-ended',                 // resume game
} as const;
```

---

## 4. Scene Transitions

```
PreloadScene → (assets loaded) → MenuScene
MenuScene → (play button) → GameScene { bridge }
GameScene → (game over) → GameOverScene (overlay, not full transition)
GameOverScene → (play again) → GameScene.restart()
GameOverScene → (menu) → MenuScene
GameScene/GameOverScene → (ad) → freeze game → resume after ad
```

### Scene Data Contracts

| From | To | Data Passed |
|------|----|-------------|
| main.ts | PreloadScene | `{ bridge: IPlatformBridge }` |
| PreloadScene | MenuScene | `{ bridge: IPlatformBridge }` |
| MenuScene | GameScene | `{ bridge: IPlatformBridge }` |
| GameScene | GameOverScene | `{ score: number, best: number, bridge: IPlatformBridge }` |

---

## 5. Yandex SDK Contract (7 Critical Pitfalls)

| # | Pitfall | How Handled |
|---|---------|-------------|
| 1 | Phaser init INSIDE `YaGames.init().then()` | `main.ts`: `await bridge.init()` before `new Phaser.Game()` |
| 2 | Subscribe to `game_api_pause` / `game_api_resume` | `YandexPlatform.init()` registers listeners |
| 3 | `pauseAll()` audio before any ad | GameScene pauses audio on `AD_STARTED` event |
| 4 | `onError` callback on every ad call | Both `showInterstitial` and `showRewarded` have `onError → resolve({ shown: false })` |
| 5 | `GameplayAPI.start/stop` in correct moments | `bridge.gameplayStart()` in GameScene.create, `bridge.gameplayStop()` on game over |
| 6 | SDK mock for local dev | `MockPlatform.ts` auto-selected when `typeof YaGames === 'undefined'` |
| 7 | No `setInterval` for ads | Ads are event-triggered only (game over, rewarded button click) |

---

## 6. Ad Timeout Watchdog

```typescript
// Cross-cutting pattern — used in GameScene or GameOverScene

function showAdWithTimeout(
  bridge: IPlatformBridge,
  type: 'interstitial' | 'rewarded',
): Promise<{ shown: boolean; rewarded?: boolean }> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      logError(`ad_${type}_timeout`);
      resolve({ shown: false });
    }, ADS.AD_TIMEOUT_MS);  // 10 seconds

    const call = type === 'interstitial'
      ? bridge.showInterstitial()
      : bridge.showRewarded();

    call
      .then((result) => { clearTimeout(timeout); resolve(result); })
      .catch(() => { clearTimeout(timeout); resolve({ shown: false }); });
  });
}
```

**Rule:** Every SDK call that can hang MUST use the watchdog. Game must NEVER freeze waiting for an ad.
