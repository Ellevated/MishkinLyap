# Feature: [FTR-009] Visual Juice
**Status:** queued | **Priority:** P0 | **Date:** 2026-03-05

## Why
Squash & stretch — принцип #1 классической анимации (Disney, Pixar). Даёт ощущение веса и живости. Animated score counter + floating numbers — создают петлю "действие → удовлетворяющий отклик". PopCap Games (Bejeweled, PvZ) — мастера juicy UI для казуалок. Все juice-гайды (GameAnalytics, Blood Moon, Gamigion) единогласно: эти эффекты — лучшее соотношение усилие/эффект.

## Context
Depends on FTR-006 (visual polish). Currently: merge has scale tween + particles, but no squash-stretch on drop/land, no animated score, no floating numbers. Game feels "flat".

## Research Reference
- V1: Squash & Stretch при падении (Score 3.00)
- V4: Анимированный счётчик очков + floating numbers (Score 2.75)

---

## Scope
**In scope:** Squash-stretch on drop and landing, animated score count-up, floating score numbers at merge point, white flash on merge
**Out of scope:** Screen shake (separate), idle animations (Sprint 3), trail effect (Sprint 2+)

---

## Allowed Files
**Modify:**
1. `src/objects/Animal.ts` — add squash-stretch tweens on creation and landing detection
2. `src/scenes/GameScene.ts` — floating score numbers at merge point, animated score counter, white flash

**FORBIDDEN:** Game logic files (MergeDetector, ScoreManager internals), SDK files, config constants.

---

## Design

### Squash & Stretch (V1)

On Animal creation (drop):
```
1. Start slightly squashed vertically (scaleX: 1.1, scaleY: 0.9)
2. During fall: stretch vertically (scaleX: 0.9, scaleY: 1.1) — 200ms
3. On landing (isSettled becomes true): squash (scaleX: 1.2, scaleY: 0.8) — 100ms
4. Bounce back to normal (scaleX: 1, scaleY: 1) — 150ms, ease: Back.easeOut
```

Volume preservation: when scaleX increases, scaleY decreases proportionally.

Implementation: In Animal.ts, watch for isSettled transition from false→true, trigger squash tween. For drop, trigger stretch tween on creation (in AnimalSpawner or Animal constructor).

### Animated Score Counter (V4)

Current: `this.scoreText.setText(String(data.score))` — instant jump.

New behavior:
```
1. On SCORE_UPDATED: tween displayed number from old → new over 300ms
2. During tween: slight scale pulse (1.0 → 1.15 → 1.0)
3. If score delta > 20: add brief color flash (gold → white → normal)
```

### Floating Score Numbers (V4)

At merge point, spawn temporary text:
```
1. Create text "+{points}" at (mergeX, mergeY)
2. Font: Marmelad, 24px, gold color (#D4A24C)
3. Tween: float up 60px over 800ms, fade out
4. Ease: Power2 ease-out
5. Destroy on complete
```

### White Flash on Merge

At merge point:
```
1. Create white circle (radius: 20, alpha: 0.8)
2. Scale from 0.5 to 2.0 over 100ms
3. Fade alpha to 0 over 100ms
4. Destroy on complete
```

---

## Implementation Plan

### Task 1: Add squash-stretch to Animal
**Type:** code
**Files:**
  - modify: `src/objects/Animal.ts` — add stretch on creation, squash on landing
**Acceptance:** Animals visibly stretch during fall and squash on landing

### Task 2: Animated score counter + floating numbers + white flash
**Type:** code
**Files:**
  - modify: `src/scenes/GameScene.ts` — replace instant score update with tween, add floating numbers at merge point, add white flash circle
**Acceptance:** Score animates smoothly, "+N" floats up from merge point, brief flash on merge

### Execution Order
1 → 2

---

## Tests

### What to test
- [ ] Animal visibly stretches during fall (scaleY > 1.0 briefly)
- [ ] Animal squashes on landing (scaleX > 1.0, scaleY < 1.0 briefly)
- [ ] Score counter animates from old to new value (not instant)
- [ ] Floating "+N" text appears at merge point and fades up
- [ ] White flash appears at merge point
- [ ] All tweens complete without errors or memory leaks (destroyed after)

### How to test
- Manual: Visual inspection during gameplay

---

## Definition of Done

### Functional
- [ ] Squash-stretch visible on every drop and landing
- [ ] Score counter animates smoothly on update
- [ ] Floating numbers show correct score at merge point
- [ ] White flash visible on merge
- [ ] No visual glitches or orphaned tweens

### Technical
- [ ] `npm run build` succeeds
- [ ] Animal.ts ≤ 150 LOC
- [ ] No console errors
