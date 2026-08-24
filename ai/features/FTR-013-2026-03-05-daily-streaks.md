# Feature: [FTR-013] Daily Streaks & Rewards
**Status:** queued | **Priority:** P0 | **Date:** 2026-03-05

## Why
Daily Streaks — самый мощный daily retention-паттерн (Duolingo: streaks = #1 retention feature). Escalating Daily Rewards (Score 3.00): награда растёт с каждым днём подряд, формируя привычку возвращаться. Streak Shield (Score 3.00): мягкий streak без жёсткого сброса — критично для ЦА 55+, где жёсткий reset вызывает оттток. "Мишка скучает — зайди 7 дней подряд!"

## Context
Depends on FTR-005 (Scenes), FTR-012 (PersistedData extensions). Currently: no daily engagement system. Player has no reason to return every day. localStorage already used for best score — extend for streak data.

## Research Reference
- S3: Escalating Daily Rewards (Score 3.00)
- S4: Streak Shield (Score 3.00)
- M4: Daily Streaks UI (Score 3.00)

---

## Scope
**In scope:** Streak counter, daily reward popup, escalating rewards (bonus score multiplier first game), streak shield (1 free miss/week), streak badge on menu
**Out of scope:** Push notifications, monetizable rewards (coins/gems), rewarded ad for shield, calendar view

---

## Allowed Files
**New files allowed:**
1. `src/game/DailyStreakManager.ts` — streak logic + persistence (~80 LOC)

**Modify:**
2. `src/config/GameConfig.ts` — add STREAK config constants, extend PersistedData with streak fields
3. `src/scenes/MenuScene.ts` — show streak badge, trigger daily reward popup on entry
4. `src/game/ScoreManager.ts` — add streak data load/save helpers (reuse loadData/saveData)

**FORBIDDEN:** GameScene.ts, MergeDetector.ts, Animal.ts, SDK files.

---

## Design

### Data Model

Extend PersistedData:
```typescript
export interface PersistedData {
  v: number;
  best: number;
  sound: boolean;
  discoveredTiers: number[];
  streak: StreakData;
}

export interface StreakData {
  count: number;           // consecutive days played
  lastPlayDate: string;    // 'YYYY-MM-DD' of last play
  shieldAvailable: boolean; // one free miss per week
  lastShieldReset: string; // 'YYYY-MM-DD' of last weekly reset (Monday)
  todayClaimed: boolean;   // has today's reward been claimed
}

export const DEFAULT_STREAK: StreakData = {
  count: 0,
  lastPlayDate: '',
  shieldAvailable: true,
  lastShieldReset: '',
  todayClaimed: false,
};
```

### Config Constants
```typescript
export const STREAK = {
  REWARDS: [1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 2.0], // day 1-7 bonus multiplier for first game
  MAX_DISPLAY: 7,       // show max 7 days in UI
  SHIELD_RESET_DAY: 1,  // Monday (getDay()=1) resets shield
} as const;
```

### DailyStreakManager (~80 LOC)

```typescript
/**
 * Module: DailyStreakManager
 * Role: Tracks daily streak, provides rewards, manages shield
 * Uses: config/GameConfig (STREAK, PersistedData)
 * Used by: MenuScene (check on entry)
 * Does NOT: Display UI, play sounds, manage score
 */
```

**Public API:**
- `checkIn(): StreakCheckInResult` — call on game open, returns streak state
- `getStreak(): number` — current streak count
- `getRewardMultiplier(): number` — today's bonus multiplier
- `isShieldAvailable(): boolean`

**StreakCheckInResult:**
```typescript
interface StreakCheckInResult {
  streak: number;
  isNewDay: boolean;        // first visit today
  streakContinued: boolean; // played yesterday → streak++
  streakRecovered: boolean; // missed 1 day, shield used
  streakBroken: boolean;    // missed >1 day, reset to 1
  rewardMultiplier: number; // today's bonus
}
```

**Logic:**
```
On checkIn():
  today = getDateString(now)
  if (lastPlayDate === today) → return current state (not new day)

  daysSince = diffDays(lastPlayDate, today)

  if (daysSince === 1):
    streak++ (continued)
  elif (daysSince === 2 && shieldAvailable):
    streak stays (shield used, shieldAvailable = false)
  else:
    streak = 1 (broken, reset)

  // Weekly shield reset (on Monday)
  if (today is Monday && lastShieldReset !== thisMonday):
    shieldAvailable = true
    lastShieldReset = thisMonday

  lastPlayDate = today
  todayClaimed = true
  save()
```

### MenuScene UI

On create(), after existing elements:
```
1. Call streakManager.checkIn()
2. If isNewDay: show reward popup overlay
3. Always show streak badge in top-right corner

Streak Badge:
  🔥 {count} (flame emoji + number)
  Font: Marmelad 20px, ochre color
  Position: top-right (width-60, 30)

Reward Popup (modal overlay, shown once per day):
  ┌─────────────────────┐
  │   День {N}! 🔥      │
  │                     │
  │  Бонус сегодня:     │
  │  x{multiplier}      │
  │  к первой игре      │
  │                     │
  │     [ Играть! ]     │
  └─────────────────────┘

  If streakRecovered:
    Add text: "Щит спас вашу серию!"
  If streakBroken:
    Add text: "Новая серия начинается!"
```

**Note:** The reward multiplier applies to the first game of the day. GameScene will need to check this — but that wiring is deferred to a future task to keep this spec focused on the streak system + menu UI.

---

## Drift Log

**Checked:** 2026-03-05 UTC
**Result:** light_drift

### Changes Detected
| File | Change Type | Action Taken |
|------|-------------|--------------|
| `src/config/GameConfig.ts` | PersistedData has `discoveredTiers` (FTR-012 already applied), no `streak` field yet | AUTO-FIX: plan updated with exact lines |
| `src/game/ScoreManager.ts` | Migration at lines 80-89 handles `discoveredTiers` patch, same pattern needed for `streak` | AUTO-FIX: migration patch added to plan |
| `src/scenes/MenuScene.ts` | Mute button at `(width-20, 20)` with `setOrigin(1, 0)` — occupies top-right corner | AUTO-FIX: streak badge positioned at `(width-20, 60)` to avoid overlap |

### References Updated
- Task 2: streak badge position changed from `(width-60, 30)` (spec) → `(width-20, 60)` (below mute icon) to avoid UI overlap

---

## Detailed Implementation Plan

### Task 1: Extend GameConfig + Create DailyStreakManager + ScoreManager migration

**Files:**
- Modify: `src/config/GameConfig.ts:85-92` — add StreakData interface, DEFAULT_STREAK, STREAK constants, extend PersistedData and DEFAULT_DATA
- Create: `src/game/DailyStreakManager.ts`
- Modify: `src/game/ScoreManager.ts:64-95` — add migration patch for missing streak field

**Context:**
GameConfig is the leaf module with no imports — safe to add new exports. ScoreManager already has a patch pattern for missing fields (lines 87-90) — we follow the exact same pattern for streak. DailyStreakManager is a standalone class (no Phaser dependency) so it can be used in MenuScene cleanly.

**Step 1: Extend src/config/GameConfig.ts**

Current state (lines 82-92):
```typescript
export const STORAGE_KEY = 'mishkin_lyap_v1';
export const STORAGE_VERSION = 1;

export interface PersistedData {
  v: number;
  best: number;
  sound: boolean;
  discoveredTiers: number[];
}

export const DEFAULT_DATA: PersistedData = { v: 1, best: 0, sound: true, discoveredTiers: [1, 2, 3] };
```

Replace lines 82-92 with:
```typescript
export const STORAGE_KEY = 'mishkin_lyap_v1';
export const STORAGE_VERSION = 1;

export interface StreakData {
  count: number;           // consecutive days played
  lastPlayDate: string;    // 'YYYY-MM-DD' of last play
  shieldAvailable: boolean; // one free miss per week
  lastShieldReset: string;  // 'YYYY-MM-DD' of last Monday reset
  todayClaimed: boolean;    // has today's reward been claimed
}

export const DEFAULT_STREAK: StreakData = {
  count: 0,
  lastPlayDate: '',
  shieldAvailable: true,
  lastShieldReset: '',
  todayClaimed: false,
};

export const STREAK = {
  REWARDS: [1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 2.0] as readonly number[], // day 1-7 multiplier
  MAX_DISPLAY: 7,
  SHIELD_RESET_DAY: 1, // Monday (getDay() === 1)
} as const;

export interface PersistedData {
  v: number;
  best: number;
  sound: boolean;
  discoveredTiers: number[];
  streak: StreakData;
}

export const DEFAULT_DATA: PersistedData = {
  v: 1,
  best: 0,
  sound: true,
  discoveredTiers: [1, 2, 3],
  streak: { ...DEFAULT_STREAK },
};
```

**Step 2: Add migration patch to src/game/ScoreManager.ts**

Current lines 87-92 (after discoveredTiers patch):
```typescript
      // Patch: add discoveredTiers if missing (pre-FTR-012 saves)
      if (!Array.isArray(parsed.discoveredTiers)) {
        parsed.discoveredTiers = [1, 2, 3];
      }

      return parsed as PersistedData;
```

Replace with:
```typescript
      // Patch: add discoveredTiers if missing (pre-FTR-012 saves)
      if (!Array.isArray(parsed.discoveredTiers)) {
        parsed.discoveredTiers = [1, 2, 3];
      }

      // Patch: add streak if missing (pre-FTR-013 saves)
      if (!parsed.streak || typeof parsed.streak !== 'object') {
        parsed.streak = { ...DEFAULT_STREAK };
      }

      return parsed as PersistedData;
```

Also add `DEFAULT_STREAK` to the import at lines 11-16:
```typescript
import {
  STORAGE_KEY,
  STORAGE_VERSION,
  DEFAULT_DATA,
  DEFAULT_STREAK,
} from '../config/GameConfig';
```

**Step 3: Create src/game/DailyStreakManager.ts**

```typescript
/**
 * Module: DailyStreakManager
 * Role: Tracks daily streak, provides rewards, manages streak shield
 * Uses: config/GameConfig (STREAK, StreakData, DEFAULT_STREAK, PersistedData, STORAGE_KEY, DEFAULT_DATA)
 * Used by: scenes/MenuScene (checkIn on entry)
 * Does NOT: Display UI, play sounds, manage score, import Phaser
 */

import {
  STREAK,
  DEFAULT_STREAK,
  STORAGE_KEY,
  DEFAULT_DATA,
} from '../config/GameConfig';
import type { StreakData, PersistedData } from '../config/GameConfig';

export interface StreakCheckInResult {
  streak: number;
  isNewDay: boolean;
  streakContinued: boolean;
  streakRecovered: boolean; // missed 1 day, shield used
  streakBroken: boolean;    // missed >1 day or no shield, reset to 1
  rewardMultiplier: number;
}

export class DailyStreakManager {
  private data: StreakData;

  constructor() {
    this.data = this.loadStreak();
  }

  /**
   * Call once on game open (MenuScene.create).
   * Updates streak state and returns what happened today.
   */
  checkIn(): StreakCheckInResult {
    const today = this.getDateString(new Date());
    const { lastPlayDate } = this.data;

    // Already checked in today — return current state without mutation
    if (lastPlayDate === today) {
      return {
        streak: this.data.count,
        isNewDay: false,
        streakContinued: false,
        streakRecovered: false,
        streakBroken: false,
        rewardMultiplier: this.getRewardMultiplier(),
      };
    }

    // First time ever (lastPlayDate empty)
    const daysSince = lastPlayDate ? this.diffDays(lastPlayDate, today) : 999;

    let streakContinued = false;
    let streakRecovered = false;
    let streakBroken = false;

    if (daysSince === 1) {
      // Played yesterday — extend streak
      this.data.count += 1;
      streakContinued = true;
    } else if (daysSince === 2 && this.data.shieldAvailable) {
      // Missed one day — use shield, streak preserved
      this.data.shieldAvailable = false;
      streakRecovered = true;
      // streak count stays the same
    } else {
      // Missed 2+ days or no shield — reset
      this.data.count = 1;
      streakBroken = lastPlayDate !== ''; // not broken on very first play
    }

    // Weekly shield reset on Monday
    const monday = this.getThisMonday(today);
    if (this.isMonday(today) && this.data.lastShieldReset !== monday) {
      this.data.shieldAvailable = true;
      this.data.lastShieldReset = monday;
    }

    // On very first play ever, set count = 1
    if (lastPlayDate === '') {
      this.data.count = 1;
      streakBroken = false;
    }

    this.data.lastPlayDate = today;
    this.data.todayClaimed = true;
    this.saveStreak(this.data);

    return {
      streak: this.data.count,
      isNewDay: true,
      streakContinued,
      streakRecovered,
      streakBroken,
      rewardMultiplier: this.getRewardMultiplier(),
    };
  }

  getStreak(): number {
    return this.data.count;
  }

  getRewardMultiplier(): number {
    const idx = Math.min(this.data.count - 1, STREAK.REWARDS.length - 1);
    return idx >= 0 ? STREAK.REWARDS[idx] : 1.0;
  }

  isShieldAvailable(): boolean {
    return this.data.shieldAvailable;
  }

  // --- private helpers ---

  private getDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private diffDays(from: string, to: string): number {
    const a = new Date(from).getTime();
    const b = new Date(to).getTime();
    return Math.round((b - a) / 86_400_000);
  }

  private isMonday(dateStr: string): boolean {
    return new Date(dateStr).getDay() === STREAK.SHIELD_RESET_DAY;
  }

  private getThisMonday(dateStr: string): string {
    const d = new Date(dateStr);
    const day = d.getDay(); // 0=Sun, 1=Mon...
    const diff = day === 0 ? -6 : 1 - day; // back to Monday
    d.setDate(d.getDate() + diff);
    return this.getDateString(d);
  }

  private loadStreak(): StreakData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_STREAK };
      const parsed: PersistedData = JSON.parse(raw);
      if (parsed?.streak && typeof parsed.streak === 'object') {
        return { ...DEFAULT_STREAK, ...parsed.streak };
      }
    } catch { /* ignore */ }
    return { ...DEFAULT_STREAK };
  }

  private saveStreak(streak: StreakData): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data: PersistedData = raw ? JSON.parse(raw) : { ...DEFAULT_DATA };
      data.streak = streak;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* localStorage unavailable — silently fail */ }
  }
}
```

**Step 4: Verify build**
```bash
cd D:/dev/game && npm run build 2>&1 | tail -20
```

Expected: no TypeScript errors.

**Acceptance Criteria:**
- [ ] `npm run build` succeeds
- [ ] `PersistedData` interface has `streak: StreakData` field
- [ ] `DEFAULT_DATA` includes `streak: { ...DEFAULT_STREAK }`
- [ ] `STREAK` and `DEFAULT_STREAK` exported from GameConfig
- [ ] `ScoreManager.loadData()` patches missing `streak` field
- [ ] `DailyStreakManager.ts` is ≤ 110 LOC

---

### Task 2: Wire streak UI to MenuScene

**Files:**
- Modify: `src/scenes/MenuScene.ts`

**Context:**
MenuScene.create() currently renders: title (y=25%), best score (y=42%), play button (y=55%), bestiary button (y=55%+70px), mute icon (top-right corner at x=width-20, y=20, origin 1,0 — 32px emoji). Streak badge goes below mute icon at `(width-20, 60)`. The daily reward popup is a modal overlay created as Phaser GameObjects on top of everything.

**Current MenuScene.ts structure:**
- Line 1-8: module header
- Line 9-13: imports
- Line 22-96: create() method
- Line 85-88: mute toggle at `(width-20, 20)` with `setOrigin(1, 0)`
- Line 94-96: bridge.showBanner(), closing `}`

**Step 1: Write the new MenuScene.ts**

```typescript
/**
 * Module: MenuScene
 * Role: Title screen with play button, streak badge, and daily reward popup
 * Uses: config/GameConfig (GAME, BRAND, STREAK), config/GameEvents, sdk/IGamePlatform
 * Used by: PreloadScene (transitions to), GameOverScene (return to menu)
 * Does NOT: Contain game logic, manage physics
 */

import Phaser from 'phaser';
import { GAME, BRAND, STREAK } from '../config/GameConfig';
import type { IPlatformBridge } from '../sdk/IGamePlatform';
import { ScoreManager } from '../game/ScoreManager';
import { AudioManager } from '../game/AudioManager';
import { DailyStreakManager } from '../game/DailyStreakManager';

export class MenuScene extends Phaser.Scene {
  private bridge!: IPlatformBridge;

  constructor() {
    super('Menu');
  }

  create(): void {
    this.bridge = this.registry.get('bridge') as IPlatformBridge;
    const { width, height } = this.scale;

    // Background
    this.cameras.main.setBackgroundColor(BRAND.BG_CREAM);

    // Title
    this.add.text(width / 2, height * 0.25, 'Мишкин\nЛяп', {
      fontSize: '48px',
      color: BRAND.TEXT_INK,
      fontFamily: BRAND.FONT_DISPLAY,
      align: 'center',
    }).setOrigin(0.5);

    // Best score
    const scoreManager = new ScoreManager(this);
    const best = scoreManager.getBestScore();
    if (best > 0) {
      this.add.text(width / 2, height * 0.42, `Рекорд: ${best}`, {
        fontSize: '22px',
        color: BRAND.TEXT_SECONDARY,
        fontFamily: BRAND.FONT_BODY,
      }).setOrigin(0.5);
    }

    // Play button
    const btnY = height * 0.55;
    const btn = this.add.rectangle(width / 2, btnY, 200, 56, 0xd4a24c, 1);
    btn.setStrokeStyle(2, 0x8a6420);
    btn.setInteractive({ useHandCursor: true });

    const btnText = this.add.text(width / 2, btnY, 'Играть', {
      fontSize: '22px',
      color: BRAND.TEXT_INK,
      fontFamily: BRAND.FONT_BODY,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    btn.on('pointerover', () => btn.setFillStyle(0xe8c47a));
    btn.on('pointerout', () => btn.setFillStyle(0xd4a24c));
    btn.on('pointerdown', () => {
      btn.setScale(0.95);
    });
    btn.on('pointerup', () => {
      btn.setScale(1);
      this.scene.start('Game');
    });

    // Bestiary button
    const bestBtnY = btnY + 70;
    const bestBtn = this.add.rectangle(width / 2, bestBtnY, 200, 52, 0xede0c4);
    bestBtn.setStrokeStyle(2, 0x8a6420);
    bestBtn.setInteractive({ useHandCursor: true });
    this.add.text(width / 2, bestBtnY, 'Зверята', {
      fontSize: '20px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_BODY, fontStyle: 'bold',
    }).setOrigin(0.5);
    bestBtn.on('pointerover', () => bestBtn.setFillStyle(0xe8c47a));
    bestBtn.on('pointerout', () => bestBtn.setFillStyle(0xede0c4));
    bestBtn.on('pointerup', () => this.scene.start('Bestiary'));

    // Mute toggle
    const audio = new AudioManager();
    const muteBtn = this.add.text(width - 20, 20, audio.isMuted() ? '🔇' : '🔊', {
      fontSize: '32px',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

    muteBtn.on('pointerup', () => {
      const muted = audio.toggleMute();
      muteBtn.setText(muted ? '🔇' : '🔊');
    });

    // Daily streak check-in
    const streakMgr = new DailyStreakManager();
    const checkIn = streakMgr.checkIn();

    // Streak badge (below mute icon, top-right corner)
    this.showStreakBadge(width, checkIn.streak);

    // Daily reward popup (only on first visit today)
    if (checkIn.isNewDay) {
      this.showRewardPopup(width, height, checkIn);
    }

    // Show banner
    this.bridge?.showBanner();
  }

  private showStreakBadge(width: number, streak: number): void {
    if (streak <= 0) return;
    const displayCount = Math.min(streak, STREAK.MAX_DISPLAY);
    this.add.text(width - 20, 60, `🔥 ${displayCount}`, {
      fontSize: '20px',
      color: BRAND.CTA_OCHRE,
      fontFamily: BRAND.FONT_DISPLAY,
    }).setOrigin(1, 0).setDepth(10);
  }

  private showRewardPopup(
    width: number,
    height: number,
    checkIn: { streak: number; streakRecovered: boolean; streakBroken: boolean; rewardMultiplier: number },
  ): void {
    const cx = width / 2;
    const cy = height / 2;
    const popupW = 280;
    const popupH = 220;

    // Dim overlay
    const overlay = this.add.rectangle(cx, cy, width, height, 0x000000, 0.5)
      .setDepth(20)
      .setInteractive(); // blocks click-through

    // Popup background
    const popup = this.add.rectangle(cx, cy, popupW, popupH, 0xf5edd8)
      .setStrokeStyle(2, 0x8a6420)
      .setDepth(21);

    // Title
    const dayLabel = Math.min(checkIn.streak, STREAK.MAX_DISPLAY);
    this.add.text(cx, cy - 80, `День ${dayLabel}! 🔥`, {
      fontSize: '24px',
      color: BRAND.TEXT_INK,
      fontFamily: BRAND.FONT_DISPLAY,
      align: 'center',
    }).setOrigin(0.5).setDepth(22);

    // Bonus text
    this.add.text(cx, cy - 40, 'Бонус сегодня:', {
      fontSize: '16px',
      color: BRAND.TEXT_SECONDARY,
      fontFamily: BRAND.FONT_BODY,
    }).setOrigin(0.5).setDepth(22);

    this.add.text(cx, cy - 10, `x${checkIn.rewardMultiplier.toFixed(1)}`, {
      fontSize: '36px',
      color: BRAND.CTA_OCHRE,
      fontFamily: BRAND.FONT_DISPLAY,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(22);

    this.add.text(cx, cy + 28, 'к первой игре', {
      fontSize: '14px',
      color: BRAND.TEXT_SECONDARY,
      fontFamily: BRAND.FONT_BODY,
    }).setOrigin(0.5).setDepth(22);

    // Shield / broken message
    let subText = '';
    if (checkIn.streakRecovered) subText = 'Щит спас вашу серию!';
    else if (checkIn.streakBroken) subText = 'Новая серия начинается!';

    if (subText) {
      this.add.text(cx, cy + 52, subText, {
        fontSize: '13px',
        color: BRAND.ACCENT_RED,
        fontFamily: BRAND.FONT_BODY,
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(22);
    }

    // Play button inside popup
    const closeBtnY = cy + 82;
    const closeBtn = this.add.rectangle(cx, closeBtnY, 160, 44, 0xd4a24c)
      .setStrokeStyle(2, 0x8a6420)
      .setDepth(22)
      .setInteractive({ useHandCursor: true });

    this.add.text(cx, closeBtnY, 'Играть!', {
      fontSize: '18px',
      color: BRAND.TEXT_INK,
      fontFamily: BRAND.FONT_BODY,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(23);

    const closePopup = (): void => {
      overlay.destroy();
      popup.destroy();
      // destroy all depth-22/23 objects via container approach would be cleaner,
      // but since we're transitioning to Game scene on button press, just start scene
      this.scene.start('Game');
    };

    closeBtn.on('pointerover', () => closeBtn.setFillStyle(0xe8c47a));
    closeBtn.on('pointerout', () => closeBtn.setFillStyle(0xd4a24c));
    closeBtn.on('pointerup', closePopup);
  }
}
```

**Step 2: Verify build and visual check**
```bash
cd D:/dev/game && npm run build 2>&1 | tail -20
```

Expected: no TypeScript errors.

Manual check:
1. Open `http://localhost:3002` (run `npm run dev -- --port 3002`)
2. First visit: reward popup appears with "День 1! 🔥", multiplier "x1.0", "Играть!" button
3. "Играть!" closes popup and starts game
4. Re-open menu (game over → menu): NO popup (same day)
5. In DevTools Console: `localStorage.setItem('mishkin_lyap_v1', JSON.stringify({...JSON.parse(localStorage.getItem('mishkin_lyap_v1')), streak: {count: 5, lastPlayDate: '2026-03-03', shieldAvailable: true, lastShieldReset: '', todayClaimed: false}}))` then refresh → popup shows "День 6! 🔥", multiplier "x1.5"
6. Streak badge `🔥 6` visible in top-right area below mute icon

**Acceptance Criteria:**
- [ ] Streak badge `🔥 N` renders at `(width-20, 60)` below mute icon, no overlap
- [ ] Daily reward popup appears only on first visit per day
- [ ] Popup shows correct day number and multiplier
- [ ] "Щит спас вашу серию!" shown when streakRecovered=true
- [ ] "Новая серия начинается!" shown when streakBroken=true
- [ ] "Играть!" button closes popup and starts game
- [ ] No console errors
- [ ] `npm run build` succeeds

---

### Execution Order

Task 1 → Task 2

Task 2 imports `DailyStreakManager` — must exist before MenuScene compiles.

### Dependencies

- Task 2 depends on Task 1 (needs `DailyStreakManager`, `StreakData`, `STREAK` exports)
- Task 1 is self-contained (GameConfig has no imports, ScoreManager just adds a patch line)

### Known Risk: Popup cleanup

The reward popup creates individual GameObjects (not a Container). When "Играть!" is pressed, `this.scene.start('Game')` tears down MenuScene entirely — all objects destroyed automatically. The `overlay.destroy()` and `popup.destroy()` calls before scene start are defensive but fine. If the user navigates away another way (e.g., Bestiary button while popup is open), popup objects will be destroyed with scene. No leak risk.

### Known Risk: AudioManager saveMuteState compatibility

`AudioManager.saveMuteState()` (lines 130-137) does `JSON.parse(raw)` then sets only `data.sound`. After FTR-013, the parsed object will have `streak` field — it gets preserved because the code spreads nothing, just mutates `data.sound` and re-serializes. No data loss.

---

## Tests

### What to test
- [ ] First ever launch: streak = 1, isNewDay = true
- [ ] Same day re-open: streak unchanged, isNewDay = false
- [ ] Next day play: streak increments, continued = true
- [ ] 2 days gap + shield available: streak preserved, shield used
- [ ] 2 days gap + no shield: streak resets to 1
- [ ] 3+ days gap: streak resets regardless of shield
- [ ] Monday resets shield availability
- [ ] Streak badge shows on menu
- [ ] Reward popup shows only on first visit per day

### How to test
- Manual: Manipulate localStorage dates to simulate multi-day scenarios
- Manual: Verify popup appears on first daily visit, not on subsequent visits

---

## Definition of Done

### Functional
- [ ] Streak counter tracks consecutive daily play
- [ ] Shield prevents streak break on single missed day (once per week)
- [ ] Daily reward popup shows on first visit each day
- [ ] Streak badge visible on menu screen
- [ ] Reward multiplier correct per streak day

### Technical
- [ ] `npm run build` succeeds
- [ ] DailyStreakManager.ts ≤ 100 LOC
- [ ] No console errors
