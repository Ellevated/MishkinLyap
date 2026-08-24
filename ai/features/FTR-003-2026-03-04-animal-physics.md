# Feature: [FTR-003] Animal Object + Physics Engine
**Status:** done | **Priority:** P0 | **Date:** 2026-03-04

## Why
The physical world is the foundation of drop-merge gameplay. Animals are Phaser Containers with Matter.js circle bodies. PhysicsManager creates walls and manages bodies. Without this, nothing moves, nothing collides.

## Context
Depends on FTR-001 (config) and FTR-002 (main.ts boot). Animal.ts is used by AnimalSpawner and MergeDetector. PhysicsManager is used by GameScene.

---

## Scope
**In scope:** Animal.ts (game entity), PhysicsManager.ts (walls, gravity, body management)
**Out of scope:** Spawning logic (FTR-004), merge detection (FTR-004), scoring (FTR-004)

---

## Blueprint Reference

**Domain:** objects/ (Animal), game/ (PhysicsManager)
**Cross-cutting:** Module headers, never throw, physics constants from GameConfig
**Data model:** Animal (tier, config, body, isMerging, isSettled), wall bodies

---

## Allowed Files
**New files allowed:**
1. `src/objects/Animal.ts` — Phaser Container + Matter body + tier data
2. `src/game/PhysicsManager.ts` — Matter.js world setup, walls, body management

**FORBIDDEN:** All other files.

---

## Environment

nodejs: false
docker: false
database: false

---

## Design

### Animal.ts (~100 LOC)

```typescript
/**
 * Module: Animal
 * Role: Game entity — Phaser Container wrapping Matter.js circle body with tier data
 * Uses: config/GameConfig (ANIMALS, AnimalConfig)
 * Used by: game/AnimalSpawner (creates), game/MergeDetector (reads tier + flags)
 * Does NOT: Manage own lifecycle, detect merges, calculate score
 */
```

Key properties:
- `tier: number` — 1-8
- `config: AnimalConfig` — from ANIMALS array
- `body: MatterJS.BodyType` — Matter.js circle body
- `isMerging: boolean` — lock flag for merge-in-progress
- `isSettled: boolean` — true when velocity < threshold (ready to merge)

Key behaviors:
- Constructor takes scene, x, y, tier → creates circle body with correct radius
- `setSettled()` called from update loop when body velocity drops below threshold
- Sprite (or colored circle placeholder) as visual representation
- Body has `label: 'animal'` and `gameObject` reference back to Animal

### PhysicsManager.ts (~150 LOC)

```typescript
/**
 * Module: PhysicsManager
 * Role: Manages Matter.js world — creates walls, adds/removes bodies
 * Uses: config/GameConfig (PHYSICS, GAME constants)
 * Used by: scenes/GameScene (creates in create())
 * Does NOT: Detect merges, create Animals, handle input
 */
```

Key behaviors:
- `createWalls()`: left, right, bottom walls as static rectangles. Uses GAME.CONTAINER_WALL_THICKNESS
- `addBody(body)`: add to Matter world
- `removeBody(body)`: remove from Matter world
- `getBodyCount()`: for physics stability monitoring
- Wall bodies have `label: 'wall'` (used by MergeDetector guard #1)
- Container inner width = GAME.WIDTH - 2 * CONTAINER_WALL_THICKNESS

---

## Implementation Plan

### Task 1: Create Animal.ts
**Type:** code
**Files:**
  - create: `src/objects/Animal.ts`
**Acceptance:** Animal creates Matter.js circle body with correct radius per tier, tsc passes

### Task 2: Create PhysicsManager.ts
**Type:** code
**Files:**
  - create: `src/game/PhysicsManager.ts`
**Acceptance:** Walls created, addBody/removeBody work, getBodyCount returns correct count

### Execution Order
1 → 2 (Animal is needed for PhysicsManager type references, but PhysicsManager doesn't import Animal directly)

---

## Tests

### What to test
- [ ] Animal constructor creates body with correct radius for each tier (1-8)
- [ ] Animal.isMerging defaults to false
- [ ] Animal.isSettled defaults to false
- [ ] PhysicsManager.createWalls() creates 3 wall bodies (left, right, bottom)
- [ ] PhysicsManager.getBodyCount() returns 0 initially (walls excluded)
- [ ] Wall bodies have label 'wall'

### How to test
- Unit: Test Animal constructor logic (mocking Phaser scene)
- Note: Full physics simulation tests are out of scope (trust Matter.js)

### TDD Order
1. Write Animal.test.ts → FAIL → Implement Animal.ts → PASS

---

## Definition of Done

### Functional
- [ ] Animal creates circle body with correct radius per tier
- [ ] PhysicsManager creates 3 walls forming a container
- [ ] Bodies can be added and removed from the world

### Tests
- [ ] Animal constructor tests pass
- [ ] PhysicsManager wall tests pass

### Technical
- [ ] `npx tsc --noEmit` passes
- [ ] Module headers on both files (>80 LOC)
- [ ] No imports from scenes/ or sdk/

---

## Autopilot Log
