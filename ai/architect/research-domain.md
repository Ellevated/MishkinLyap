# Domain Architecture Research — Zverata (Зверята)

**Persona:** Eric (Domain Modeler — DDD lens applied to client-side game)
**Focus:** Module boundaries, interface contracts, state machine, merge detection, reusability
**Date:** 2026-03-04

---

## Research Conducted

- [sgbj/suika-clone — Phaser + Matter.js TypeScript](https://github.com/sgbj/suika-clone) — reference structural pattern confirmed; single GameScene pattern, no separated module contracts
- [Phaser Matter Collision Plugin](https://mikewesthad.github.io/phaser-matter-collision-plugin/docs/index.html) — `addOnCollideStart` per-object API is the idiomatic approach; avoids centralized collision soup
- [Modular Game Worlds in Phaser 3 — Matter Physics](https://itnext.io/modular-game-worlds-in-phaser-3-tilemaps-5-matter-physics-platformer-d14d1f614557) — `collisionstart` event iterates all pairs; need label-based body identification
- [DI in Phaser 3 — SOLID principles](https://dev.to/belka/the-power-of-dependency-injection-in-phaser-3-building-a-modular-game-with-solid-principles-5251) — dependency injection applicable to Phaser scenes; services injected, not imported directly
- [Playgama Bridge — cross-platform SDK abstraction](https://github.com/playgama/bridge) — proven pattern: single `IPlatformSDK` interface, platform-specific adapters; used in production for Yandex Games
- [State Machine for Video Game Menus](https://code-notes.casantosmu.com/patterns/finite-state-machines/) — FSM with explicit states + events + transitions; enum-driven transitions
- [Phaser 3 Collision — Matter.js docs](https://docs.phaser.io/api-documentation/namespace/physics-matter-components-collision) — `setOnCollide`, `setOnCollideWith` per-body callbacks; collision categories via bitmask

**Total queries:** 6 web searches + 1 code context deep-dive

---

## Kill Question Answer

**"Can you explain the architecture using only business terms, without mentioning any technology?"**

Yes — and here is the proof:

> "The game has four concerns. First, the **play rules** — physics, when animals merge, scoring. Second, **what the player sees** — screens, animations, visual feedback. Third, **the platform handshake** — telling Yandex when gameplay starts, when to show ads, how to save the best score. Fourth, **the tuning knobs** — which animal is tier 1, how big is the container, what score each merge gives."

These four concerns map to four modules with no technology leak in the naming:
- Play Rules → **GameCore**
- What Player Sees → **Presentation**
- Platform Handshake → **PlatformBridge**
- Tuning Knobs → **GameConfig**

The only place technology language must appear is in the *implementation* layer, not the boundary definitions.

---

## Proposed Domain Decisions

### Module Boundaries (Bounded Contexts for a Client-Side Game)

Note: In a pure DDD sense, "bounded context" requires teams, codebase partitions, and deployment units. For a single-developer client-side game, the equivalent is **module with explicit interface contract** — same linguistic isolation principle, different scale.

The test: can a term mean something different across modules? Yes. "Animal" in GameCore means a physics body with tier and collision state. "Animal" in Presentation means a sprite with animation and sound. These are the same word for two different things. That boundary is real.

---

### Module 1: GameCore

**Responsibility:** Owns the rules of the game. What can happen, when, and with what consequence. No rendering, no platform calls.

**Core Concepts:**
- `Animal` — a physics entity with a tier (1-8), position, velocity, merge-eligibility state
- `MergeEvent` — the fact that two same-tier Animals touched and produced a higher-tier Animal
- `Score` — running count of merge-points accumulated in a session
- `GameSession` — the lifecycle of one play attempt (active | frozen | ended)
- `DropZone` — the container that animals fall into; defines game over boundary
- `NextAnimal` — the upcoming animal shown to player before drop

**Ubiquitous Language:**
- **Drop:** releasing an Animal from the top into the DropZone
- **Merge:** two same-tier Animals colliding → destroyed → one higher-tier Animal born at midpoint
- **Chain Merge:** a Merge that immediately triggers another Merge without player action
- **Overflow:** an Animal resting above the game over line → session ends
- **Tier:** the rank of an Animal (1=Hamster ... 8=Bear)

**Subdomain Type:** Core (this IS the game; everything else serves this)

**TypeScript Interfaces:**

```typescript
// src/core/types.ts

export type AnimalTier = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface AnimalState {
  id: string;           // unique per session, stable across frames
  tier: AnimalTier;
  x: number;
  y: number;
  isMerging: boolean;   // locked during merge animation — prevents double-merge
  isSettled: boolean;   // false while still falling fast
}

export interface MergeResult {
  destroyedIds: [string, string];
  spawnedAnimal: AnimalState;
  scoreGained: number;
}

export interface GameSessionState {
  status: 'idle' | 'active' | 'frozen' | 'ended';
  score: number;
  highScore: number;
  nextTier: AnimalTier;
  animals: AnimalState[];
  sessionDurationMs: number;
}

// The contract GameCore exposes to the outside world
export interface IGameCore {
  getSessionState(): GameSessionState;
  onMerge(callback: (result: MergeResult) => void): void;
  onGameOver(callback: (finalScore: number) => void): void;
  onScoreChanged(callback: (score: number) => void): void;
}
```

---

### Module 2: Presentation

**Responsibility:** Everything the player sees and hears. Translates GameCore events into visual + audio feedback. Owns scenes, animations, particles, UI.

**Core Concepts:**
- `Scene` — a full-screen state (Menu, Gameplay, GameOver)
- `AnimalSprite` — the visual representation of a GameCore Animal
- `MergeEffect` — the 0.2s scale+particles animation triggered by MergeEvent
- `ScoreDisplay` — live score counter in the UI
- `DropIndicator` — the line/arrow showing where the next animal will land

**Ubiquitous Language:**
- **Scene** (not "screen" — Phaser's word, aligns with business "what player sees")
- **Effect** (not "animation" — broader, includes sound + particles)
- **Transition** — the move from one Scene to another (fade, flash, etc.)

**Subdomain Type:** Supporting (important for player experience, but replaceable — a text-only version would still be the same game)

**TypeScript Interfaces:**

```typescript
// src/presentation/types.ts

export interface ISceneTransition {
  from: SceneName;
  to: SceneName;
  trigger: 'play_pressed' | 'game_over' | 'ad_complete' | 'continue_pressed' | 'menu_pressed';
}

export type SceneName = 'PreloadScene' | 'MenuScene' | 'GameScene' | 'GameOverScene';

export interface IMergeEffectConfig {
  x: number;
  y: number;
  tier: AnimalTier;        // determines particle color / scale
  scoreGained: number;     // shown as floating text
}

// What Presentation requires from GameCore (inbound contract)
export interface IGameEventSource {
  onMerge(callback: (result: MergeResult) => void): void;
  onGameOver(callback: (finalScore: number) => void): void;
  onScoreChanged(callback: (score: number) => void): void;
}
```

---

### Module 3: PlatformBridge

**Responsibility:** The handshake with Yandex Games (or any future platform). Ads, leaderboard, cloud save, pause/resume signals. Isolated behind an interface so the game never knows if it's running on Yandex, locally, or a future platform.

**Core Concepts:**
- `AdSlot` — a type of ad placement (interstitial | rewarded | banner)
- `AdRequest` — the act of asking the platform to show an ad
- `AdOutcome` — whether the ad was watched (rewarded), dismissed, or errored
- `PlatformStorage` — where highscore persists (localStorage in mock, Yandex cloud in prod)
- `GameplaySignal` — `start` / `stop` notifications the platform requires

**Ubiquitous Language:**
- **Interstitial:** ad shown automatically after game over (platform-initiated, time-constrained)
- **Rewarded:** ad player chose to watch in exchange for a continue (player-initiated, unlimited)
- **Banner:** persistent ad outside the game canvas
- **Mock:** local substitute that makes the game run without platform SDK

**Subdomain Type:** Generic (Yandex is a vendor; the interface pattern here is reusable across all HTML5 game platforms)

**TypeScript Interfaces:**

```typescript
// src/sdk/types.ts

export type AdType = 'interstitial' | 'rewarded' | 'banner';

export interface AdOutcome {
  type: AdType;
  watched: boolean;   // false = dismissed early or error
  error?: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  isCurrentPlayer: boolean;
}

// THE interface — all platform adapters implement this
export interface IPlatformBridge {
  // Lifecycle
  init(): Promise<void>;
  signalGameplayStart(): void;
  signalGameplayStop(): void;

  // Ads
  showInterstitial(onComplete: (outcome: AdOutcome) => void): void;
  showRewarded(onComplete: (outcome: AdOutcome) => void): void;
  showBanner(): void;
  hideBanner(): void;
  pauseAudio(): void;   // required before any ad

  // Storage
  saveHighScore(score: number): Promise<void>;
  loadHighScore(): Promise<number>;

  // Leaderboard (optional)
  submitScore(score: number): Promise<void>;
  getLeaderboard(): Promise<LeaderboardEntry[]>;

  // Platform events
  onPause(callback: () => void): void;
  onResume(callback: () => void): void;
}

// Yandex production implementation
// export class YandexBridge implements IPlatformBridge { ... }

// Local development mock — zero network, deterministic
// export class MockBridge implements IPlatformBridge { ... }
```

**Anti-Corruption Layer:** `GameScene` never calls `YaGames` directly. It calls `IPlatformBridge`. The `YandexBridge` adapter translates between the Yandex SDK's language ("game_api_pause", "ysdk.adv.showInterstitialAdv") and the game's language ("onPause", "showInterstitial"). This is the ACL pattern.

---

### Module 4: GameConfig

**Responsibility:** Single source of truth for all tunable parameters. No logic, no behavior — pure data. Changing a value here changes game feel everywhere.

**Core Concepts:**
- `AnimalChain` — the 8-tier progression with radii and scores
- `PhysicsParams` — gravity, restitution, friction coefficients
- `AdPolicy` — minimum time before first interstitial, cooldown between ads
- `LayoutParams` — container dimensions, drop zone height, game over line

**Subdomain Type:** Generic (configuration pattern is reusable; specific values are game-specific)

```typescript
// src/config/GameConfig.ts

export interface AnimalTierConfig {
  tier: AnimalTier;
  name: string;         // "Hamster", "Rabbit", etc.
  textureKey: string;   // Phaser asset key
  radius: number;       // physics circle radius in pixels
  scoreOnMerge: number; // points awarded when this tier is created by merge
}

export interface PhysicsConfig {
  gravity: number;          // 1.5 recommended for satisfying drop feel
  restitution: number;      // 0.3 — slight bounce, not bouncy toy
  friction: number;         // 0.1
  frictionAir: number;      // 0.01
  sleepEnabled: boolean;    // true — important for performance with many bodies
}

export interface AdPolicyConfig {
  minSessionSecondsBefore firstInterstitial: number;  // 60
  interstitialCooldownSeconds: number;                // 180
}

export interface GameConfig {
  animalChain: AnimalTierConfig[];   // index 0 = tier 1
  physics: PhysicsConfig;
  adPolicy: AdPolicyConfig;
  containerWidth: number;
  containerHeight: number;
  gameOverLineY: number;             // Y position of death line
  dropLineY: number;                 // Y position where animal spawns
}
```

---

### Context Map

```
         [GameConfig]
              |
          (read-only)
              |
         [GameCore] ──── emits events ────> [Presentation]
              |                                    |
         (signals)                           (triggers)
              |                                    |
         [PlatformBridge] <─── calls ─────────────┘
              |
         [YandexBridge] (production)
         [MockBridge]   (local dev)
```

**Relationships:**

- **GameConfig → GameCore:** Read-only data feed. GameCore reads config at init, never writes back. No ACL needed — pure data, no linguistic mismatch.

- **GameCore → Presentation:** Event-driven (domain events pattern). Presentation subscribes to `onMerge`, `onGameOver`, `onScoreChanged`. Presentation never calls back into GameCore. Unidirectional — clean boundary.

- **Presentation → PlatformBridge:** Customer-Supplier. Presentation is the customer that requests ads and score saves. PlatformBridge is the supplier. The IPlatformBridge interface is the Published Language — stable contract regardless of which platform adapter is plugged in.

- **Game → YandexBridge / MockBridge:** Conformist (game conforms to the IPlatformBridge contract) + Anti-Corruption Layer (YandexBridge translates Yandex's own vocabulary into game vocabulary). The game never becomes Conformist to Yandex directly.

---

### Domain Events

| Event | Source Module | Triggered By | Consumed By |
|-------|--------------|--------------|-------------|
| `AnimalDropped` | GameCore | Player releases animal | Presentation (drop sound) |
| `MergeDetected` | GameCore | Collision between same-tier bodies | GameCore (spawn new animal), Presentation (merge effect) |
| `ScoreChanged` | GameCore | MergeDetected → score calculation | Presentation (score display update) |
| `GameOver` | GameCore | Animal detected above game-over line | Presentation (game over screen), PlatformBridge (interstitial ad, gameplay stop signal) |
| `ContinueRequested` | Presentation | Player taps "Continue" button | PlatformBridge (rewarded ad request) |
| `AdCompleted` | PlatformBridge | Rewarded ad watched | GameCore (clear top animal, resume session) |
| `PlatformPaused` | PlatformBridge | Yandex sends pause signal (tab switch) | GameCore (freeze physics), Presentation (pause overlay) |
| `HighScoreSaved` | PlatformBridge | GameOver + score > highScore | — (side effect only) |

---

### Aggregate Design

**GameCore Aggregates:**

- **GameSession** (Aggregate Root)
  - Entities: `Animal[]` (each with unique id, tier, physics state)
  - Value Objects: `Score` (immutable sum), `AnimalTier` (1-8 enum), `SessionStatus`
  - Invariants:
    - No Animal can merge while `isMerging = true` (prevents double-consume)
    - Score can only increase, never decrease
    - `status === 'ended'` is terminal — no further drops allowed
    - Maximum one Drop in-flight at a time (prevents rapid-fire dropping)
  - Boundary Reason: Score, animals, and session status must remain consistent together. If an animal merges, score must update atomically. These cannot be separated without risking inconsistent state (e.g., animal destroyed but score not updated).

- **DropQueue** (small aggregate)
  - Entities: `currentAnimal`, `nextAnimal`
  - Value Objects: `AnimalTier` for both slots
  - Invariants: `nextAnimal` must always be pre-generated (tier 1-5 only, weighted random)
  - Boundary Reason: The "what comes next" display is a self-contained concern; it reads from config (tier probabilities) and writes to GameSession only when a drop occurs.

---

### Game State Machine Design (AQ-2)

The state machine governs `GameSession.status` and Phaser scene transitions.

```
                    ┌──────────────┐
                    │    LOADING   │ (PreloadScene)
                    └──────┬───────┘
                           │ assets_ready
                    ┌──────▼───────┐
              ┌────►│     MENU     │ (MenuScene)
              │     └──────┬───────┘
              │            │ play_pressed
              │     ┌──────▼───────┐
              │     │   PLAYING    │ (GameScene)
              │     └──────┬───────┘
              │            │ overflow_detected
              │     ┌──────▼───────┐
              │     │  GAME_OVER   │ (GameOverScene overlay)
              │     └──────┬───────┘
              │            │
              │      ┌─────┴──────┐
              │      │            │
              │  no_ad_shown  ad_available
              │      │            │
              │      │     ┌──────▼──────┐
              │      │     │  AD_PLAYING │ (PlatformBridge handles)
              │      │     └──────┬──────┘
              │      │            │ ad_complete
              │      └────►┌──────▼──────┐
              │             │  RESULTS   │ (score shown, continue button)
              │             └──────┬──────┘
              └────────────────────┘ play_again_pressed
```

**State Transition Table:**

| Current State | Event | Next State | Actions |
|---------------|-------|------------|---------|
| LOADING | `assets_ready` | MENU | Show MenuScene |
| MENU | `play_pressed` | PLAYING | Launch GameScene, `signalGameplayStart()` |
| PLAYING | `overflow_detected` | GAME_OVER | Freeze physics, `signalGameplayStop()`, check ad policy |
| GAME_OVER | `ad_policy_satisfied` | AD_PLAYING | `pauseAudio()`, `showInterstitial()` |
| GAME_OVER | `ad_policy_not_satisfied` | RESULTS | Show results overlay immediately |
| AD_PLAYING | `ad_complete` | RESULTS | `resumeAudio()`, show results |
| RESULTS | `continue_pressed` (rewarded) | AD_PLAYING (rewarded) | `showRewarded()` |
| RESULTS (rewarded ad complete) | `ad_complete` | PLAYING | Remove top animal, resume |
| RESULTS | `play_again_pressed` | PLAYING | Reset GameSession, `signalGameplayStart()` |
| RESULTS | `menu_pressed` | MENU | Return to MenuScene |
| PLAYING | `platform_pause` | PLAYING (frozen) | Pause physics, show overlay |
| PLAYING (frozen) | `platform_resume` | PLAYING | Resume physics |

**Implementation Recommendation:** Use Phaser's scene manager with `launch`, `stop`, `pause`, `resume` methods. GameScene stays alive during GameOver overlay (preserves physics state for the "continue" path). GameOverScene launches as an overlay on top.

---

### Merge Detection Algorithm Design (AQ-5)

This is the most technically nuanced boundary. The business rule is: "two same-tier animals touch → they become one animal of the next tier."

**Problem:** Matter.js fires `collisionstart` on every tick. Two colliding bodies can trigger multiple collision events before the merge animation completes. Without guards, one merge produces 3-4 merge events.

**Solution — Merge Guard Pattern:**

```typescript
// src/core/MergeSystem.ts

interface MergeCandidate {
  animalA: Animal;
  animalB: Animal;
}

class MergeSystem {
  private mergingIds: Set<string> = new Set();

  // Called from Matter.js collisionstart event
  evaluateCollision(bodyA: MatterBody, bodyB: MatterBody): MergeResult | null {
    const animalA = this.resolveAnimal(bodyA);
    const animalB = this.resolveAnimal(bodyB);

    // Guard 1: Both must be Animals (not walls/floor)
    if (!animalA || !animalB) return null;

    // Guard 2: Same tier required
    if (animalA.tier !== animalB.tier) return null;

    // Guard 3: Neither already in a merge (prevents double-consume)
    if (this.mergingIds.has(animalA.id) || this.mergingIds.has(animalB.id)) return null;

    // Guard 4: Maximum tier — Bear (tier 8) cannot merge further
    if (animalA.tier === 8) return null;

    // Guard 5: Animal must have settled (prevents instant mid-air merges)
    if (!animalA.isSettled || !animalB.isSettled) return null;

    // Lock both animals against further merges
    this.mergingIds.add(animalA.id);
    this.mergingIds.add(animalB.id);

    return this.executeMerge(animalA, animalB);
  }

  private executeMerge(a: Animal, b: Animal): MergeResult {
    const spawnX = (a.x + b.x) / 2;
    const spawnY = (a.y + b.y) / 2;
    const newTier = (a.tier + 1) as AnimalTier;

    // Spawn happens after brief delay (0.2s) to allow animation
    // Removal of mergingIds guard happens after spawn
    return {
      destroyedIds: [a.id, b.id],
      spawnedAnimal: { id: generateId(), tier: newTier, x: spawnX, y: spawnY, isMerging: false, isSettled: false },
      scoreGained: GAME_CONFIG.animalChain[newTier - 1].scoreOnMerge
    };
  }

  releaseMergeGuard(id: string): void {
    this.mergingIds.delete(id);
  }
}
```

**Settled state note:** An animal is considered "settled" after its velocity magnitude drops below threshold (~0.5 px/tick) OR after 1.5 seconds from spawn. This prevents immediate mid-air merges that look wrong to the player.

**Chain merge handling:** After spawning a new animal, it enters the world as a normal physics body. If it happens to land on another same-tier animal, the MergeSystem will catch that collision naturally — no special chain logic needed. Chain merges are emergent, not explicitly programmed.

---

## Cross-Cutting Implications

### For Data Architecture

- **GameSession is the unit of data.** Score, animal states, timing — all scoped to one session. No cross-session data except `highScore`.
- **highScore** persists to `IPlatformBridge.saveHighScore()` which may write to localStorage (mock) or Yandex cloud storage (prod). The data schema is just `{ highScore: number }` — deliberately minimal.
- **Animal state is ephemeral.** Never persisted mid-session. If page refreshes, game starts over. This is correct for this genre.
- **Config is read-only at runtime.** Load once, never mutate. Treat as immutable constants.

### For API Design (Scene Communication)

- Scenes communicate via Phaser's EventEmitter (`this.events.emit`), not direct method calls.
- GameScene emits `GAME_OVER` event with final score — GameOverScene listens.
- No scene directly imports another scene's class — only event names (Published Language).
- `IPlatformBridge` is passed to scenes via Phaser's `data` system at scene launch, not imported as singleton. This enables testing with MockBridge.

```typescript
// Launching GameScene with bridge injected
this.scene.start('GameScene', { bridge: this.bridge, config: GAME_CONFIG });

// In GameScene.create():
const { bridge, config } = this.scene.settings.data as GameSceneData;
```

### For Agent Architecture (LLM-maintained code)

- Each module lives in its own directory with an `index.ts` barrel export.
- Max 400 LOC per file (per project rules). MergeSystem, Animal, GameSession — each separate file.
- TypeScript interfaces defined in `types.ts` per module — the LLM reads these as the contract.
- Self-documenting via Module Headers (per project protocol):

```typescript
/**
 * Module: MergeSystem
 * Role: Detects valid merge collisions and executes merge logic
 * Uses: GameConfig (tier data, score values), Animal (state read/write)
 * Used by: GameScene (subscribes to Matter.js collisionstart)
 * Glossary: ai/glossary/gamecore.md
 */
```

### For Operations (Game 2 Reusability — AQ-7)

**Generic (reuse in Game 2 unchanged):**
- `IPlatformBridge` interface + `MockBridge` implementation
- `YandexBridge` implementation
- `AdPolicyConfig` shape
- State machine transition table pattern (change values, not structure)
- Scene communication via events pattern

**Game-specific (replace for Game 2):**
- `AnimalTierConfig[]` — replace 8 animals with whatever Game 2 uses
- `MergeSystem` merge logic — if Game 2 has different merge rules
- `PhysicsConfig` values — tuned per game feel
- All Presentation assets (sprites, sounds, particles)

**Portfolio boilerplate target:**
```
game-boilerplate/
  src/
    sdk/
      IPlatformBridge.ts     ← GENERIC
      MockBridge.ts          ← GENERIC
      YandexBridge.ts        ← GENERIC
    config/
      GameConfig.ts          ← interface GENERIC, values SPECIFIC
  docs/
    state-machine-template.md
    merge-guard-pattern.md
```

---

## Concerns & Recommendations

### Critical Issues

- **Missing: isSettled guard in sgbj/suika-clone reference** — The reference implementation does not have a "settled" state check before merge. This causes phantom merges when two animals of the same tier are dropped simultaneously and collide mid-air before hitting the pile. Impact: game-breaking edge case, confusing to players.
  - **Fix:** Implement `isSettled: boolean` on AnimalState. Set to true after velocity drops below threshold for 3 consecutive frames. Only merge when both animals are settled.
  - **Rationale:** In Suika Game (original), this is handled by the physics engine's sleep mode. Phaser's Matter.js `enableSleep: true` helps but is not sufficient alone.

- **Missing: Ad policy enforcement at module boundary** — If ad timing logic lives inside GameScene, it becomes impossible to test and impossible to reuse. "Don't show ads before 60 seconds" is a business rule, not a presentation detail.
  - **Fix:** `AdPolicyConfig` lives in GameConfig. `PlatformBridge` (or a thin `AdPolicyEnforcer` wrapper) checks the policy before each `showInterstitial()` call. GameScene just calls `bridge.showInterstitial()` — policy is transparent.
  - **Rationale:** This boundary follows the linguistic test — "ad policy" belongs to the platform handshake vocabulary, not to "what the player sees."

- **SDK init must block Phaser init** — Business Blueprint pitfall #1. If Phaser starts before `YaGames.init()` resolves, SDK state is undefined and ad calls will silently fail.
  - **Fix:** `main.ts` structure:
    ```typescript
    const bridge = await createBridge();  // resolves to YandexBridge or MockBridge
    await bridge.init();
    const game = new Phaser.Game({ ...config, scene: [PreloadScene, MenuScene, GameScene] });
    game.registry.set('bridge', bridge);
    ```
  - **Rationale:** This is the ACL at the entry point. The game world cannot start until the platform world is ready.

### Important Considerations

- **Phaser Scenes vs single-scene state machine** — For this game, multiple scenes (PreloadScene, MenuScene, GameScene, GameOverScene) are correct. They map cleanly to the state machine states. Do NOT use a single GameScene with internal state flags — that conflates Presentation states with GameCore session states.
  - **Recommendation:** GameOverScene launches as overlay (`this.scene.launch('GameOverScene')`), keeping GameScene alive for the "continue" path.

- **Matter.js body labels for merge detection** — Every Animal body must have `label: 'animal'` set at creation. Wall and floor bodies get `label: 'boundary'`. MergeSystem filters on label before checking tier. Without this, collision events include wall-animal collisions which will NullPointerException when trying to read `.tier`.

- **Collision categories for dropping animal** — The animal being dropped (before player releases) must NOT collide with other animals (only with walls). Use Matter.js collision categories: `DROPPING_CATEGORY` collides only with `BOUNDARY_CATEGORY`. On release, switch to `ANIMAL_CATEGORY`. This prevents jitter on the drop preview.

### Questions for Clarification

- Does the "Continue" rewarded ad restore full game state (all animals kept, only top animal removed) or does it restart with a score bonus? Business answer needed before implementing AdCompleted → GameCore transition.
- Is the game over line checked on every physics tick (potentially expensive with 50+ bodies) or only when an animal comes to rest? The "settled" detection timing matters here.
- For Game 2 reusability — is the 8-tier chain a generic pattern we extract, or is Game 2 potentially a different genre entirely? If different genre, the merge boilerplate is irrelevant and only the SDK adapter is worth extracting.

---

## References

- [Eric Evans — Domain-Driven Design: Tackling Complexity in the Heart of Software](https://www.domainlanguage.com/ddd/)
- [sgbj/suika-clone — reference Phaser + Matter.js structure](https://github.com/sgbj/suika-clone)
- [Phaser Matter Collision Plugin — per-object collision API](https://mikewesthad.github.io/phaser-matter-collision-plugin/docs/index.html)
- [Playgama Bridge — IPlatformBridge pattern in production](https://github.com/playgama/bridge)
- [Modular Game Worlds in Phaser 3 — Matter collision deep dive](https://itnext.io/modular-game-worlds-in-phaser-3-tilemaps-5-matter-physics-platformer-d14d1f614557)
- [State Machine for Video Game Menus — FSM implementation](https://code-notes.casantosmu.com/patterns/finite-state-machines/)
- [Phaser Collision Components API](https://docs.phaser.io/api-documentation/namespace/physics-matter-components-collision)
- [DI in Phaser 3 with SOLID principles](https://dev.to/belka/the-power-of-dependency-injection-in-phaser-3-building-a-modular-game-with-solid-principles-5251)
