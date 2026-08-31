# Feature: [FTR-027] Onboarding & Tutorial
**Status:** queued | **Priority:** P0 | **Date:** 2026-03-05

## Why
Tutorial Hints (Score 2.60) + Hints on Stuck (2.35) + Endowed Progress (2.60) + Difficulty Adaptation (2.35): PMC/NIH исследование (2020): "frustration from confusion" — #1 причина оттока у игроков 55+. Повторяющиеся туториалы (DG19) эффективнее одноразовых. Для ЦА 55+ женщин: пошаговое раскрытие (step-by-step disclosure) снижает когнитивную нагрузку. Endowed Progress (Nunes & Dreze 2006): "2 из 8 уже собрано" мотивирует сильнее, чем "0 из 8".

## Context
Depends on FTR-003 (Animal.ts), FTR-005 (GameScene), FTR-004 (Core Mechanics). Currently: NO tutorial at all. New players see empty container with no explanation. GameScene.update() only calls checkGameOver(). No firstRun flags in PersistedData.

**Current GameScene.ts (341 LOC → ~376 after Sprint 3-4):**
```typescript
update(_time: number, delta: number): void {
  if (this.phase !== 'playing') return;
  this.checkGameOver(delta);
}
```

**Current PersistedData:** Has `v`, `best`, `sound`, `discoveredTiers`, `streak`, `missions`, `career`, `unlockedAchievements`, `dailyChallenge`. No tutorial tracking.

**Key verified APIs:**
- Phaser 3 tweens: smooth animations for hint overlays
- `this.scene.pause()` / `this.scene.resume()` — can pause game during tutorial steps
- Container overlay approach: tutorial UI as depth-layered elements over game

**Design decision: Event-driven hints** — TutorialManager listens to game events and shows contextual hints. No forced pauses except first launch. Hints auto-dismiss after action is performed.

## Research Reference
- G14: Tutorial Hints (Score 2.60) — contextual hints when player doesn't merge
- V15: Подсказки при застревании (Score 2.35) — visual highlight of mergeable pairs
- P8: Endowed Progress Effect (Score 2.60) — part of progress "gifted" on first launch
- G13: Difficulty Adaptation (Score 2.35) — slower start for 55+

---

## Scope
**In scope:** TutorialManager with 3-step tutorial on first launch, contextual hints when stuck (no merge for 5s), endowed progress display on first bestiary visit, gentle gravity ramp for first 5 drops
**Out of scope:** Interactive drag-and-drop tutorial, per-feature tutorials for advanced mechanics (missions, bestiary), tutorial skip button (auto-completes after steps done), settings toggle for hints

---

## Allowed Files
**New files allowed:**
1. `src/game/TutorialManager.ts` — step tracking, hint display, stuck detection (~65 LOC)

**Modify:**
2. `src/scenes/GameScene.ts` — create TutorialManager, hook into events (+5 lines)
3. `src/config/GameConfig.ts` — add TUTORIAL config constants (+8 lines)
4. `src/game/ScoreManager.ts` — add tutorialData to PersistedData, migration (+5 lines)
5. `src/objects/Animal.ts` — add highlight pulse for merge hint (+5 LOC)

**FORBIDDEN:** MergeDetector.ts, PhysicsManager.ts, AnimalSpawner.ts, AudioManager.ts, SDK files, MenuScene.ts.

---

## Design

### Config Constants

```typescript
export const TUTORIAL = {
  STEPS: [
    { id: 'tap_to_drop', hint: 'Нажмите, чтобы бросить зверька!', event: 'animal_dropped' },
    { id: 'first_merge', hint: 'Одинаковые зверята сливаются!', event: 'merge_completed' },
    { id: 'keep_going', hint: 'Собирайте всех зверят! 🐻', event: 'score_200' },
  ] as const,
  STUCK_THRESHOLD_MS: 5000,   // show hint after 5s of no drops
  HINT_FADE_DURATION: 300,    // ms
  GRAVITY_RAMP_DROPS: 5,      // first N drops at reduced gravity
  GRAVITY_RAMP_MULT: 0.7,     // 70% gravity for first drops
} as const;
```

### PersistedData Extension

```typescript
// Add to PersistedData
tutorialData: {
  completed: boolean;      // all 3 steps done
  currentStep: number;     // 0-2
  gamesPlayed: number;     // for stuck detection heuristic
};
```

Migration: if `tutorialData` missing → `{ completed: false, currentStep: 0, gamesPlayed: 0 }`.

### TutorialManager (~65 LOC)

```typescript
/**
 * Module: TutorialManager
 * Role: Step-by-step tutorial on first launch, contextual stuck hints
 * Uses: config/GameConfig (TUTORIAL), ScoreManager (persistence), GameEvents
 * Used by: GameScene (created in create(), listens to events)
 * Does NOT: Modify physics, manage score, control spawning
 */
```

**Public API:**
- `constructor(scene: Phaser.Scene)` — loads tutorial state, subscribes to events
- `isActive(): boolean` — true if tutorial not completed
- `getGravityMultiplier(): number` — 0.7 for first 5 drops, then 1.0
- `checkStuck(delta: number): void` — called from update(), shows hint if stuck
- `destroy(): void` — cleanup

**Implementation:**
```typescript
export class TutorialManager {
  private scene: Phaser.Scene;
  private completed: boolean;
  private currentStep: number;
  private dropCount = 0;
  private stuckTimer = 0;
  private hintText: Phaser.GameObjects.Text | null = null;
  private hintBg: Phaser.GameObjects.Rectangle | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const data = loadData();
    const td = data.tutorialData || { completed: false, currentStep: 0, gamesPlayed: 0 };
    this.completed = td.completed;
    this.currentStep = td.currentStep;

    if (!this.completed) {
      this.showCurrentHint();
      this.listenForProgress();
    }
  }

  isActive(): boolean { return !this.completed; }

  getGravityMultiplier(): number {
    if (this.dropCount < TUTORIAL.GRAVITY_RAMP_DROPS) return TUTORIAL.GRAVITY_RAMP_MULT;
    return 1.0;
  }

  onDrop(): void {
    this.dropCount++;
    this.stuckTimer = 0;
    if (this.currentStep === 0) this.advanceStep();
  }

  onMerge(): void {
    this.stuckTimer = 0;
    if (this.currentStep === 1) this.advanceStep();
  }

  onScoreReached(score: number): void {
    if (this.currentStep === 2 && score >= 200) this.advanceStep();
  }

  checkStuck(delta: number): void {
    if (this.completed) return;
    this.stuckTimer += delta;
    if (this.stuckTimer >= TUTORIAL.STUCK_THRESHOLD_MS) {
      this.showCurrentHint();
      this.stuckTimer = 0;
    }
  }

  private advanceStep(): void {
    this.hideHint();
    this.currentStep++;
    if (this.currentStep >= TUTORIAL.STEPS.length) {
      this.completed = true;
    } else {
      // Show next hint after short delay
      this.scene.time.delayedCall(500, () => this.showCurrentHint());
    }
    this.save();
  }

  private showCurrentHint(): void {
    if (this.completed || this.currentStep >= TUTORIAL.STEPS.length) return;
    this.hideHint();

    const { width, height } = this.scene.cameras.main;
    const step = TUTORIAL.STEPS[this.currentStep];

    // Semi-transparent background
    this.hintBg = this.scene.add.rectangle(width / 2, height * 0.25, width * 0.8, 50, 0x3D2B1F, 0.85)
      .setDepth(100).setAlpha(0);
    this.hintText = this.scene.add.text(width / 2, height * 0.25, step.hint, {
      fontFamily: BRAND.FONT_BODY,
      fontSize: '20px',
      color: '#FFFFFF',
      align: 'center',
    }).setOrigin(0.5).setDepth(101).setAlpha(0);

    // Fade in
    this.scene.tweens.add({ targets: [this.hintBg, this.hintText], alpha: 1, duration: TUTORIAL.HINT_FADE_DURATION });
  }

  private hideHint(): void {
    if (this.hintText) {
      this.scene.tweens.add({
        targets: [this.hintBg, this.hintText],
        alpha: 0,
        duration: TUTORIAL.HINT_FADE_DURATION,
        onComplete: () => {
          this.hintText?.destroy();
          this.hintBg?.destroy();
          this.hintText = null;
          this.hintBg = null;
        },
      });
    }
  }

  private save(): void {
    const data = loadData();
    data.tutorialData = { completed: this.completed, currentStep: this.currentStep, gamesPlayed: (data.tutorialData?.gamesPlayed || 0) + 1 };
    saveData(data);
  }

  destroy(): void {
    this.hintText?.destroy();
    this.hintBg?.destroy();
  }
}
```

### Animal.ts Changes (+5 LOC)

Add method for merge hint highlighting:
```typescript
/** Pulse highlight to suggest merge possibility */
showMergeHint(): void {
  if (!this.sprite) return;
  this.scene.tweens.add({
    targets: this.sprite, alpha: 0.5, duration: 300, yoyo: true, repeat: 2
  });
}
```

This is used by TutorialManager when player is stuck — find two same-tier animals and pulse them.

### GameScene Integration (+5 lines)

```typescript
// In create():
this.tutorial = new TutorialManager(this);

// In onDropRequested():
this.tutorial.onDrop();

// In onMerge():
this.tutorial.onMerge();

// In update():
this.tutorial.checkStuck(delta);
```

### Gravity Ramp Integration

```typescript
// In onDropRequested() — modify gravity for first drops:
const gravMult = this.tutorial.getGravityMultiplier();
if (gravMult !== 1.0) {
  // Apply temporary reduced gravity via body scale
  const body = animal.body as MatterJS.BodyType;
  // Matter.js: gravityScale affects per-body gravity
  (body as any).plugin = { ...(body as any).plugin, gravity: { scale: { x: 1, y: gravMult } } };
}
```

Note: Matter.js `Body.set(body, 'plugin', { gravity: { scale: { y: 0.7 } } })` is the official per-body gravity override. This only affects first 5 drops.

---

## Implementation Plan

### Task 1: Create TutorialManager + config + persistence
**Type:** code
**Files:**
  - modify: `src/config/GameConfig.ts` — add TUTORIAL config constants
  - create: `src/game/TutorialManager.ts` — step tracking, hint display, stuck detection, gravity ramp
  - modify: `src/game/ScoreManager.ts` — add tutorialData to PersistedData, migration
  - modify: `src/objects/Animal.ts` — add showMergeHint() pulse method
**Acceptance:** TutorialManager shows 3-step tutorial on first launch, hints re-appear when stuck for 5s, gravity is 70% for first 5 drops

### Task 2: Wire TutorialManager to GameScene
**Type:** code
**Files:**
  - modify: `src/scenes/GameScene.ts` — create TutorialManager, hook onDrop/onMerge/checkStuck, apply gravity ramp (+5 lines)
**Acceptance:** First game shows tutorial overlay with contextual hints, hints dismiss after action, gravity ramp makes first drops gentler

### Execution Order
1 → 2

---

## Tests

### What to test
- [ ] First launch: tutorial step 1 appears ("Нажмите, чтобы бросить зверька!")
- [ ] After first drop: step 1 clears, step 2 appears after delay
- [ ] After first merge: step 2 clears, step 3 appears
- [ ] After reaching 200 score: tutorial completes
- [ ] Tutorial state persists — second game doesn't show tutorial
- [ ] 5 seconds without drop → hint re-appears (stuck detection)
- [ ] First 5 drops have reduced gravity (70%)
- [ ] Drop 6+ has normal gravity
- [ ] Hint text readable (20px, high contrast)
- [ ] No performance impact from stuck timer

### How to test
- Manual: Clear localStorage → start game → observe 3-step tutorial
- Manual: Wait 5+ seconds without dropping → verify hint re-appears
- Manual: First drops visibly slower (gentler fall)
- Manual: Close/reopen → verify tutorial doesn't repeat

---

## Definition of Done

### Functional
- [ ] 3-step tutorial guides new players naturally
- [ ] Stuck hints re-appear contextually
- [ ] Gravity ramp eases first experience
- [ ] Tutorial feels helpful, not intrusive

### Technical
- [ ] `npm run build` succeeds
- [ ] TutorialManager.ts ≤ 70 LOC
- [ ] Animal.ts ≤ 130 LOC after changes
- [ ] GameScene additions ≤ 8 lines
- [ ] No console errors
- [ ] Tutorial state persists correctly
