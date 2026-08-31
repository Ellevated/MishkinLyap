# Feature: [FTR-005] Scenes & Game Loop
**Status:** done | **Priority:** P0 | **Date:** 2026-03-04

## Why
This is where everything comes together. GameScene orchestrates all managers, MenuScene provides the entry point, GameOverScene handles end-of-game flow with ads. PreloadScene loads assets. Without scenes, the game has no UI and no playable loop.

## Context
Depends on FTR-001 (config), FTR-002 (SDK bridge), FTR-003 (Animal + Physics), FTR-004 (mechanics). This task wires ALL components into a playable game.

---

## Scope
**In scope:** PreloadScene.ts, MenuScene.ts, GameScene.ts (orchestrator), GameOverScene.ts
**Out of scope:** Final assets/sprites (FTR-006), build pipeline (TECH-007)

---

## Blueprint Reference

**Domain:** scenes/
**Cross-cutting:** State machine (GamePhase + TRANSITIONS), ad watchdog, audio pause/resume, no game logic in scenes
**Data model:** Scene data contracts (bridge, score, best), GamePhase state machine

---

## Allowed Files
**New files allowed:**
1. `src/scenes/PreloadScene.ts` — asset loading + progress
2. `src/scenes/MenuScene.ts` — title + highscore + play button
3. `src/scenes/GameScene.ts` — pure orchestrator
4. `src/scenes/GameOverScene.ts` — score + rewarded ad + play again (overlay)

**Modify:**
5. `src/main.ts` — add scene list to Phaser config (add imports)

**FORBIDDEN:** All other files.

---

## Environment

nodejs: false
docker: false
database: false

---

## Design

### PreloadScene.ts (~80 LOC)

```typescript
/**
 * Module: PreloadScene
 * Role: Loads all game assets, shows loading progress, transitions to Menu
 * Uses: config/GameConfig (ANIMALS for asset keys)
 * Used by: main.ts (first scene in Phaser config)
 * Does NOT: Contain game logic, call SDK
 */
```

- Load animal sprites (or placeholder colored circles for now)
- Load background, UI elements
- Show progress bar
- On complete: `this.scene.start('Menu', { bridge: this.data.get('bridge') })`

### MenuScene.ts (~100 LOC)

```typescript
/**
 * Module: MenuScene
 * Role: Title screen with play button and best score display
 * Uses: config/GameConfig (GAME), config/GameEvents (EVENTS), sdk/IGamePlatform
 * Used by: PreloadScene (transitions to), GameOverScene (return to menu)
 * Does NOT: Contain game logic, manage physics
 */
```

- Display game title "Зверята"
- Display best score from bridge.loadHighScore() (with localStorage fallback)
- Play button (large, 44px+ touch target for 55+ audience)
- On play: `this.scene.start('Game', { bridge })`
- Show sticky banner via bridge.showBanner()

### GameScene.ts (~150 LOC) — PURE ORCHESTRATOR

```typescript
/**
 * Module: GameScene
 * Role: Creates managers, wires events, manages game state machine, handles scene transitions
 * Uses: PhysicsManager, MergeDetector, AnimalSpawner, ScoreManager, InputHandler, GameConfig, GameEvents
 * Used by: MenuScene (scene.start), main.ts (scene list)
 * Emits: EVENTS.GAME_OVER (to self), game.events SCENE_GAME_OVER (cross-scene)
 * Does NOT: Detect merges, calculate score, call SDK directly, contain physics constants
 */
```

**create() method:**
1. Store bridge from scene data
2. Create all 5 managers
3. Wire events: DROP_REQUESTED → spawn + start cooldown, ANIMAL_MERGED → handle merge + score, GAME_OVER → transition
4. Call bridge.gameplayStart()
5. Set phase = 'playing'

**update() loop:**
1. Check isSettled on all animals (velocity < threshold → set flag)
2. Check game over condition (any animal body.position.y < GAME_OVER_LINE_Y for sustained time)
3. Draw game over line (visual indicator)

**State machine:**
```typescript
type GamePhase = 'menu' | 'playing' | 'frozen' | 'game-over' | 'ad';
```
- `playing`: input enabled, physics active
- `frozen`: input disabled, physics paused (during ad)
- `game-over`: input disabled, launch GameOverScene overlay

**Event handlers:**
- `onDropRequested(x)`: disable input → spawner.spawnAtDrop(x) → start cooldown → re-enable
- `onMerge(result)`: spawner.destroy(A, B) → spawner.spawnAtMerge(x, y, tier+1) → score.addScore(points)
- `onGameOver()`: bridge.gameplayStop() → score.checkAndSaveBest() → bridge.saveHighScore() → launch overlay

### GameOverScene.ts (~100 LOC) — OVERLAY

```typescript
/**
 * Module: GameOverScene
 * Role: Game over overlay — shows score, offers rewarded ad continue, play again, menu
 * Uses: config/GameConfig (ADS), sdk/IGamePlatform, config/GameEvents
 * Used by: GameScene (launches as overlay)
 * Does NOT: Manage physics, detect merges, handle game state
 */
```

- Display "Game Over" text
- Display current score and best score
- "Continue" button (rewarded ad) — calls showAdWithTimeout(bridge, 'rewarded')
  - If rewarded → close overlay, GameScene continues
  - If not → button disabled, show other options
- "Play Again" button → restart GameScene
- "Menu" button → stop GameScene, start MenuScene
- Interstitial ad (if cooldown allows) before returning to menu

**showAdWithTimeout utility** — import from shared location or define inline

---

## User Flow

1. PreloadScene: assets load → auto-transition to Menu
2. MenuScene: player sees title + best score, taps Play
3. GameScene: physics world visible, game-over line drawn, player taps to drop
4. Drop → animal falls → physics → collides → merge check → score update
5. Game over: overlay appears with score + continue/play again/menu
6. Rewarded ad → continue game OR play again → restart OR menu

---

## Flow Coverage Matrix

| # | User Flow Step | Covered by Task | Status |
|---|----------------|-----------------|--------|
| 1 | Assets load + progress | Task 1 (PreloadScene) | new |
| 2 | Title + best score | Task 2 (MenuScene) | new |
| 3 | Tap Play → game starts | Task 2 → Task 3 transition | new |
| 4 | Tap → drop animal | Task 3 (GameScene) wires InputHandler | new |
| 5 | Physics + merge + score | Task 3 (GameScene) wires managers | new |
| 6 | Game over → overlay | Task 3 → Task 4 | new |
| 7 | Rewarded ad → continue | Task 4 (GameOverScene) | new |
| 8 | Play again → restart | Task 4 (GameOverScene) | new |
| 9 | Menu → back to title | Task 4 → Task 2 | new |

---

## Implementation Plan

### Task 1: Create PreloadScene.ts
**Type:** code
**Files:**
  - create: `src/scenes/PreloadScene.ts`
**Acceptance:** Assets load (or placeholders), transitions to Menu

### Task 2: Create MenuScene.ts
**Type:** code
**Files:**
  - create: `src/scenes/MenuScene.ts`
**Acceptance:** Title displayed, play button works, best score shown

### Task 3: Create GameScene.ts
**Type:** code
**Files:**
  - create: `src/scenes/GameScene.ts`
**Acceptance:** All managers created, events wired, game loop runs, state machine works

### Task 4: Create GameOverScene.ts
**Type:** code
**Files:**
  - create: `src/scenes/GameOverScene.ts`
**Acceptance:** Score displayed, rewarded ad button works, play again restarts

### Task 5: Wire scenes in main.ts
**Type:** code
**Files:**
  - modify: `src/main.ts`
**Acceptance:** All 4 scenes registered, boot goes through Preload → Menu

### Execution Order
1 → 2 → 3 → 4 → 5

---

## Tests

### What to test
- [ ] State machine: canTransition('playing', 'game-over') === true
- [ ] State machine: canTransition('menu', 'game-over') === false
- [ ] State machine: canTransition('ad', 'playing') === true
- [ ] showAdWithTimeout resolves { shown: false } on timeout (10s)
- [ ] showAdWithTimeout resolves with result on success
- [ ] GameScene creates all 5 managers in create()
- [ ] GameOverScene disables continue button after failed rewarded ad

### How to test
- Unit: State machine transitions, ad watchdog timeout
- Integration: Manual playtest — full game loop from menu to game over to play again

### TDD Order
1. State machine tests → implement in GameScene
2. Ad watchdog tests → implement showAdWithTimeout
3. Manual integration test for full game loop

---

## Definition of Done

### Functional
- [ ] Game boots → PreloadScene → MenuScene → GameScene loop works
- [ ] Drop → merge → score visible on screen
- [ ] Game over detected, overlay appears
- [ ] Play again restarts the game
- [ ] Rewarded ad flow works (mock: 2s delay → continue)

### Tests
- [ ] State machine unit tests pass
- [ ] Ad watchdog unit tests pass

### E2E User Journey
- [ ] Full game playable from start to game over to play again
- [ ] All buttons responsive (44px+ touch targets)
- [ ] No dead-end states

### Technical
- [ ] `npx tsc --noEmit` passes
- [ ] GameScene.ts ≤ 150 LOC (pure orchestrator)
- [ ] Module headers on all files >80 LOC
- [ ] Event names from GameEvents.ts only

---

## Autopilot Log
