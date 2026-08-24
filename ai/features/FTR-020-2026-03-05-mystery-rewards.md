# Feature: [FTR-020] Mystery Rewards
**Status:** queued | **Priority:** P0 | **Date:** 2026-03-05

## Why
Variable Ratio Reinforcement (Score 2.75 + Psychology Score 3.00): непредсказуемость награды = максимальная вовлечённость. Дофамин от ОЖИДАНИЯ, не от самой награды (Schultz 1997). Самый устойчивый паттерн по Скиннеру. Candy Crush "Sugar Rush", Suika "Golden Fruit" — случайный бонус ×2 создаёт моменты неожиданной радости.

## Context
Depends on FTR-005 (GameScene), FTR-010 (ComboTracker for multiplier integration). Currently: every merge gives same base score × combo multiplier. No randomized bonus events.

**Research finding:** Optimal variable ratio for casual = VR-10 (avg 1 reward per 10 merges). Pity counter at 20 prevents "bad luck" frustration. Mystery rewards should feel like a surprise, not a regular mechanic.

## Research Reference
- S7: Variable Ratio Mystery Rewards (Score 2.75)
- P2: Variable Ratio Reinforcement (Score 3.00)

---

## Scope
**In scope:** MysteryRewardManager with VR-10 + pity counter, 3 reward types (score boost, brief golden mode, score shower), visual popup for mystery reward, per-session state (no persistence needed)
**Out of scope:** Collectible rewards (stickers), rewarded ad to double mystery reward, mystery reward sounds (AudioManager handles in FTR-008), inventory system

---

## Allowed Files
**New files allowed:**
1. `src/game/MysteryRewardManager.ts` — reward probability + pity counter (~60 LOC)

**Modify:**
2. `src/scenes/GameScene.ts` — wire MysteryRewardManager to onMerge, show reward popup (~15 lines)
3. `src/config/GameConfig.ts` — add MYSTERY_REWARDS config constants

**FORBIDDEN:** MergeDetector.ts, Animal.ts, PhysicsManager.ts, ScoreManager.ts internals, SDK files.

---

## Design

### Config Constants

```typescript
export const MYSTERY = {
  BASE_CHANCE: 0.1,          // 1 in 10 merges (VR-10)
  PITY_THRESHOLD: 20,        // guaranteed reward after 20 dry merges
  SCORE_BOOST_MULT: 3,       // ×3 score for this merge
  GOLDEN_DURATION_MS: 5000,  // golden mode lasts 5 seconds
  GOLDEN_MULT: 2,            // ×2 all scores during golden mode
} as const;
```

### Reward Types

```typescript
export type MysteryRewardType = 'score_boost' | 'golden_mode' | 'score_shower';
```

| Type | Effect | Visual | Frequency Weight |
|------|--------|--------|-----------------|
| `score_boost` | This merge scores ×3 | "×3!" gold text flash | 50% |
| `golden_mode` | All merges ×2 for 5 seconds | Gold tint on screen edges, timer bar | 30% |
| `score_shower` | Bonus +100 points with particle rain | Falling star particles + "+100" | 20% |

### MysteryRewardManager (~60 LOC)

```typescript
/**
 * Module: MysteryRewardManager
 * Role: Decides if a mystery reward triggers on merge, selects reward type
 * Uses: config/GameConfig (MYSTERY)
 * Used by: GameScene (onMerge)
 * Does NOT: Display UI, modify score, play sounds
 */
```

**State (per-session, no persistence):**
```typescript
private mergesSinceReward = 0;   // pity counter
private goldenModeActive = false;
private goldenModeEndTime = 0;
```

**Public API:**
- `checkMerge(): MysteryRewardType | null` — called on each merge, returns reward or null
- `isGoldenMode(): boolean` — true if golden mode active
- `getGoldenMultiplier(): number` — 2 if golden, 1 otherwise
- `update(time: number): void` — check golden mode expiry

**Probability logic:**
```typescript
checkMerge(): MysteryRewardType | null {
  this.mergesSinceReward++;

  let triggered = false;

  // Pity: guaranteed after threshold
  if (this.mergesSinceReward >= MYSTERY.PITY_THRESHOLD) {
    triggered = true;
  } else {
    // Variable ratio: BASE_CHANCE per merge
    triggered = Math.random() < MYSTERY.BASE_CHANCE;
  }

  if (!triggered) return null;

  this.mergesSinceReward = 0;

  // Weighted random: 50% boost, 30% golden, 20% shower
  const roll = Math.random();
  if (roll < 0.5) return 'score_boost';
  if (roll < 0.8) return 'golden_mode';
  return 'score_shower';
}
```

### GameScene Integration (~15 lines)

In create():
```typescript
this.mysteryRewards = new MysteryRewardManager();
```

In onMerge(), after existing combo logic:
```typescript
// Mystery reward check
const reward = this.mysteryRewards.checkMerge();
if (reward) {
  this.handleMysteryReward(reward, mergeX, mergeY, result.scoreAwarded);
}

// Golden mode multiplier (stacks with combo)
const goldenMult = this.mysteryRewards.getGoldenMultiplier();
const finalScore = Math.round(result.scoreAwarded * comboMultiplier * goldenMult);
```

In update():
```typescript
this.mysteryRewards.update(this.time.now);
// Update golden mode visual if active/expired
```

### handleMysteryReward() in GameScene

```typescript
private handleMysteryReward(type: MysteryRewardType, x: number, y: number, baseScore: number): void {
  switch (type) {
    case 'score_boost':
      // Show "×3!" at merge point, large gold text
      this.showRewardText(x, y, '×3!', '#FFD700', 36);
      // Score boost applied via multiplier in onMerge calculation
      break;

    case 'golden_mode':
      this.mysteryRewards.activateGoldenMode(this.time.now);
      // Gold tint overlay on screen edges
      this.showGoldenOverlay();
      this.showRewardText(x, y, 'Золотой режим!', '#FFD700', 28);
      break;

    case 'score_shower':
      // Bonus points
      this.score.addScore(100);
      // Rain particles from top
      this.showScoreShower();
      this.showRewardText(x, y, '+100', '#FFD700', 32);
      break;
  }
}
```

### Visual Effects

**Score Boost ("×3!"):**
- Large gold text at merge point, Marmelad 36px
- Scale from 0 → 1.5 → 1.0 (200ms), then float up + fade (600ms)

**Golden Mode:**
- Two vertical gold gradient rectangles on screen edges (left/right, alpha 0.15)
- Small timer bar at top (width decreasing over 5 seconds)
- All merge particles become gold-tinted during golden mode
- Fade out when golden mode ends

**Score Shower:**
- 10-15 small star shapes (circles, gold color) rain from top of screen
- Random X positions, fall with slight spread, fade at bottom
- Duration: 1 second

---

## Implementation Plan

### Task 1: Create MysteryRewardManager + config
**Type:** code
**Files:**
  - modify: `src/config/GameConfig.ts` — add MYSTERY constants, MysteryRewardType type
  - create: `src/game/MysteryRewardManager.ts` — VR-10 probability + pity counter + golden mode timer
**Acceptance:** MysteryRewardManager.checkMerge() triggers rewards at ~10% rate with pity at 20, golden mode times out correctly

### Task 2: Wire rewards to GameScene with visuals
**Type:** code
**Files:**
  - modify: `src/scenes/GameScene.ts` — create MysteryRewardManager, wire to onMerge, handleMysteryReward(), golden mode overlay, score shower particles (~15 lines orchestration + ~40 lines visual helpers)
**Acceptance:** Mystery rewards trigger during gameplay with visual feedback, golden mode applies ×2 multiplier to all merges for 5s, score shower adds bonus points with particles

### Execution Order
1 → 2

---

## Tests

### What to test
- [ ] Mystery reward triggers approximately 1 in 10 merges (play 30+ merges)
- [ ] Pity counter guarantees reward after 20 dry merges
- [ ] Score boost: merge score shows ×3 value
- [ ] Golden mode: ×2 multiplier active for 5 seconds
- [ ] Golden mode: visual overlay visible during active period
- [ ] Golden mode: multiplier returns to normal after 5s
- [ ] Score shower: +100 bonus points added
- [ ] Score shower: falling star particles visible
- [ ] No reward on first merge (counter starts at 0)
- [ ] Multiple golden modes don't stack (just refresh timer)

### How to test
- Manual: Play extended session (50+ merges), observe reward frequency
- Manual: Count dry merges — should never exceed 20 without reward
- Manual: During golden mode, verify score text shows higher values

---

## Definition of Done

### Functional
- [ ] Mystery rewards trigger at variable rate (~10% per merge)
- [ ] Pity counter prevents frustration (guaranteed at 20)
- [ ] 3 reward types with distinct visual feedback
- [ ] Golden mode applies timed multiplier
- [ ] Score shower adds bonus points
- [ ] Rewards feel surprising and rewarding

### Technical
- [ ] `npm run build` succeeds
- [ ] MysteryRewardManager.ts ≤ 70 LOC
- [ ] GameScene additions ≤ 60 lines (including visual helpers)
- [ ] No console errors
- [ ] No performance issues from particle effects
