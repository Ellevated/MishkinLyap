# Feature: [FTR-016] Daily Missions
**Status:** queued | **Priority:** P0 | **Date:** 2026-03-05

## Why
Ежедневные миссии (Score 2.65): "Сделай 5 мерджей медведей", "Набери 5000", "Сыграй 3 раунда" — все 3 выполнены = бонус. Даёт структуру сессии, превращает бесцельную игру в набор конкретных целей. Progress Bars (Score 2.60): визуальный прогресс к награде intrinsically satisfying. Royal Match, Candy Crush — daily missions = ядро D1-D7 retention.

## Context
Depends on FTR-005 (GameScene events), FTR-010 (ComboTracker for combo missions). Currently: no mission system. Player plays without specific goals beyond beating high score. Need per-session event tracking + daily mission state persistence.

## Research Reference
- S6: Daily Missions (Score 2.65)
- M6: Progress Bars (Score 2.60)

---

## Scope
**In scope:** MissionTracker with 3 daily missions, mission pool (8-10 mission templates), daily random selection, progress tracking during gameplay, mission panel accessible from menu, completion reward (bonus multiplier next game)
**Out of scope:** Mission tiers/difficulty, streak bonus for completing missions, rewarded ad for mission skip, weekly missions

---

## Allowed Files
**New files allowed:**
1. `src/game/MissionTracker.ts` — mission state + progress tracking (~120 LOC)

**Modify:**
2. `src/config/GameConfig.ts` — add MISSIONS config, extend PersistedData with mission fields
3. `src/scenes/MenuScene.ts` — add "Задания" button, show completion indicator
4. `src/scenes/GameScene.ts` — wire gameplay events to MissionTracker (merge count, score, tier created)

**New files allowed (UI):**
5. `src/scenes/MissionsScene.ts` — missions panel with progress bars (~90 LOC)
6. `src/main.ts` — register MissionsScene

**FORBIDDEN:** MergeDetector.ts, Animal.ts, PhysicsManager.ts, SDK files.

---

## Design

### Mission Templates

```typescript
export interface MissionTemplate {
  id: string;
  text: string;           // display text with {target}
  type: MissionType;
  target: number;
}

export type MissionType =
  | 'merges'           // total merges in a day
  | 'score'            // total score in a day
  | 'games'            // games played in a day
  | 'tier_created'     // create specific tier animal
  | 'combo'            // achieve combo count

export const MISSION_POOL: MissionTemplate[] = [
  { id: 'merges_10',     text: 'Сделайте {target} мерджей',        type: 'merges',       target: 10 },
  { id: 'merges_25',     text: 'Сделайте {target} мерджей',        type: 'merges',       target: 25 },
  { id: 'score_3000',    text: 'Наберите {target} очков',          type: 'score',        target: 3000 },
  { id: 'score_8000',    text: 'Наберите {target} очков',          type: 'score',        target: 8000 },
  { id: 'games_3',       text: 'Сыграйте {target} раунда',        type: 'games',        target: 3 },
  { id: 'games_5',       text: 'Сыграйте {target} раундов',       type: 'games',        target: 5 },
  { id: 'tier_cat',      text: 'Создайте кота (тир 4)',           type: 'tier_created', target: 4 },
  { id: 'tier_fox',      text: 'Создайте лису (тир 6)',           type: 'tier_created', target: 6 },
  { id: 'combo_3',       text: 'Соберите комбо x{target}',        type: 'combo',        target: 3 },
  { id: 'combo_5',       text: 'Соберите комбо x{target}',        type: 'combo',        target: 5 },
];
```

### Config Constants
```typescript
export const MISSIONS = {
  DAILY_COUNT: 3,                    // missions per day
  ALL_COMPLETE_BONUS: 1.5,           // multiplier for completing all 3
} as const;
```

### PersistedData Extension
```typescript
// Add to PersistedData
missions: MissionSaveData;

interface MissionSaveData {
  date: string;                      // 'YYYY-MM-DD' — reset daily
  active: ActiveMission[];           // 3 missions for today
  allCompleted: boolean;
}

interface ActiveMission {
  templateId: string;
  progress: number;
  completed: boolean;
}
```

### MissionTracker (~120 LOC)

```typescript
/**
 * Module: MissionTracker
 * Role: Tracks daily mission progress, selects random missions, persists state
 * Uses: config/GameConfig (MISSIONS, MISSION_POOL)
 * Used by: GameScene (reports events), MenuScene (reads state), MissionsScene (displays)
 * Does NOT: Display UI, manage score, detect merges
 */
```

**Public API:**
- `loadOrReset(): ActiveMission[]` — load today's missions or generate new ones if new day
- `reportMerge(tier: number): void` — called on each merge
- `reportScore(score: number): void` — called on game end (daily cumulative)
- `reportGamePlayed(): void` — called on game end
- `reportCombo(count: number): void` — called when combo updates
- `getMissions(): ActiveMission[]` — current missions with progress
- `isAllCompleted(): boolean`

**Daily Reset Logic:**
```
On loadOrReset():
  today = getDateString(now)
  if (savedDate !== today):
    Pick 3 random non-duplicate missions from MISSION_POOL
    Reset all progress
    Save with today's date
  Return current missions
```

### MissionsScene (~90 LOC)

```
Layout (480x854):
┌──────────────────────────┐
│       Задания             │  ← Title
│       на сегодня          │
│                          │
│  ☐ Сделайте 10 мерджей   │
│  [████████░░] 8/10       │  ← Progress bar + fraction
│                          │
│  ✓ Наберите 3000 очков   │  ← Completed (checkmark, green)
│  [██████████] 3000/3000  │
│                          │
│  ☐ Сыграйте 3 раунда    │
│  [████░░░░░░] 1/3        │
│                          │
│  ─────────────────────   │
│  Все задания: 1/3        │
│  Награда: x1.5 к счёту   │
│                          │
│       [ Назад ]          │
└──────────────────────────┘
```

**Progress bar:**
- Width: 280px, height: 14px
- Filled: ochre (#D4A24C)
- Empty: border (#D6C6A9)
- Completed: green (#4A7A30)
- Text: Nunito 16px

### GameScene Integration

In onMerge:
```typescript
this.missionTracker.reportMerge(result.newTier);
```

In triggerGameOver:
```typescript
this.missionTracker.reportScore(this.score.getScore());
this.missionTracker.reportGamePlayed();
```

In combo handler (after FTR-010):
```typescript
this.missionTracker.reportCombo(comboCount);
```

---

## Drift Log

**Checked:** 2026-03-05 UTC
**Result:** no_drift

### Changes Detected
| File | Change Type | Action Taken |
|------|-------------|--------------|
| `src/config/GameConfig.ts` | No change since spec | N/A |
| `src/game/ScoreManager.ts` | No change since spec | N/A |
| `src/scenes/GameScene.ts` | No change since spec | N/A |
| `src/scenes/MenuScene.ts` | No change since spec | N/A |
| `src/main.ts` | No change since spec | N/A |

### References Updated
- None needed

---

## Detailed Implementation Plan

### Task 1: Add mission types and config to GameConfig

**Files:**
- Modify: `src/config/GameConfig.ts:88-114`

**Context:**
Add all mission-related types (MissionType, MissionTemplate, ActiveMission, MissionSaveData), the MISSION_POOL constant, the MISSIONS config constant, and extend PersistedData + DEFAULT_DATA with the `missions` field. This provides the data foundation for MissionTracker.

**Step 1: Add mission types after STREAK config (after line 87)**

Append the following block after the `} as const;` closing STREAK on line 87 and before `export const STORAGE_KEY` on line 89:

```typescript
// --- Missions ---

export type MissionType = 'merges' | 'score' | 'games' | 'tier_created' | 'combo';

export interface MissionTemplate {
  readonly id: string;
  readonly text: string;
  readonly type: MissionType;
  readonly target: number;
}

export const MISSION_POOL: readonly MissionTemplate[] = [
  { id: 'merges_10',  text: 'Сделайте {target} мерджей',  type: 'merges',       target: 10 },
  { id: 'merges_25',  text: 'Сделайте {target} мерджей',  type: 'merges',       target: 25 },
  { id: 'score_3000', text: 'Наберите {target} очков',     type: 'score',        target: 3000 },
  { id: 'score_8000', text: 'Наберите {target} очков',     type: 'score',        target: 8000 },
  { id: 'games_3',    text: 'Сыграйте {target} раунда',   type: 'games',        target: 3 },
  { id: 'games_5',    text: 'Сыграйте {target} раундов',  type: 'games',        target: 5 },
  { id: 'tier_cat',   text: 'Создайте кота (тир 4)',      type: 'tier_created', target: 4 },
  { id: 'tier_fox',   text: 'Создайте лису (тир 6)',      type: 'tier_created', target: 6 },
  { id: 'combo_3',    text: 'Соберите комбо x{target}',   type: 'combo',        target: 3 },
  { id: 'combo_5',    text: 'Соберите комбо x{target}',   type: 'combo',        target: 5 },
] as const;

export const MISSIONS = {
  DAILY_COUNT: 3,
  ALL_COMPLETE_BONUS: 1.5,
} as const;

export interface ActiveMission {
  templateId: string;
  progress: number;
  completed: boolean;
}

export interface MissionSaveData {
  date: string;
  active: ActiveMission[];
  allCompleted: boolean;
}

export const DEFAULT_MISSIONS: MissionSaveData = {
  date: '', active: [], allCompleted: false,
};
```

**Step 2: Extend PersistedData interface (line 104-110)**

Add `missions: MissionSaveData;` field to the PersistedData interface:

```typescript
export interface PersistedData {
  v: number;
  best: number;
  sound: boolean;
  discoveredTiers: number[];
  streak: StreakData;
  missions: MissionSaveData;
}
```

**Step 3: Extend DEFAULT_DATA (line 112-114)**

Add missions default:

```typescript
export const DEFAULT_DATA: PersistedData = {
  v: 1, best: 0, sound: true, discoveredTiers: [1, 2, 3],
  streak: { ...DEFAULT_STREAK }, missions: { ...DEFAULT_MISSIONS },
};
```

**Acceptance Criteria:**
- [ ] `npm run build` succeeds with no type errors
- [ ] All exported types (MissionType, MissionTemplate, ActiveMission, MissionSaveData) are importable
- [ ] MISSION_POOL has 10 templates, MISSIONS has DAILY_COUNT=3
- [ ] PersistedData includes `missions` field
- [ ] DEFAULT_DATA includes missions with DEFAULT_MISSIONS spread

---

### Task 2: Add missions field migration to ScoreManager

**Files:**
- Modify: `src/game/ScoreManager.ts:89-92`

**Context:**
ScoreManager.loadData() handles backward-compatible patching of PersistedData for older saves. Add patching for the new `missions` field so existing players don't lose data.

**Step 1: Add DEFAULT_MISSIONS import (line 12-16)**

Update the import to include DEFAULT_MISSIONS:

```typescript
import {
  STORAGE_KEY,
  STORAGE_VERSION,
  DEFAULT_DATA,
  DEFAULT_STREAK,
  DEFAULT_MISSIONS,
} from '../config/GameConfig';
```

**Step 2: Add missions patching in loadData() (after line 91)**

After the existing `if (!parsed.streak)` patch on line 91, add:

```typescript
      if (!parsed.missions) parsed.missions = { ...DEFAULT_MISSIONS };
```

**Step 3: Add missions field to migration block (lines 80-87)**

In the version migration block, add `missions` to the returned object:

```typescript
      if (parsed.v !== STORAGE_VERSION) {
        return {
          v: STORAGE_VERSION, best: parsed.best, sound: parsed.sound ?? true,
          discoveredTiers: parsed.discoveredTiers ?? [1, 2, 3],
          streak: parsed.streak ?? { ...DEFAULT_STREAK },
          missions: parsed.missions ?? { ...DEFAULT_MISSIONS },
        };
      }
```

**Acceptance Criteria:**
- [ ] `npm run build` succeeds
- [ ] loadData() returns PersistedData with `missions` field even for old saves
- [ ] ScoreManager.ts stays at ~125 LOC (was 121, adding ~4 lines)

---

### Task 3: Create MissionTracker

**Files:**
- Create: `src/game/MissionTracker.ts`

**Context:**
Core mission logic: daily reset/generation, progress tracking per event type, persistence via localStorage. Follows DailyStreakManager pattern (own load/save, no scene dependency).

**Step 1: Create MissionTracker.ts**

```typescript
/**
 * Module: MissionTracker
 * Role: Tracks daily mission progress, selects random missions, persists state
 * Uses: config/GameConfig (MISSIONS, MISSION_POOL, STORAGE_KEY, DEFAULT_MISSIONS)
 * Used by: GameScene (reports events), MenuScene (reads state), MissionsScene (displays)
 * Does NOT: Display UI, manage score, detect merges
 */

import {
  MISSIONS,
  MISSION_POOL,
  STORAGE_KEY,
  DEFAULT_DATA,
  DEFAULT_MISSIONS,
} from '../config/GameConfig';
import type { PersistedData, ActiveMission, MissionSaveData, MissionTemplate } from '../config/GameConfig';

export class MissionTracker {
  private missions: ActiveMission[] = [];
  private date = '';

  /** Load today's missions or generate new ones if new day. */
  loadOrReset(): ActiveMission[] {
    const data = this.loadData();
    const saved = data.missions;
    const today = this.dateStr(new Date());

    if (saved.date === today && saved.active.length === MISSIONS.DAILY_COUNT) {
      this.missions = saved.active;
      this.date = today;
      return this.missions;
    }

    // New day or corrupted — generate fresh missions
    this.missions = this.pickRandom(MISSIONS.DAILY_COUNT);
    this.date = today;
    this.save(data);
    return this.missions;
  }

  /** Called on each merge. Increments 'merges' and checks 'tier_created'. */
  reportMerge(tier: number): void {
    let changed = false;
    for (const m of this.missions) {
      if (m.completed) continue;
      const tpl = this.getTemplate(m.templateId);
      if (!tpl) continue;
      if (tpl.type === 'merges') {
        m.progress = Math.min(m.progress + 1, tpl.target);
        if (m.progress >= tpl.target) m.completed = true;
        changed = true;
      } else if (tpl.type === 'tier_created' && tier >= tpl.target) {
        m.progress = tpl.target;
        m.completed = true;
        changed = true;
      }
    }
    if (changed) this.save();
  }

  /** Called on game end with cumulative daily score. */
  reportScore(totalDayScore: number): void {
    let changed = false;
    for (const m of this.missions) {
      if (m.completed) continue;
      const tpl = this.getTemplate(m.templateId);
      if (!tpl || tpl.type !== 'score') continue;
      m.progress = Math.min(totalDayScore, tpl.target);
      if (m.progress >= tpl.target) m.completed = true;
      changed = true;
    }
    if (changed) this.save();
  }

  /** Called on game end. Increments 'games' missions. */
  reportGamePlayed(): void {
    let changed = false;
    for (const m of this.missions) {
      if (m.completed) continue;
      const tpl = this.getTemplate(m.templateId);
      if (!tpl || tpl.type !== 'games') continue;
      m.progress = Math.min(m.progress + 1, tpl.target);
      if (m.progress >= tpl.target) m.completed = true;
      changed = true;
    }
    if (changed) this.save();
  }

  /** Called when combo count updates. Sets 'combo' progress to max seen. */
  reportCombo(count: number): void {
    let changed = false;
    for (const m of this.missions) {
      if (m.completed) continue;
      const tpl = this.getTemplate(m.templateId);
      if (!tpl || tpl.type !== 'combo') continue;
      if (count > m.progress) {
        m.progress = Math.min(count, tpl.target);
        if (m.progress >= tpl.target) m.completed = true;
        changed = true;
      }
    }
    if (changed) this.save();
  }

  getMissions(): ActiveMission[] { return this.missions; }

  isAllCompleted(): boolean {
    return this.missions.length === MISSIONS.DAILY_COUNT
      && this.missions.every(m => m.completed);
  }

  getCompletedCount(): number {
    return this.missions.filter(m => m.completed).length;
  }

  getTemplate(templateId: string): MissionTemplate | undefined {
    return MISSION_POOL.find(t => t.id === templateId);
  }

  private pickRandom(count: number): ActiveMission[] {
    const pool = [...MISSION_POOL];
    const picked: ActiveMission[] = [];
    const usedTypes = new Set<string>();
    while (picked.length < count && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      const tpl = pool[idx];
      pool.splice(idx, 1);
      if (usedTypes.has(tpl.type)) continue;
      usedTypes.add(tpl.type);
      picked.push({ templateId: tpl.id, progress: 0, completed: false });
    }
    return picked;
  }

  private save(existingData?: PersistedData): void {
    const data = existingData ?? this.loadData();
    data.missions = {
      date: this.date,
      active: this.missions,
      allCompleted: this.isAllCompleted(),
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ok */ }
  }

  private loadData(): PersistedData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_DATA, missions: { ...DEFAULT_MISSIONS } };
      const parsed = JSON.parse(raw);
      if (!parsed.missions) parsed.missions = { ...DEFAULT_MISSIONS };
      return parsed as PersistedData;
    } catch { return { ...DEFAULT_DATA, missions: { ...DEFAULT_MISSIONS } }; }
  }

  private dateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
```

**Acceptance Criteria:**
- [ ] `npm run build` succeeds
- [ ] MissionTracker.ts is ~140 LOC (within 140 LOC limit)
- [ ] `loadOrReset()` returns 3 missions with unique types
- [ ] `reportMerge()` increments merges-type and checks tier_created
- [ ] `reportScore()` updates score-type missions
- [ ] `reportGamePlayed()` increments games-type missions
- [ ] `reportCombo()` updates combo-type missions (max-tracking)
- [ ] `isAllCompleted()` returns true only when all 3 are done
- [ ] Daily reset generates new missions for new date

---

### Task 4: Wire MissionTracker into GameScene

**Files:**
- Modify: `src/scenes/GameScene.ts:8-21,44-46,56-74,128-173,225-240,269-279`

**Context:**
GameScene orchestrates gameplay. MissionTracker must receive events: reportMerge on each merge, reportCombo after combo tracking, reportScore and reportGamePlayed on game over. MissionTracker is instantiated in create(), loaded with loadOrReset().

**Step 1: Add import (after line 20)**

After the `import { EffectsManager }` line, add:

```typescript
import { MissionTracker } from '../game/MissionTracker';
```

**Step 2: Add field declaration (after line 43)**

After `private sessionStats = { ... };` on line 43, add:

```typescript
  private missionTracker!: MissionTracker;
```

**Step 3: Initialize in create() (after line 64, inside "Create managers" block)**

After `this.effects = new EffectsManager(this, 75);` add:

```typescript
    this.missionTracker = new MissionTracker();
    this.missionTracker.loadOrReset();
```

**Step 4: Report merge in onMerge() (after line 141)**

After `this.score.discoverTier(result.newTier);` on line 141, add:

```typescript
    this.missionTracker.reportMerge(result.newTier);
```

**Step 5: Report combo in onMerge() (after line 130)**

The combo count is already computed on line 130: `const comboCount = this.combo.registerMerge();`
After `this.updateComboUI(comboCount);` on line 133, add:

```typescript
    this.missionTracker.reportCombo(comboCount);
```

**Step 6: Report game end in triggerGameOver() (after line 232)**

After `const isNewRecord = this.score.checkAndSaveBest();` on line 232, add:

```typescript
    this.missionTracker.reportScore(this.score.getScore());
    this.missionTracker.reportGamePlayed();
```

**Acceptance Criteria:**
- [ ] `npm run build` succeeds
- [ ] GameScene.ts stays under 300 LOC (was 280, adding ~10 lines)
- [ ] MissionTracker.reportMerge() called on every merge with newTier
- [ ] MissionTracker.reportCombo() called on every merge with comboCount
- [ ] MissionTracker.reportScore() + reportGamePlayed() called at game over
- [ ] No changes to existing game logic

---

### Task 5: Create MissionsScene and register in main.ts

**Files:**
- Create: `src/scenes/MissionsScene.ts`
- Modify: `src/main.ts:19,65`

**Context:**
Dedicated scene showing 3 daily missions with progress bars. Follows same pattern as BestiaryScene (standalone scene, reads from manager, has Back button). Registered in Phaser scene list alongside other scenes.

**Step 1: Create MissionsScene.ts**

```typescript
/**
 * Module: MissionsScene
 * Role: Displays daily missions with progress bars
 * Uses: config/GameConfig (BRAND, MISSIONS), game/MissionTracker
 * Used by: MenuScene (navigation), main.ts (scene list)
 */

import Phaser from 'phaser';
import { BRAND, MISSIONS } from '../config/GameConfig';
import { MissionTracker } from '../game/MissionTracker';

export class MissionsScene extends Phaser.Scene {
  constructor() { super('Missions'); }

  create(): void {
    const { width } = this.scale;
    this.cameras.main.setBackgroundColor(BRAND.BG_CREAM);
    const tracker = new MissionTracker();
    const missions = tracker.loadOrReset();

    // Title
    this.add.text(width / 2, 40, 'Задания', {
      fontSize: '36px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_DISPLAY,
    }).setOrigin(0.5);
    this.add.text(width / 2, 78, 'на сегодня', {
      fontSize: '20px', color: BRAND.TEXT_SECONDARY, fontFamily: BRAND.FONT_BODY,
    }).setOrigin(0.5);

    // Mission cards
    let y = 130;
    const barW = 280;
    const barH = 14;

    for (const m of missions) {
      const tpl = tracker.getTemplate(m.templateId);
      if (!tpl) continue;

      const label = tpl.text.replace('{target}', String(tpl.target));
      const icon = m.completed ? '\u2713' : '\u25CB';
      const textColor = m.completed ? BRAND.SUCCESS : BRAND.TEXT_INK;

      this.add.text(width / 2 - barW / 2, y, `${icon}  ${label}`, {
        fontSize: '18px', color: textColor, fontFamily: BRAND.FONT_BODY,
      }).setOrigin(0, 0.5);
      y += 28;

      // Progress bar background
      this.add.rectangle(width / 2, y, barW + 4, barH + 4, 0xd6c6a9)
        .setStrokeStyle(1, 0x8a6420, 0.3);

      // Progress bar fill
      const ratio = Math.min(m.progress / tpl.target, 1);
      const fillW = barW * ratio;
      const fillColor = m.completed ? 0x4a7a30 : 0xd4a24c;
      if (fillW > 0) {
        this.add.rectangle(
          width / 2 - barW / 2 + fillW / 2, y, fillW, barH, fillColor,
        );
      }

      // Fraction text
      this.add.text(width / 2 + barW / 2 + 12, y, `${m.progress}/${tpl.target}`, {
        fontSize: '14px', color: BRAND.TEXT_SECONDARY, fontFamily: BRAND.FONT_BODY,
      }).setOrigin(0, 0.5);
      y += 40;
    }

    // Summary
    y += 10;
    this.add.line(0, 0, width / 2 - barW / 2, y, width / 2 + barW / 2, y, 0xd6c6a9)
      .setOrigin(0);
    y += 20;

    const done = tracker.getCompletedCount();
    this.add.text(width / 2, y, `Выполнено: ${done} / ${MISSIONS.DAILY_COUNT}`, {
      fontSize: '18px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_BODY,
    }).setOrigin(0.5);
    y += 30;

    const bonusColor = tracker.isAllCompleted() ? BRAND.SUCCESS : BRAND.TEXT_SECONDARY;
    const bonusPrefix = tracker.isAllCompleted() ? '\u2713 ' : '';
    this.add.text(width / 2, y, `${bonusPrefix}Награда: x${MISSIONS.ALL_COMPLETE_BONUS} к счёту`, {
      fontSize: '16px', color: bonusColor, fontFamily: BRAND.FONT_BODY,
    }).setOrigin(0.5);
    y += 50;

    // Back button
    const btn = this.add.rectangle(width / 2, y, 180, 48, 0xede0c4)
      .setStrokeStyle(2, 0x8a6420);
    btn.setInteractive({ useHandCursor: true });
    this.add.text(width / 2, y, 'Назад', {
      fontSize: '20px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_BODY, fontStyle: 'bold',
    }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(0xe8c47a));
    btn.on('pointerout', () => btn.setFillStyle(0xede0c4));
    btn.on('pointerup', () => this.scene.start('Menu'));
  }
}
```

**Step 2: Add import in main.ts (after line 19)**

After `import { LeaderboardScene } from './scenes/LeaderboardScene';`, add:

```typescript
import { MissionsScene } from './scenes/MissionsScene';
```

**Step 3: Register scene in Phaser config (line 65)**

Change scene array from:

```typescript
    scene: [PreloadScene, MenuScene, GameScene, GameOverScene, BestiaryScene, LeaderboardScene],
```

to:

```typescript
    scene: [PreloadScene, MenuScene, GameScene, GameOverScene, BestiaryScene, LeaderboardScene, MissionsScene],
```

**Acceptance Criteria:**
- [ ] `npm run build` succeeds
- [ ] MissionsScene.ts is ~100 LOC (within 110 LOC limit)
- [ ] Scene displays 3 missions with progress bars
- [ ] Completed missions show green checkmark and green bar
- [ ] Summary shows X/3 completed count
- [ ] Bonus line shows x1.5 multiplier (green when all done)
- [ ] Back button navigates to Menu
- [ ] Scene key `'Missions'` is registered in Phaser

---

### Task 6: Add "Задания" button to MenuScene

**Files:**
- Modify: `src/scenes/MenuScene.ts:14,84-94,107-108`

**Context:**
MenuScene currently has 3 buttons: Играть (y=height*0.55), Зверята (btnY+70), Рейтинг (bestBtnY+60). Add "Задания" button between Рейтинг and the bottom of the screen. Also add a completion badge indicator.

**Step 1: Add MissionTracker import (after line 14)**

After `import { DailyStreakManager } from '../game/DailyStreakManager';`, add:

```typescript
import { MissionTracker } from '../game/MissionTracker';
```

**Step 2: Add "Задания" button after Рейтинг button (after line 94)**

After the leaderboard button block ending with:
```typescript
    lbBtn.on('pointerup', () => this.scene.start('Leaderboard', { returnTo: 'Menu' }));
```

Add the Задания button:

```typescript
    // Missions button
    const msBtnY = lbBtnY + 60;
    const msBtn = this.add.rectangle(width / 2, msBtnY, 200, 52, 0xede0c4);
    msBtn.setStrokeStyle(2, 0x8a6420);
    msBtn.setInteractive({ useHandCursor: true });
    this.add.text(width / 2, msBtnY, 'Задания', {
      fontSize: '20px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_BODY, fontStyle: 'bold',
    }).setOrigin(0.5);
    msBtn.on('pointerover', () => msBtn.setFillStyle(0xe8c47a));
    msBtn.on('pointerout', () => msBtn.setFillStyle(0xede0c4));
    msBtn.on('pointerup', () => this.scene.start('Missions'));

    // Mission completion badge
    const mTracker = new MissionTracker();
    mTracker.loadOrReset();
    const mDone = mTracker.getCompletedCount();
    if (mDone > 0) {
      const badgeColor = mTracker.isAllCompleted() ? '#4A7A30' : '#D4A24C';
      this.add.text(width / 2 + 110, msBtnY, `${mDone}/3`, {
        fontSize: '14px', color: badgeColor, fontFamily: BRAND.FONT_BODY, fontStyle: 'bold',
      }).setOrigin(0.5);
    }
```

**Acceptance Criteria:**
- [ ] `npm run build` succeeds
- [ ] MenuScene.ts stays under 200 LOC (was 156, adding ~20 lines)
- [ ] "Задания" button visible below Рейтинг
- [ ] Button navigates to MissionsScene
- [ ] Completion badge shows X/3 when missions started
- [ ] Badge is green when all 3 completed, ochre otherwise
- [ ] Button hover/press follows same pattern as other buttons

---

### Execution Order

Task 1 → Task 2 → Task 3 → Task 4
                             ↓
                    Task 5 → Task 6

### Dependencies

- Task 2 depends on Task 1 (needs DEFAULT_MISSIONS, PersistedData.missions)
- Task 3 depends on Task 1 (needs MISSIONS, MISSION_POOL, ActiveMission types)
- Task 4 depends on Task 3 (needs MissionTracker class)
- Task 5 depends on Task 3 (needs MissionTracker class)
- Task 6 depends on Task 3 + Task 5 (needs MissionTracker + MissionsScene registered)

### Research Sources

- Solution verified: Phaser 3 progress bars via `this.add.rectangle()` — same pattern already used in BestiaryScene (line 74-78) and PreloadScene (line 25-28). No external plugins needed.
- DailyStreakManager pattern (own load/save, no Phaser.Scene dependency for persistence) confirmed as correct approach for MissionTracker.

---

## Tests

### What to test
- [ ] 3 random missions generated per day
- [ ] Missions persist across page reloads (same day)
- [ ] New missions generated on new day
- [ ] No duplicate mission types in daily set
- [ ] Merge events increment merge-type missions
- [ ] Score events increment score-type missions
- [ ] Game played events increment games-type missions
- [ ] Completed missions show checkmark
- [ ] Progress bars fill accurately
- [ ] "Задания" button accessible from menu

### How to test
- Manual: Play through several games, check mission progress in missions scene
- Manual: Manipulate localStorage date to test daily reset

---

## Definition of Done

### Functional
- [ ] 3 daily missions displayed with progress bars
- [ ] Missions track merge/score/games/tier/combo events
- [ ] Completed missions visually marked
- [ ] All-complete bonus indicator shown
- [ ] Daily reset with new random missions

### Technical
- [ ] `npm run build` succeeds
- [ ] MissionTracker.ts ≤ 140 LOC
- [ ] MissionsScene.ts ≤ 110 LOC
- [ ] No console errors
