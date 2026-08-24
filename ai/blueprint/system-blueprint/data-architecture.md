# Data Architecture — Zverata

**Date:** 2026-03-04
**Architecture:** B — Modular Standard
**Source:** ai/architect/architectures.md

---

## Data Model

### No Database. No Server. Pure Client-Side.

All data is ephemeral (in-memory) or persisted to localStorage. No network data except Yandex SDK calls.

---

## Type Definitions

### Animal Configuration (compile-time, immutable)

```typescript
// config/GameConfig.ts

export interface AnimalConfig {
  readonly tier: number;
  readonly name: string;
  readonly radius: number;
  readonly score: number;
  readonly key: string;  // sprite asset key
}

export const ANIMALS: readonly AnimalConfig[] = [
  { tier: 1, name: 'hamster', radius: 28, score: 2,  key: 'hamster'  },
  { tier: 2, name: 'rabbit',  radius: 38, score: 6,  key: 'rabbit'   },
  { tier: 3, name: 'kitten',  radius: 50, score: 12, key: 'kitten'   },
  { tier: 4, name: 'cat',     radius: 63, score: 20, key: 'cat'      },
  { tier: 5, name: 'dog',     radius: 78, score: 30, key: 'dog'      },
  { tier: 6, name: 'fox',     radius: 95, score: 42, key: 'fox'      },
  { tier: 7, name: 'panda',   radius: 114,score: 56, key: 'panda'    },
  { tier: 8, name: 'bear',    radius: 135,score: 72, key: 'bear'     },
] as const;
```

**Score formula:** `tier * (tier + 1)` — quadratic growth.

**Spawn pool:** Tiers 1-5 only. Tiers 6-8 are merge-only.

### Physics Constants (compile-time, immutable)

```typescript
// config/GameConfig.ts

export const PHYSICS = {
  GRAVITY_Y: 1.5,
  RESTITUTION: 0.3,
  FRICTION: 0.5,
  FRICTION_AIR: 0.01,
} as const;

export const GAME = {
  WIDTH: 480,
  HEIGHT: 854,
  SPAWN_MAX_TIER: 5,
  DROP_COOLDOWN_MS: 500,
  GAME_OVER_LINE_Y: 120,
} as const;

export const ADS = {
  MIN_SESSION_BEFORE_INTERSTITIAL_MS: 60_000,
  INTERSTITIAL_COOLDOWN_MS: 180_000,
  AD_TIMEOUT_MS: 10_000,
} as const;
```

### Runtime Game Object

```typescript
// objects/Animal.ts

class Animal extends Phaser.GameObjects.Container {
  public readonly tier: number;
  public readonly config: AnimalConfig;
  public body: MatterJS.BodyType;
  public isMerging: boolean = false;
  public isSettled: boolean = false;
}
```

**Lifecycle:** Created by `AnimalSpawner` → active in Matter.js world → merged by `MergeDetector` → destroyed.

### Game State Machine

```typescript
// Used in GameScene.ts

type GamePhase = 'menu' | 'playing' | 'frozen' | 'game-over' | 'ad';

const TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  menu:       ['playing'],
  playing:    ['frozen', 'game-over'],
  frozen:     ['playing'],
  'game-over': ['ad', 'menu', 'playing'],
  ad:         ['menu', 'playing', 'game-over'],
};
```

### Merge Result

```typescript
// game/MergeDetector.ts

interface MergeResult {
  removedA: Animal;
  removedB: Animal;
  created: Animal;        // next tier
  scoreAwarded: number;
  isFinalTier: boolean;   // tier 8 = Bear
}
```

---

## Persistence

### System of Record Table

| Entity | SoR | Location | Consistency | Owner |
|--------|-----|----------|-------------|-------|
| AnimalConfig (tiers) | Compile-time | `GameConfig.ts` | Strong (immutable) | config/ |
| ActiveAnimals | Runtime | Matter.js world | Strong (single-thread) | PhysicsManager |
| CurrentScore | Runtime | ScoreManager in-memory | Strong (single-thread) | ScoreManager |
| BestScore | localStorage | Key `zverata_v1` | Strong (sync write) | ScoreManager |
| BestScore replica | Yandex SDK | `player.setData` | Eventual (async, fire-and-forget) | YandexPlatform |
| LeaderboardRank | Yandex service | Platform-owned | Eventual | YandexPlatform |
| SoundPreference | localStorage | Key `zverata_v1` | Strong (sync write) | ScoreManager |
| AdCooldownState | Runtime | GameScene in-memory | Ephemeral (resets per session) | GameScene |
| GamePhase | Runtime | GameScene in-memory | Strong (single-thread) | GameScene |

### localStorage Schema

**Single JSON blob.** One key, one atomic read/write. Prevents partial state corruption.

```typescript
// game/ScoreManager.ts

export const STORAGE_KEY = 'zverata_v1';
export const STORAGE_VERSION = 1;

export interface PersistedData {
  v: number;       // schema version — for future migrations
  best: number;    // all-time high score
  sound: boolean;  // sound on/off preference
}

export const DEFAULT_DATA: PersistedData = { v: 1, best: 0, sound: true };

export function loadData(): PersistedData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DATA };
    const data = JSON.parse(raw);
    if (!data || typeof data.v !== 'number') return { ...DEFAULT_DATA };
    // Migration: v0 -> v1
    if (data.v < 1) return { ...DEFAULT_DATA, best: Math.max(0, Number(data.best) || 0) };
    // Validate
    return {
      v: STORAGE_VERSION,
      best: (typeof data.best === 'number' && isFinite(data.best) && data.best >= 0) ? data.best : 0,
      sound: typeof data.sound === 'boolean' ? data.sound : true,
    };
  } catch { return { ...DEFAULT_DATA }; }
}

export function saveData(data: PersistedData): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* quota exceeded, silent */ }
}
```

### Yandex SDK Storage (async replica, NOT SoR)

```typescript
// sdk/YandexPlatform.ts

async saveHighScore(score: number): Promise<void> {
  // Fire-and-forget to Yandex player storage
  try { await this.player.setData({ bestScore: score }, true); } catch {}
  // Fire-and-forget to leaderboard
  try {
    if (this.player.getMode() !== 'lite') {
      const lb = await this.ysdk.getLeaderboards();
      await lb.setScore('main_score', score);
    }
  } catch {}
}
```

**Rule:** localStorage is always written FIRST (sync). Yandex SDK is written SECOND (async, best-effort). If SDK write fails, game continues with correct local state.

---

## Data Flow Diagram

```
[User Action: drop animal]
       ↓
[InputHandler] → drop position (x coordinate)
       ↓
[AnimalSpawner] → creates Animal at (x, GAME_OVER_LINE_Y + offset)
       ↓
[Matter.js world] → physics simulation (gravity, collisions)
       ↓
[MergeDetector] → collision event → 5-guard check → merge event
       ↓
[AnimalSpawner] → destroy 2 old Animals, create 1 new Animal (tier+1)
       ↓
[ScoreManager] → add score → check highscore → save to localStorage
       ↓
[GameScene] → if new best → bridge.saveHighScore() (async, fire-and-forget)
```

```
[Game Over detected]
       ↓
[GameScene] → phase = 'game-over' → bridge.gameplayStop()
       ↓
[GameOverScene overlay] → show score, best score, rewarded ad button
       ↓
[User: rewarded ad] → bridge.showRewarded() → if rewarded → continue game
[User: play again] → scene.restart()
[User: interstitial shown] → bridge.showInterstitial() → back to menu
```
