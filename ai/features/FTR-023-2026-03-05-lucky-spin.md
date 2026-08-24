# Feature: [FTR-023] Lucky Spin / Колесо Удачи
**Status:** queued | **Priority:** P1 | **Date:** 2026-03-05

## Why
Lucky Spin (Score 2.60): раз в день бесплатный спин. Доп. спин за rewarded ad. Appointment mechanic — причина зайти сегодня. Coin Master: lucky spin = #1 daily retention mechanic в casual играх. Для ЦА 55+ женщин — визуальное "колесо фортуны" знакомо и привлекательно (ТВ-шоу, лотереи).

## Context
Depends on FTR-005 (scenes), FTR-014 (rewarded ads). Currently: daily streak (FTR-013) is the only appointment mechanic. Lucky spin adds second reason to return daily.

**Current MenuScene.ts: ~144 LOC** (post Sprint 1-2). Sprint 3 adds ~30 LOC for mode buttons → ~174 LOC. Sprint 4 adds ~12 for spin button → ~186 LOC. Within 400 limit.

**Verified APIs:**
- Phaser 3 tweens: `this.tweens.add({ targets, angle, ease: 'Cubic.easeOut' })` — smooth wheel rotation
- Weighted random: standard JS `Math.random()` with cumulative weights
- `showRewarded()` already implemented in IPlatformBridge (FTR-014)

**Legal check (research):** Free spin (no IAP) = no gambling regulations in EU/Russia. If paid spins added later — must show probabilities explicitly (EU, Belgium/Netherlands stricter).

## Research Reference
- S12: Lucky Spin / Колесо Удачи (Score 2.60)

---

## Scope
**In scope:** LuckySpinScene with animated wheel (6 segments), 1 free spin/day, extra spin for rewarded ad, score-based rewards (bonuses for next game), reward popup, spin button on MenuScene
**Out of scope:** Paid spins (IAP), cosmetic rewards from spin (needs FTR-026 first), spin history, weekly jackpot, multi-spin

---

## Allowed Files
**New files allowed:**
1. `src/scenes/LuckySpinScene.ts` — wheel animation, reward display (~100 LOC)
2. `src/game/SpinRewardManager.ts` — weighted random, reward table, persistence (~50 LOC)

**Modify:**
3. `src/scenes/MenuScene.ts` — add spin button with "Доступно!" indicator (+12 lines)
4. `src/config/GameConfig.ts` — add SPIN config, SpinReward type (+10 lines)
5. `src/game/ScoreManager.ts` — add spinData to PersistedData, migration (+8 lines)
6. `src/scenes/PreloadScene.ts` — register LuckySpinScene (+2 lines)

**FORBIDDEN:** GameScene.ts, Animal.ts, MergeDetector.ts, PhysicsManager.ts, AudioManager.ts, SDK files.

---

## Design

### Config Constants

```typescript
export type SpinRewardType = 'score_bonus' | 'score_multiplier' | 'extra_spin';

export interface SpinReward {
  type: SpinRewardType;
  value: number;        // amount for score_bonus, multiplier for score_multiplier, 0 for extra_spin
  label: string;        // display text on wheel segment
  color: number;        // hex color for segment
  weight: number;       // probability weight (higher = more common)
}

export const SPIN = {
  SEGMENTS: [
    { type: 'score_bonus',      value: 100, label: '+100',   color: 0xEDE0C4, weight: 35 },
    { type: 'score_multiplier', value: 2,   label: '×2',     color: 0xD4A24C, weight: 25 },
    { type: 'score_bonus',      value: 500, label: '+500',   color: 0xE8D5A3, weight: 20 },
    { type: 'extra_spin',       value: 0,   label: 'Ещё!',   color: 0x4A7A30, weight: 10 },
    { type: 'score_bonus',      value: 1000,label: '+1000',  color: 0xFFD700, weight: 7 },
    { type: 'score_multiplier', value: 3,   label: '×3!',    color: 0xC44832, weight: 3 },
  ] as SpinReward[],
  SPIN_DURATION_MS: 4000,      // wheel rotation time
  MIN_ROTATIONS: 5,            // minimum full spins before stopping
  MAX_ROTATIONS: 8,
  MAX_AD_SPINS_PER_DAY: 2,    // max extra spins from rewarded ads
} as const;
```

### PersistedData Extension

```typescript
// Add to PersistedData
spinData: {
  lastSpinDate: string;              // 'YYYY-MM-DD' of last free spin
  adSpinsToday: number;              // rewarded ad spins used today
  pendingBonus: {                    // consumed at next game start
    type: 'score_bonus' | 'score_multiplier';
    value: number;
  } | null;
};
```

Migration: if `spinData` missing → `{ lastSpinDate: '', adSpinsToday: 0, pendingBonus: null }`.

### SpinRewardManager (~50 LOC)

```typescript
/**
 * Module: SpinRewardManager
 * Role: Weighted random selection, spin availability, reward persistence
 * Uses: config/GameConfig (SPIN), ScoreManager (persistence)
 * Used by: LuckySpinScene (spin action), GameScene (consume pending bonus)
 * Does NOT: Display UI, animate wheel, manage ads
 */
```

**Public API:**
- `canFreeSpin(): boolean` — true if lastSpinDate !== today
- `canAdSpin(): boolean` — true if adSpinsToday < MAX_AD_SPINS_PER_DAY
- `spin(): SpinReward` — weighted random selection + update persistence
- `consumeBonus(): { type: string; value: number } | null` — get & clear pending bonus
- `getSegmentIndex(reward: SpinReward): number` — for wheel animation target angle

**Weighted random:**
```typescript
spin(): SpinReward {
  const segments = SPIN.SEGMENTS;
  const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const segment of segments) {
    roll -= segment.weight;
    if (roll <= 0) return segment;
  }
  return segments[segments.length - 1];
}
```

### LuckySpinScene (~100 LOC)

```typescript
/**
 * Module: LuckySpinScene
 * Role: Animated wheel display, spin button, reward popup
 * Uses: SpinRewardManager, IPlatformBridge (rewarded ads)
 * Used by: MenuScene (scene transition)
 * Does NOT: Manage score persistence, calculate probabilities
 */
```

**Layout:**
```
┌──────────────────────────┐
│  [←]  Колесо Удачи       │  ← Back button + title
│                          │
│       ▼ (indicator)      │
│    ┌──────────┐          │
│    │          │          │
│    │  WHEEL   │          │  ← 6 colored segments, 280px diameter
│    │  (spins) │          │
│    │          │          │
│    └──────────┘          │
│                          │
│  [ Крутить! ]            │  ← Primary button (ochre, 220x52)
│  [ За рекламу +1 ]      │  ← Secondary (if ad spin available)
│                          │
│  Бонус: ×2 к следующей!  │  ← Current pending bonus display
└──────────────────────────┘
```

**Wheel rendering (Graphics + Text):**
```typescript
private drawWheel(): void {
  const cx = this.cameras.main.width / 2;
  const cy = this.cameras.main.height * 0.4;
  const radius = 140;
  const segments = SPIN.SEGMENTS;
  const sliceAngle = (Math.PI * 2) / segments.length;

  this.wheelContainer = this.add.container(cx, cy);

  segments.forEach((seg, i) => {
    const startAngle = i * sliceAngle - Math.PI / 2;
    const graphics = this.add.graphics();
    graphics.fillStyle(seg.color, 1);
    graphics.slice(0, 0, radius, startAngle, startAngle + sliceAngle, false);
    graphics.fillPath();
    graphics.lineStyle(2, 0x3D2B1F, 0.3);
    graphics.strokePath();
    this.wheelContainer.add(graphics);

    // Label at segment center
    const labelAngle = startAngle + sliceAngle / 2;
    const labelR = radius * 0.65;
    const text = this.add.text(
      Math.cos(labelAngle) * labelR,
      Math.sin(labelAngle) * labelR,
      seg.label,
      { fontFamily: BRAND.FONT_BODY, fontSize: '18px', color: '#3D2B1F', align: 'center' }
    ).setOrigin(0.5).setAngle(Phaser.Math.RadToDeg(labelAngle) + 90);
    this.wheelContainer.add(text);
  });

  // Indicator triangle at top
  const indicator = this.add.triangle(cx, cy - radius - 15, 0, 0, -12, -20, 12, -20, 0xC44832);
  indicator.setDepth(10);
}
```

**Spin animation:**
```typescript
private async executeSpin(): Promise<void> {
  if (this.isSpinning) return;
  this.isSpinning = true;

  // 1. Determine winner BEFORE animation
  const reward = this.rewardManager.spin();
  const segmentIndex = this.rewardManager.getSegmentIndex(reward);
  const sliceDeg = 360 / SPIN.SEGMENTS.length;

  // 2. Calculate target angle (indicator at top = 270°)
  const targetSliceDeg = 270 - (segmentIndex * sliceDeg + sliceDeg / 2);
  const fullRotations = Phaser.Math.Between(SPIN.MIN_ROTATIONS, SPIN.MAX_ROTATIONS) * 360;
  const finalAngle = fullRotations + targetSliceDeg;

  // 3. Tween with easeOut
  this.tweens.add({
    targets: this.wheelContainer,
    angle: finalAngle,
    duration: SPIN.SPIN_DURATION_MS,
    ease: 'Cubic.easeOut',
    onComplete: () => {
      this.isSpinning = false;
      this.showRewardPopup(reward);
    },
  });
}
```

**Reward popup:**
```typescript
private showRewardPopup(reward: SpinReward): void {
  // Overlay panel (similar to streak popup in MenuScene)
  const { width, height } = this.cameras.main;

  // Dim background
  const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5);
  overlay.setInteractive(); // block clicks

  // Reward text
  const rewardText = reward.type === 'extra_spin'
    ? 'Ещё один спин!'
    : reward.type === 'score_multiplier'
      ? `×${reward.value} очков\nв следующей игре!`
      : `+${reward.value} очков\nв следующей игре!`;

  const text = this.add.text(width / 2, height * 0.4, rewardText, {
    fontFamily: BRAND.FONT_DISPLAY,
    fontSize: '28px',
    color: '#FFD700',
    align: 'center',
  }).setOrigin(0.5);

  // Scale-in animation
  text.setScale(0);
  this.tweens.add({ targets: text, scale: 1, duration: 300, ease: 'Back.easeOut' });

  // OK button or auto-spin-again
  if (reward.type === 'extra_spin') {
    this.time.delayedCall(800, () => {
      overlay.destroy();
      text.destroy();
      this.executeSpin(); // auto-spin again!
    });
  } else {
    this.time.delayedCall(1500, () => {
      overlay.destroy();
      text.destroy();
      this.updateUI(); // refresh button states
    });
  }
}
```

### MenuScene Integration (+12 lines)

Add spin button below bestiary:
```
Current layout (post Sprint 3):
  Title: Y = 180
  Best: Y = 300
  [Играть]       Y = 400
  [Ежедневная]   Y = 465
  [Без стресса]  Y = 530
  [Бестиарий]    Y = 600 (moved down)

Add spin button:
  [🎡 Колесо!]   Y = 660 (if canFreeSpin or canAdSpin → add "!" indicator)
```

```typescript
// Spin button with availability indicator
const spinMgr = new SpinRewardManager();
const spinAvailable = spinMgr.canFreeSpin() || spinMgr.canAdSpin();
const spinBtn = this.createButton(width / 2, 660, spinAvailable ? 'Колесо! ✨' : 'Колесо', 0xEDE0C4);
spinBtn.on('pointerup', () => this.scene.start('LuckySpin', { bridge: this.bridge }));
if (spinAvailable) {
  // Pulse animation on button to draw attention
  this.tweens.add({ targets: spinBtn, scale: 1.05, duration: 600, yoyo: true, repeat: -1 });
}
```

### GameScene Bonus Consumption

When starting a new game, check for pending spin bonus:
```typescript
// In GameScene.create() — consume pending bonus
const spinMgr = new SpinRewardManager();
const bonus = spinMgr.consumeBonus();
if (bonus) {
  if (bonus.type === 'score_bonus') {
    this.score.addScore(bonus.value);
    this.effects.showToast(`+${bonus.value} бонус!`);
  } else if (bonus.type === 'score_multiplier') {
    this.sessionBonusMult = bonus.value; // applied to all scores this session
    this.effects.showToast(`×${bonus.value} бонус!`);
  }
}
```

**Note:** The sessionBonusMult is applied in onMerge alongside combo multiplier. This adds ~5 lines to GameScene.

---

## Implementation Plan

### Task 1: Create SpinRewardManager + config
**Type:** code
**Files:**
  - modify: `src/config/GameConfig.ts` — add SPIN config, SpinReward/SpinRewardType types
  - create: `src/game/SpinRewardManager.ts` — weighted random, persistence, bonus management
  - modify: `src/game/ScoreManager.ts` — add spinData to PersistedData, migration
**Acceptance:** SpinRewardManager.spin() returns weighted random reward, canFreeSpin() tracks daily limit, pendingBonus persists across sessions

### Task 2: Create LuckySpinScene with wheel animation
**Type:** code
**Files:**
  - create: `src/scenes/LuckySpinScene.ts` — wheel drawing, spin tween, reward popup, ad spin button
  - modify: `src/scenes/PreloadScene.ts` — register LuckySpinScene
**Acceptance:** Wheel renders with 6 colored segments, spins with easeOut animation, shows reward popup, extra_spin triggers auto-re-spin

### Task 3: Wire to MenuScene + GameScene bonus
**Type:** code
**Files:**
  - modify: `src/scenes/MenuScene.ts` — add spin button with availability indicator, pulse animation
  - modify: `src/scenes/GameScene.ts` — consume pending bonus at game start (+5 lines)
**Acceptance:** Spin button on menu, pending bonus applied at game start with toast notification

### Execution Order
1 → 2 → 3

---

## Tests

### What to test
- [ ] Wheel renders with 6 colored segments and labels
- [ ] Free spin available once per day
- [ ] Wheel animation smooth (Cubic.easeOut, 4 seconds)
- [ ] Wheel stops on correct segment matching reward
- [ ] "Ещё!" reward triggers automatic re-spin
- [ ] Score bonus applied at next game start with toast
- [ ] Score multiplier applied to all merges in next game
- [ ] Rewarded ad grants extra spin
- [ ] Max 2 ad spins per day
- [ ] Spin button on menu shows availability indicator
- [ ] Pending bonus persists across app restart

### How to test
- Manual: Open Lucky Spin, tap spin → observe wheel animation + reward
- Manual: Get "Ещё!" reward → verify auto-re-spin
- Manual: Get score bonus → start game → verify bonus applied
- Manual: Close app, reopen → verify pending bonus still there
- Manual: Spin twice (free + ad) → verify both work, third blocked

---

## Definition of Done

### Functional
- [ ] Animated wheel with 6 weighted segments
- [ ] 1 free spin per day + up to 2 ad spins
- [ ] Rewards applied to next game session
- [ ] "Ещё!" auto-re-spin feels exciting
- [ ] Menu button indicates availability

### Technical
- [ ] `npm run build` succeeds
- [ ] LuckySpinScene.ts ≤ 110 LOC
- [ ] SpinRewardManager.ts ≤ 60 LOC
- [ ] MenuScene additions ≤ 15 lines
- [ ] No console errors
- [ ] No orphaned tweens on scene exit
