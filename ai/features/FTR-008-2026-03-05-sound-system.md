# Feature: [FTR-008] Sound System Foundation
**Status:** queued | **Priority:** P0 | **Date:** 2026-03-05

## Why
Игра полностью беззвучная. Звук — #1 фактор "сока" (juice) в casual играх. Исследование CreatorSoundsPro: immediate audio response создаёт ощущение "отзывчивости". Escalating pitch при комбо — доказанный драйвер "ещё разок" (Candy Crush, Suika). ASMR-текстуры — топ для ЦА 55+ женщин (Water Match в топе US Charts). Ambient loop влияет на восприятие времени — игрок не замечает, как прошёл час.

## Context
Depends on all FTR-001..007 (playable game). No audio system exists yet. Phaser 3 has built-in audio manager via `this.sound`. Web Audio API requires user gesture to unlock — handle via first tap.

## Research Reference
- A1: Escalating Pitch при комбо (Score 3.00)
- A2: Randomized Micro-Variation (Score 3.00)
- A3: Immediate Audio Response (Score 3.00)
- A4: ASMR-текстуры (Score 2.65)
- A7: Flow-Sustaining Ambient Loops (Score 3.00)

---

## Scope
**In scope:** AudioManager class, 5 sound types (drop, land, merge, combo-chime, game-over), ambient music loop, pitch randomization, escalating pitch on combo, mute toggle
**Out of scope:** Adaptive music (Sprint 4), seasonal audio, multi-layer stacking, audio priority hierarchy

---

## Allowed Files
**New files allowed:**
1. `src/game/AudioManager.ts` — centralized audio controller (~120 LOC)
2. `public/assets/audio/drop.mp3` — soft "puf" on animal drop
3. `public/assets/audio/land.mp3` — soft thud on landing
4. `public/assets/audio/merge.mp3` — satisfying ASMR "plop" on merge
5. `public/assets/audio/combo.mp3` — ascending chime for combo chains
6. `public/assets/audio/gameover.mp3` — gentle descending tone
7. `public/assets/audio/bgm.mp3` — ambient loop (30-60s, loopable)

**Modify:**
8. `src/scenes/PreloadScene.ts` — load audio assets
9. `src/scenes/GameScene.ts` — wire AudioManager to events
10. `src/scenes/MenuScene.ts` — add mute toggle button
11. `src/config/GameConfig.ts` — add AUDIO config constants

**FORBIDDEN:** Game logic files (MergeDetector, AnimalSpawner, InputHandler, PhysicsManager), SDK files.

---

## Design

### AudioManager (~120 LOC)

```typescript
/**
 * Module: AudioManager
 * Role: Centralized audio — plays sounds with pitch variation, handles combo escalation
 * Uses: config/GameConfig (AUDIO), Phaser.Sound
 * Used by: GameScene (wires events)
 * Does NOT: Contain game logic, manage score, detect merges
 */
```

**Public API:**
- `playDrop()` — soft "puf" on drop input (immediate, <50ms)
- `playLand()` — thud on animal settling
- `playMerge(comboCount: number)` — merge sound with escalating pitch based on combo
- `playGameOver()` — gentle descending tone
- `startMusic()` / `stopMusic()` — ambient loop control
- `toggleMute()` / `isMuted(): boolean` — mute state (persisted in localStorage)

**Pitch Randomization (A2):**
```typescript
// Every sound plays with ±5% pitch variation
const rate = 1.0 + (Math.random() * 0.1 - 0.05);
sound.play({ rate });
```

**Escalating Pitch on Combo (A1):**
```typescript
// Each consecutive merge raises pitch by ~semitone
// comboCount 1 = normal, 2 = +semitone, 3 = +2 semitones...
const comboRate = 1.0 + (comboCount - 1) * 0.06;
const finalRate = comboRate + (Math.random() * 0.1 - 0.05);
mergeSound.play({ rate: Math.min(finalRate, 2.0) });
```

**Immediate Response (A3):**
- Drop sound triggers on `DROP_REQUESTED` event, NOT on animation complete
- Merge sound triggers on `ANIMAL_MERGED` event immediately

### Audio Assets
Use Phaser's audio generation or embed tiny MP3s (total <500KB).
Fallback: generate sounds programmatically via Web Audio API oscillators if no MP3 files.

### Config Addition
```typescript
export const AUDIO = {
  PITCH_VARIATION: 0.05,
  COMBO_PITCH_STEP: 0.06,
  MAX_PITCH_RATE: 2.0,
  BGM_VOLUME: 0.3,
  SFX_VOLUME: 0.6,
} as const;
```

---

## Implementation Plan

### Task 1: Create AudioManager with pitch variation
**Type:** code
**Files:**
  - create: `src/game/AudioManager.ts`
  - modify: `src/config/GameConfig.ts` — add AUDIO constants
**Acceptance:** AudioManager class with playDrop/playMerge/playGameOver methods, pitch randomization works

### Task 2: Generate/create audio assets + load in PreloadScene
**Type:** code
**Files:**
  - create: `public/assets/audio/*.mp3` (or use Phaser tone generation)
  - modify: `src/scenes/PreloadScene.ts` — load audio files
**Acceptance:** All audio assets loaded without errors

### Task 3: Wire AudioManager to GameScene events
**Type:** code
**Files:**
  - modify: `src/scenes/GameScene.ts` — create AudioManager, wire to DROP_REQUESTED and ANIMAL_MERGED
**Acceptance:** Sounds play on drop and merge with pitch variation, escalating pitch on combo

### Task 4: Add mute toggle + ambient music
**Type:** code
**Files:**
  - modify: `src/scenes/MenuScene.ts` — mute button
  - modify: `src/scenes/GameScene.ts` — start/stop ambient music
**Acceptance:** Mute button works, ambient loop plays during gameplay, mute state persists

### Execution Order
1 → 2 → 3 → 4

---

## Tests

### What to test
- [ ] AudioManager.playMerge(1) plays at normal pitch
- [ ] AudioManager.playMerge(3) plays at higher pitch than playMerge(1)
- [ ] Pitch randomization produces different rates on consecutive calls
- [ ] toggleMute() persists to localStorage
- [ ] No console errors from missing audio assets

### How to test
- Manual: Play game, verify sounds on drop/merge/game-over
- Manual: Verify pitch escalation on chain reactions
- Manual: Verify mute toggle works

---

## Definition of Done

### Functional
- [ ] Drop sound plays immediately on tap (before animation)
- [ ] Merge sound plays with pitch variation on every merge
- [ ] Combo merges produce escalating pitch (audibly higher)
- [ ] Ambient music loops during gameplay
- [ ] Mute toggle works and persists across sessions

### Technical
- [ ] `npm run build` succeeds
- [ ] AudioManager.ts ≤ 150 LOC
- [ ] Total audio assets < 500KB
- [ ] No console errors
