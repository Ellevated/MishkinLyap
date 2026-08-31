# Feature: [FTR-026] Cosmetic Skins
**Status:** queued | **Priority:** P2 | **Date:** 2026-03-05

## Why
Themed Cosmetic Skins (Score 2.35): косметика не влияет на геймплей, но даёт мотивацию коллекции и персонализации. Emoji Dropper: skins = 30% revenue для drop games. Для ЦА 55+ женщин — "мои мишки" персонализированы = emotional ownership. Unlock через достижения = прогрессия даже в бесконечной игре.

## Context
Depends on FTR-003 (Animal.ts), FTR-017 (CareerStats for unlock conditions). Currently: animals use fixed sprites from PNG files, loaded via `config.key` (e.g., 'hamster', 'bunny'). Sprite is `Phaser.GameObjects.Image` inside Container.

**Current Animal.ts (121 LOC → ~146 after Sprint 3 idle):**
```typescript
private sprite: Phaser.GameObjects.Image | null = null;
// Created in constructor: this.scene.add.image(0, 0, config.key)
```

**Design decision: Tint-based MVP** — no new art assets required. `sprite.setTint(color)` changes color multiplicatively. This gives distinct visual variants (golden, rosy, arctic, shadow) without needing 8×N new PNGs. Architecture allows easy upgrade to full sprite replacement when art is available.

**Phaser tint verified:** `sprite.setTint(0xFFD700)` applies multiplicative color. Result: golden-tinted version of original sprite. Works with WebGL renderer. `clearTint()` restores original.

## Research Reference
- G12: Themed Cosmetic Skins (Score 2.35)
- P7: Completionism / Set Completion (Score 2.65) — skins as collectibles

---

## Scope
**In scope:** SkinManager with 5 tint-based skins, unlock via gameplay milestones, skin selector on MenuScene, tint applied to all animals in gameplay, persistence of unlocked skins + active skin
**Out of scope:** Sprite-replacement skins (needs art assets), IAP skins, skin preview in bestiary, per-animal skin (all animals get same tint), animated skins, seasonal-exclusive skins

---

## Allowed Files
**New files allowed:**
1. `src/game/SkinManager.ts` — skin registry, unlock conditions, active skin management (~60 LOC)

**Modify:**
2. `src/objects/Animal.ts` — add setSkinTint()/clearSkinTint() methods (+5 LOC, total ~151 LOC)
3. `src/scenes/MenuScene.ts` — skin selector button → skin picker UI (+10 lines)
4. `src/config/GameConfig.ts` — add SKINS config, SkinDef type (+10 lines)
5. `src/game/ScoreManager.ts` — persist unlockedSkins + activeSkin in PersistedData, migration (+8 lines)
6. `src/scenes/GameScene.ts` — apply active skin tint to spawned animals (+3 lines)

**FORBIDDEN:** MergeDetector.ts, PhysicsManager.ts, AnimalSpawner.ts, AudioManager.ts, SDK files.

---

## Design

### Config Constants

```typescript
export interface SkinDef {
  id: string;
  name: string;          // Display name
  tint: number;          // Hex color for setTint (0 = no tint)
  unlockLabel: string;   // What player needs to do
  unlockCheck: (stats: SkinUnlockStats) => boolean;
}

export interface SkinUnlockStats {
  bestScore: number;
  totalGames: number;     // from CareerStats (FTR-017)
  totalMerges: number;    // from CareerStats
  highestTier: number;    // max tier ever created
  discoveredTiers: number[];
}

export const SKINS: SkinDef[] = [
  {
    id: 'default',
    name: 'Обычные',
    tint: 0,               // no tint
    unlockLabel: 'Всегда',
    unlockCheck: () => true,
  },
  {
    id: 'golden',
    name: 'Золотые',
    tint: 0xFFD700,
    unlockLabel: 'Набери 10,000 очков',
    unlockCheck: (s) => s.bestScore >= 10000,
  },
  {
    id: 'rosy',
    name: 'Розовые',
    tint: 0xFFB6C1,
    unlockLabel: '50 мерджей за карьеру',
    unlockCheck: (s) => s.totalMerges >= 50,
  },
  {
    id: 'arctic',
    name: 'Ледяные',
    tint: 0x87CEEB,
    unlockLabel: 'Сыграй 100 игр',
    unlockCheck: (s) => s.totalGames >= 100,
  },
  {
    id: 'shadow',
    name: 'Тёмные',
    tint: 0x696969,
    unlockLabel: 'Создай Медведя',
    unlockCheck: (s) => s.highestTier >= 8,
  },
] as const;
```

### PersistedData Extension

```typescript
// Add to PersistedData
skinData: {
  unlockedSkins: string[];    // skin IDs unlocked
  activeSkin: string;         // current skin ID
};
```

Migration: if `skinData` missing → `{ unlockedSkins: ['default'], activeSkin: 'default' }`.

### SkinManager (~60 LOC)

```typescript
/**
 * Module: SkinManager
 * Role: Manages skin unlocks, active skin selection, tint values
 * Uses: config/GameConfig (SKINS), ScoreManager (persistence)
 * Used by: GameScene (apply tint), MenuScene (skin picker)
 * Does NOT: Display animals, modify physics, manage score
 */
```

**Public API:**
- `constructor()` — loads unlocked skins from PersistedData
- `getActiveSkin(): SkinDef` — returns current skin config
- `getActiveTint(): number` — returns tint hex (0 = no tint)
- `setActiveSkin(skinId: string): void` — change active skin + save
- `getUnlockedSkins(): SkinDef[]` — all unlocked skins
- `getAllSkins(): SkinDef[]` — all skins with lock status
- `checkUnlocks(stats: SkinUnlockStats): string[]` — check & unlock new skins, returns newly unlocked IDs

**Implementation:**
```typescript
export class SkinManager {
  private unlockedSkins: Set<string>;
  private activeSkinId: string;

  constructor() {
    const data = loadData();
    const skinData = data.skinData || { unlockedSkins: ['default'], activeSkin: 'default' };
    this.unlockedSkins = new Set(skinData.unlockedSkins);
    this.activeSkinId = skinData.activeSkin;
    // Ensure default is always unlocked
    this.unlockedSkins.add('default');
  }

  getActiveSkin(): SkinDef {
    return SKINS.find(s => s.id === this.activeSkinId) ?? SKINS[0];
  }

  getActiveTint(): number {
    return this.getActiveSkin().tint;
  }

  setActiveSkin(skinId: string): void {
    if (!this.unlockedSkins.has(skinId)) return;
    this.activeSkinId = skinId;
    this.save();
  }

  checkUnlocks(stats: SkinUnlockStats): string[] {
    const newlyUnlocked: string[] = [];
    for (const skin of SKINS) {
      if (this.unlockedSkins.has(skin.id)) continue;
      if (skin.unlockCheck(stats)) {
        this.unlockedSkins.add(skin.id);
        newlyUnlocked.push(skin.id);
      }
    }
    if (newlyUnlocked.length > 0) this.save();
    return newlyUnlocked;
  }

  getAllSkins(): Array<SkinDef & { unlocked: boolean }> {
    return SKINS.map(s => ({ ...s, unlocked: this.unlockedSkins.has(s.id) }));
  }

  private save(): void {
    const data = loadData();
    data.skinData = {
      unlockedSkins: [...this.unlockedSkins],
      activeSkin: this.activeSkinId,
    };
    saveData(data);
  }
}
```

### Animal.ts Changes (+5 LOC)

Add public methods for tint control:
```typescript
/** Apply cosmetic skin tint to sprite */
setSkinTint(tint: number): void {
  if (tint && this.sprite) this.sprite.setTint(tint);
}

/** Remove skin tint, restore original colors */
clearSkinTint(): void {
  this.sprite?.clearTint();
}
```

These methods are safe — tint is visual only, doesn't affect physics or Container transform.

### GameScene Integration (+3 lines)

Apply skin tint to every spawned animal:

```typescript
// In create():
this.skinManager = new SkinManager();
const skinTint = this.skinManager.getActiveTint();

// After animal spawn (in onDropRequested and onMerge):
if (skinTint) {
  animal.setSkinTint(skinTint);
}
```

For simplicity, tint is applied to new animals at spawn time. Existing animals in the scene already have the tint from when they were spawned.

### MenuScene Skin Picker (+10 lines)

Simple horizontal skin selector below bestiary:

```
Layout addition:
  [Бестиарий]    Y = 600
  [🎡 Колесо!]   Y = 660 (from FTR-023)

  Шкурки:                     Y = 720
  [○] [●] [○] [🔒] [🔒]     Y = 745 (5 circles, colored by tint)
  "Золотые" ← active label   Y = 775
```

```typescript
// Skin selector in MenuScene
const skinMgr = new SkinManager();
const allSkins = skinMgr.getAllSkins();
const startX = (width - (allSkins.length - 1) * 50) / 2;

allSkins.forEach((skin, i) => {
  const x = startX + i * 50;
  const y = 745;
  const color = skin.tint || 0xF5EDD8; // default = cream
  const circle = this.add.circle(x, y, 18, color)
    .setStrokeStyle(3, skin.id === skinMgr.getActiveSkin().id ? 0x3D2B1F : 0xD6C6A9);

  if (!skin.unlocked) {
    // Locked: show lock overlay
    circle.setAlpha(0.4);
    this.add.text(x, y, '🔒', { fontSize: '14px' }).setOrigin(0.5);
  } else {
    // Unlocked: selectable
    circle.setInteractive();
    circle.on('pointerup', () => {
      skinMgr.setActiveSkin(skin.id);
      this.scene.restart(); // refresh UI
    });
  }
});

// Active skin name
this.add.text(width / 2, 775, skinMgr.getActiveSkin().name, {
  fontFamily: BRAND.FONT_BODY,
  fontSize: '14px',
  color: BRAND.TEXT_SECONDARY,
}).setOrigin(0.5);
```

### Unlock Notification

When a skin is newly unlocked (checked at game end), show a toast:

```typescript
// In GameOverScene or GameScene.triggerGameOver():
const newSkins = skinMgr.checkUnlocks({
  bestScore: score.getBestScore(),
  totalGames: careerStats.gamesPlayed,
  totalMerges: careerStats.totalMerges,
  highestTier: sessionStats.highestTier,
  discoveredTiers: data.discoveredTiers,
});

if (newSkins.length > 0) {
  const skinName = SKINS.find(s => s.id === newSkins[0])?.name || '';
  // Show unlock notification
  effects.showToast(`Новая шкурка: ${skinName}!`);
}
```

**Dependency note:** `careerStats` comes from FTR-017 (Achievements). If FTR-017 is not implemented yet, unlock check can use simpler stats available from ScoreManager (bestScore, discoveredTiers). The more advanced unlock conditions (totalGames, totalMerges) would become available after FTR-017.

**Fallback if FTR-017 not done:**
```typescript
const stats: SkinUnlockStats = {
  bestScore: score.getBestScore(),
  totalGames: 0,       // placeholder until FTR-017
  totalMerges: 0,      // placeholder until FTR-017
  highestTier: Math.max(...data.discoveredTiers),
  discoveredTiers: data.discoveredTiers,
};
```

Only 'default', 'golden' (bestScore), and 'shadow' (highestTier) would be unlockable without FTR-017. The others would unlock after FTR-017 adds CareerStats.

---

## Implementation Plan

### Task 1: Create SkinManager + config + persistence
**Type:** code
**Files:**
  - modify: `src/config/GameConfig.ts` — add SKINS config, SkinDef/SkinUnlockStats types
  - create: `src/game/SkinManager.ts` — skin registry, unlock logic, active skin management
  - modify: `src/game/ScoreManager.ts` — add skinData to PersistedData, migration
  - modify: `src/objects/Animal.ts` — add setSkinTint()/clearSkinTint() methods
**Acceptance:** SkinManager loads/saves skins, checkUnlocks detects new unlocks, Animal accepts tint

### Task 2: Wire skins to GameScene + MenuScene picker
**Type:** code
**Files:**
  - modify: `src/scenes/GameScene.ts` — apply skin tint to spawned animals, check unlocks at game end (+3 lines)
  - modify: `src/scenes/MenuScene.ts` — skin picker circles, active indicator, lock overlay (+10 lines)
**Acceptance:** Animals show active skin tint during gameplay, skin picker on menu shows all skins with lock status, selecting skin applies immediately on next game

### Execution Order
1 → 2

---

## Tests

### What to test
- [ ] Default skin: no tint (original colors)
- [ ] Golden skin: visible gold tint on all animals
- [ ] Rosy skin: visible pink tint on all animals
- [ ] Arctic skin: visible blue tint on all animals
- [ ] Shadow skin: visible dark tint on all animals
- [ ] Tint persists across games (selected skin remembered)
- [ ] Locked skins show 🔒 and are not selectable
- [ ] Unlocking condition met → skin becomes available
- [ ] Newly unlocked skin shows notification toast
- [ ] Tint doesn't affect physics or gameplay
- [ ] Tint clears correctly when switching back to default
- [ ] Skin picker shows correct active/locked states

### How to test
- Manual: Select golden skin → start game → all animals have gold tint
- Manual: Switch to default → start game → normal colors
- Manual: Score 10,000+ → golden unlocks with notification
- Manual: Create bear (tier 8) → shadow skin unlocks
- Manual: Close/reopen game → selected skin preserved

---

## Definition of Done

### Functional
- [ ] 5 skins available (1 default + 4 unlockable)
- [ ] Tint-based visuals clearly distinguishable
- [ ] Skin selection persists across sessions
- [ ] Unlock conditions work (score, tier milestones)
- [ ] Skin picker intuitive and accessible

### Technical
- [ ] `npm run build` succeeds
- [ ] SkinManager.ts ≤ 70 LOC
- [ ] Animal.ts ≤ 155 LOC after changes
- [ ] MenuScene additions ≤ 15 lines
- [ ] GameScene additions ≤ 5 lines
- [ ] No console errors
- [ ] No visual artifacts from tinting
