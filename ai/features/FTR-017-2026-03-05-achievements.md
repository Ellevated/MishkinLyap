# Feature: [FTR-017] Milestone Achievements
**Status:** queued | **Priority:** P0 | **Date:** 2026-03-05

## Why
Milestone Achievements (Score 2.60): "Первый мердж", "100 мерджей", "Создай Медведя", "50,000 за карьеру" — каждое = badge. Прогрессия даже в бесконечной игре. Xbox-style achievements дают долгосрочную мотивацию после того, как краткосрочные цели (daily missions) исчерпаны. Для ЦА 55+ — коллекционирование наград особенно привлекательно.

## Context
Depends on FTR-005 (GameScene events), FTR-012 (discoveredTiers persistence). Currently: no achievement system. Career stats not tracked. Need lifetime stats persistence + achievement definitions + unlock tracking + display.

## Research Reference
- S8: Milestone Achievements (Score 2.60)

---

## Scope
**In scope:** AchievementManager with 12-15 achievements, career stats tracking (total merges, total score, games played, highest tier), achievement unlock persistence, achievements scene, unlock notification during gameplay
**Out of scope:** Yandex Games achievements API integration (Sprint 3), reward for unlocking, tiered achievements (bronze/silver/gold)

---

## Allowed Files
**New files allowed:**
1. `src/game/AchievementManager.ts` — achievement definitions + career tracking (~120 LOC)
2. `src/scenes/AchievementsScene.ts` — achievements display (~100 LOC)

**Modify:**
3. `src/config/GameConfig.ts` — add career stats and achievement data to PersistedData
4. `src/scenes/GameScene.ts` — report events to AchievementManager, show unlock toast
5. `src/scenes/MenuScene.ts` — add "Награды" button
6. `src/main.ts` — register AchievementsScene

**FORBIDDEN:** MergeDetector.ts, Animal.ts, PhysicsManager.ts, SDK files.

---

## Design

### Career Stats (persisted)

```typescript
export interface CareerStats {
  totalMerges: number;
  totalScore: number;
  gamesPlayed: number;
  highestTier: number;       // max tier ever created
  maxCombo: number;          // best combo ever
  totalPlayTimeMs: number;   // approximate
}

export const DEFAULT_CAREER: CareerStats = {
  totalMerges: 0,
  totalScore: 0,
  gamesPlayed: 0,
  highestTier: 1,
  maxCombo: 0,
  totalPlayTimeMs: 0,
};
```

### Achievement Definitions

```typescript
export interface AchievementDef {
  id: string;
  name: string;         // display name
  description: string;  // how to earn
  icon: string;         // emoji for now, sprites later
  check: (stats: CareerStats) => boolean;
}

const ACHIEVEMENTS: AchievementDef[] = [
  // First steps
  { id: 'first_merge',    name: 'Первый мердж',     description: 'Сделайте первое слияние',     icon: '🐹', check: s => s.totalMerges >= 1 },
  { id: 'merges_50',      name: 'Мерджер',           description: 'Сделайте 50 слияний',         icon: '🔄', check: s => s.totalMerges >= 50 },
  { id: 'merges_500',     name: 'Мердж-мастер',      description: 'Сделайте 500 слияний',        icon: '⭐', check: s => s.totalMerges >= 500 },

  // Tier milestones
  { id: 'create_cat',     name: 'Котик!',            description: 'Создайте кота (тир 4)',       icon: '🐱', check: s => s.highestTier >= 4 },
  { id: 'create_fox',     name: 'Лисичка!',          description: 'Создайте лису (тир 6)',       icon: '🦊', check: s => s.highestTier >= 6 },
  { id: 'create_panda',   name: 'Панда!',            description: 'Создайте панду (тир 7)',      icon: '🐼', check: s => s.highestTier >= 7 },
  { id: 'create_bear',    name: 'МЕДВЕДЬ!',          description: 'Создайте медведя (тир 8)',    icon: '🐻', check: s => s.highestTier >= 8 },

  // Score milestones
  { id: 'score_5k',       name: 'Пять тысяч',        description: 'Наберите 5,000 очков за карьеру',   icon: '💫', check: s => s.totalScore >= 5000 },
  { id: 'score_50k',      name: 'Полтинник',          description: 'Наберите 50,000 очков за карьеру',  icon: '🏆', check: s => s.totalScore >= 50000 },

  // Games played
  { id: 'games_10',       name: 'Завсегдатай',        description: 'Сыграйте 10 раундов',        icon: '🎮', check: s => s.gamesPlayed >= 10 },
  { id: 'games_100',      name: 'Ветеран',            description: 'Сыграйте 100 раундов',       icon: '🎖️', check: s => s.gamesPlayed >= 100 },

  // Combo
  { id: 'combo_5',        name: 'Каскадёр',           description: 'Соберите комбо x5',           icon: '🔥', check: s => s.maxCombo >= 5 },
];
```

### AchievementManager (~120 LOC)

```typescript
/**
 * Module: AchievementManager
 * Role: Tracks career stats, checks achievement unlocks, persists state
 * Uses: config/GameConfig (CareerStats, ACHIEVEMENTS)
 * Used by: GameScene (reports events), AchievementsScene (displays)
 * Does NOT: Display UI, play sounds, manage daily missions
 */
```

**Public API:**
- `reportMerge(tier: number): string[]` — update stats, return newly unlocked achievement IDs
- `reportGameEnd(score: number): string[]` — update games/score, return newly unlocked
- `reportCombo(count: number): string[]`
- `getStats(): CareerStats`
- `getUnlockedIds(): string[]`
- `getAchievements(): Array<AchievementDef & { unlocked: boolean }>`

**Unlock Check:**
```
On each report:
  Update career stats
  For each achievement not yet unlocked:
    If check(stats) returns true:
      Add to unlocked set
      Save to localStorage
      Return as newly unlocked
```

### AchievementsScene (~100 LOC)

```
Layout (480x854, scrollable if needed):
┌──────────────────────────┐
│       Награды             │  ← Title
│      5 / 12 🏅           │  ← Progress count
│                          │
│  🐹 Первый мердж     ✓  │  ← Unlocked: full color + check
│     Сделайте первое      │
│     слияние              │
│                          │
│  🔄 Мерджер          ✓  │
│     Сделайте 50 слияний  │
│                          │
│  ⭐ Мердж-мастер      🔒 │  ← Locked: grayed out + lock
│     Сделайте 500 слияний │
│     [████░░░░░] 234/500  │  ← Progress bar for locked
│                          │
│  ...                     │
│                          │
│       [ Назад ]          │
└──────────────────────────┘
```

**Styling:**
- Unlocked: name in TEXT_INK, icon full color, green checkmark
- Locked: name in TEXT_SECONDARY, icon grayed (alpha 0.4), progress bar below
- Row height: 70px (icon + 2 lines)
- Scrollable via Phaser camera if exceeds screen

### Unlock Toast in GameScene

When AchievementManager returns newly unlocked IDs:
```
Toast at top of screen (above score):
  "🏆 Награда: {name}!"
  Marmelad 22px, gold color
  Tween: slide in from top, hold 1.5s, slide out
```

---

## Drift Log

**Checked:** 2026-03-05 UTC
**Result:** no_drift

### Changes Detected
| File | Change Type | Action Taken |
|------|-------------|--------------|
| `src/config/GameConfig.ts` | No change (160 LOC, PersistedData at line 147) | None |
| `src/scenes/GameScene.ts` | No change (288 LOC, onMerge at line 132, triggerGameOver at line 231) | None |
| `src/scenes/MenuScene.ts` | No change (168 LOC, 4 buttons: Играть/Зверята/Рейтинг/Задания) | None |
| `src/main.ts` | No change (78 LOC, 7 scenes at line 66) | None |
| `src/game/ScoreManager.ts` | No change (124 LOC, migration patch at lines 91-94) | None |

### References Updated
- None needed

---

## Detailed Implementation Plan

### Task 1: Add CareerStats + Achievement definitions to GameConfig + migration in ScoreManager

**Files:**
- Modify: `src/config/GameConfig.ts:89-159` — add CareerStats interface, DEFAULT_CAREER, AchievementDef, ACHIEVEMENTS array, extend PersistedData
- Modify: `src/game/ScoreManager.ts:91-94` — add career+achievements migration patch

**Context:**
All data types and constants live in GameConfig.ts (leaf module, no imports). Achievement definitions use lambda `check` functions that are never serialized — only achievement IDs are persisted. ScoreManager.loadData() already has a patch section for missing fields; we extend it for career and achievements.

**Step 1: Add CareerStats and AchievementDef types to GameConfig.ts**

After the `DEFAULT_MISSIONS` constant (line 145) and before `PersistedData` interface (line 147), add:

```typescript
// src/config/GameConfig.ts — insert after line 145 (DEFAULT_MISSIONS), before PersistedData

export interface CareerStats {
  totalMerges: number;
  totalScore: number;
  gamesPlayed: number;
  highestTier: number;
  maxCombo: number;
  totalPlayTimeMs: number;
}

export const DEFAULT_CAREER: CareerStats = {
  totalMerges: 0, totalScore: 0, gamesPlayed: 0,
  highestTier: 1, maxCombo: 0, totalPlayTimeMs: 0,
};

export interface AchievementDef {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly check: (stats: CareerStats) => boolean;
  /** For progress bar: extract current value from stats */
  readonly progress?: (stats: CareerStats) => number;
  /** For progress bar: target value */
  readonly target?: number;
}

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  // First steps
  { id: 'first_merge',  name: 'Первый мердж',   description: 'Сделайте первое слияние',       icon: '🐹', check: s => s.totalMerges >= 1,   progress: s => s.totalMerges, target: 1 },
  { id: 'merges_50',    name: 'Мерджер',         description: 'Сделайте 50 слияний',           icon: '🔄', check: s => s.totalMerges >= 50,  progress: s => s.totalMerges, target: 50 },
  { id: 'merges_500',   name: 'Мердж-мастер',    description: 'Сделайте 500 слияний',          icon: '⭐', check: s => s.totalMerges >= 500, progress: s => s.totalMerges, target: 500 },
  // Tier milestones
  { id: 'create_cat',   name: 'Котик!',          description: 'Создайте кота (тир 4)',         icon: '🐱', check: s => s.highestTier >= 4, progress: s => s.highestTier, target: 4 },
  { id: 'create_fox',   name: 'Лисичка!',        description: 'Создайте лису (тир 6)',         icon: '🦊', check: s => s.highestTier >= 6, progress: s => s.highestTier, target: 6 },
  { id: 'create_panda', name: 'Панда!',          description: 'Создайте панду (тир 7)',        icon: '🐼', check: s => s.highestTier >= 7, progress: s => s.highestTier, target: 7 },
  { id: 'create_bear',  name: 'МЕДВЕДЬ!',        description: 'Создайте медведя (тир 8)',      icon: '🐻', check: s => s.highestTier >= 8, progress: s => s.highestTier, target: 8 },
  // Score milestones
  { id: 'score_5k',     name: 'Пять тысяч',      description: 'Наберите 5,000 за карьеру',     icon: '💫', check: s => s.totalScore >= 5000,  progress: s => s.totalScore, target: 5000 },
  { id: 'score_50k',    name: 'Полтинник',        description: 'Наберите 50,000 за карьеру',    icon: '🏆', check: s => s.totalScore >= 50000, progress: s => s.totalScore, target: 50000 },
  // Games played
  { id: 'games_10',     name: 'Завсегдатай',      description: 'Сыграйте 10 раундов',          icon: '🎮', check: s => s.gamesPlayed >= 10,  progress: s => s.gamesPlayed, target: 10 },
  { id: 'games_100',    name: 'Ветеран',          description: 'Сыграйте 100 раундов',         icon: '🎖️', check: s => s.gamesPlayed >= 100, progress: s => s.gamesPlayed, target: 100 },
  // Combo
  { id: 'combo_5',      name: 'Каскадёр',         description: 'Соберите комбо x5',             icon: '🔥', check: s => s.maxCombo >= 5, progress: s => s.maxCombo, target: 5 },
] as const;
```

**Step 2: Extend PersistedData interface and DEFAULT_DATA**

Replace the current PersistedData (line 147) and DEFAULT_DATA (line 156):

```typescript
// src/config/GameConfig.ts — replace PersistedData + DEFAULT_DATA

export interface PersistedData {
  v: number;
  best: number;
  sound: boolean;
  discoveredTiers: number[];
  streak: StreakData;
  missions: MissionSaveData;
  career: CareerStats;
  unlockedAchievements: string[];
}

export const DEFAULT_DATA: PersistedData = {
  v: 1, best: 0, sound: true, discoveredTiers: [1, 2, 3],
  streak: { ...DEFAULT_STREAK }, missions: { ...DEFAULT_MISSIONS },
  career: { ...DEFAULT_CAREER }, unlockedAchievements: [],
};
```

**Step 3: Extend ScoreManager.loadData() migration patch**

In `src/game/ScoreManager.ts`, extend the patch block (lines 91-94) to also patch career and achievements:

```typescript
// src/game/ScoreManager.ts — replace lines 91-94 (the patch block inside loadData)

      // Patch: add missing fields from later features
      if (!Array.isArray(parsed.discoveredTiers)) parsed.discoveredTiers = [1, 2, 3];
      if (!parsed.streak) parsed.streak = { ...DEFAULT_STREAK };
      if (!parsed.missions) parsed.missions = { ...DEFAULT_MISSIONS };
      if (!parsed.career) parsed.career = { ...DEFAULT_CAREER };
      if (!Array.isArray(parsed.unlockedAchievements)) parsed.unlockedAchievements = [];
```

Also add `DEFAULT_CAREER` to the import at line 11-17:

```typescript
// src/game/ScoreManager.ts — updated import (line 11-17)
import {
  STORAGE_KEY,
  STORAGE_VERSION,
  DEFAULT_DATA,
  DEFAULT_STREAK,
  DEFAULT_MISSIONS,
  DEFAULT_CAREER,
} from '../config/GameConfig';
```

And extend the version migration block (lines 82-88) to include career+achievements:

```typescript
// src/game/ScoreManager.ts — replace lines 82-88 (version migration)
      if (parsed.v !== STORAGE_VERSION) {
        return {
          v: STORAGE_VERSION, best: parsed.best, sound: parsed.sound ?? true,
          discoveredTiers: parsed.discoveredTiers ?? [1, 2, 3],
          streak: parsed.streak ?? { ...DEFAULT_STREAK },
          missions: parsed.missions ?? { ...DEFAULT_MISSIONS },
          career: parsed.career ?? { ...DEFAULT_CAREER },
          unlockedAchievements: parsed.unlockedAchievements ?? [],
        };
      }
```

**Step 4: Verify build**

```bash
cd D:/dev/game && npx tsc --noEmit
```

Expected: No type errors. All existing code that uses `PersistedData` still works because new fields have defaults.

**Acceptance Criteria:**
- [ ] `CareerStats` interface and `DEFAULT_CAREER` exported from GameConfig
- [ ] `AchievementDef` interface and 12-element `ACHIEVEMENTS` array exported
- [ ] `PersistedData` includes `career: CareerStats` and `unlockedAchievements: string[]`
- [ ] `ScoreManager.loadData()` patches missing career/achievements for existing saves
- [ ] `npx tsc --noEmit` passes

---

### Task 2: Create AchievementManager

**Files:**
- Create: `src/game/AchievementManager.ts` (~130 LOC)

**Context:**
AchievementManager follows the MissionTracker pattern: standalone class, own loadData/save, report methods that return newly unlocked IDs. Lambdas in ACHIEVEMENTS are never serialized — only `unlockedAchievements: string[]` is persisted. Each report method updates career stats, then scans all achievements for newly unlocked ones.

**Step 1: Create AchievementManager.ts**

```typescript
// src/game/AchievementManager.ts

/**
 * Module: AchievementManager
 * Role: Tracks career stats, checks achievement unlocks, persists state
 * Uses: config/GameConfig (CareerStats, ACHIEVEMENTS, STORAGE_KEY, DEFAULT_DATA, DEFAULT_CAREER)
 * Used by: GameScene (reports events), AchievementsScene (displays)
 * Does NOT: Display UI, play sounds, manage daily missions
 */

import {
  ACHIEVEMENTS,
  STORAGE_KEY,
  DEFAULT_DATA,
  DEFAULT_CAREER,
} from '../config/GameConfig';
import type { CareerStats, PersistedData, AchievementDef } from '../config/GameConfig';

export interface AchievementStatus {
  def: AchievementDef;
  unlocked: boolean;
}

export class AchievementManager {
  private career: CareerStats;
  private unlocked: Set<string>;

  constructor() {
    const data = this.loadData();
    this.career = { ...data.career };
    this.unlocked = new Set(data.unlockedAchievements);
  }

  /** Called on each merge. Updates career stats, returns newly unlocked IDs. */
  reportMerge(tier: number): string[] {
    this.career.totalMerges++;
    if (tier > this.career.highestTier) this.career.highestTier = tier;
    return this.checkAndSave();
  }

  /** Called at game end. Updates score+games, returns newly unlocked IDs. */
  reportGameEnd(score: number): string[] {
    this.career.totalScore += score;
    this.career.gamesPlayed++;
    return this.checkAndSave();
  }

  /** Called on combo. Updates maxCombo if higher, returns newly unlocked IDs. */
  reportCombo(count: number): string[] {
    if (count > this.career.maxCombo) this.career.maxCombo = count;
    return this.checkAndSave();
  }

  /** Get current career stats (read-only copy). */
  getStats(): CareerStats {
    return { ...this.career };
  }

  /** Get all unlocked achievement IDs. */
  getUnlockedIds(): string[] {
    return [...this.unlocked];
  }

  /** Get all achievements with unlock status for display. */
  getAll(): AchievementStatus[] {
    return ACHIEVEMENTS.map(def => ({
      def,
      unlocked: this.unlocked.has(def.id),
    }));
  }

  /** Number of unlocked achievements. */
  getUnlockedCount(): number {
    return this.unlocked.size;
  }

  /** Total achievement count. */
  getTotalCount(): number {
    return ACHIEVEMENTS.length;
  }

  /** Check all achievements, persist, return newly unlocked IDs. */
  private checkAndSave(): string[] {
    const newlyUnlocked: string[] = [];
    for (const ach of ACHIEVEMENTS) {
      if (this.unlocked.has(ach.id)) continue;
      if (ach.check(this.career)) {
        this.unlocked.add(ach.id);
        newlyUnlocked.push(ach.id);
      }
    }
    this.save();
    return newlyUnlocked;
  }

  private save(): void {
    const data = this.loadData();
    data.career = { ...this.career };
    data.unlockedAchievements = [...this.unlocked];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* localStorage full — silently fail */ }
  }

  private loadData(): PersistedData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_DATA, career: { ...DEFAULT_CAREER }, unlockedAchievements: [] };
      const p = JSON.parse(raw);
      if (!p.career) p.career = { ...DEFAULT_CAREER };
      if (!Array.isArray(p.unlockedAchievements)) p.unlockedAchievements = [];
      return p as PersistedData;
    } catch {
      return { ...DEFAULT_DATA, career: { ...DEFAULT_CAREER }, unlockedAchievements: [] };
    }
  }
}
```

**Step 2: Verify build**

```bash
cd D:/dev/game && npx tsc --noEmit
```

Expected: No errors. AchievementManager compiles, imports resolve.

**Acceptance Criteria:**
- [ ] `AchievementManager.ts` created, <=140 LOC
- [ ] `reportMerge()` increments totalMerges and updates highestTier
- [ ] `reportGameEnd()` increments gamesPlayed and adds to totalScore
- [ ] `reportCombo()` updates maxCombo (only if higher)
- [ ] `checkAndSave()` returns only NEWLY unlocked IDs (not already unlocked)
- [ ] Career stats and unlocked IDs persist to localStorage
- [ ] `npx tsc --noEmit` passes

---

### Task 3: Wire AchievementManager into GameScene + unlock toast

**Files:**
- Modify: `src/scenes/GameScene.ts:1-22` (imports), `src/scenes/GameScene.ts:26-34` (fields), `src/scenes/GameScene.ts:49-79` (create), `src/scenes/GameScene.ts:132-178` (onMerge), `src/scenes/GameScene.ts:231-248` (triggerGameOver)

**Context:**
GameScene is the orchestrator (288 LOC). We add AchievementManager as a field, create it in `create()`, call `reportMerge()` in `onMerge()`, call `reportGameEnd()` + `reportCombo()` in `triggerGameOver()`, and show unlock toast via EffectsManager. The toast reuses the existing `showToast()` approach but with a dedicated text element positioned above the score. Adding ~20 LOC keeps GameScene under 320 LOC, well within the 400 limit.

**Step 1: Add import**

Add to imports section (after line 21, the MissionTracker import):

```typescript
// src/scenes/GameScene.ts — add after MissionTracker import (line 21)
import { AchievementManager } from '../game/AchievementManager';
import { ACHIEVEMENTS } from '../config/GameConfig';
```

Note: `ACHIEVEMENTS` is needed to look up achievement name by ID for the toast.

**Step 2: Add field**

Add after `missionTracker` field declaration (line 34):

```typescript
// src/scenes/GameScene.ts — add after line 34
  private achievements!: AchievementManager;
  private achievementToast!: Phaser.GameObjects.Text;
```

**Step 3: Initialize in create()**

Add after `this.missionTracker.loadOrReset();` (line 69):

```typescript
// src/scenes/GameScene.ts — add after line 69
    this.achievements = new AchievementManager();
```

Add after the comboText creation (after line 103, before the game-over line):

```typescript
// src/scenes/GameScene.ts — add after line 103 (comboText creation)
    this.achievementToast = this.add.text(GAME.WIDTH / 2, 8, '', {
      fontSize: '18px', color: '#D4A24C', fontFamily: BRAND.FONT_DISPLAY,
    }).setOrigin(0.5, 0).setDepth(15).setAlpha(0);
```

**Step 4: Report in onMerge()**

Add after the missionTracker reports (after line 147, before `this.score.discoverTier`):

```typescript
// src/scenes/GameScene.ts — add after line 146 (missionTracker.reportCombo)
    const achMerge = this.achievements.reportMerge(result.newTier);
    if (comboCount >= 2) {
      const achCombo = this.achievements.reportCombo(comboCount);
      achMerge.push(...achCombo);
    }
    if (achMerge.length > 0) this.showAchievementToast(achMerge[0]);
```

**Step 5: Report in triggerGameOver()**

Add after `this.missionTracker.reportGamePlayed();` (line 241):

```typescript
// src/scenes/GameScene.ts — add after line 241
    this.achievements.reportGameEnd(this.score.getScore());
```

**Step 6: Add showAchievementToast method**

Add before the `shutdown()` method (before line 277):

```typescript
// src/scenes/GameScene.ts — add before shutdown()
  private showAchievementToast(achievementId: string): void {
    const ach = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!ach) return;
    this.achievementToast.setText(`${ach.icon} ${ach.name}!`).setAlpha(1);
    this.tweens.add({
      targets: this.achievementToast,
      y: { from: -30, to: 8 }, duration: 300, ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(1500, () => {
          this.tweens.add({
            targets: this.achievementToast, y: -30, alpha: 0, duration: 300, ease: 'Power2',
          });
        });
      },
    });
  }
```

**Step 7: Verify build**

```bash
cd D:/dev/game && npx tsc --noEmit
```

Expected: No errors. GameScene now reports to AchievementManager and shows unlock toast.

**Acceptance Criteria:**
- [ ] AchievementManager created in GameScene.create()
- [ ] Merges reported via `achievements.reportMerge()` in onMerge()
- [ ] Combos reported via `achievements.reportCombo()` in onMerge()
- [ ] Game end reported via `achievements.reportGameEnd()` in triggerGameOver()
- [ ] Unlock toast slides in from top with achievement icon+name
- [ ] GameScene stays under 320 LOC
- [ ] `npx tsc --noEmit` passes

---

### Task 4: Create AchievementsScene + wire Menu + register in main

**Files:**
- Create: `src/scenes/AchievementsScene.ts` (~115 LOC)
- Modify: `src/scenes/MenuScene.ts:96-106` — add "Награды" button after Задания
- Modify: `src/main.ts:20,66` — import + register AchievementsScene

**Context:**
AchievementsScene follows BestiaryScene/MissionsScene pattern: title, content rows, back button. Layout: compact rows (55px each) to fit 12 achievements in ~660px (available space ~714px after title+button). Unlocked items show colored icon + name + green check. Locked items show grayed icon + name + progress bar. Progress uses the `progress` and `target` fields from AchievementDef.

**Step 1: Create AchievementsScene.ts**

```typescript
// src/scenes/AchievementsScene.ts

/**
 * Module: AchievementsScene
 * Role: Displays all achievements with unlocked/locked state and progress bars
 * Uses: config/GameConfig (BRAND, GAME), game/AchievementManager
 * Used by: MenuScene (navigation)
 * Does NOT: Unlock achievements, track stats
 */

import Phaser from 'phaser';
import { BRAND, GAME } from '../config/GameConfig';
import { AchievementManager } from '../game/AchievementManager';

export class AchievementsScene extends Phaser.Scene {
  constructor() { super('Achievements'); }

  create(): void {
    const w = GAME.WIDTH;
    this.cameras.main.setBackgroundColor(BRAND.BG_CREAM);
    const mgr = new AchievementManager();
    const all = mgr.getAll();
    const stats = mgr.getStats();
    const unlockedCount = mgr.getUnlockedCount();
    const totalCount = mgr.getTotalCount();

    // Title
    this.add.text(w / 2, 28, 'Награды', {
      fontSize: '36px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_DISPLAY,
    }).setOrigin(0.5);

    this.add.text(w / 2, 62, `${unlockedCount} / ${totalCount}`, {
      fontSize: '20px', color: BRAND.TEXT_SECONDARY, fontFamily: BRAND.FONT_BODY,
    }).setOrigin(0.5);

    // Achievement rows
    const startY = 95;
    const rowH = 55;

    for (let i = 0; i < all.length; i++) {
      const { def, unlocked } = all[i];
      const y = startY + i * rowH;

      // Alternating row bg
      if (i % 2 === 0) {
        this.add.rectangle(w / 2, y + rowH / 2, w - 20, rowH, 0xede0c4, 0.4);
      }

      // Icon
      const iconAlpha = unlocked ? 1 : 0.35;
      this.add.text(22, y + 10, def.icon, {
        fontSize: '24px',
      }).setOrigin(0, 0).setAlpha(iconAlpha);

      // Name + status
      const nameColor = unlocked ? BRAND.TEXT_INK : BRAND.TEXT_SECONDARY;
      this.add.text(54, y + 6, def.name, {
        fontSize: '16px', color: nameColor, fontFamily: BRAND.FONT_BODY,
        fontStyle: unlocked ? 'bold' : '',
      }).setOrigin(0, 0);

      // Status indicator (right side)
      if (unlocked) {
        this.add.text(w - 22, y + 10, '\u2713', {
          fontSize: '22px', color: '#4A7A30', fontFamily: BRAND.FONT_BODY, fontStyle: 'bold',
        }).setOrigin(1, 0);
      } else {
        this.add.text(w - 22, y + 10, '\uD83D\uDD12', {
          fontSize: '18px',
        }).setOrigin(1, 0);
      }

      // Description (smaller, below name)
      this.add.text(54, y + 26, def.description, {
        fontSize: '12px', color: BRAND.TEXT_SECONDARY, fontFamily: BRAND.FONT_BODY,
      }).setOrigin(0, 0);

      // Progress bar for locked achievements
      if (!unlocked && def.progress && def.target) {
        const current = def.progress(stats);
        const ratio = Math.min(current / def.target, 1);
        const barX = 54;
        const barW = 180;
        const barH = 8;
        const barY = y + 42;
        this.add.rectangle(barX + barW / 2, barY, barW, barH, 0xd6c6a9).setOrigin(0.5);
        if (ratio > 0) {
          this.add.rectangle(barX + (barW * ratio) / 2, barY, barW * ratio, barH, 0xd4a24c).setOrigin(0.5);
        }
        this.add.text(barX + barW + 8, barY, `${current}/${def.target}`, {
          fontSize: '10px', color: BRAND.TEXT_SECONDARY, fontFamily: BRAND.FONT_BODY,
        }).setOrigin(0, 0.5);
      }
    }

    // Back button
    const btnY = GAME.HEIGHT - 50;
    const btn = this.add.rectangle(w / 2, btnY, 200, 48, 0xede0c4).setStrokeStyle(2, 0x8a6420);
    btn.setInteractive({ useHandCursor: true });
    this.add.text(w / 2, btnY, 'Назад', {
      fontSize: '20px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_BODY, fontStyle: 'bold',
    }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(0xe8c47a));
    btn.on('pointerout', () => btn.setFillStyle(0xede0c4));
    btn.on('pointerup', () => this.scene.start('Menu'));
  }
}
```

**Step 2: Add "Награды" button to MenuScene**

In `src/scenes/MenuScene.ts`, add a new button after the Задания button (after line 106). The new button goes between Задания and the mute toggle.

```typescript
// src/scenes/MenuScene.ts — add after line 106 (msBtn pointerup handler)

    // Achievements button
    const achBtnY = msBtnY + 60;
    const achBtn = this.add.rectangle(width / 2, achBtnY, 200, 52, 0xede0c4);
    achBtn.setStrokeStyle(2, 0x8a6420);
    achBtn.setInteractive({ useHandCursor: true });
    this.add.text(width / 2, achBtnY, 'Награды', {
      fontSize: '20px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_BODY, fontStyle: 'bold',
    }).setOrigin(0.5);
    achBtn.on('pointerover', () => achBtn.setFillStyle(0xe8c47a));
    achBtn.on('pointerout', () => achBtn.setFillStyle(0xede0c4));
    achBtn.on('pointerup', () => this.scene.start('Achievements'));
```

**Step 3: Register AchievementsScene in main.ts**

Add import after MissionsScene import (line 20):

```typescript
// src/main.ts — add after line 20
import { AchievementsScene } from './scenes/AchievementsScene';
```

Add to scene array (line 66):

```typescript
// src/main.ts — replace line 66
    scene: [PreloadScene, MenuScene, GameScene, GameOverScene, BestiaryScene, LeaderboardScene, MissionsScene, AchievementsScene],
```

**Step 4: Verify build + manual test**

```bash
cd D:/dev/game && npx tsc --noEmit
cd D:/dev/game && npm run dev -- --port 3002
```

Manual verification:
1. Open http://localhost:3002
2. Menu should show 5 buttons: Играть, Зверята, Рейтинг, Задания, Награды
3. Click "Награды" — should show 12 achievements, all locked with progress 0
4. Play a game, make a merge — "Первый мердж" toast should appear
5. Return to Награды — "Первый мердж" should show as unlocked with checkmark

**Acceptance Criteria:**
- [ ] AchievementsScene.ts created, <=120 LOC
- [ ] Shows 12 achievements with correct locked/unlocked state
- [ ] Progress bars for locked achievements with accurate values
- [ ] Unlocked achievements show green checkmark
- [ ] "Награды" button visible in MenuScene
- [ ] AchievementsScene registered in main.ts scene array
- [ ] `npm run build` succeeds
- [ ] No console errors

---

### Execution Order

Task 1 → Task 2 → Task 3 → Task 4

### Dependencies

- Task 2 depends on Task 1 (needs CareerStats, ACHIEVEMENTS, PersistedData with career/achievements)
- Task 3 depends on Task 2 (needs AchievementManager class)
- Task 4 depends on Task 2 (needs AchievementManager for display) and Task 3 (toast code in GameScene)

### LOC Budget

| File | Current LOC | Added LOC | Final LOC | Limit |
|------|-------------|-----------|-----------|-------|
| GameConfig.ts | 160 | +55 (types+defs) | ~215 | 400 |
| ScoreManager.ts | 124 | +4 (migration patch) | ~128 | 400 |
| AchievementManager.ts | 0 (new) | ~105 | ~105 | 140 |
| AchievementsScene.ts | 0 (new) | ~100 | ~100 | 120 |
| GameScene.ts | 288 | +25 (import+field+init+reports+toast) | ~313 | 400 |
| MenuScene.ts | 168 | +12 (button) | ~180 | 400 |
| main.ts | 78 | +2 (import+scene) | ~80 | 400 |

### Layout Verification

12 achievements x 55px row = 660px content.
Title (28px + 62px) = 70px header area.
Back button at HEIGHT-50 = 804px. Available content: 804 - 95 (startY) = 709px.
660px < 709px. **Fits without scrolling.**

### Research Sources

- Phaser camera setBounds (Context7 /websites/phaser_io) — verified scrolling API but determined compact layout avoids needing it

---

## Tests

### What to test
- [ ] Career stats increment correctly (merges, score, games)
- [ ] Achievement unlocks when condition met (e.g., 50 merges)
- [ ] Already unlocked achievements not re-triggered
- [ ] Achievement data persists across page reloads
- [ ] AchievementsScene shows correct locked/unlocked state
- [ ] Progress bars accurate for locked achievements
- [ ] Unlock toast appears in GameScene on new achievement
- [ ] "Награды" button accessible from menu

### How to test
- Manual: Play through, observe unlock toasts, verify in achievements scene
- Manual: Modify localStorage to set stats near achievement thresholds

---

## Definition of Done

### Functional
- [ ] 12 achievements defined with meaningful milestones
- [ ] Career stats tracked across sessions
- [ ] Achievement unlocks detected and persisted
- [ ] Unlock toast shown during gameplay
- [ ] AchievementsScene displays all achievements with correct state
- [ ] Progress bars for locked achievements

### Technical
- [ ] `npm run build` succeeds
- [ ] AchievementManager.ts ≤ 140 LOC
- [ ] AchievementsScene.ts ≤ 120 LOC
- [ ] No console errors
