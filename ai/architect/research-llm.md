# LLM Systems Architecture Research — Zverata (Зверята)

**Researcher:** Erik (LLM Architect lens)
**Phase:** 1 — Individual Research
**Date:** 2026-03-04
**Focus:** How to structure this codebase so Claude Code can work on it effectively

---

## Kill Question (Applied to This Project)

**"Can Claude Code modify the merge logic without reading the physics file?"**

If the answer is "no, they're tangled," the architecture is not LLM-ready.

Every architectural decision in this research is measured against this question.

---

## Core Insight: Claude Code IS the Runtime

This project has no LLM in production. But LLM is the PRIMARY developer.

That flips the usual tradeoffs:
- **Human readability** matters less than **agent readability**
- **Clever abstractions** hurt more than in human-written code (agents can't grep-and-infer intent)
- **Consistency** matters more than **optimality** (agents pattern-match, inconsistency breaks patterns)
- **Explicit over implicit** — agents don't "know" your conventions unless they're written down

The architecture must be optimized for a developer who:
1. Has a 200K token context window
2. Reads 5-15 files per task
3. Forgets everything between sessions
4. Excels at pattern matching, fails at convention inference

---

## Research Finding #1: File Size is the Atomic Unit of Agent Work

### The Problem

When Claude Code works on a task, it reads files into context. Each file costs tokens. An agent working on "fix merge animation" shouldn't need to read 800 LOC of GameScene to find the 20 LOC that matter.

### Phaser 3 Anti-Pattern (Common in GitHub repos)

```
GameScene.ts  ← 1200 LOC, everything in one class
  - physics setup
  - input handling
  - merge detection
  - scoring
  - UI updates
  - animation callbacks
  - game over logic
  - SDK calls
```

This is a **context budget bomb**. To fix one bug, agent reads 1200 LOC.

### LLM-Ready Pattern

```
GameScene.ts          ← 150 LOC (orchestrator only, no business logic)
PhysicsManager.ts     ← 200 LOC (Matter.js setup, wall creation, gravity)
MergeDetector.ts      ← 150 LOC (collision events, debounce, tier matching)
ScoreManager.ts       ← 100 LOC (points, highscore, persistence)
AnimationManager.ts   ← 150 LOC (tweens, particles, merge effect)
InputHandler.ts       ← 100 LOC (drop on click/touch, position calculation)
UIManager.ts          ← 150 LOC (score display, game over screen, buttons)
```

Each file = one concern = one context read.
Agent can fix merge animation by reading ONLY AnimationManager.ts (150 LOC).

**Rule:** Max 400 LOC per file. Target 150-250 LOC for manager classes.

---

## Research Finding #2: The Module Header Protocol

### Problem

Agents start each task with zero memory. They need to orient before they can contribute. Without orientation, they make wrong assumptions about what a file does.

### Solution: Mandatory Module Headers

Every significant TypeScript file starts with a comment block:

```typescript
/**
 * Module: MergeDetector
 * Role: Detects same-tier collisions between Animal objects and triggers merge events
 * Uses: PhysicsManager (collision events), Animal (tier property), GameConfig (TIER_COUNT)
 * Used by: GameScene (subscribes to 'merge' events)
 * Emits: 'merge' event with { animalA: Animal, animalB: Animal, newTier: number }
 * Does NOT: Create animals, update score, play animations (delegates to caller)
 */
```

This is ~200 tokens. An agent reading this header knows:
- What this module does
- What it imports
- Who imports it
- What events it emits
- What it explicitly does NOT do (prevents scope creep)

**Rule:** Every file > 100 LOC gets a module header. Non-negotiable.

---

## Research Finding #3: Config-First Design

### Why This Matters for LLM Development

The #1 maintenance task in game development is tuning. Gravity feels too fast. Merge score needs adjustment. Physics bounce feels wrong.

If tuning parameters are buried in logic files, every tune session requires:
1. Find the constant (grep, or read whole file)
2. Understand context (why this value?)
3. Change value
4. Test
5. Risk: agent accidentally changes logic near the constant

### Proposed: Single Source of Truth Config

```typescript
// src/config/GameConfig.ts
// ALL tunable parameters live here. ONLY here.
// When Claude Code tunes game feel, it reads ONLY this file.

export const PHYSICS = {
  GRAVITY_Y: 1.5,          // Higher = faster fall. Range: 0.5-3.0
  RESTITUTION: 0.3,        // Bounciness 0-1. 0.3 = slight bounce, not chaotic
  FRICTION: 0.1,           // Surface friction. Lower = more sliding
  FRICTION_AIR: 0.01,      // Air resistance. Keep low for natural fall
  WALL_THICKNESS: 50,      // Invisible walls. Must be > largest animal radius
} as const;

export const ANIMALS = [
  { tier: 1, name: 'hamster',  radius: 25,  score: 1,   key: 'hamster'  },
  { tier: 2, name: 'rabbit',   radius: 35,  score: 3,   key: 'rabbit'   },
  { tier: 3, name: 'kitten',   radius: 48,  score: 6,   key: 'kitten'   },
  { tier: 4, name: 'cat',      radius: 60,  score: 10,  key: 'cat'      },
  { tier: 5, name: 'dog',      radius: 72,  score: 15,  key: 'dog'      },
  { tier: 6, name: 'fox',      radius: 85,  score: 21,  key: 'fox'      },
  { tier: 7, name: 'panda',    radius: 100, score: 28,  key: 'panda'    },
  { tier: 8, name: 'bear',     radius: 118, score: 36,  key: 'bear'     },
] as const;

export const GAME = {
  CANVAS_WIDTH: 480,
  CANVAS_HEIGHT: 640,
  DROP_ZONE_Y: 80,          // Y position where animals are dropped
  GAME_OVER_LINE_Y: 120,    // Y position where game ends if animal crosses
  DROP_COOLDOWN_MS: 500,    // Prevent rapid-fire drops
  MIN_TIER_TO_SPAWN: 1,     // Minimum tier that can be spawned (next drop)
  MAX_TIER_TO_SPAWN: 3,     // Maximum tier that can be spawned (keep it fair)
} as const;

export const ANIMATIONS = {
  MERGE_SCALE_PEAK: 1.4,    // Max scale during merge pop (1.4 = 40% bigger)
  MERGE_DURATION_MS: 200,   // Total merge animation duration
  MERGE_PARTICLES: 8,       // Number of particles emitted on merge
  DROP_INDICATOR_ALPHA: 0.6, // Transparency of drop line indicator
} as const;

export const ADS = {
  MIN_SESSION_BEFORE_INTERSTITIAL_MS: 60_000,  // 60 seconds
  INTERSTITIAL_COOLDOWN_MS: 180_000,           // 3 minutes between interstitials
} as const;
```

**Result:** When Oleg says "gravity feels too fast" or Kamil says "I want bigger animals," Claude Code reads ONE file and changes ONE number. No logic touched.

---

## Research Finding #4: TypeScript as LLM Documentation

### Problem

Agents infer behavior from type signatures. Weak types = wrong inferences.

### Anti-pattern

```typescript
function createAnimal(scene: any, x: number, y: number, type: number): any
```

Agent cannot infer: what is `type`? What does it return? What properties does the result have?

### LLM-Ready Pattern

```typescript
// Types are documentation. Every interface is a contract the agent can read.

export type Tier = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface AnimalConfig {
  readonly tier: Tier;
  readonly name: string;   // 'hamster', 'rabbit', etc.
  readonly radius: number; // physics circle radius in pixels
  readonly score: number;  // points awarded when this tier is CREATED by merge
  readonly key: string;    // Phaser texture key
}

export interface Animal extends Phaser.GameObjects.Container {
  readonly tier: Tier;
  readonly config: AnimalConfig;
  body: MatterJS.BodyType;  // Matter.js physics body
  isMarkedForMerge: boolean; // Prevents double-merge in same physics step
}

export interface MergeEvent {
  animalA: Animal;
  animalB: Animal;
  newTier: Tier;           // tier after merge (animalA.tier + 1)
  mergeX: number;          // X position for new animal (midpoint)
  mergeY: number;          // Y position for new animal (midpoint)
}

export interface GameState {
  phase: 'menu' | 'playing' | 'paused' | 'game-over' | 'ad-playing';
  score: number;
  highScore: number;
  nextTier: Tier;          // tier of the animal shown in preview
  dropCount: number;       // total animals dropped this session
  mergeCount: number;      // total merges this session
}
```

Agent reading `MergeEvent` knows exactly what the merge system produces without reading implementation. Agent writing a new system that consumes merge events gets the interface contract for free.

---

## Research Finding #5: Event-Driven Architecture for Decoupling

### Why Events Beat Direct Calls for LLM Maintenance

With direct calls:
```typescript
// MergeDetector.ts
this.animationManager.playMergeEffect(x, y);  // MergeDetector KNOWS AnimationManager exists
this.scoreManager.addScore(newTier);           // MergeDetector KNOWS ScoreManager API
this.gameScene.spawnAnimal(newTier, x, y);    // MergeDetector KNOWS GameScene API
```

Agent modifying MergeDetector must read AnimationManager, ScoreManager, AND GameScene to understand all dependencies. That's 400+ LOC of context just to understand what MergeDetector touches.

With events (Phaser's EventEmitter):
```typescript
// MergeDetector.ts — only knows about game events, not concrete systems
this.events.emit('animal:merged', mergeEvent);

// AnimationManager.ts — subscribes, independent
this.events.on('animal:merged', this.handleMerge, this);

// ScoreManager.ts — subscribes, independent
this.events.on('animal:merged', this.addMergeScore, this);
```

Agent modifying MergeDetector reads ONLY MergeDetector. Zero coupling.

### Proposed Event Catalog

```typescript
// src/config/GameEvents.ts
// Complete list of all game events. Single place to see all communication.

export const EVENTS = {
  // Physics / Game Core
  ANIMAL_DROPPED:  'animal:dropped',  // { animal: Animal, x: number }
  ANIMAL_MERGED:   'animal:merged',   // MergeEvent
  ANIMAL_SETTLED:  'animal:settled',  // { animal: Animal } (stopped moving)

  // Game State
  GAME_OVER:       'game:over',       // { score: number, highScore: number }
  GAME_RESTART:    'game:restart',    // {}
  GAME_PAUSE:      'game:pause',      // {}
  GAME_RESUME:     'game:resume',     // {}

  // Score
  SCORE_UPDATED:   'score:updated',   // { score: number, delta: number }
  HIGHSCORE_SAVED: 'score:highscore', // { highScore: number }

  // SDK / Ads
  AD_STARTED:      'ad:started',      // { type: 'interstitial' | 'rewarded' }
  AD_FINISHED:     'ad:finished',     // { type, rewarded: boolean }
  AD_ERROR:        'ad:error',        // { type, error: string }
} as const;
```

This file = complete communication map. Agent sees all system interactions in one 50-line file.

---

## Research Finding #6: Scene Architecture for Claude Code

### The Single-Scene Anti-Pattern

Many Phaser tutorials put everything in one GameScene. For Claude Code, this means any task requires reading the entire scene.

### Recommended Multi-Scene Split

```
PreloadScene.ts   (~100 LOC)
  - Load all assets
  - Progress bar
  - Transition to MenuScene

MenuScene.ts      (~120 LOC)
  - Title display
  - Best score
  - Play button → GameScene

GameScene.ts      (~150 LOC) ← ORCHESTRATOR ONLY
  - Create managers
  - Wire events
  - Handle scene transitions
  - NO business logic

HUDScene.ts       (~100 LOC) ← Runs PARALLEL to GameScene
  - Score display
  - Next animal preview
  - Separates UI from physics (important: UI updates on every frame, physics doesn't)

GameOverScene.ts  (~120 LOC)
  - Score summary
  - Rewarded video button
  - Play again button
```

**Key insight:** HUDScene runs in parallel via `this.scene.launch('HUDScene')`. This separates UI rendering from physics simulation. An agent modifying score display only touches HUDScene — never sees physics code.

### GameScene as Pure Orchestrator

```typescript
// GameScene.ts — orchestrates, never implements
export class GameScene extends Phaser.Scene {
  private physicsManager!: PhysicsManager;
  private mergeDetector!: MergeDetector;
  private animalSpawner!: AnimalSpawner;
  private scoreManager!: ScoreManager;
  private inputHandler!: InputHandler;
  private adManager!: AdManager;
  private stateManager!: GameStateManager;

  create(): void {
    this.physicsManager = new PhysicsManager(this);
    this.mergeDetector = new MergeDetector(this);
    this.animalSpawner = new AnimalSpawner(this);
    this.scoreManager = new ScoreManager(this);
    this.inputHandler = new InputHandler(this);
    this.stateManager = new GameStateManager(this);

    this.stateManager.start();  // transitions to 'playing' state

    // Launch HUD as parallel scene
    this.scene.launch('HUDScene', { events: this.events });
  }

  // GameScene DOES NOT handle merge events. MergeDetector emits, others listen.
}
```

Agent reading GameScene (150 LOC) understands the entire system topology. No business logic to parse.

---

## Research Finding #7: Naming Conventions for LLM Pattern Matching

Agents pattern-match on naming. Inconsistency breaks pattern recognition and increases the context needed to orient.

### Naming Rules

```
Files:       PascalCase, noun-focused
             AnimalSpawner.ts, MergeDetector.ts, ScoreManager.ts
             NOT: merge-logic.ts, physics.ts, game-stuff.ts

Classes:     Match filename exactly
             class AnimalSpawner extends ... { }

Events:      'domain:action' format
             'animal:merged', 'score:updated', 'game:over'
             NOT: 'MERGE', 'onGameOver', 'scoreChange'

Constants:   SCREAMING_SNAKE in GameConfig
             PHYSICS.GRAVITY_Y, GAME.CANVAS_WIDTH
             NOT: gravityY, canvasWidth, gravity_y

Methods:     Verb-first, action-oriented
             spawnAnimal(), detectMerge(), updateScore()
             NOT: animal(), merger(), score()

Interfaces:  Noun, no prefix/suffix
             Animal, MergeEvent, GameState, AnimalConfig
             NOT: IAnimal, TAnimal, AnimalInterface
```

**Why this matters:** When a new Claude Code session opens and reads `MergeDetector.ts`, it immediately knows: "This file detects merges. The class is called MergeDetector. Methods start with detect/handle. Events it emits follow the 'animal:merged' pattern."

Zero onboarding time.

---

## Research Finding #8: SDK Abstraction for Testability

### The Problem with Direct SDK Calls

```typescript
// Anti-pattern: SDK calls scattered in game logic
if (score > 100) {
  ysdk.adv.showInterstitial({ ... });  // What if ysdk is null in dev?
}
```

When Claude Code writes tests or runs in local dev, Yandex SDK doesn't exist. This makes the entire game untestable.

### Interface-First SDK Design

```typescript
// src/sdk/IGamePlatform.ts
// The ONLY interface game code knows about. No Yandex-specific code outside sdk/

export interface IGamePlatform {
  // Lifecycle
  init(): Promise<void>;
  notifyGameStart(): void;
  notifyGameStop(): void;

  // Ads
  showInterstitial(): Promise<AdResult>;
  showRewarded(): Promise<RewardedResult>;
  showBanner(): void;
  hideBanner(): void;

  // Storage
  saveData(data: Record<string, unknown>): Promise<void>;
  loadData(): Promise<Record<string, unknown>>;

  // Leaderboard (future)
  submitScore?(score: number): Promise<void>;
}

export interface AdResult {
  shown: boolean;
  error?: string;
}

export interface RewardedResult {
  rewarded: boolean;
  error?: string;
}
```

Two implementations:
- `YandexPlatform.ts` — wraps real Yandex SDK
- `MockPlatform.ts` — returns instant success, logs calls to console

```typescript
// src/sdk/MockPlatform.ts — local development
export class MockPlatform implements IGamePlatform {
  async showInterstitial(): Promise<AdResult> {
    console.log('[MockPlatform] Interstitial shown (mock)');
    return { shown: true };
  }
  // ... all methods return safe mocks
}
```

**Agent benefit:** Claude Code can write any game feature without knowing about Yandex SDK. It codes against `IGamePlatform`. Tests use `MockPlatform`. Zero SDK knowledge required.

---

## Research Finding #9: State Machine as Explicit Contract

### Why Implicit State is Agent-Hostile

```typescript
// Anti-pattern: state scattered as booleans
this.isGameOver = false;
this.isPaused = false;
this.isAdPlaying = false;
// Agent must read ALL of these to understand current state
// Agent must update ALL of them on transitions (misses one = bug)
```

### Explicit State Machine

```typescript
// src/game/GameStateManager.ts
type GamePhase = 'loading' | 'menu' | 'playing' | 'paused' | 'game-over' | 'ad';

// Valid transitions — agent can see every allowed state change
const TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  loading:   ['menu'],
  menu:      ['playing'],
  playing:   ['paused', 'game-over'],
  paused:    ['playing', 'menu'],
  'game-over': ['ad', 'menu'],
  ad:        ['menu', 'playing'],  // rewarded → back to playing
};
```

An agent reading this 10-line transition table understands the ENTIRE state machine. No guessing. If it tries to add an invalid transition, TypeScript rejects it.

---

## Research Finding #10: Testing Strategy for a Game

### What's Testable Without Running Phaser

Phaser is a rendering engine — you can't unit test rendering. But game logic is pure TypeScript.

```
TESTABLE (unit tests, no Phaser):
  - GameConfig values (sanity checks: radius increases with tier, score increases)
  - Merge tier calculation (tier 3 + tier 3 = tier 4, tier 8 + tier 8 = no merge)
  - Score calculation (merge gives correct points per tier)
  - State machine transitions (playing → game-over valid, game-over → playing invalid)
  - Ad timing rules (no interstitial before 60 seconds, no more often than 3 min)
  - MockPlatform behavior

NOT TESTABLE (manual QA + Kamil):
  - Physics feel (gravity, bounce)
  - Animation satisfaction
  - Touch response
  - Merge visual feedback
  - Performance on mobile
```

**Test structure:**

```
tests/
  unit/
    GameConfig.test.ts     -- Config sanity: tier[n].radius > tier[n-1].radius
    MergeRules.test.ts     -- Merge math, tier caps, scoring
    StateManager.test.ts   -- Valid/invalid transitions
    AdTiming.test.ts       -- 60s / 3min rules
  integration/
    (none for Week 1 — too expensive for this timeline)
```

**Rule:** Tests validate game RULES, not Phaser rendering. Kamil validates game FEEL.

---

## Research Finding #11: Reusability for Game 2

AQ-7 from the agenda: what should be generic vs game-specific from Day 1?

### Extract to Generic (game-agnostic, reusable for Game 2)

```
src/sdk/
  IGamePlatform.ts     ← generic platform interface (works for any game)
  YandexPlatform.ts    ← Yandex implementation
  MockPlatform.ts      ← dev mock

src/shared/
  EventBus.ts          ← typed event emitter wrapper (game-agnostic)
  StateManager.ts      ← generic state machine (game-agnostic)
  StorageService.ts    ← localStorage wrapper with SDK fallback
```

### Keep Game-Specific

```
src/config/
  GameConfig.ts        ← Zverata-specific constants and animal chain

src/game/
  (all game logic)     ← Zverata-specific mechanics

src/scenes/
  (all scenes)         ← Zverata-specific UI

src/objects/
  Animal.ts            ← Zverata-specific game object
```

For Game 2: copy `src/sdk/` and `src/shared/` wholesale. All reusable. Zero modification.

**Rule:** If it references animals, scores, or Zverata gameplay — it's game-specific. Otherwise it's shared.

---

## Proposed File Structure (LLM-Optimized)

```
src/
├── main.ts                    (~50 LOC)   SDK init → Phaser boot
│
├── config/
│   ├── GameConfig.ts          (~80 LOC)   ALL tuning constants with comments
│   └── GameEvents.ts          (~50 LOC)   ALL event name constants
│
├── scenes/
│   ├── PreloadScene.ts        (~100 LOC)  Asset loading only
│   ├── MenuScene.ts           (~120 LOC)  Title + play button
│   ├── GameScene.ts           (~150 LOC)  Pure orchestrator
│   ├── HUDScene.ts            (~100 LOC)  Score + preview overlay
│   └── GameOverScene.ts       (~120 LOC)  End screen + rewarded ad
│
├── game/
│   ├── PhysicsManager.ts      (~200 LOC)  Matter.js config + walls + bodies
│   ├── MergeDetector.ts       (~150 LOC)  Collision → merge event
│   ├── AnimalSpawner.ts       (~150 LOC)  Create + destroy Animal objects
│   ├── InputHandler.ts        (~100 LOC)  Mouse/touch → drop position
│   ├── ScoreManager.ts        (~100 LOC)  Score + highscore + persistence
│   ├── GameStateManager.ts    (~100 LOC)  State machine + transitions
│   └── AnimationManager.ts    (~150 LOC)  Tweens + particles + sound
│
├── objects/
│   └── Animal.ts              (~120 LOC)  Phaser Container + Matter body
│
├── sdk/
│   ├── IGamePlatform.ts       (~60 LOC)   Interface + result types
│   ├── YandexPlatform.ts      (~180 LOC)  Real SDK wrapper + 7 pitfalls
│   ├── MockPlatform.ts        (~80 LOC)   Dev mock
│   └── AdManager.ts           (~120 LOC)  Timing rules + SDK delegation
│
├── shared/
│   ├── types.ts               (~80 LOC)   All shared TypeScript interfaces
│   ├── EventBus.ts            (~60 LOC)   Typed Phaser EventEmitter wrapper
│   └── StorageService.ts      (~80 LOC)   localStorage + SDK storage
│
└── types/
    └── phaser.d.ts            (~30 LOC)   Any needed Phaser type augmentations
```

**Total:** ~2,460 LOC across 24 files. Average file: ~100 LOC.
**Max file:** PhysicsManager.ts at ~200 LOC.
**Agent reading any task:** Reads 2-4 files, ~400 LOC total. Well within context budget.

---

## Context Budget Analysis

| Task | Files Agent Reads | LOC | Tokens |
|------|-------------------|-----|--------|
| "Fix merge animation" | AnimationManager.ts + GameEvents.ts | ~200 | ~1.5K |
| "Tune physics feel" | GameConfig.ts | ~80 | ~600 |
| "Fix ad timing bug" | AdManager.ts + GameConfig.ts | ~200 | ~1.5K |
| "Add score multiplier" | ScoreManager.ts + GameEvents.ts + GameConfig.ts | ~230 | ~1.7K |
| "Debug game-over trigger" | GameStateManager.ts + MergeDetector.ts | ~250 | ~1.9K |
| "Understand full system" | GameScene.ts + GameEvents.ts + types.ts | ~280 | ~2.1K |

**Baseline context budget per task: ~2K tokens.**
That leaves 198K tokens for reasoning, code generation, and output in Opus 4.6.

Compare to the monolithic GameScene.ts pattern: reading 1200 LOC = ~9K tokens just to orient.

---

## Anti-Patterns to Enforce via Architecture Rules

Add these to `.claude/rules/architecture.md`:

```
Game-specific rules:
- PhysicsManager is the ONLY file that imports Matter.js directly
- GameConfig is the ONLY file with numeric constants for tuning
- All events MUST be defined in GameEvents.ts before use
- GameScene MUST NOT contain business logic (no merge math, no score calc)
- YandexSDK code MUST NOT appear outside src/sdk/
- Animal.ts MUST NOT contain game logic (no scoring, no merge detection)
```

---

## Kamil-Friendliness: Teaching Layer

One meta-goal: Kamil (10 years old) can understand what code does when Claude explains it.

**Design implications:**
- GameConfig.ts = show Kamil, he can change numbers and see what happens
- Animal progression chain = Kamil helped design this, the config documents his choices
- Comments explain WHY, not WHAT: `// 0.3 = slight bounce, like dropping a soft toy`
- Module headers name the responsibility: "This file decides when two animals merge"

**Teaching flow with Claude Code:**
1. Kamil: "why does the rabbit bounce so much?"
2. Claude reads GameConfig.ts (80 LOC), points to `PHYSICS.RESTITUTION: 0.3`
3. Kamil changes to 0.1, sees result
4. Kamil learns: code = instructions with numbers you can tune

This only works if config is isolated. If physics constants are buried in PhysicsManager.ts, step 2 fails.

---

## Summary: LLM-Ready Checklist for This Project

| Criterion | Target | How We Achieve It |
|-----------|--------|-------------------|
| Max file size | 400 LOC | 24 files, avg 100 LOC |
| Module headers | Every file >100 LOC | Mandatory format in rules |
| Config isolation | 1 file, all constants | GameConfig.ts is SSOT |
| Event catalog | 1 file, all events | GameEvents.ts is SSOT |
| Type coverage | 100% public APIs | types.ts + inline interfaces |
| SDK abstraction | IGamePlatform interface | No Yandex code outside sdk/ |
| State machine | Explicit transitions | GameStateManager.ts |
| Agent task budget | <2K tokens to orient | See context budget table |
| Testing | Game rules tested | Not Phaser rendering |
| Naming | Consistent conventions | Enforced in rules |

---

## Open Questions for Board Discussion

1. **HUDScene parallel vs overlay:** Running HUD as separate Phaser scene is clean but adds complexity. Alternative: simple DOM overlay for score. Which is more LLM-maintainable?

2. **Event bus scope:** Use Phaser's built-in `scene.events` or a singleton EventBus? Singleton is cleaner for cross-scene events but requires careful cleanup.

3. **AnimationManager ownership:** Animations touch specific game objects. Should AnimationManager be injected into objects (Animal plays its own merge animation) or remain external (AnimationManager knows about all objects)? External is more LLM-friendly (one place to find all animation code).

4. **StorageService sync priority:** localStorage vs Yandex SDK storage. If SDK save fails, fall back to localStorage silently? The LLM needs clear rules here to avoid inconsistent implementations.

---

## References

- Anthropic: Building Effective Agents — https://www.anthropic.com/research/building-effective-agents
- Phaser 3 TypeScript starter patterns — multiple GitHub repos (sgbj/suika-clone as reference)
- ADR-007 (from this project): Caller-writes pattern for subagent outputs
- ADR-010 (from this project): Orchestrator zero-read pattern
- Project rules: `.claude/rules/architecture.md` — file limits, import direction
- Project rules: `.claude/rules/model-capabilities.md` — effort routing, context window
