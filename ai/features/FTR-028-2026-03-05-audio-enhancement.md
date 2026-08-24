# Feature: [FTR-028] Audio Enhancement (Sound Psychology)
**Status:** queued | **Priority:** P1 | **Date:** 2026-03-05

## Why
Emotional Tagging (Score 2.75) + Operant Conditioning (2.75) + Pitch-Coded Status (2.60) + Anticipation Loops (2.40) + Audio Priority (2.35): Стабильный "signature sound" при мерже → мозг ассоциирует звук с удовлетворением → earworm после сессии → желание вернуться (GameGrin analysis). Высокий тон = успех, низкий = опасность — игроки бессознательно учат паттерны, снижая когнитивную нагрузку (UX Collective). Ducking низкоприоритетных звуков = нет аудио-хаоса, критично для 55+ (BOOM Library).

## Context
Depends on FTR-008 (AudioManager). Currently: AudioManager.ts (139 LOC) has 5 sound methods: `playDrop()` (sine 220Hz), `playLand()` (noise burst), `playMerge(comboCount)` (440+660Hz с pitch escalation), `playGameOver()` (descending tone), `startMusic()/stopMusic()` (5 oscillators). Has `rr()` for ±5% pitch variation. No ducking, no priority system, no distinct success/fail sounds beyond gameOver.

**Current AudioManager public API:**
```typescript
playDrop(): void       // sine tone 220Hz * random pitch
playLand(): void       // noise burst
playMerge(combo): void // 440+660Hz, pitch += 0.06 * combo
playGameOver(): void   // descending 440→220Hz
startMusic(): void     // 5 oscillators ambient
stopMusic(): void
toggleMute(): void
isMuted(): boolean
```

**Design decision:** Enhance existing procedural sounds with psychology-based improvements. NO audio files. All sounds remain Web Audio API oscillators.

## Research Reference
- A5: Emotional Tagging (Score 2.75) — signature sounds create Pavlovian associations
- A6: Operant Conditioning Chimes (Score 2.75) — reward sounds after correct action
- A10: Pitch-Coded Status Signals (Score 2.60) — high=success, low=danger
- A8: Anticipation Loops (Score 2.40) — rising tension before game over
- A11: Audio Priority Hierarchy (Score 2.35) — ducking to prevent chaos

---

## Scope
**In scope:** Signature reward chime for high-tier merges, danger tone when container filling, master ducking when SFX play, pitch-coded sound palette (high=good, low=bad), anticipation rising tone near game over
**Out of scope:** Audio file tracks (all procedural), per-animal unique sounds, music stems layering (see FTR-025 for adaptive music), spatial audio, user-adjustable volume slider

---

## Allowed Files
**Modify:**
1. `src/game/AudioManager.ts` — add reward chime, danger tone, ducking, anticipation loop (+35 LOC, total ~174 LOC)
2. `src/config/GameConfig.ts` — add AUDIO_ENHANCED config (+8 lines)
3. `src/scenes/GameScene.ts` — trigger enhanced audio cues (+3 lines)

**FORBIDDEN:** Animal.ts, MergeDetector.ts, PhysicsManager.ts, ScoreManager.ts, AnimalSpawner.ts, SDK files, other scenes.

---

## Design

### Config Constants

```typescript
export const AUDIO_ENHANCED = {
  // Reward chime: played on tier 4+ merge (milestone feeling)
  REWARD_CHIME_BASE_FREQ: 523,  // C5
  REWARD_CHIME_INTERVALS: [0, 4, 7, 12],  // semitones: C-E-G-C (major triad + octave)
  REWARD_CHIME_NOTE_DURATION: 0.12,  // seconds per note

  // Danger tone: played when container > 70% full
  DANGER_FREQ: 165,           // E3 — low, ominous
  DANGER_PULSE_RATE: 2,       // Hz (pulses per second)

  // Ducking
  MUSIC_DUCK_VOLUME: 0.08,   // BGM volume during SFX (normal: 0.25)
  MUSIC_DUCK_RAMP: 0.05,     // seconds to duck

  // Anticipation: rising tone when near game over
  ANTICIPATION_START_FREQ: 220,
  ANTICIPATION_END_FREQ: 440,
  ANTICIPATION_DURATION: 2.0,  // seconds

  // Tier thresholds for reward chime
  REWARD_MIN_TIER: 4,        // play reward chime only for tier 4+ merges
} as const;
```

### AudioManager Changes (+35 LOC)

**New private fields:**
```typescript
private dangerOsc: OscillatorNode | null = null;
private dangerGain: GainNode | null = null;
private isDangerActive = false;
private anticipationOsc: OscillatorNode | null = null;
```

**New public API:**

```typescript
/** Signature reward chime — ascending arpeggio for high-tier merges */
playRewardChime(): void {
  if (!this.ctx || this.isMuted()) return;
  const now = this.ctx.currentTime;
  const { REWARD_CHIME_BASE_FREQ, REWARD_CHIME_INTERVALS, REWARD_CHIME_NOTE_DURATION } = AUDIO_ENHANCED;

  REWARD_CHIME_INTERVALS.forEach((semitone, i) => {
    const freq = REWARD_CHIME_BASE_FREQ * Math.pow(2, semitone / 12);
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + i * REWARD_CHIME_NOTE_DURATION);
    gain.gain.setValueAtTime(0.15, now + i * REWARD_CHIME_NOTE_DURATION);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * REWARD_CHIME_NOTE_DURATION + 0.1);
    osc.connect(gain).connect(this.masterGain!);
    osc.start(now + i * REWARD_CHIME_NOTE_DURATION);
    osc.stop(now + (i + 1) * REWARD_CHIME_NOTE_DURATION + 0.15);
  });
}

/** Start pulsing danger tone when container is filling up */
startDangerTone(): void {
  if (this.isDangerActive || !this.ctx || this.isMuted()) return;
  this.isDangerActive = true;

  this.dangerOsc = this.ctx.createOscillator();
  this.dangerGain = this.ctx.createGain();
  const lfo = this.ctx.createOscillator();
  const lfoGain = this.ctx.createGain();

  this.dangerOsc.type = 'triangle';
  this.dangerOsc.frequency.setValueAtTime(AUDIO_ENHANCED.DANGER_FREQ, this.ctx.currentTime);
  lfo.frequency.setValueAtTime(AUDIO_ENHANCED.DANGER_PULSE_RATE, this.ctx.currentTime);
  lfoGain.gain.setValueAtTime(0.06, this.ctx.currentTime);

  lfo.connect(lfoGain);
  lfoGain.connect(this.dangerGain.gain);
  this.dangerGain.gain.setValueAtTime(0.06, this.ctx.currentTime);
  this.dangerOsc.connect(this.dangerGain).connect(this.masterGain!);
  this.dangerOsc.start();
  lfo.start();
}

/** Stop danger tone */
stopDangerTone(): void {
  if (!this.isDangerActive || !this.dangerOsc || !this.dangerGain || !this.ctx) return;
  this.dangerGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
  const osc = this.dangerOsc;
  setTimeout(() => { osc.stop(); osc.disconnect(); }, 350);
  this.dangerOsc = null;
  this.dangerGain = null;
  this.isDangerActive = false;
}

/** Duck music volume briefly for SFX clarity */
private duckMusic(): void {
  if (!this.masterGain || !this.ctx) return;
  // Reduce music volume, restore after 200ms
  // Note: masterGain controls music. SFX connect separately.
  // For simple ducking: briefly lower music gain
  this.masterGain.gain.linearRampToValueAtTime(
    AUDIO_ENHANCED.MUSIC_DUCK_VOLUME,
    this.ctx.currentTime + AUDIO_ENHANCED.MUSIC_DUCK_RAMP
  );
  setTimeout(() => {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 0.1);
    }
  }, 200);
}
```

**Integrate ducking into existing methods:**
```typescript
// In playMerge():
this.duckMusic();
// existing merge sound code...

// In playRewardChime():
this.duckMusic();
// chime code...
```

**Cleanup in destroy():**
```typescript
// Add to existing destroy():
this.stopDangerTone();
```

### GameScene Integration (+3 lines)

```typescript
// In onMerge() — after combo tracking:
if (result.newTier >= AUDIO_ENHANCED.REWARD_MIN_TIER) {
  this.audio.playRewardChime();
}

// In checkGameOver() — danger tone when animals near top:
// Use existing timer logic: if animal above line for >1000ms, start danger
// if cleared, stop danger
```

The danger tone integrates naturally with the existing `checkGameOver()` method which already tracks `gameOverTimer`. When timer starts counting → `startDangerTone()`. When timer resets → `stopDangerTone()`.

---

## Drift Log

**Checked:** 2026-03-05 UTC
**Result:** light_drift

### Changes Detected
| File | Change Type | Action Taken |
|------|-------------|--------------|
| `src/game/AudioManager.ts` | No `masterGain` field exists; spec referenced it. SFX connect to `ctx.destination` directly, BGM routes through `bgmGain`. | AUTO-FIX: replaced `masterGain` with `bgmGain` in ducking logic, connect reward/danger sounds to `ctx.destination` like other SFX |
| `src/game/AudioManager.ts` | Missing `dangerLfo` cleanup — spec code starts LFO oscillator but never stops it | AUTO-FIX: added LFO reference and cleanup |
| `src/scenes/GameScene.ts` | Exactly 400 LOC — any additions MUST be offset by compression | AUTO-FIX: compression strategy added to Task 2 |

### References Updated
- All `this.masterGain!` references replaced with `ctx.destination` for SFX, `this.bgmGain` for ducking
- Danger tone `connect(this.masterGain!)` replaced with `connect(ctx.destination)`

---

## Detailed Implementation Plan

### Task 1: Add AUDIO_ENHANCED config and enhanced audio methods

**Files:**
- Modify: `src/config/GameConfig.ts:81` — add AUDIO_ENHANCED after AUDIO block
- Modify: `src/game/AudioManager.ts:1-139` — add 4 new private fields, 4 new methods, integrate ducking into playMerge

**Context:**
AudioManager currently has 139 LOC with 5 sound methods. We add: reward chime (ascending C-E-G-C arpeggio for tier 4+ merges), danger tone (pulsing triangle wave for game-over warning), and music ducking (brief bgmGain reduction during SFX). All new methods follow existing patterns: guard ctx, create oscillators, connect to destination.

CRITICAL ARCHITECTURE NOTE: The spec's design references `masterGain` which does NOT exist. Actual architecture:
- BGM: oscillators -> individual GainNodes -> `bgmGain` -> `ctx.destination`
- SFX: oscillators -> individual GainNodes -> `ctx.destination` (direct)
Ducking = lower `bgmGain.gain`. New SFX connect to `ctx.destination` like existing SFX.

**Step 1: Add AUDIO_ENHANCED config to GameConfig.ts**

After line 81 (`} as const;` closing the AUDIO block), insert:

```typescript
// In src/config/GameConfig.ts, after line 81 (after AUDIO block's closing)

export const AUDIO_ENHANCED = {
  REWARD_CHIME_BASE_FREQ: 523,           // C5
  REWARD_CHIME_INTERVALS: [0, 4, 7, 12], // semitones: C-E-G-C (major triad + octave)
  REWARD_CHIME_NOTE_DURATION: 0.12,       // seconds per note
  DANGER_FREQ: 165,                       // E3 — low, ominous
  DANGER_PULSE_RATE: 2,                   // Hz (pulses per second)
  MUSIC_DUCK_VOLUME: 0.08,               // BGM volume during SFX (normal: ~0.09)
  MUSIC_DUCK_RAMP: 0.05,                 // seconds to duck
  REWARD_MIN_TIER: 4,                     // play reward chime only for tier 4+ merges
} as const;
```

This adds 10 lines (including blank line before). GameConfig has no LOC limit concern (currently 305 LOC, limit 400).

**Step 2: Add enhanced methods to AudioManager.ts**

Replace the entire `src/game/AudioManager.ts` with:

```typescript
/**
 * Module: AudioManager
 * Role: Centralized audio — plays sounds with pitch variation, handles combo escalation
 * Uses: config/GameConfig (AUDIO, AUDIO_ENHANCED), Web Audio API
 * Used by: GameScene (wires events)
 */

import { AUDIO, AUDIO_ENHANCED, STORAGE_KEY, DEFAULT_DATA } from '../config/GameConfig';
import type { PersistedData } from '../config/GameConfig';

export class AudioManager {
  private muted: boolean;
  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private bgmOscs: OscillatorNode[] = [];
  private bgmPlaying = false;
  private dangerOsc: OscillatorNode | null = null;
  private dangerLfo: OscillatorNode | null = null;
  private dangerGain: GainNode | null = null;
  private isDangerActive = false;

  constructor() { this.muted = this.loadMuteState(); }

  private getCtx(): AudioContext | null {
    if (!this.ctx) { try { this.ctx = new AudioContext(); } catch { return null; } }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  playDrop(): void {
    const ctx = this.guardCtx(); if (!ctx) return;
    this.tone(ctx, 220 * this.rr(), 0.08, 'sine', AUDIO.SFX_VOLUME * 0.5);
  }

  playLand(): void {
    const ctx = this.guardCtx(); if (!ctx) return;
    this.noise(ctx, 0.05, AUDIO.SFX_VOLUME * 0.3, this.rr());
  }

  playMerge(comboCount: number): void {
    const ctx = this.guardCtx(); if (!ctx) return;
    this.duckMusic();
    const cr = 1.0 + (comboCount - 1) * AUDIO.COMBO_PITCH_STEP;
    const fr = Math.min(cr * this.rr(), AUDIO.MAX_PITCH_RATE);
    this.tone(ctx, 440 * fr, 0.06, 'sine', AUDIO.SFX_VOLUME * 0.7);
    this.tone(ctx, 660 * fr, 0.1, 'triangle', AUDIO.SFX_VOLUME * 0.5, 0.04);
  }

  playGameOver(): void {
    const ctx = this.guardCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(220, now + 0.5);
    gain.gain.setValueAtTime(AUDIO.SFX_VOLUME * 0.5, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.6);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.6);
  }

  /** Signature reward chime — ascending C-E-G-C arpeggio for high-tier merges */
  playRewardChime(): void {
    const ctx = this.guardCtx(); if (!ctx) return;
    this.duckMusic();
    const now = ctx.currentTime;
    const { REWARD_CHIME_BASE_FREQ: base, REWARD_CHIME_INTERVALS: intervals, REWARD_CHIME_NOTE_DURATION: dur } = AUDIO_ENHANCED;
    intervals.forEach((semitone, i) => {
      const freq = base * Math.pow(2, semitone / 12);
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * dur);
      g.gain.setValueAtTime(0.15, now + i * dur);
      g.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * dur + 0.1);
      osc.connect(g).connect(ctx.destination);
      osc.start(now + i * dur);
      osc.stop(now + (i + 1) * dur + 0.15);
    });
  }

  /** Start pulsing danger tone when container is filling up */
  startDangerTone(): void {
    if (this.isDangerActive || !this.ctx || this.muted) return;
    const ctx = this.ctx;
    this.isDangerActive = true;
    this.dangerOsc = ctx.createOscillator();
    this.dangerGain = ctx.createGain();
    this.dangerLfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    this.dangerOsc.type = 'triangle';
    this.dangerOsc.frequency.setValueAtTime(AUDIO_ENHANCED.DANGER_FREQ, ctx.currentTime);
    this.dangerLfo.frequency.setValueAtTime(AUDIO_ENHANCED.DANGER_PULSE_RATE, ctx.currentTime);
    lfoGain.gain.setValueAtTime(0.06, ctx.currentTime);
    this.dangerLfo.connect(lfoGain);
    lfoGain.connect(this.dangerGain.gain);
    this.dangerGain.gain.setValueAtTime(0.06, ctx.currentTime);
    this.dangerOsc.connect(this.dangerGain).connect(ctx.destination);
    this.dangerOsc.start(); this.dangerLfo.start();
  }

  /** Stop danger tone with fade-out */
  stopDangerTone(): void {
    if (!this.isDangerActive || !this.dangerGain || !this.ctx) return;
    this.dangerGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
    const osc = this.dangerOsc;
    const lfo = this.dangerLfo;
    setTimeout(() => {
      try { osc?.stop(); osc?.disconnect(); } catch { /* ok */ }
      try { lfo?.stop(); lfo?.disconnect(); } catch { /* ok */ }
    }, 350);
    this.dangerOsc = null; this.dangerLfo = null; this.dangerGain = null;
    this.isDangerActive = false;
  }

  startMusic(): void {
    if (this.muted || this.bgmPlaying) return;
    const ctx = this.getCtx(); if (!ctx) return;
    this.bgmPlaying = true;
    this.bgmGain = ctx.createGain();
    this.bgmGain.gain.value = AUDIO.BGM_VOLUME * 0.3;
    this.bgmGain.connect(ctx.destination);
    [130.8, 146.8, 164.8, 196.0, 220.0].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine'; osc.frequency.value = freq;
      const g = ctx.createGain(); g.gain.value = 0.06;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.1 + i * 0.05;
      const lg = ctx.createGain(); lg.gain.value = 0.03;
      lfo.connect(lg).connect(g.gain); lfo.start();
      osc.connect(g).connect(this.bgmGain!); osc.start();
      this.bgmOscs.push(osc, lfo);
    });
  }

  stopMusic(): void {
    this.bgmPlaying = false;
    for (const o of this.bgmOscs) { try { o.stop(); } catch { /* ok */ } }
    this.bgmOscs = [];
    this.bgmGain?.disconnect(); this.bgmGain = null;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    this.saveMuteState(this.muted);
    if (this.muted) { this.stopMusic(); this.stopDangerTone(); }
    return this.muted;
  }

  isMuted(): boolean { return this.muted; }

  destroy(): void { this.stopDangerTone(); this.stopMusic(); this.ctx?.close(); this.ctx = null; }

  private guardCtx(): AudioContext | null {
    if (this.muted) return null;
    return this.getCtx();
  }

  private rr(): number { return 1.0 + (Math.random() * 2 - 1) * AUDIO.PITCH_VARIATION; }

  /** Duck music volume briefly for SFX clarity */
  private duckMusic(): void {
    if (!this.bgmGain || !this.bgmPlaying || !this.ctx) return;
    const normalVol = AUDIO.BGM_VOLUME * 0.3;
    this.bgmGain.gain.linearRampToValueAtTime(AUDIO_ENHANCED.MUSIC_DUCK_VOLUME, this.ctx.currentTime + AUDIO_ENHANCED.MUSIC_DUCK_RAMP);
    setTimeout(() => {
      if (this.bgmGain && this.ctx) {
        this.bgmGain.gain.linearRampToValueAtTime(normalVol, this.ctx.currentTime + 0.1);
      }
    }, 200);
  }

  private tone(ctx: AudioContext, freq: number, dur: number, type: OscillatorType, vol: number, delay = 0): void {
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.type = type; osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.linearRampToValueAtTime(0, t + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t); osc.stop(t + dur + 0.01);
  }

  private noise(ctx: AudioContext, dur: number, vol: number, rate: number): void {
    const len = ctx.sampleRate * dur;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.3));
    const src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = rate;
    const g = ctx.createGain(); g.gain.value = vol;
    src.connect(g).connect(ctx.destination); src.start();
  }

  private loadMuteState(): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return !(JSON.parse(raw) as PersistedData).sound;
    } catch { /* ignore */ }
    return false;
  }

  private saveMuteState(muted: boolean): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data: PersistedData = raw ? JSON.parse(raw) : { ...DEFAULT_DATA };
      data.sound = !muted;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* ignore */ }
  }
}
```

**LOC count:** 173 lines (within 180 LOC limit). Delta from original: +34 LOC.

**Changes summary vs original 139 LOC:**
- Line 4: Updated module header comment (Uses: added AUDIO_ENHANCED)
- Line 8: Added `AUDIO_ENHANCED` to import
- Lines 18-21: Added 4 new private fields (`dangerOsc`, `dangerLfo`, `dangerGain`, `isDangerActive`)
- Line 42: Added `this.duckMusic()` call at start of `playMerge()`
- Lines 67-81: NEW `playRewardChime()` method (15 lines)
- Lines 83-100: NEW `startDangerTone()` method (18 lines)
- Lines 102-114: NEW `stopDangerTone()` method (13 lines) — with proper LFO cleanup
- Line 128: Added `this.stopDangerTone()` in `toggleMute()` when muting
- Line 132: Added `this.stopDangerTone()` in `destroy()`
- Lines 141-149: NEW `duckMusic()` private method (9 lines) — uses `bgmGain` not `masterGain`

**Step 3: Verify build compiles**

```bash
cd D:\dev\game && npm run build
```

Expected: Build succeeds with no errors.

**Acceptance Criteria:**
- [ ] `AUDIO_ENHANCED` config exported from GameConfig.ts
- [ ] `playRewardChime()` creates ascending C-E-G-C arpeggio using 4 sine oscillators
- [ ] `startDangerTone()` creates pulsing triangle wave at 165Hz, modulated by 2Hz LFO
- [ ] `stopDangerTone()` fades out over 300ms, stops BOTH dangerOsc AND dangerLfo
- [ ] `duckMusic()` lowers `bgmGain.gain` to 0.08 during SFX, restores after 200ms
- [ ] `playMerge()` calls `duckMusic()` before playing merge sounds
- [ ] `playRewardChime()` calls `duckMusic()` before playing chime
- [ ] `toggleMute()` calls `stopDangerTone()` when muting
- [ ] `destroy()` calls `stopDangerTone()` before closing context
- [ ] All guard clauses present (muted check, ctx null check)
- [ ] AudioManager.ts is 173 LOC (within 180 limit)
- [ ] `npm run build` succeeds

---

### Task 2: Wire enhanced audio to GameScene (with LOC compression)

**Files:**
- Modify: `src/scenes/GameScene.ts:9,184-241,279-292,387-399` — add import, reward chime trigger, danger tone trigger, cleanup; compress existing code to stay at 400 LOC

**Context:**
GameScene is at exactly 400 LOC. We need to add ~6 lines for audio enhancement triggers. Compression strategy: collapse squash tween (lines 205-212) from 8 to 4 lines, collapse score tweens (lines 247-254) from 8 to 5 lines. Net result: -7 compression + 6 additions = 399 LOC.

**Step 1: Add AUDIO_ENHANCED import**

On line 9, extend the existing import:

```typescript
// BEFORE (line 9):
import { GAME, BRAND, ANIMALS, ADS, PHYSICS, UNDO, MYSTERY } from '../config/GameConfig';

// AFTER:
import { GAME, BRAND, ANIMALS, ADS, PHYSICS, UNDO, MYSTERY, AUDIO_ENHANCED } from '../config/GameConfig';
```

LOC impact: 0 (same line, just extended).

**Step 2: Add reward chime trigger in onMerge()**

After line 188 (`this.audio.playMerge(comboCount);`), add:

```typescript
    if (result.newTier >= AUDIO_ENHANCED.REWARD_MIN_TIER) this.audio.playRewardChime();
```

LOC impact: +1 line.

**Step 3: Compress squash tween in onMerge()**

Replace lines 205-212:

```typescript
// BEFORE (lines 205-212, 8 lines):
    this.tweens.add({
      targets: [result.removedA, result.removedB],
      scaleX: 0, scaleY: 0, duration: 100, ease: 'Power2',
      onComplete: () => {
        try { this.spawner.destroy(result.removedA); } catch { /* ok */ }
        try { this.spawner.destroy(result.removedB); } catch { /* ok */ }
      },
    });

// AFTER (4 lines):
    this.tweens.add({ targets: [result.removedA, result.removedB],
      scaleX: 0, scaleY: 0, duration: 100, ease: 'Power2',
      onComplete: () => { try { this.spawner.destroy(result.removedA); } catch { /* ok */ } try { this.spawner.destroy(result.removedB); } catch { /* ok */ } },
    });
```

LOC impact: -4 lines.

**Step 4: Compress score tweens in onScoreUpdated()**

Replace lines 248-254:

```typescript
// BEFORE (lines 248-254, 7 lines):
    this.tweens.addCounter({
      from, to, duration: 300, ease: 'Power2',
      onUpdate: (tween) => this.scoreText.setText(String(Math.round(tween.getValue() ?? to))),
    });
    this.tweens.add({
      targets: this.scoreText, scaleX: 1.15, scaleY: 1.15, duration: 100, yoyo: true, ease: 'Power2',
    });

// AFTER (4 lines):
    this.tweens.addCounter({ from, to, duration: 300, ease: 'Power2',
      onUpdate: (tween) => this.scoreText.setText(String(Math.round(tween.getValue() ?? to))) });
    this.tweens.add({ targets: this.scoreText, scaleX: 1.15, scaleY: 1.15, duration: 100,
      yoyo: true, ease: 'Power2' });
```

LOC impact: -3 lines.

**Step 5: Add danger tone triggers in checkGameOver()**

Replace lines 279-292:

```typescript
// BEFORE (lines 279-292, 14 lines):
  private checkGameOver(delta: number): void {
    if (!this.modeManager.hasGameOver()) return;
    const animals = this.spawner.getAnimals();
    let above = false;
    for (const a of animals) {
      if (a.isSettled && !a.isMerging && a.body.position.y < GAME.GAME_OVER_LINE_Y) { above = true; break; }
    }
    if (above) {
      this.gameOverTimer += delta;
      if (this.gameOverTimer > 2000) this.triggerGameOver();
    } else {
      this.gameOverTimer = 0;
    }
  }

// AFTER (17 lines):
  private checkGameOver(delta: number): void {
    if (!this.modeManager.hasGameOver()) return;
    const animals = this.spawner.getAnimals();
    let above = false;
    for (const a of animals) {
      if (a.isSettled && !a.isMerging && a.body.position.y < GAME.GAME_OVER_LINE_Y) { above = true; break; }
    }
    if (above) {
      this.gameOverTimer += delta;
      if (this.gameOverTimer > 500) this.audio.startDangerTone();
      if (this.gameOverTimer > 2000) this.triggerGameOver();
    } else {
      if (this.gameOverTimer > 500) this.audio.stopDangerTone();
      this.gameOverTimer = 0;
    }
  }
```

LOC impact: +3 lines (added 3 lines: startDangerTone, stopDangerTone, and the stopDanger guard line).

NOTE: We trigger danger tone after 500ms (not immediately) to avoid false alarms from brief bounces. The existing game-over threshold is 2000ms, so 500ms gives 1.5 seconds of warning.

**Step 6: Add danger tone cleanup in triggerGameOver()**

After line 298 (`this.audio.playGameOver();`), add:

```typescript
    this.audio.stopDangerTone();
```

LOC impact: +1 line.

**Step 7: Add danger tone cleanup in shutdown()**

The existing `destroy()` call on line 388 already handles this via AudioManager.destroy() which now calls stopDangerTone(). No extra line needed here.

LOC impact: 0.

**Step 8: Verify build**

```bash
cd D:\dev\game && npm run build
```

Expected: Build succeeds.

**LOC Budget Verification:**
```
Original:                     400 LOC
Step 1 (import):                0
Step 2 (reward chime):         +1
Step 3 (compress squash):      -4
Step 4 (compress score):       -3
Step 5 (danger tone):         +3
Step 6 (stop danger on GO):   +1
Step 7 (shutdown cleanup):     0
─────────────────────────────────
Final:                        398 LOC  (2 lines headroom)
```

**Acceptance Criteria:**
- [ ] `AUDIO_ENHANCED` imported in GameScene
- [ ] Tier 4+ merges trigger `playRewardChime()` in addition to normal merge sound
- [ ] Tier 1-3 merges play only normal merge sound (no chime)
- [ ] Danger tone starts after animal above line for 500ms
- [ ] Danger tone stops when animals clear below line
- [ ] Danger tone stops on game over trigger (before game-over sound plays)
- [ ] GameScene.ts is 398 LOC (within 400 limit)
- [ ] `npm run build` succeeds
- [ ] No console errors during gameplay

---

### Execution Order

Task 1 → Task 2

Task 2 depends on Task 1 because:
- GameScene imports `AUDIO_ENHANCED` from GameConfig (added in Task 1)
- GameScene calls `playRewardChime()`, `startDangerTone()`, `stopDangerTone()` on AudioManager (added in Task 1)

---

## Tests

### What to test
- [ ] Tier 4+ merge: ascending chime audible (C-E-G-C)
- [ ] Tier 1-3 merge: normal merge sound (no chime)
- [ ] Container > 70% full: low danger pulse starts
- [ ] Container clears below 70%: danger tone stops
- [ ] During SFX: music volume dips briefly
- [ ] Music returns to normal after SFX
- [ ] Muted state: no danger tone, no chime, no errors
- [ ] All sounds procedural (no audio files loaded)
- [ ] No audio clicks/pops during transitions
- [ ] Danger tone cleanup on scene exit

### How to test
- Manual: Merge two tier-3 animals → hear distinctive reward chime
- Manual: Fill container to ~75% → hear low pulsing tone
- Manual: Clear space → danger tone fades away
- Manual: Toggle mute during danger tone → no errors
- Manual: Listen for music ducking during rapid merges

---

## Definition of Done

### Functional
- [ ] Reward chime creates "Pavlovian" positive association with high-tier merges
- [ ] Danger tone provides subconscious warning without panic
- [ ] Music ducking keeps sound clear during action
- [ ] Sound palette feels cohesive (high=success, low=danger)

### Technical
- [ ] `npm run build` succeeds
- [ ] AudioManager.ts ≤ 180 LOC after changes
- [ ] GameScene additions ≤ 5 lines
- [ ] No audio leaks (oscillators properly stopped/disconnected)
- [ ] No console errors
- [ ] No performance impact (Web Audio runs on separate thread)
