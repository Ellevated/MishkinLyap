# Feature: [FTR-010] Combo System
**Status:** queued | **Priority:** P0 | **Date:** 2026-03-05

## Why
Combo — ядро залипательности в merge-играх. Suika Game: каскадные мерджи — самый залипательный момент. Combo multiplier (x2, x3, x4...) увеличивает session length — игрок хочет побить combo-рекорд. Визуальная эскалация (больше частиц, ярче вспышки, нарастающий текст) — подтверждённый усилитель engagement (Candy Crush, Brawl Stars).

## Context
Depends on FTR-004 (MergeDetector), FTR-005 (GameScene). Currently merges happen but no combo tracking — each merge is treated identically regardless of chain reactions.

## Research Reference
- S1: Combo Score Multiplier (Score 2.75)
- V7: Combo Escalation Visual (Score 2.40)

---

## Scope
**In scope:** ComboTracker class, combo time window, score multiplier, combo counter UI, escalating particle effects per combo level
**Out of scope:** Super Evolution Time / Combo Fever special mode (P1), combo sound (FTR-008 handles escalating pitch)

---

## Allowed Files
**New files allowed:**
1. `src/game/ComboTracker.ts` — tracks combo state (~60 LOC)

**Modify:**
2. `src/scenes/GameScene.ts` — wire ComboTracker, apply multiplier, show combo UI, escalate particles
3. `src/config/GameConfig.ts` — add COMBO config constants
4. `src/config/GameEvents.ts` — add COMBO_UPDATED event (optional)

**FORBIDDEN:** MergeDetector.ts, ScoreManager.ts internals, SDK files, Animal.ts.

---

## Design

### ComboTracker (~60 LOC)

```typescript
/**
 * Module: ComboTracker
 * Role: Tracks consecutive merges within time window, provides multiplier
 * Uses: config/GameConfig (COMBO)
 * Used by: GameScene (onMerge handler)
 * Does NOT: Detect merges, calculate base score, manage particles
 */
```

**State:**
- `count: number` — current combo count (0 = no combo)
- `lastMergeTime: number` — timestamp of last merge
- `active: boolean` — combo window is open

**Public API:**
- `registerMerge(): number` — called on each merge, returns current combo count
- `getMultiplier(): number` — returns score multiplier (1.0, 1.5, 2.0, 2.5, 3.0)
- `reset()` — reset combo state

**Logic:**
```
On merge:
  if (now - lastMergeTime < COMBO_WINDOW_MS):
    count++
  else:
    count = 1
  lastMergeTime = now
  return count
```

### Config Constants
```typescript
export const COMBO = {
  WINDOW_MS: 2000,        // Time window for consecutive merges
  MULTIPLIERS: [1, 1, 1.5, 2, 2.5, 3],  // index = combo count, cap at 3x
  MAX_DISPLAY: 5,         // Max combo displayed (x5+)
} as const;
```

### Combo UI in GameScene

When combo count >= 2:
```
1. Show "x{N}" text near score (right side)
2. Font: Marmelad, 32px, gold → red gradient by level
3. Scale pulse animation on each increment (1.0 → 1.3 → 1.0)
4. Fade out when combo window expires
```

### Particle Escalation

In `emitMergeParticles(x, y)`, scale effects by combo:
```
combo 1: 7 particles (current)
combo 2: 10 particles, slightly larger
combo 3: 14 particles, larger, brighter colors
combo 4+: 18 particles, max size, gold sparkles
```

### Score Integration

In GameScene.onMerge():
```typescript
const comboCount = this.combo.registerMerge();
const multiplier = this.combo.getMultiplier();
const finalScore = Math.round(result.scoreAwarded * multiplier);
this.score.addScore(finalScore);
```

---

## Implementation Plan

### Task 1: Create ComboTracker + config
**Type:** code
**Files:**
  - create: `src/game/ComboTracker.ts`
  - modify: `src/config/GameConfig.ts` — add COMBO constants
**Acceptance:** ComboTracker tracks consecutive merges within window, returns correct multiplier

### Task 2: Wire combo to GameScene — multiplier + UI + particles
**Type:** code
**Files:**
  - modify: `src/scenes/GameScene.ts` — integrate ComboTracker in onMerge, show combo counter, apply multiplier to score, scale particles by combo level
**Acceptance:** Combo counter visible, score multiplied, particles escalate

### Execution Order
1 → 2

---

## Tests

### What to test
- [ ] Single merge = combo 1, multiplier 1.0
- [ ] Two merges within 2s = combo 2, multiplier 1.5
- [ ] Combo resets after 2s gap
- [ ] Combo counter "x2" appears on screen during combo
- [ ] Particles increase in count/size during combo
- [ ] Score reflects multiplier (verify with floating numbers from FTR-009)

### How to test
- Manual: Trigger chain reactions, observe combo counter and particle escalation
- Unit: ComboTracker.registerMerge() returns correct count and multiplier

---

## Definition of Done

### Functional
- [ ] Combo counter tracks chain merges within 2s window
- [ ] Score multiplied correctly (x1.5, x2, x2.5, x3 cap)
- [ ] "x2", "x3" etc visible on screen during combo
- [ ] Particles visibly escalate with higher combo
- [ ] Combo resets after timeout

### Technical
- [ ] `npm run build` succeeds
- [ ] ComboTracker.ts ≤ 80 LOC
- [ ] No console errors
