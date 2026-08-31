# Feature: [FTR-031] Player Stats & Investment Display
**Status:** queued | **Priority:** P1 | **Date:** 2026-03-05

## Why
Sunk Cost Fallacy (Score 2.40) + Personal Best UI (2.60) + Goal-Gradient Effect (2.35): "С вами 47 дней, собрано 23 мишки, рекорд 12,450" — чем больше вложено, тем сложнее бросить (Arkes & Blumer 1985). "Побейте свой рекорд: 12,450!" — явный вызов на MenuScene мотивирует без соцдавления (Suika, Temple Run). "Почти собрали!" при 1-2 зверях до завершения коллекции — чем ближе к цели, тем энергичнее действие (Hull 1932, Kivetz 2006). Эти 3 психологических паттерна создают retention через осознание вложений.

## Context
Depends on FTR-017 (CareerStats), FTR-012 (Bestiary). Currently: MenuScene.ts (132 LOC) shows best score as plain text. CareerStats has: `totalMerges`, `totalScore`, `gamesPlayed`, `highestTier`, `maxCombo`. BestiaryScene shows discovered animals grid. GameOverScene.ts (116 LOC) shows score, best, and continue/restart buttons.

**Current MenuScene best score display:**
```typescript
// y = h * 0.35, plain text
this.add.text(w / 2, h * 0.35, `Рекорд: ${best}`, { fontSize: '22px', ... });
```

**Current GameOverScene layout:**
```
Score: N               Y varies
Лучший: N              (only if new record)
[Продолжить за ▶]      (if available)
[Ещё раз]
[Меню]
```

**CareerStats available from ScoreManager:**
```typescript
career: {
  totalMerges: number;
  totalScore: number;
  gamesPlayed: number;
  highestTier: number;
  maxCombo: number;
}
```

**Design decision:** Enhance existing UI elements rather than creating new scene. MenuScene gets "Beat your record" text + investment stats. GameOverScene gets goal-gradient hints ("2 зверя до полной коллекции!"). No separate stats scene — keep it minimal.

## Research Reference
- P10: Sunk Cost Fallacy (Score 2.40) — investment display creates attachment
- S2: Personal Best + "Beat Your Record" (Score 2.60) — explicit challenge UI
- P9: Goal-Gradient Effect (Score 2.35) — progress accelerates near completion

---

## Scope
**In scope:** "Побейте рекорд!" challenge text on MenuScene, investment stats display (games played, total merges, days active), goal-gradient hints at game over (nearest uncollected animal, collection progress), career stats in compact format
**Out of scope:** Separate stats scene/dashboard, detailed per-session history, graphs/charts, sharing stats, prestige/reset system, achievement-based goal hints

---

## Allowed Files
**Modify:**
1. `src/scenes/MenuScene.ts` — add "Beat your record" challenge text, investment stats line (+12 lines, total ~144 LOC)
2. `src/scenes/GameOverScene.ts` — add goal-gradient hint (nearest uncollected animal, collection %) (+8 lines, total ~124 LOC)
3. `src/config/GameConfig.ts` — add STATS display thresholds (+3 lines)

**FORBIDDEN:** GameScene.ts, Animal.ts, MergeDetector.ts, PhysicsManager.ts, AnimalSpawner.ts, AudioManager.ts, ScoreManager.ts, SDK files.

---

## Design

### Config Constants

```typescript
export const STATS_DISPLAY = {
  SHOW_CHALLENGE_MIN_GAMES: 3,  // show "Beat your record" after 3 games
  SHOW_INVESTMENT_MIN_GAMES: 5, // show investment stats after 5 games
  GOAL_GRADIENT_THRESHOLD: 0.6, // show "almost done!" when collection > 60%
} as const;
```

### MenuScene Changes (+12 lines)

**Replace plain "Рекорд: N" with challenge UI:**

```typescript
// Instead of simple "Рекорд: N", show challenge-styled text
const career = data.career || { gamesPlayed: 0, totalMerges: 0, totalScore: 0 };

// "Beat your record" challenge (after 3+ games)
if (career.gamesPlayed >= STATS_DISPLAY.SHOW_CHALLENGE_MIN_GAMES && best > 0) {
  this.add.text(w / 2, h * 0.33, `Побейте рекорд: ${best.toLocaleString()}!`, {
    fontFamily: BRAND.FONT_DISPLAY,
    fontSize: '22px',
    color: '#D4A24C',
  }).setOrigin(0.5);
} else if (best > 0) {
  // First few games: plain score
  this.add.text(w / 2, h * 0.33, `Рекорд: ${best.toLocaleString()}`, {
    fontFamily: BRAND.FONT_BODY,
    fontSize: '20px',
    color: BRAND.TEXT_SECONDARY,
  }).setOrigin(0.5);
}

// Investment stats (after 5+ games) — compact one-liner
if (career.gamesPlayed >= STATS_DISPLAY.SHOW_INVESTMENT_MIN_GAMES) {
  const daysActive = calculateDaysActive(data); // from streak data
  this.add.text(w / 2, h * 0.38, `${career.gamesPlayed} игр · ${career.totalMerges} мерджей · ${daysActive}д с нами`, {
    fontFamily: BRAND.FONT_BODY,
    fontSize: '13px',
    color: BRAND.TEXT_SECONDARY,
    alpha: 0.7,
  }).setOrigin(0.5);
}
```

**Helper function:**
```typescript
function calculateDaysActive(data: PersistedData): number {
  // Approximate from streak data — firstPlayDate or gamesPlayed/2
  if (data.streak?.startDate) {
    const start = new Date(data.streak.startDate);
    const now = new Date();
    return Math.max(1, Math.ceil((now.getTime() - start.getTime()) / 86400000));
  }
  return Math.max(1, Math.ceil(data.career?.gamesPlayed || 1 / 2));
}
```

### GameOverScene Changes (+8 lines)

**Goal-gradient: show nearest uncollected animal and collection progress:**

```typescript
// After score display, before buttons:
const discovered = data.discoveredTiers || [];
const totalAnimals = ANIMALS.length; // 8 animals
const progress = discovered.length / totalAnimals;

// Collection progress
if (discovered.length > 0 && discovered.length < totalAnimals) {
  const progressText = `Коллекция: ${discovered.length}/${totalAnimals}`;

  // Goal-gradient: emphasize closeness
  if (progress >= STATS_DISPLAY.GOAL_GRADIENT_THRESHOLD) {
    this.add.text(w / 2, goalY, `${progressText} — почти все! 🎉`, {
      fontFamily: BRAND.FONT_BODY, fontSize: '15px', color: '#D4A24C',
    }).setOrigin(0.5);
  } else {
    // Find next uncollected animal name
    const nextTier = findNextUncollected(discovered);
    const nextName = ANIMALS[nextTier - 1]?.name || '';
    this.add.text(w / 2, goalY, `${progressText} · Следующий: ${nextName}`, {
      fontFamily: BRAND.FONT_BODY, fontSize: '14px', color: BRAND.TEXT_SECONDARY,
    }).setOrigin(0.5);
  }
}

// Career milestone on big achievements
if (career.gamesPlayed === 10 || career.gamesPlayed === 50 || career.gamesPlayed === 100) {
  this.add.text(w / 2, milestoneY, `${career.gamesPlayed}-я игра! 🎮`, {
    fontFamily: BRAND.FONT_BODY, fontSize: '14px', color: '#D4A24C',
  }).setOrigin(0.5);
}
```

**Helper:**
```typescript
function findNextUncollected(discovered: number[]): number {
  for (let t = 1; t <= ANIMALS.length; t++) {
    if (!discovered.includes(t)) return t;
  }
  return ANIMALS.length;
}
```

### No New PersistedData Fields

All data already exists:
- `best` — best score (existing)
- `career` — gamesPlayed, totalMerges, totalScore (from FTR-017)
- `discoveredTiers` — collection progress (from core game)
- `streak` — has startDate info (from FTR-013)

No migration needed.

---

## Implementation Plan

### Task 1: Enhance MenuScene with challenge + investment display
**Type:** code
**Files:**
  - modify: `src/config/GameConfig.ts` — add STATS_DISPLAY thresholds
  - modify: `src/scenes/MenuScene.ts` — replace plain "Рекорд" with challenge text, add investment stats line (+12 lines)
**Acceptance:** After 3 games, best score shows as challenge "Побейте рекорд!". After 5 games, compact investment stats appear. Layout balanced.

### Task 2: Add goal-gradient hints to GameOverScene
**Type:** code
**Files:**
  - modify: `src/scenes/GameOverScene.ts` — add collection progress, nearest uncollected animal name, career milestones (+8 lines)
**Acceptance:** Game over shows "Коллекция: 5/8 — почти все!" when near completion, or "Следующий: Лисичка" otherwise. Career milestone celebrations at 10/50/100 games.

### Execution Order
1 → 2

---

## Tests

### What to test
- [ ] First 2 games: plain "Рекорд: N" displayed
- [ ] After 3 games: "Побейте рекорд: N!" challenge text
- [ ] After 5 games: investment stats line visible (games, merges, days)
- [ ] Game over: collection progress shown (N/8)
- [ ] Collection > 60%: "почти все!" emphasis
- [ ] Collection < 60%: next uncollected animal name shown
- [ ] Career milestone: "10-я игра!" celebration text
- [ ] No stats if career data missing (graceful fallback)
- [ ] Text readable and fits screen (13-22px, proper positioning)
- [ ] Investment stats don't clutter MenuScene

### How to test
- Manual: Play 3+ games → menu shows "Побейте рекорд!"
- Manual: Play 5+ games → menu shows "N игр · N мерджей · Nд с нами"
- Manual: Game over with 6/8 animals → see "Коллекция: 6/8 — почти все!"
- Manual: Game over with 3/8 animals → see "Следующий: [animal name]"
- Manual: 10th game → see "10-я игра!" on game over

---

## Definition of Done

### Functional
- [ ] "Beat your record" creates personal challenge motivation
- [ ] Investment stats create emotional attachment (sunk cost)
- [ ] Goal-gradient accelerates collection drive
- [ ] All text feels encouraging, not pressuring

### Technical
- [ ] `npm run build` succeeds
- [ ] MenuScene.ts ≤ 150 LOC after changes
- [ ] GameOverScene.ts ≤ 130 LOC after changes
- [ ] GameConfig additions ≤ 5 lines
- [ ] No console errors
- [ ] Graceful fallback when career data missing
- [ ] No layout overlap with existing UI elements
