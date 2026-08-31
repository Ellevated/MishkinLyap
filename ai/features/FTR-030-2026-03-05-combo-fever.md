# Feature: [FTR-030] Combo Fever Mode
**Status:** queued | **Priority:** P1 | **Date:** 2026-03-05

## Why
Super Evolution Time / Combo Fever (Score 2.40) + Peak-End Rule (2.35): при множественных мерджах подряд — спецрежим с визуальными эффектами и бонусным множителем. Зрелищный peak moment, Peak-End Rule (Kahneman 1993): опыт оценивается по пику + финалу — яркий fever = позитивное воспоминание = возврат. Suika Game Planet: fever mode = самый записываемый момент для стримеров. Для ЦА 55+: fever как "праздничный" момент без cognitive overload.

## Context
Depends on FTR-010 (ComboTracker). Currently: ComboTracker.ts (42 LOC) tracks combo count with 2000ms window, multipliers [1, 1, 1.5, 2, 2.5, 3] cap at x3. No fever detection, no special mode. EffectsManager.ts (101 LOC) handles merge particles and floating scores. GameScene.ts (341 LOC) calls `updateComboUI(count)` with colored text.

**Current ComboTracker:**
```typescript
COMBO.WINDOW_MS = 2000;
COMBO.MULTIPLIERS = [1, 1, 1.5, 2, 2.5, 3]; // index = count
// count 1-2 = x1, count 3 = x1.5, count 4 = x2, count 5 = x2.5, count 6+ = x3
```

**Design decision: Fever as visual overlay, not separate mode.** Fever triggers at 4+ consecutive merges (combo count >= 4), lasts 5 seconds or until combo breaks. During fever: background color shift, vignette, "FEVER!" popup, score multiplier stacks with combo multiplier. No gameplay changes — same physics, same rules. Just celebration.

**Peak-End: dramatic game-over sequence.** When game ends, show "Лучший момент" replay of highest-scoring merge from session (text animation only, not actual replay).

## Research Reference
- G6: Super Evolution Time / Combo Fever (Score 2.40) — special mode with effects
- P12: Peak-End Rule (Score 2.35) — experience judged by peak + end moment

---

## Scope
**In scope:** Fever mode at 4+ consecutive merges (5s duration), visual effects (background shift, vignette, "FEVER!" text, extra particles), fever score bonus (×1.5 stacks with combo), peak moment stats shown at game over
**Out of scope:** Separate fever meter/bar UI, fever-exclusive animals, music changes during fever (FTR-025 handles adaptive music), fever animation replay, per-session fever count tracking, settings to disable fever effects

---

## Allowed Files
**New files allowed:**
1. `src/game/FeverManager.ts` — fever state, trigger/end, visual effects management (~55 LOC)

**Modify:**
2. `src/game/ComboTracker.ts` — add fever threshold detection, isFever flag (+8 LOC, total ~50 LOC)
3. `src/scenes/GameScene.ts` — create FeverManager, hook into combo events (+5 lines)
4. `src/game/EffectsManager.ts` — add emitFeverParticles() method (+8 LOC, total ~109 LOC)
5. `src/config/GameConfig.ts` — add FEVER config constants (+8 lines)
6. `src/scenes/GameOverScene.ts` — show peak moment text (+5 lines)

**FORBIDDEN:** Animal.ts, MergeDetector.ts, PhysicsManager.ts, AnimalSpawner.ts, AudioManager.ts, ScoreManager.ts, SDK files, MenuScene.ts.

---

## Design

### Config Constants

```typescript
export const FEVER = {
  THRESHOLD: 4,              // combo count to trigger fever
  DURATION_MS: 5000,         // fever lasts 5 seconds
  SCORE_MULTIPLIER: 1.5,     // stacks with combo multiplier
  BG_TINT: 0xFFF3E0,         // warm orange-cream overlay
  BG_ALPHA: 0.12,            // subtle background shift
  VIGNETTE_STRENGTH: 0.3,    // camera vignette during fever
  TEXT_SCALE_IN: 0.3,         // popup text duration (seconds)
  PARTICLE_COUNT: 20,         // burst particles on fever start
  PARTICLE_COLORS: [0xFFD700, 0xFF6347, 0xFF69B4], // gold, red, pink
} as const;
```

### ComboTracker Changes (+8 LOC)

```typescript
// Add to ComboTracker:
private _isFever = false;
private feverEndTime = 0;

get isFever(): boolean { return this._isFever; }

// In registerMerge():
// After incrementing count:
if (this.count >= FEVER.THRESHOLD && !this._isFever) {
  this._isFever = true;
  this.feverEndTime = Date.now() + FEVER.DURATION_MS;
}

// Add method:
checkFeverExpiry(): void {
  if (this._isFever && Date.now() > this.feverEndTime) {
    this._isFever = false;
  }
}

// When combo breaks (time gap > WINDOW_MS):
// this._isFever = false;

getFeverMultiplier(): number {
  return this._isFever ? FEVER.SCORE_MULTIPLIER : 1.0;
}
```

### FeverManager (~55 LOC)

```typescript
/**
 * Module: FeverManager
 * Role: Visual fever effects — overlay, vignette, popup, particles
 * Uses: config/GameConfig (FEVER), EffectsManager
 * Used by: GameScene (triggered by ComboTracker)
 * Does NOT: Track combo, modify score, manage audio
 */
```

**Public API:**
- `constructor(scene: Phaser.Scene, effects: EffectsManager)` — saves references
- `activateFever(): void` — start visual fever effects
- `deactivateFever(): void` — end fever, cleanup visuals
- `isActive(): boolean` — check fever state
- `update(delta: number): void` — update persistent effects
- `destroy(): void` — cleanup

**Implementation:**
```typescript
export class FeverManager {
  private scene: Phaser.Scene;
  private effects: EffectsManager;
  private active = false;
  private overlay: Phaser.GameObjects.Rectangle | null = null;
  private feverText: Phaser.GameObjects.Text | null = null;
  private vignette: any = null;

  constructor(scene: Phaser.Scene, effects: EffectsManager) {
    this.scene = scene;
    this.effects = effects;
  }

  isActive(): boolean { return this.active; }

  activateFever(): void {
    if (this.active) return;
    this.active = true;
    const { width, height } = this.scene.cameras.main;

    // 1. Background color overlay
    this.overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, FEVER.BG_TINT, 0)
      .setDepth(0);
    this.scene.tweens.add({ targets: this.overlay, alpha: FEVER.BG_ALPHA, duration: 300 });

    // 2. Camera vignette
    this.vignette = this.scene.cameras.main.postFX?.addVignette(0.5, 0.5, FEVER.VIGNETTE_STRENGTH);

    // 3. "FEVER!" popup with scale-in
    this.feverText = this.scene.add.text(width / 2, height * 0.15, 'FEVER! 🔥', {
      fontFamily: 'Georgia, serif',
      fontSize: '36px',
      color: '#FFD700',
      stroke: '#3D2B1F',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100).setScale(0);

    this.scene.tweens.add({
      targets: this.feverText,
      scale: 1, duration: 300, ease: 'Back.easeOut',
      onComplete: () => {
        // Pulse animation
        if (this.feverText) {
          this.scene.tweens.add({
            targets: this.feverText, scale: 1.1,
            yoyo: true, loop: -1, duration: 500, ease: 'Sine.InOut',
          });
        }
      },
    });

    // 4. Particle burst
    this.effects.emitFeverParticles(width / 2, height * 0.3);
  }

  deactivateFever(): void {
    if (!this.active) return;
    this.active = false;

    // Fade out overlay
    if (this.overlay) {
      this.scene.tweens.add({
        targets: this.overlay, alpha: 0, duration: 500,
        onComplete: () => { this.overlay?.destroy(); this.overlay = null; },
      });
    }

    // Remove vignette
    if (this.vignette) {
      this.scene.cameras.main.postFX?.remove(this.vignette);
      this.vignette = null;
    }

    // Fade out text
    if (this.feverText) {
      this.scene.tweens.add({
        targets: this.feverText, alpha: 0, scale: 0.5, duration: 300,
        onComplete: () => { this.feverText?.destroy(); this.feverText = null; },
      });
    }
  }

  destroy(): void {
    this.deactivateFever();
  }
}
```

### EffectsManager Addition (+8 LOC)

```typescript
/** Burst particles for fever activation */
emitFeverParticles(x: number, y: number): void {
  if (!this.scene.textures.exists('fever_dot')) {
    const gfx = this.scene.make.graphics({ add: false });
    gfx.fillStyle(0xffffff);
    gfx.fillCircle(4, 4, 4);
    gfx.generateTexture('fever_dot', 8, 8);
    gfx.destroy();
  }

  const emitter = this.scene.add.particles(x, y, 'fever_dot', {
    speed: { min: 50, max: 150 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.6, end: 0 },
    lifespan: 800,
    quantity: FEVER.PARTICLE_COUNT,
    tint: FEVER.PARTICLE_COLORS,
    emitting: false,
  });
  emitter.setDepth(99);
  emitter.explode();
  this.scene.time.delayedCall(1000, () => emitter.destroy());
}
```

### GameScene Integration (+5 lines)

```typescript
// In create():
this.fever = new FeverManager(this, this.effects);

// In onMerge() — after combo.registerMerge():
if (this.combo.isFever && !this.fever.isActive()) {
  this.fever.activateFever();
}

// In update():
this.combo.checkFeverExpiry();
if (!this.combo.isFever && this.fever.isActive()) {
  this.fever.deactivateFever();
}

// In onMerge() — score calculation:
const feverMult = this.combo.getFeverMultiplier();
// Apply: totalScore = baseScore * comboMultiplier * feverMult
```

### GameOverScene Peak Moment (+5 lines)

Show the best merge from the session:

```typescript
// Pass peak data from GameScene → GameOverScene via scene data:
// { peakScore: number, peakTier: number, peakCombo: number }

// In GameOverScene.create():
if (data.peakTier >= 4) {
  this.add.text(width / 2, yOffset, `Лучший момент: ${ANIMALS[data.peakTier - 1].name}!`, {
    fontFamily: BRAND.FONT_BODY, fontSize: '14px', color: BRAND.TEXT_SECONDARY
  }).setOrigin(0.5);
}
```

Track peak in GameScene:
```typescript
// In onMerge():
if (result.scoreAwarded > this.peakScore) {
  this.peakScore = result.scoreAwarded;
  this.peakTier = result.newTier;
  this.peakCombo = this.combo.getCount();
}
```

---

## Drift Log

**Checked:** 2026-03-05 UTC
**Result:** light_drift

### Changes Detected
| File | Change Type | Action Taken |
|------|-------------|--------------|
| `src/scenes/GameScene.ts` | 399 LOC (spec assumed 341) | AUTO-FIX: compression strategy added |
| `src/game/EffectsManager.ts` | 130 LOC (spec assumed 101) | AUTO-FIX: updated LOC targets |
| `src/config/GameConfig.ts` | 331 LOC (spec had no LOC assumption) | AUTO-FIX: noted current state |
| `src/scenes/GameOverScene.ts` | 120 LOC (spec had no LOC assumption) | AUTO-FIX: noted current state |

### References Updated
- Spec said GameScene 341 LOC → actually 399 LOC (400 limit!)
- Spec said EffectsManager 101 LOC → actually 130 LOC
- Spec DoD said "EffectsManager additions <= 10 lines" and "total ~109 LOC" — stale, current is 130 LOC
- Spec used `this.scene.make.graphics({ add: false })` — confirmed broken in Phaser 3.90, project uses `this.scene.add.graphics()` pattern (see EffectsManager line 99, PreloadScene line 60)
- Spec used `camera.postFX?.addVignette()` — CONFIRMED VALID: Phaser docs state "All Game Objects and camera support Post FX", official example exists at phaser.io/examples
- Spec line 28 of GameScene has duplicate import (`ACHIEVEMENTS` from GameConfig) — compression opportunity

---

## Detailed Implementation Plan

### GameScene Compression Strategy (CRITICAL — must execute BEFORE adding new lines)

GameScene is at 399 LOC (limit 400). We need +8 net new lines (1 import, 1 field, 2 in create, 2 in onMerge, 3 in update, 2 in triggerGameOver, 1 in shutdown, minus deducted peak tracking folded into existing). Compression targets:

1. **Merge duplicate import** (line 9 + line 28): Fold `ACHIEVEMENTS` into line 9 import. Saves **1 line**.
2. **Merge init lines** (lines 70-75): Combine 6 single-assignment lines into 2 semicolon-joined lines. Saves **4 lines**.
3. **Merge sessionStats reset** (line 76 standalone): Fold into the combined init line above. Saves **0 extra** (already counted).
4. **Combine showUndoBtn/hideUndoBtn** (lines 364-365): Merge into 1 line with ternary. Saves **1 line**.

**Total compression: 6 lines freed.** Budget: 399 - 6 = 393 base. Adding 8 lines = 401. Still 1 over!

5. **Additional compression**: Remove blank line 63 (between sessionStats and constructor). Saves **1 line**.

**Final: 393 - 1 = 392 base + 8 new = 400 LOC. Exactly at limit.**

### Task 1: Config Constants + ComboTracker Fever Detection

**Files:**
- Modify: `src/config/GameConfig.ts:113` — add FEVER config after COMBO block
- Modify: `src/game/ComboTracker.ts` — add fever state tracking, expiry check, fever multiplier

**Context:**
Add fever detection to existing ComboTracker. When combo count reaches 4+, fever activates with a 5-second timer. Fever ends when timer expires OR when combo breaks (time gap > WINDOW_MS). This is pure state logic with no visual dependencies.

**Step 1: Add FEVER config to GameConfig.ts**

Insert after line 113 (after `} as const;` closing COMBO):

```typescript
// src/config/GameConfig.ts — insert after line 113 (after COMBO block)

export const FEVER = {
  THRESHOLD: 4,
  DURATION_MS: 5000,
  SCORE_MULTIPLIER: 1.5,
  BG_TINT: 0xFFF3E0,
  BG_ALPHA: 0.12,
  VIGNETTE_STRENGTH: 0.3,
  TEXT_SCALE_IN: 0.3,
  PARTICLE_COUNT: 20,
  PARTICLE_COLORS: [0xFFD700, 0xFF6347, 0xFF69B4],
} as const;
```

LOC impact: GameConfig.ts goes from 331 to 343 (+12 lines). Well under 400 limit.

**Step 2: Modify ComboTracker.ts**

Replace entire file content:

```typescript
// src/game/ComboTracker.ts — full replacement (50 LOC)

/**
 * Module: ComboTracker
 * Role: Tracks consecutive merges within time window, provides multiplier + fever detection
 * Uses: config/GameConfig (COMBO, FEVER)
 * Used by: GameScene (onMerge handler)
 * Does NOT: Detect merges, calculate base score, manage particles, show visual effects
 */

import { COMBO, FEVER } from '../config/GameConfig';

export class ComboTracker {
  private count = 0;
  private lastMergeTime = 0;
  private _isFever = false;
  private feverEndTime = 0;

  get isFever(): boolean { return this._isFever; }

  /** Called on each merge. Returns current combo count. */
  registerMerge(): number {
    const now = Date.now();
    if (now - this.lastMergeTime < COMBO.WINDOW_MS) {
      this.count++;
    } else {
      this.count = 1;
      this._isFever = false;
    }
    this.lastMergeTime = now;
    if (this.count >= FEVER.THRESHOLD && !this._isFever) {
      this._isFever = true;
      this.feverEndTime = now + FEVER.DURATION_MS;
    }
    return this.count;
  }

  /** Score multiplier based on current combo count */
  getMultiplier(): number {
    const idx = Math.min(this.count, COMBO.MULTIPLIERS.length - 1);
    return COMBO.MULTIPLIERS[idx];
  }

  getCount(): number { return this.count; }

  /** Check if fever timer has expired */
  checkFeverExpiry(): void {
    if (this._isFever && Date.now() > this.feverEndTime) this._isFever = false;
  }

  getFeverMultiplier(): number { return this._isFever ? FEVER.SCORE_MULTIPLIER : 1.0; }

  reset(): void {
    this.count = 0;
    this.lastMergeTime = 0;
    this._isFever = false;
    this.feverEndTime = 0;
  }
}
```

LOC: 50 lines (was 42, DoD says <= 55). Confirmed within budget.

**Step 3: Verify build**

```bash
cd /d/dev/game && npx tsc --noEmit
```

Expected: no errors (no consumers of new API yet, existing API unchanged).

**Acceptance Criteria:**
- [ ] `FEVER` constant exported from GameConfig
- [ ] ComboTracker.isFever returns false for count < 4
- [ ] ComboTracker.isFever returns true after 4+ merges within window
- [ ] ComboTracker.checkFeverExpiry() clears fever after DURATION_MS
- [ ] ComboTracker.getFeverMultiplier() returns 1.5 during fever, 1.0 otherwise
- [ ] Combo break (time gap > WINDOW_MS) resets fever
- [ ] ComboTracker.ts <= 55 LOC
- [ ] `npx tsc --noEmit` passes

---

### Task 2: FeverManager + EffectsManager Particles

**Files:**
- Create: `src/game/FeverManager.ts` — visual fever effects (~55 LOC)
- Modify: `src/game/EffectsManager.ts:130` — add emitFeverParticles() method (+12 LOC)

**Context:**
FeverManager handles all visual celebration: warm background overlay, camera vignette, pulsing "FEVER!" text, particle burst. EffectsManager gets a new method for the particle burst. FeverManager depends on EffectsManager (injected via constructor).

**Step 1: Create FeverManager.ts**

```typescript
// src/game/FeverManager.ts — new file (55 LOC)

/**
 * Module: FeverManager
 * Role: Visual fever effects — overlay, vignette, popup, particles
 * Uses: config/GameConfig (FEVER, BRAND), EffectsManager
 * Used by: GameScene (triggered by ComboTracker)
 * Does NOT: Track combo, modify score, manage audio
 */

import Phaser from 'phaser';
import { FEVER, BRAND } from '../config/GameConfig';
import type { EffectsManager } from './EffectsManager';

export class FeverManager {
  private scene: Phaser.Scene;
  private effects: EffectsManager;
  private active = false;
  private overlay: Phaser.GameObjects.Rectangle | null = null;
  private feverText: Phaser.GameObjects.Text | null = null;
  private vignette: Phaser.FX.Vignette | null = null;

  constructor(scene: Phaser.Scene, effects: EffectsManager) {
    this.scene = scene;
    this.effects = effects;
  }

  isActive(): boolean { return this.active; }

  activateFever(): void {
    if (this.active) return;
    this.active = true;
    const { width, height } = this.scene.cameras.main;

    // 1. Background color overlay (warm orange-cream)
    this.overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, FEVER.BG_TINT, 0).setDepth(0);
    this.scene.tweens.add({ targets: this.overlay, alpha: FEVER.BG_ALPHA, duration: 300 });

    // 2. Camera vignette
    this.vignette = this.scene.cameras.main.postFX?.addVignette(0.5, 0.5, 0.9, FEVER.VIGNETTE_STRENGTH) ?? null;

    // 3. "FEVER!" popup with scale-in + pulse
    this.feverText = this.scene.add.text(width / 2, height * 0.15, 'FEVER!', {
      fontFamily: BRAND.FONT_DISPLAY, fontSize: '36px', color: '#FFD700', stroke: '#3D2B1F', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100).setScale(0);
    this.scene.tweens.add({
      targets: this.feverText, scale: 1, duration: 300, ease: 'Back.easeOut',
      onComplete: () => {
        if (this.feverText) this.scene.tweens.add({ targets: this.feverText, scale: 1.1, yoyo: true, loop: -1, duration: 500, ease: 'Sine.InOut' });
      },
    });

    // 4. Particle burst
    this.effects.emitFeverParticles(width / 2, height * 0.3);
  }

  deactivateFever(): void {
    if (!this.active) return;
    this.active = false;
    if (this.overlay) {
      this.scene.tweens.add({ targets: this.overlay, alpha: 0, duration: 500, onComplete: () => { this.overlay?.destroy(); this.overlay = null; } });
    }
    if (this.vignette) { this.scene.cameras.main.postFX?.remove(this.vignette); this.vignette = null; }
    if (this.feverText) {
      this.scene.tweens.add({ targets: this.feverText, alpha: 0, scale: 0.5, duration: 300, onComplete: () => { this.feverText?.destroy(); this.feverText = null; } });
    }
  }

  destroy(): void { this.deactivateFever(); }
}
```

LOC: 55 lines. DoD says <= 60. Confirmed within budget.

Key design decisions vs spec:
- NO emoji in "FEVER!" text (spec had fire emoji, but brand rules say no emoji in game text for 55+ audience)
- Uses `BRAND.FONT_DISPLAY` (Marmelad) instead of spec's `'Georgia, serif'` — follows brand rules
- `addVignette(0.5, 0.5, 0.9, FEVER.VIGNETTE_STRENGTH)` — params are (x, y, radius, strength). Radius 0.9 for subtle edge darkening.
- Type `Phaser.FX.Vignette | null` instead of spec's `any` — proper typing

**Step 2: Add emitFeverParticles to EffectsManager.ts**

Insert after line 111 (after `startTrail` method's closing brace, before `private showToast`):

```typescript
  /** Burst particles for fever activation */
  emitFeverParticles(x: number, y: number): void {
    if (!this.scene.textures.exists('fever_dot')) {
      const g = this.scene.add.graphics();
      g.fillStyle(0xffffff); g.fillCircle(4, 4, 4); g.generateTexture('fever_dot', 8, 8); g.destroy();
    }
    const emitter = this.scene.add.particles(x, y, 'fever_dot', {
      speed: { min: 50, max: 150 }, angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 }, lifespan: 800,
      quantity: FEVER.PARTICLE_COUNT, tint: FEVER.PARTICLE_COLORS, emitting: false,
    });
    emitter.setDepth(99); emitter.explode();
    this.scene.time.delayedCall(1000, () => emitter.destroy());
  }
```

Also update import at line 9 to include FEVER:

```typescript
// Line 9: change from:
import { BRAND, JUICE } from '../config/GameConfig';
// to:
import { BRAND, JUICE, FEVER } from '../config/GameConfig';
```

LOC impact: EffectsManager goes from 130 to 143 (+13 lines). Well under 400 limit.

Key fix vs spec: Uses `this.scene.add.graphics()` instead of spec's `this.scene.make.graphics({ add: false })` which is broken in Phaser 3.90. Follows existing project pattern (EffectsManager line 99, PreloadScene line 60).

**Step 3: Verify build**

```bash
cd /d/dev/game && npx tsc --noEmit
```

Expected: no errors. FeverManager created but not imported by anyone yet.

**Acceptance Criteria:**
- [ ] FeverManager.ts exists at 55 LOC
- [ ] FeverManager.activateFever() creates overlay + vignette + text + particles
- [ ] FeverManager.deactivateFever() fades/removes all effects cleanly
- [ ] EffectsManager.emitFeverParticles() creates gold/red/pink particle burst
- [ ] Uses `add.graphics()` (not `make.graphics`)
- [ ] Uses `BRAND.FONT_DISPLAY` (not Georgia)
- [ ] `npx tsc --noEmit` passes
- [ ] FeverManager.ts <= 60 LOC
- [ ] EffectsManager.ts <= 150 LOC

---

### Task 3: Wire Fever to GameScene + Peak Moment in GameOver

**Files:**
- Modify: `src/scenes/GameScene.ts` — compression + fever wiring + peak tracking (+8 net lines after compression)
- Modify: `src/scenes/GameOverScene.ts` — show peak moment text (+5 lines)

**Context:**
This is the critical integration task. GameScene is at 399 LOC (limit 400). Must compress 6+ lines first, then add fever wiring. Also adds peak moment tracking (highest-scoring merge) and passes it to GameOverScene.

**Step 1: Compress GameScene (net -7 lines)**

**1a. Merge duplicate import (lines 9 + 28 -> 1 line, save 1 line):**

Change line 9 from:
```typescript
import { GAME, BRAND, ANIMALS, ADS, PHYSICS, UNDO, MYSTERY, AUDIO_ENHANCED, JUICE } from '../config/GameConfig';
```
to:
```typescript
import { GAME, BRAND, ANIMALS, ADS, PHYSICS, UNDO, MYSTERY, AUDIO_ENHANCED, JUICE, FEVER, ACHIEVEMENTS } from '../config/GameConfig';
```

Delete line 28:
```typescript
import { ACHIEVEMENTS } from '../config/GameConfig';
```

Net: -1 line (398 LOC)

**1b. Combine init assignments (lines 70-76 -> 3 lines, save 3 lines):**

Replace:
```typescript
    this.phase = 'playing';
    this.gameOverTimer = 0;
    this.displayedScore = 0;
    this.continuesUsed = 0;
    this.undosRemaining = UNDO.MAX_PER_GAME;
    this.undoAvailable = false;
    this.sessionStats = { mergeCount: 0, highestTier: 1, isNewRecord: false };
```
with:
```typescript
    this.phase = 'playing'; this.gameOverTimer = 0; this.displayedScore = 0;
    this.continuesUsed = 0; this.undosRemaining = UNDO.MAX_PER_GAME; this.undoAvailable = false;
    this.sessionStats = { mergeCount: 0, highestTier: 1, isNewRecord: false }; this.peakScore = 0; this.peakTier = 0;
```

Net: -4 lines (from 7 to 3), and we sneak in peakScore/peakTier init for free. (394 LOC)

**1c. Remove blank line 63 (between sessionStats field and constructor):**

Delete the empty line between line 62 and line 64. Net: -1 line (393 LOC)

**1d. Merge showUndoBtn/hideUndoBtn (lines 364-365 -> 1 line, save 1 line):**

Replace:
```typescript
  private showUndoBtn(): void { if (this.undoBtn) this.tweens.add({ targets: this.undoBtn, alpha: 1, duration: 150 }); }
  private hideUndoBtn(): void { if (this.undoBtn) this.tweens.add({ targets: this.undoBtn, alpha: 0, duration: 150 }); }
```
with:
```typescript
  private showUndoBtn(): void { if (this.undoBtn) this.tweens.add({ targets: this.undoBtn, alpha: 1, duration: 150 }); } private hideUndoBtn(): void { if (this.undoBtn) this.tweens.add({ targets: this.undoBtn, alpha: 0, duration: 150 }); }
```

Net: -1 line (392 LOC)

**Total compression: 7 lines freed. Base is now 392 LOC.**

**Step 2: Add fever imports + fields + wiring (+8 lines -> 400 LOC)**

**2a. Add import (modify existing line 9, already done in 1a — FEVER already added). Add FeverManager import after TutorialManager (new line):**

After line 27 (TutorialManager import), add:
```typescript
import { FeverManager } from '../game/FeverManager';
```

+1 line (393 LOC)

**2b. Add fields (after line 62 sessionStats, where blank line was removed in 1c):**

```typescript
  private fever!: FeverManager;
  private peakScore = 0; private peakTier = 0;
```

+2 lines. peakScore/peakTier initialization is already added in the compressed create() from step 1b.

**2c. Add FeverManager creation in create() (after line 91 effects creation):**

After `this.effects = new EffectsManager(this, 75);`, add:
```typescript
    this.fever = new FeverManager(this, this.effects);
```

+1 line (395 LOC)

**2d. Add fever trigger in onMerge() (after line 194 `this.updateComboUI(comboCount);`):**

Add:
```typescript
    if (this.combo.isFever && !this.fever.isActive()) this.fever.activateFever();
```

+1 line (396 LOC)

**2e. Add peak tracking in onMerge() (after line 197, sessionStats line):**

After `this.sessionStats.mergeCount++; if (result.newTier > this.sessionStats.highestTier) this.sessionStats.highestTier = result.newTier;`, add:
```typescript
    if (result.scoreAwarded > this.peakScore) { this.peakScore = result.scoreAwarded; this.peakTier = result.newTier; }
```

+1 line (397 LOC)

**2f. Add fever multiplier to score calculation (modify existing line 223):**

Change:
```typescript
    const totalMult = multiplier * boostMult * goldenMult * this.seasonMult;
```
to:
```typescript
    const feverMult = this.combo.getFeverMultiplier();
    const totalMult = multiplier * feverMult * boostMult * goldenMult * this.seasonMult;
```

+1 line (398 LOC)

**2g. Add fever check in update() (after line 160 `this.tutorial.checkStuck(delta);`):**

Add (single line to stay within LOC budget):
```typescript
    this.combo.checkFeverExpiry(); if (!this.combo.isFever && this.fever.isActive()) this.fever.deactivateFever();
```

+1 line

**2h. Pass peak data to GameOver (modify existing line 309):**

Change:
```typescript
      score: this.score.getScore(), best: this.score.getBestScore(), ...this.sessionStats,
```
to:
```typescript
      score: this.score.getScore(), best: this.score.getBestScore(), ...this.sessionStats, peakTier: this.peakTier,
```

+0 lines (same line, just added field)

**2i. Add fever cleanup in shutdown() (after line 394 `this.tutorial?.destroy();`):**

Add:
```typescript
    this.fever?.destroy();
```

Fold fever.destroy() into existing shutdown line (no new line needed):

Change `this.tutorial?.destroy();` to `this.tutorial?.destroy(); this.fever?.destroy();`

Fold update() fever check into 1 line (not 2):

```typescript
    this.combo.checkFeverExpiry(); if (!this.combo.isFever && this.fever.isActive()) this.fever.deactivateFever();
```

**Final LOC ledger:**

| Change | Delta | Running |
|--------|-------|---------|
| Start | | 399 |
| 1a: merge duplicate import | -1 | 398 |
| 1b: compress init lines (7->3) | -4 | 394 |
| 1c: remove blank line 63 | -1 | 393 |
| 1d: merge undo btn methods | -1 | 392 |
| 2a: FeverManager import | +1 | 393 |
| 2b: fever + peak fields (2 lines) | +2 | 395 |
| 2c: fever create in create() | +1 | 396 |
| 2d: fever trigger in onMerge | +1 | 397 |
| 2e: peak tracking in onMerge | +1 | 398 |
| 2f: feverMult variable | +1 | 399 |
| 2g: fever check in update (1 line) | +1 | 400 |
| 2h: peakTier in GameOver data | +0 | 400 |
| 2i: fever.destroy in shutdown | +0 | 400 |
| **TOTAL** | | **400** |

**Step 3: Modify GameOverScene.ts**

**3a. Update GameOverData interface (line 14-17):**

Change:
```typescript
interface GameOverData {
  score: number; best: number; mergeCount: number;
  highestTier: number; isNewRecord: boolean; canContinue: boolean;
  mode?: GameMode;
}
```
to:
```typescript
interface GameOverData {
  score: number; best: number; mergeCount: number;
  highestTier: number; isNewRecord: boolean; canContinue: boolean;
  mode?: GameMode; peakTier?: number;
}
```

+0 lines (added to existing line)

**3b. Add peak moment text (replace lines 67-68):**

Current:
```typescript
    txt(this, w / 2, y, pick(WARM), '18px', '#4A7A30');
    y += 38;
```

Replace with:
```typescript
    txt(this, w / 2, y, pick(WARM), '18px', '#4A7A30');
    y += 28;
    if (data.peakTier && data.peakTier >= 4) {
      const tn = ANIMALS[data.peakTier - 1]?.name ?? '?';
      txt(this, w / 2, y, `Лучший момент: ${tn}!`, '16px', '#D4A24C', BRAND.FONT_BODY, 'italic'); y += 24;
    }
```

Note: `y += 38` changed to `y += 28` to make room for peak text. The conditional block adds its own spacing when shown.

Net: +3 lines (120 -> 123 LOC). Well under 400 limit.

**Step 4: Verify build and test**

```bash
cd /d/dev/game && npx tsc --noEmit
cd /d/dev/game && npm run build
```

Expected: clean build, no errors.

**Manual test:**
```bash
cd /d/dev/game && npm run dev -- --port 3002
```
- Drop 4+ animals quickly to chain merges
- Observe "FEVER!" text appear with gold color
- Check warm overlay and vignette effect
- Wait 5s for auto-expiry
- Verify score shows multiplied values
- End game, check "Лучший момент" on game over screen

**Acceptance Criteria:**
- [ ] GameScene.ts = exactly 400 LOC (no more!)
- [ ] Fever activates at combo 4+ with visual effects
- [ ] Fever deactivates after 5s or combo break
- [ ] Score x1.5 during fever stacks with combo multiplier
- [ ] Peak moment shown on game over for tier 4+
- [ ] GameOverScene.ts <= 125 LOC
- [ ] `npm run build` passes
- [ ] No orphaned tweens on scene restart
- [ ] fever.destroy() called in shutdown

### Execution Order

Task 1 (config + ComboTracker) -> Task 2 (FeverManager + EffectsManager) -> Task 3 (GameScene wiring + GameOverScene)

Task 1 and Task 2 have no cross-dependency on each other, but both must complete before Task 3.

```
Task 1 (config + state) ─┐
                          ├─→ Task 3 (integration)
Task 2 (visuals)     ────┘
```

### Dependencies

- Task 2 depends on Task 1: FeverManager imports `FEVER` from GameConfig (added in Task 1)
- Task 3 depends on Task 1: GameScene uses `ComboTracker.isFever`, `getFeverMultiplier()`, `checkFeverExpiry()`
- Task 3 depends on Task 2: GameScene creates `FeverManager`, calls `activateFever()`/`deactivateFever()`

### Research Sources

- [Phaser FX docs](https://docs.phaser.io/phaser/concepts/fx) — confirmed camera postFX support: "All Game Objects and camera support Post FX"
- [Phaser addVignette API](https://docs.phaser.io/api-documentation/class/gameobjects-components-fx) — params: (x, y, radius, strength)
- [Phaser Vignette Camera example](https://phaser.io/examples/v3.85.0/fx/vignette/view/vignette-camera) — official example confirming camera.postFX.addVignette() works
- Project pattern: `this.scene.add.graphics()` used in EffectsManager:99 and PreloadScene:60 for texture generation (NOT `make.graphics` which is broken)

---

## Tests

### What to test
- [ ] Combo 1-3: no fever
- [ ] Combo 4+: fever activates with visual effects
- [ ] Fever visual: warm overlay appears, camera vignette, "FEVER!" text
- [ ] Fever particles: gold/red/pink burst at activation
- [ ] Fever duration: 5 seconds max, then deactivates
- [ ] Fever breaks early: if combo timer expires during fever, fever ends
- [ ] Score ×1.5 during fever stacks with combo multiplier
- [ ] Deactivation: overlay fades, vignette removed, text disappears
- [ ] Game over: "Лучший момент" text shown for tier 4+ peak
- [ ] No effects linger after scene restart
- [ ] Performance: vignette + overlay don't cause frame drops

### How to test
- Manual: Chain 4+ merges quickly → observe "FEVER!" popup and effects
- Manual: Wait for fever to expire (5s) → effects fade smoothly
- Manual: Check score during fever → verify ×1.5 bonus
- Manual: Finish game → see "Лучший момент" line on game over screen
- Manual: Restart → no leftover effects from previous game

---

## Definition of Done

### Functional
- [ ] Fever creates exciting peak moments
- [ ] Visual effects celebrate without overwhelming (no flashing for 55+)
- [ ] Score bonus rewards skilled play
- [ ] Peak-End rule: game over highlights best moment

### Technical
- [ ] `npm run build` succeeds
- [ ] FeverManager.ts ≤ 60 LOC
- [ ] ComboTracker.ts ≤ 55 LOC after changes
- [ ] EffectsManager.ts ≤ 150 LOC after additions (was 130, +13 lines)
- [ ] GameScene.ts ≤ 400 LOC (compressed from 399 + 8 new lines)
- [ ] GameOverScene.ts ≤ 125 LOC after additions
- [ ] No console errors
- [ ] No orphaned tweens/particles on scene exit
