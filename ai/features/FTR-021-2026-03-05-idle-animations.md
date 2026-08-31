# Feature: [FTR-021] Idle Animations
**Status:** queued | **Priority:** P1 | **Date:** 2026-03-05

## Why
Idle-анимации (Score 2.65): мишки в контейнере моргают, покачиваются — создают эмоциональную привязку "они живые". Merge Mansion: idle animations — ключевой фактор cute aggression (Aragón 2015). Для ЦА 55+ женщин — мишки как домашние питомцы, хочется заботиться.

## Context
Depends on FTR-003 (Animal.ts), FTR-006 (sprites).

**Current Animal.ts architecture (121 LOC):**
- `Animal extends Phaser.GameObjects.Container` (NOT MatterSprite)
- Container holds: sprite (Phaser.GameObjects.Image) + optional fallback circle + tier label
- Physics body created via `this.scene.matter.add.circle()` and linked to Container
- Container syncs position/rotation with body in `syncPosition()` (called on scene 'update' event)
- `isSettled` property tracks when velocity < 0.3 threshold

**Research finding:** For Container-based architecture (not MatterSprite), idle animations are safe because visual elements are children of Container — their transforms are LOCAL and don't affect physics body. Can tween sprite.scaleX/scaleY within Container without affecting collision circle.

**Key constraint:** Idle animations should ONLY play when `isSettled === true`. Animating falling/bouncing animals would conflict with physics motion.

## Research Reference
- V10: Idle Animations (Score 2.65)
- P14: Cute Aggression (Score 3.00) — related principle

## Verified Technical Approach
- Container children (sprite) can be tweened independently of physics body
- `isSettled` transition (false→true) = trigger to start idle
- Velocity spike (isSettled reset) = trigger to stop idle
- Matter.js sleeping not used in this project (check by sleep events), use isSettled instead

---

## Scope
**In scope:** Subtle idle animation on settled animals — gentle sway/breathe cycle, triggered when settled, stopped when bumped
**Out of scope:** Frame-based sprite sheet animations (would require new art assets), blinking eyes (requires sprite modifications), per-tier unique animations, idle sounds

---

## Allowed Files
**Modify:**
1. `src/objects/Animal.ts` — add idle tween management, start on settled, stop on bumped (~25 lines, total ~146 LOC)

**FORBIDDEN:** GameScene.ts, MergeDetector.ts, PhysicsManager.ts, AnimalSpawner.ts, config files, SDK files.

---

## Design

### Idle Animation Specification

**"Breathe" cycle — gentle scale oscillation:**
```
scaleX: 1.0 → 1.04 → 1.0    (±4%)
scaleY: 1.0 → 0.96 → 1.0    (inverse, volume preservation)
Duration: 1200ms per cycle
Ease: Sine.easeInOut
Repeat: infinite (yoyo)
```

**"Sway" cycle — subtle rotation:**
```
rotation: 0 → +0.03 → 0 → -0.03 → 0  (±1.7 degrees)
Duration: 2000ms per cycle
Ease: Sine.easeInOut
Repeat: infinite (yoyo)
```

**Both tweens apply to the SPRITE inside Container, not to the Container itself.** This keeps physics body unaffected.

**Phase randomization:** Each animal starts idle with random delay (0-500ms) to prevent synchronized "breathing" across all animals.

### Animal.ts Changes

Current relevant code in Animal.ts:

```typescript
// Line ~60: sprite reference
private sprite: Phaser.GameObjects.Image | null = null;

// Line ~80: isSettled tracking
private wasSettled = false;

// In syncPosition():
this.isSettled = speed < SETTLED_VELOCITY_THRESHOLD;
if (!this.wasSettled && this.isSettled && !this.landTweenDone) {
  // landing squash tween...
}
```

**Add idle tween management:**

```typescript
private idleTween: Phaser.Tweens.Tween | null = null;
private swayTween: Phaser.Tweens.Tween | null = null;

/** Start idle animation on the sprite (not the container) */
private startIdle(): void {
  if (this.idleTween || !this.sprite) return;

  const delay = Phaser.Math.Between(0, 500); // desync animals

  this.idleTween = this.scene.tweens.add({
    targets: this.sprite,
    scaleX: { from: this.sprite.scaleX, to: this.sprite.scaleX * 1.04 },
    scaleY: { from: this.sprite.scaleY, to: this.sprite.scaleY * 0.96 },
    duration: 1200,
    ease: 'Sine.easeInOut',
    yoyo: true,
    repeat: -1,
    delay,
  });

  this.swayTween = this.scene.tweens.add({
    targets: this.sprite,
    angle: { from: -1.7, to: 1.7 },
    duration: 2000,
    ease: 'Sine.easeInOut',
    yoyo: true,
    repeat: -1,
    delay,
  });
}

/** Stop idle animation, reset sprite to base scale */
private stopIdle(): void {
  if (this.idleTween) {
    this.idleTween.stop();
    this.idleTween = null;
  }
  if (this.swayTween) {
    this.swayTween.stop();
    this.swayTween = null;
  }
  if (this.sprite) {
    // Reset to base scale (recalculated from radius, same as constructor)
    const frame = this.sprite.frame;
    const maxDim = Math.max(frame.width, frame.height);
    const baseFactor = (this.config.radius * 2) / maxDim;
    this.sprite.setScale(baseFactor);
    this.sprite.setAngle(0);
  }
}
```

**Wire to settled state in syncPosition():**

```typescript
// After existing isSettled calculation:
if (this.isSettled && !this.wasSettled) {
  // Just settled — start idle after landing tween completes
  this.scene.time.delayedCall(300, () => {
    if (this.isSettled && this.active) this.startIdle();
  });
}
if (!this.isSettled && this.wasSettled) {
  // Got bumped — stop idle immediately
  this.stopIdle();
}
```

**Cleanup in destroy():**
```typescript
// In existing destroy() override:
this.stopIdle();
```

### Scale Math Consideration

The sprite's base scale is computed in constructor:
```typescript
const maxDim = Math.max(frame.width, frame.height);
const scaleFactor = (this.config.radius * 2) / maxDim;
this.sprite.setScale(scaleFactor);
```

For idle tween, we multiply from BASE scale, not from 1.0:
- `scaleX: baseFactor → baseFactor * 1.04` (breathe out)
- `scaleY: baseFactor → baseFactor * 0.96` (compress)

This preserves the correct visual size.

---

## Implementation Plan

### Task 1: Add idle animation to Animal.ts
**Type:** code
**Files:**
  - modify: `src/objects/Animal.ts` — add startIdle/stopIdle methods, wire to settled state transitions, cleanup on destroy (~25 new lines)
**Acceptance:** Settled animals gently breathe and sway, animation stops when bumped, no physics interference, no orphaned tweens

### Execution Order
Single task — self-contained in Animal.ts.

---

## Tests

### What to test
- [ ] Settled animals visibly breathe (scale oscillation ~4%)
- [ ] Settled animals visibly sway (rotation ±1.7°)
- [ ] Animation starts ~300ms after settling (after landing squash completes)
- [ ] Animation stops immediately when animal is bumped
- [ ] Animation restarts when animal re-settles
- [ ] Different animals are NOT synchronized (random delay)
- [ ] No visual glitches when animal is destroyed during idle
- [ ] Physics collisions unaffected by idle animation
- [ ] Performance: 15+ settled animals don't cause frame drops

### How to test
- Manual: Drop several animals, wait for them to settle, observe breathing/sway
- Manual: Drop new animal onto settled pile — observe idle animations stop on bumped animals
- Manual: Check FPS with full container (~20 animals)

---

## Definition of Done

### Functional
- [ ] Settled animals have visible idle animation
- [ ] Animation feels organic (subtle, not jarring)
- [ ] Animation responsive to physics (stops on bump)
- [ ] No synchronized "robot army" effect (staggered)

### Technical
- [ ] `npm run build` succeeds
- [ ] Animal.ts ≤ 150 LOC after changes
- [ ] No orphaned tweens (properly cleaned up on destroy)
- [ ] No console errors
- [ ] No frame drops with 15+ idle animals
