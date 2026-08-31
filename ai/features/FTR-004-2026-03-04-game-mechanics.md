# Feature: [FTR-004] Core Game Mechanics
**Status:** done | **Priority:** P0 | **Date:** 2026-03-04

## Why
This is the game itself — input handling, animal spawning, merge detection, and scoring. The core loop: tap → drop → physics → collision → merge → score → repeat. Without this, there's no gameplay.

## Context
Depends on FTR-001 (config), FTR-003 (Animal + PhysicsManager). These 4 managers are created by GameScene (FTR-005) and wired via Phaser events.

---

## Scope
**In scope:** InputHandler.ts, AnimalSpawner.ts, MergeDetector.ts, ScoreManager.ts
**Out of scope:** Scene orchestration (FTR-005), SDK calls (FTR-002), UI (FTR-005)

---

## Blueprint Reference

**Domain:** game/
**Cross-cutting:** 5-guard merge pattern (invariant), error handling (never throw), event constants from GameEvents.ts, score formula `tier * (tier + 1)`, localStorage persistence schema
**Data model:** MergeResult, PersistedData, GamePhase

---

## Allowed Files
**New files allowed:**
1. `src/game/InputHandler.ts` — mouse/touch → drop position
2. `src/game/AnimalSpawner.ts` — create/destroy Animal, next-drop preview
3. `src/game/MergeDetector.ts` — collision → merge event (5-guard)
4. `src/game/ScoreManager.ts` — score + highscore + localStorage

**FORBIDDEN:** All other files.

---

## Environment

nodejs: false
docker: false
database: false

---

## Design

### InputHandler.ts (~80 LOC)

```typescript
/**
 * Module: InputHandler
 * Role: Converts mouse/touch input to drop requests with x position
 * Uses: config/GameConfig (GAME), config/GameEvents (EVENTS)
 * Used by: scenes/GameScene (creates and enables/disables)
 * Emits: EVENTS.DROP_REQUESTED { x: number }
 * Does NOT: Create animals, manage cooldown timer (GameScene does)
 */
```

- Listen to `pointerdown` on scene
- Clamp x to container bounds (wall thickness to width - wall thickness)
- Emit `EVENTS.DROP_REQUESTED` with clamped x
- `enable()` / `disable()` for game state control (disabled during cooldown, game over, ads)

### AnimalSpawner.ts (~100 LOC)

```typescript
/**
 * Module: AnimalSpawner
 * Role: Creates and destroys Animal instances, manages next-drop preview
 * Uses: config/GameConfig (ANIMALS, GAME), objects/Animal, game/PhysicsManager
 * Used by: scenes/GameScene (creates, calls spawn methods)
 * Emits: EVENTS.ANIMAL_DROPPED { animal: Animal }
 * Does NOT: Handle input, detect merges, calculate score
 */
```

- `spawnAtDrop(x)`: create Animal at (x, GAME_OVER_LINE_Y + offset) with random tier 1-SPAWN_MAX_TIER
- `spawnAtMerge(x, y, tier)`: create Animal at merge position with specific tier
- `destroy(animal)`: remove from scene + physics world
- `peekNextTier()`: return pre-rolled next tier for preview display
- Internal: pre-roll next drop tier on init and after each drop

### MergeDetector.ts (~120 LOC)

```typescript
/**
 * Module: MergeDetector
 * Role: Listens for Matter.js collisions, validates merge conditions, emits merge events
 * Uses: config/GameConfig (ANIMALS), config/GameEvents (EVENTS), objects/Animal
 * Used by: scenes/GameScene (creates and wires)
 * Emits: EVENTS.ANIMAL_MERGED { MergeResult }
 * Does NOT: Create or destroy Animals, calculate score, handle input
 */
```

**5-Guard Pattern (INVARIANT — most critical code in the game):**
1. Both bodies are Animals (not walls) — check `label === 'animal'`
2. Both have the same tier
3. Neither has `isMerging === true`
4. Neither tier is 8 (Bear, final)
5. Both have `isSettled === true`

**Merge execution:**
1. Set `isMerging = true` on BOTH animals FIRST
2. Calculate midpoint position
3. Emit `EVENTS.ANIMAL_MERGED` with MergeResult payload
4. Caller (GameScene) handles spawn of new animal + destroy of old ones

```typescript
export interface MergeResult {
  removedA: Animal;
  removedB: Animal;
  newTier: number;
  mergeX: number;
  mergeY: number;
  scoreAwarded: number;
  isFinalTier: boolean;
}
```

### ScoreManager.ts (~80 LOC)

```typescript
/**
 * Module: ScoreManager
 * Role: Manages score accumulation, highscore persistence to localStorage
 * Uses: config/GameConfig (STORAGE_KEY, PersistedData, DEFAULT_DATA)
 * Used by: scenes/GameScene (creates, calls addScore)
 * Emits: EVENTS.SCORE_UPDATED { score: number, best: number }
 * Does NOT: Display score UI, call SDK, detect merges
 */
```

- `addScore(points)`: increment score, check if new best, emit EVENTS.SCORE_UPDATED
- `getScore()`, `getBestScore()`: getters
- `checkAndSaveBest()`: if current > best → save to localStorage, return true
- `reset()`: reset current score to 0 for new game
- `loadData()` / `saveData()`: localStorage with validation and migration (from blueprint)

---

## Implementation Plan

### Task 1: Create ScoreManager.ts
**Type:** code
**Files:**
  - create: `src/game/ScoreManager.ts`
**Acceptance:** Score math correct, localStorage load/save/migrate work, events emit

### Task 2: Create InputHandler.ts
**Type:** code
**Files:**
  - create: `src/game/InputHandler.ts`
**Acceptance:** Pointer events captured, x clamped to container bounds, event emitted

### Task 3: Create AnimalSpawner.ts
**Type:** code
**Files:**
  - create: `src/game/AnimalSpawner.ts`
**Acceptance:** Animals spawn at correct position, destroy removes from world, next tier pre-rolled

### Task 4: Create MergeDetector.ts
**Type:** code
**Files:**
  - create: `src/game/MergeDetector.ts`
**Acceptance:** All 5 guards enforced, isMerging set before emit, MergeResult payload correct

### Execution Order
1 → 2 → 3 → 4

---

## Tests

### What to test
- [ ] ScoreManager: addScore(12) → getScore() === 12
- [ ] ScoreManager: score 100, best was 50 → checkAndSaveBest() returns true, best now 100
- [ ] ScoreManager: loadData() with corrupted localStorage returns DEFAULT_DATA
- [ ] ScoreManager: loadData() with valid JSON returns parsed data
- [ ] ScoreManager: saveData() writes to localStorage under STORAGE_KEY
- [ ] MergeDetector: shouldMerge returns false when tiers differ
- [ ] MergeDetector: shouldMerge returns false when either isMerging=true
- [ ] MergeDetector: shouldMerge returns false for tier 8 (Bear)
- [ ] MergeDetector: shouldMerge returns false when either not settled
- [ ] MergeDetector: shouldMerge returns true when all 5 guards pass
- [ ] AnimalSpawner: spawnAtDrop creates animal with tier 1-5 only
- [ ] InputHandler: x position clamped within container bounds

### How to test
- Unit: ScoreManager (localStorage mock), MergeDetector (5-guard), AnimalSpawner (tier range)
- Integration: Not needed — wiring tested in FTR-005

### TDD Order
1. ScoreManager tests → implement
2. MergeDetector 5-guard tests → implement
3. InputHandler + AnimalSpawner tests → implement

---

## Definition of Done

### Functional
- [ ] All 4 manager classes created and compile
- [ ] 5-guard merge detection validates correctly
- [ ] Score persists to localStorage
- [ ] Corrupted localStorage gracefully degrades

### Tests
- [ ] ScoreManager: 5+ test cases pass
- [ ] MergeDetector: 5 guard tests pass
- [ ] AnimalSpawner: tier range test passes

### Technical
- [ ] `npx tsc --noEmit` passes
- [ ] Module headers on all 4 files (>80 LOC)
- [ ] No imports from scenes/ or sdk/
- [ ] Event names from GameEvents.ts only (no string literals)

---

## Autopilot Log
