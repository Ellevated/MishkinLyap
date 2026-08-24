# Feature: [FTR-032] Visual & Audio Polish
**Status:** done | **Priority:** P0 | **Date:** 2026-03-05

## Why
Три критические проблемы с презентацией игры:
1. Спрайты животных имели непрозрачный фон → при стакинге видны прямоугольники
2. Зверьки вписаны в физический круг с зазором → выглядят слишком маленькими
3. Фоновая музыка — тёмный ambient из 5 осцилляторов (130-220 Hz) → звучит как Half-Life, не подходит целевой аудитории (женщины 55+, стиль советских мультиков)

## Context
- Спрайты уже обработаны пользователем — лежат в `brandbook/assets/sprites/Crops/` с RGBA прозрачностью
- Все 8 PNG — портретная ориентация (ratio 0.44-0.74), RGBA mode
- AudioManager.ts: 198 LOC, адаптивная система calm/tense/combo уже работает
- GameScene.ts: 408 LOC — НЕ ТРОГАТЬ (public API AudioManager не меняется)

---

## Scope
**In scope:**
- Копирование + переименование 8 спрайтов из brandbook в public/assets/animals/
- Конфигурируемый множитель масштаба спрайтов (VISUAL.SPRITE_OVERFLOW)
- Полная замена BGM-секции AudioManager: от дронов к мелодичной пентатонике
- Корректировка GLOW_OUTER_STRENGTH под новый масштаб

**Out of scope:**
- Изменение SFX (playDrop, playMerge, playRewardChime, etc.) — остаются как есть
- BestiaryScene (использует setDisplaySize, не зависит от baseFactor)
- Изменение физики (радиусы, restitution)
- Подключение playLand() (dead code, отдельная задача)

---

## Impact Tree Analysis (ARCH-392)

### Step 1: UP — who uses?
- `src/scenes/GameScene.ts` → `AudioManager` (6 call sites: startMusic, stopMusic, setMusicState)
- `src/scenes/MenuScene.ts` → `AudioManager` (isMuted, toggleMute only)
- `src/game/AnimalSpawner.ts` → `Animal` (creates instances)
- `src/game/MergeDetector.ts` → `Animal` (reads tier, isMerging)

### Step 2: DOWN — what depends on?
- `AudioManager` imports: `AUDIO`, `AUDIO_ENHANCED`, `STORAGE_KEY`, `DEFAULT_DATA` from GameConfig
- `Animal` imports: `ANIMALS`, `PHYSICS`, `BRAND`, `JUICE` from GameConfig
- `PreloadScene` loads sprites by key from `ANIMALS[].key`

### Step 3: BY TERM — grep entire project
- `baseFactor` → 5 occurrences, ALL in Animal.ts (private field)
- `startMusic` → AudioManager definition + 2 calls in GameScene
- `setMusicState` → AudioManager definition + 2 calls in GameScene
- `bgmGain` → 7 occurrences, ALL in AudioManager.ts (private)

### Step 4: CHECKLIST — mandatory folders
- [x] `tests/**` — Playwright visual tests exist (may need screenshot update)
- [x] `public/assets/animals/` — sprite files being replaced
- [x] No DB migrations needed

### Verification
- [x] All found files added to Allowed Files
- [x] Public API of AudioManager NOT changing → zero grep cleanup needed

---

## Allowed Files
**ONLY these files may be modified during implementation:**
1. `public/assets/animals/*.png` — replace 8 sprite files
2. `src/objects/Animal.ts` — apply SPRITE_OVERFLOW to baseFactor (1 line)
3. `src/config/GameConfig.ts` — add VISUAL block + adjust GLOW_OUTER_STRENGTH
4. `src/game/AudioManager.ts` — rewrite BGM section (startMusic, applyMusicState, scheduler)

**FORBIDDEN:** All other files. Especially `GameScene.ts` (at 408 LOC limit) and `MenuScene.ts`.

---

## Environment

nodejs: true
docker: false
database: false

---

## Approaches

### Approach 1: Minimal — inline scale, warm up existing oscillators
**Summary:** Keep 5 held oscillators, shift to higher octave + triangle type. Inline `* 1.3` in Animal.ts.
**Pros:** Minimal code change (~10 LOC total)
**Cons:** Still drones, not melodic. Magic number in Animal.ts violates codebase convention.

### Approach 2: Full — config constant, looping melody with scheduler
**Source:** [A Tale of Two Clocks](https://web.dev/articles/audio-scheduling), [Omnibullet procedural soundtrack](https://omnibullet.cz/devlog/004-procedural-soundtrack/)
**Summary:** Config constant SPRITE_OVERFLOW. Replace BGM with lookahead-scheduled 8-bar pentatonic melody. Triangle oscillators + ADSR envelopes + convolver reverb. State variation via BPM/timbre/harmony.
**Pros:** Real melodic music, Soviet cartoon feel, configurable scale, follows codebase conventions
**Cons:** More complex (~85 LOC net BGM addition), needs musical composition

### Approach 3: Extract MusicEngine — separate file for BGM
**Summary:** Same as Approach 2, but extract all BGM code into `MusicEngine.ts`.
**Pros:** Clean separation, future-proof
**Cons:** Over-engineering — Approach 2 keeps AudioManager at ~234 LOC, well under 400 limit

### Selected: 2
**Rationale:** Config constant follows codebase pattern (every tunable in GameConfig). Looping melody with scheduler produces real music, not drones. LOC budget comfortable at ~234 total. No need to extract separate file (Approach 3) since we're well under 400.

---

## Design

### Sprite Mapping (Cyrillic → English)

| Source (brandbook/assets/sprites/Crops/) | Target (public/assets/animals/) | Tier | Dimensions |
|------------------------------------------|----------------------------------|------|-----------|
| хомяк.png | ml_sprite_tier1_hamster.png | 1 | 84×115 |
| Заяц.png | ml_sprite_tier2_bunny.png | 2 | 91×209 |
| Котенок.png | ml_sprite_tier3_kitten.png | 3 | 135×183 |
| Котяра.png | ml_sprite_tier4_cat.png | 4 | 142×230 |
| Собака.png | ml_sprite_tier5_puppy.png | 5 | 160×243 |
| лиса.png | ml_sprite_tier6_fox.png | 6 | 166×288 |
| панда.png | ml_sprite_tier7_panda.png | 7 | 194×332 |
| Медведь.png | ml_sprite_tier8_bear.png | 8 | 244×457 |

### Scale Factor Math

Current: `baseFactor = (radius * 2) / maxDim`
New: `baseFactor = ((radius * 2) / maxDim) * VISUAL.SPRITE_OVERFLOW`

Example (tier 1 hamster, radius=18, sprite 84×115):
- Current: `36 / 115 = 0.31` → sprite 26×36px in 36px circle
- With 1.25: `0.31 * 1.25 = 0.39` → sprite 33×45px, exceeds 36px circle by 9px vertically

Example (tier 8 bear, radius=85, sprite 244×457):
- Current: `170 / 457 = 0.37` → sprite 90×170px in 170px circle
- With 1.25: `0.37 * 1.25 = 0.47` → sprite 115×213px, exceeds 170px circle by 43px vertically

**Portrait sprites → overflow is mainly vertical → natural look, animals "stick out" top/bottom.**

### Music Architecture

Replace BGM section of AudioManager with:

```
AudioManager.ts (~234 LOC total)
├── SFX methods (unchanged): playDrop, playLand, playMerge, playRewardChime,
│   playGameOver, startDangerTone, stopDangerTone
├── Mute/lifecycle (unchanged): toggleMute, isMuted, destroy
├── createReverb() → ConvolverNode (~15 LOC)
│   └── Algorithmic IR: decaying white noise, 1.5s duration
├── playMelodyNote(freq, time) (~20 LOC)
│   └── Triangle osc + detuned sine overtone, ADSR envelope → reverb → bgmGain
├── Lookahead scheduler (~25 LOC)
│   ├── setTimeout(scheduler, 25) fires every 25ms
│   ├── Schedules notes 100ms ahead via ctx.currentTime
│   └── Steps through melody pattern by state
├── MELODY + STATE_PARAMS (~30 LOC)
│   ├── F major pentatonic: F4(349), G4(392), A4(440), C5(523), D5(587)
│   ├── 8-bar melody array: [freq, duration_beats][]
│   ├── calm:  BPM=72,  osc=triangle, gain=0.06, harmony=false
│   ├── tense: BPM=108, osc=triangle, gain=0.09, harmony=false
│   └── combo: BPM=132, osc=triangle, gain=0.10, harmony=true (+5th)
└── startMusic / stopMusic / setMusicState (rewritten internals, same signatures)
```

**Key techniques (from external research):**
1. **Lookahead scheduler** — sample-precise timing, no JS jitter ([web.dev](https://web.dev/articles/audio-scheduling))
2. **Triangle oscillators** — warmest Web Audio waveform ([Chip Bell](https://chipbell4.github.io/2023/12/09/building-a-pad-with-webaudio/))
3. **ADSR envelope** — 0.005s attack, 0.5s exponential decay → music box timbre
4. **Convolver reverb** — algorithmic IR, warm room feel without audio files ([gskinner](https://blog.gskinner.com/archives/2019/02/reverb-web-audio-api.html))
5. **F major pentatonic** — warm, folk-adjacent character, no wrong notes

---

## Drift Log

**Checked:** 2026-03-05 UTC
**Result:** no_drift

### Changes Detected
| File | Change Type | Action Taken |
|------|-------------|--------------|
| `src/objects/Animal.ts` | No changes (169 LOC) | None |
| `src/game/AudioManager.ts` | No changes (198 LOC) | None |
| `src/config/GameConfig.ts` | No changes (361 LOC) | None |
| `src/scenes/PreloadScene.ts` | No changes (73 LOC) | None |
| `public/assets/animals/*.png` | 8 files exist (old sprites with opaque bg) | To be replaced by Task 1 |

### References Updated
- None needed — all line numbers and signatures match spec assumptions.

### Notes
- `VISUAL` constant does NOT exist yet in GameConfig.ts — will be added.
- `brandbook/assets/sprites/Crops/` has 8 individual PNGs + 1 atlas sheet (ml_sprites_all8_nobg_2.png) — only individual PNGs are used.
- Source sprites use Cyrillic filenames with mixed case (хомяк.png, Заяц.png, etc.)
- GameConfig.ts is at 361 LOC, adding VISUAL (~5 LOC) + MUSIC (~25 LOC) brings to ~391 LOC — under 400 limit.

---

## Detailed Implementation Plan

### Research Sources
- [A Tale of Two Clocks — Lookahead Scheduler](https://web.dev/articles/audio-scheduling) — confirmed: 25ms setTimeout interval, 100ms lookahead, schedule via ctx.currentTime
- [Building a Pad with WebAudio — Warm Timbres](https://chipbell4.github.io/2023/12/09/building-a-pad-with-webaudio/) — triangle oscillators warmest built-in waveform
- [Polyphonic Synth — ADSR Envelopes](https://dev.to/hexshift/building-a-polyphonic-synth-with-web-audio-api-no-libraries-needed-4a07) — setValueAtTime + exponentialRampToValueAtTime for envelope
- [Making Reverb with Web Audio API](https://blog.gskinner.com/archives/2019/02/reverb-web-audio-api.html) — confirmed: ConvolverNode with decaying white noise buffer, no audio files needed
- [Omnibullet — Procedural Soundtrack Architecture](https://omnibullet.cz/devlog/004-procedural-soundtrack/) — state-based melody variation (BPM, gain, harmony)
- [MDN Web Audio Advanced Techniques](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques) — oscillator re-creation per note, ADSR via GainNode scheduling
- [web-audio-scheduler npm](https://github.com/mohayonao/web-audio-scheduler) — reference architecture: interval 25ms, aheadTime 100ms, visibilitychange handling

### Task 1: Replace Sprite Assets

**Type:** asset
**Files:**
  - replace: `public/assets/animals/ml_sprite_tier1_hamster.png`
  - replace: `public/assets/animals/ml_sprite_tier2_bunny.png`
  - replace: `public/assets/animals/ml_sprite_tier3_kitten.png`
  - replace: `public/assets/animals/ml_sprite_tier4_cat.png`
  - replace: `public/assets/animals/ml_sprite_tier5_puppy.png`
  - replace: `public/assets/animals/ml_sprite_tier6_fox.png`
  - replace: `public/assets/animals/ml_sprite_tier7_panda.png`
  - replace: `public/assets/animals/ml_sprite_tier8_bear.png`

**Context:**
Replace old opaque-background sprites with new RGBA transparent ones from brandbook.
PreloadScene.ts (line 50-55) loads sprites by convention `assets/animals/ml_sprite_tier${tier}_${key}.png` — filenames must match exactly.

**Step 1: Copy and rename sprites**

```bash
cp "brandbook/assets/sprites/Crops/хомяк.png" "public/assets/animals/ml_sprite_tier1_hamster.png"
cp "brandbook/assets/sprites/Crops/Заяц.png" "public/assets/animals/ml_sprite_tier2_bunny.png"
cp "brandbook/assets/sprites/Crops/Котенок.png" "public/assets/animals/ml_sprite_tier3_kitten.png"
cp "brandbook/assets/sprites/Crops/Котяра.png" "public/assets/animals/ml_sprite_tier4_cat.png"
cp "brandbook/assets/sprites/Crops/Собака.png" "public/assets/animals/ml_sprite_tier5_puppy.png"
cp "brandbook/assets/sprites/Crops/лиса.png" "public/assets/animals/ml_sprite_tier6_fox.png"
cp "brandbook/assets/sprites/Crops/панда.png" "public/assets/animals/ml_sprite_tier7_panda.png"
cp "brandbook/assets/sprites/Crops/Медведь.png" "public/assets/animals/ml_sprite_tier8_bear.png"
```

**Step 2: Verify all 8 files exist and are non-zero**

```bash
ls -la public/assets/animals/ml_sprite_tier*.png
```

Expected: 8 files, each >1KB, all PNG format.

**Step 3: Visual verification**

```bash
npm run dev -- --port 3002
```

Open browser, start game, drop animals of each tier. Verify:
- No colored-circle fallback for any tier
- Sprites have transparent backgrounds (no visible rectangle)
- All 8 tiers render correctly

**Acceptance Criteria:**
- [ ] 8 PNG files replaced in public/assets/animals/
- [ ] All files are RGBA (transparent background)
- [ ] Game loads all 8 tiers without fallback to colored circles
- [ ] PreloadScene loads sprites successfully (no console errors)

---

### Task 2: Add Sprite Scale Overflow + Glow Adjustment

**Type:** code
**Files:**
  - Modify: `src/config/GameConfig.ts:107` — add VISUAL block after JUICE block
  - Modify: `src/config/GameConfig.ts:101` — increase GLOW_OUTER_STRENGTH from 4 to 6
  - Modify: `src/objects/Animal.ts:10` — add VISUAL to import
  - Modify: `src/objects/Animal.ts:39` — apply SPRITE_OVERFLOW multiplier

**Context:**
New transparent sprites are portrait-oriented (taller than wide). The current `baseFactor` calculation fits sprites exactly within the physics circle diameter, making animals look too small. Adding a configurable overflow multiplier makes animals visually exceed the physics circle by ~25%, creating a more natural look where animals "stick out" of their collision boundary.

GLOW_OUTER_STRENGTH needs increase from 4 to 6 because the larger sprites need a proportionally stronger glow to remain visible.

**Step 1: Add VISUAL config block to GameConfig.ts**

In `src/config/GameConfig.ts`, after the JUICE block (after line 107, before FEVER):

```typescript
export const VISUAL = {
  /** Sprite scale overflow — ratio beyond physics circle. 1.0 = exact fit, 1.25 = 25% overflow */
  SPRITE_OVERFLOW: 1.25,
} as const;
```

**Step 2: Increase GLOW_OUTER_STRENGTH in GameConfig.ts**

In `src/config/GameConfig.ts`, line 101, change:
```typescript
  GLOW_OUTER_STRENGTH: 4,
```
to:
```typescript
  GLOW_OUTER_STRENGTH: 6,
```

**Step 3: Add VISUAL import to Animal.ts**

In `src/objects/Animal.ts`, line 10, change:
```typescript
import { ANIMALS, PHYSICS, BRAND, JUICE } from '../config/GameConfig';
```
to:
```typescript
import { ANIMALS, PHYSICS, BRAND, JUICE, VISUAL } from '../config/GameConfig';
```

**Step 4: Apply SPRITE_OVERFLOW to baseFactor in Animal.ts**

In `src/objects/Animal.ts`, line 39, change:
```typescript
      this.baseFactor = (radius * 2) / maxDim;
```
to:
```typescript
      this.baseFactor = ((radius * 2) / maxDim) * VISUAL.SPRITE_OVERFLOW;
```

**Step 5: Verify**

```bash
npm run dev -- --port 3002
```

Visual checks:
- Tier 1 hamster (radius=18): sprite should visibly exceed the 36px physics circle
- Tier 8 bear (radius=85): sprite should visibly exceed the 170px physics circle
- Idle breathing animation still works (uses baseFactor for scale bounds)
- Glow ring visible on tier 5+ animals (GLOW_OUTER_STRENGTH now 6)
- No clipping or rendering artifacts

**Acceptance Criteria:**
- [ ] VISUAL.SPRITE_OVERFLOW = 1.25 added to GameConfig.ts
- [ ] GLOW_OUTER_STRENGTH changed from 4 to 6
- [ ] Animal.ts applies overflow multiplier to baseFactor
- [ ] Animals visually exceed physics circle by ~25%
- [ ] Idle breathing animation scales correctly (uses updated baseFactor)
- [ ] Glow visible on tier 5+ with new strength
- [ ] GameConfig.ts total LOC <= 400 (currently 361 + ~5 = ~366)
- [ ] Animal.ts total LOC <= 400 (currently 169, no change in LOC count)

---

### Task 3: Rewrite Background Music System

**Type:** code
**Files:**
  - Modify: `src/config/GameConfig.ts` — add MUSIC config block
  - Modify: `src/game/AudioManager.ts:1-198` — rewrite BGM section (lines 90-153), keep all SFX and utility methods

**Context:**
The current BGM is 5 held oscillators at 130-220 Hz producing dark ambient drones (like Half-Life). Target audience is women 55+, and the brand aesthetic is Soviet cartoons. We need warm, melodic pentatonic music using a lookahead scheduler for sample-precise timing, triangle oscillators for warmth, ADSR envelopes for music-box timbre, and convolver reverb for room warmth. Three adaptive states (calm/tense/combo) control BPM, gain, and harmony.

**LOC Budget Analysis:**
- Current AudioManager.ts: 198 LOC
- Lines to KEEP unchanged (SFX, utils, mute, danger): ~139 LOC
- Lines to DELETE (old BGM: startMusic, stopMusic, setMusicState, getMusicState, applyMusicState, addComboOsc, removeComboOsc): ~50 LOC
- Lines to ADD (new BGM system): ~95 LOC
- Estimated total: 139 + 95 = ~234 LOC (well under 400 limit)

**CRITICAL: What stays UNCHANGED in AudioManager.ts:**
- Lines 1-5: imports and MusicState type
- Lines 7-8: class declaration
- Lines 16-22: constructor, getCtx
- Lines 24-88: ALL SFX methods (playDrop, playLand, playMerge, playRewardChime, playGameOver, startDangerTone, stopDangerTone)
- Lines 120-128: toggleMute, isMuted (signatures identical)
- Lines 155-197: guardCtx, rr, duckMusic, tone, noise, loadMuteState, saveMuteState

**CRITICAL: What gets REWRITTEN (same public signatures, new internals):**
- startMusic(): void
- stopMusic(): void
- setMusicState(s: MusicState): void
- getMusicState(): MusicState
- destroy(): void

**CRITICAL: What gets DELETED (replaced by new melody system):**
- applyMusicState() private method
- addComboOsc() private method
- removeComboOsc() private method

**CRITICAL: What gets ADDED (new private methods + fields):**
- createReverb(): ConvolverNode — algorithmic impulse response
- playMelodyNote(freq, startTime, duration): void — ADSR envelope + triangle osc
- scheduleMelody(): void — lookahead scheduler loop
- New private fields: melodyReverb, melodyIdx, schedTimer, nextNoteTime, currentBpm

**Step 1: Add MUSIC config to GameConfig.ts**

In `src/config/GameConfig.ts`, after the VISUAL block, add:

```typescript
/** F-major pentatonic melody for BGM. Each entry: [frequency_Hz, duration_in_beats] */
export const MUSIC = {
  /** Melody notes: F major pentatonic scale (F4, G4, A4, C5, D5) + rests (0 Hz) */
  MELODY: [
    [349, 1], [392, 1], [440, 2], [349, 1], [523, 1], [440, 2],
    [587, 1], [523, 1], [440, 1], [392, 1], [349, 2], [0, 2],
    [440, 1], [523, 1], [587, 2], [523, 1], [440, 1], [392, 2],
    [349, 1], [440, 1], [523, 1], [392, 1], [349, 2], [0, 2],
  ] as readonly (readonly [number, number])[],
  /** State parameters: [bpm, gain, addHarmony] */
  STATES: {
    calm:  { bpm: 72,  gain: 0.06, harmony: false },
    tense: { bpm: 108, gain: 0.09, harmony: false },
    combo: { bpm: 132, gain: 0.10, harmony: true },
  } as const,
  /** ADSR envelope */
  ATTACK: 0.005,
  DECAY_FACTOR: 0.6,
  /** Reverb impulse response duration (seconds) */
  REVERB_DURATION: 1.5,
  REVERB_DECAY: 2.0,
  /** Scheduler timing */
  SCHEDULE_AHEAD: 0.1,
  SCHEDULE_INTERVAL: 25,
  /** Harmony interval ratio (perfect 5th = 3/2) */
  HARMONY_RATIO: 1.5,
  HARMONY_GAIN_MULT: 0.4,
  /** Detuned overtone offset (cents) */
  OVERTONE_DETUNE: 7,
  OVERTONE_GAIN_MULT: 0.3,
} as const;
```

**Step 2: Rewrite AudioManager.ts BGM section**

Replace the entire class field declarations (lines 9-14) with updated fields:

OLD (lines 9-14):
```typescript
  private ctx: AudioContext | null = null; private bgmGain: GainNode | null = null;
  private bgmOscs: OscillatorNode[] = []; private bgmPlaying = false;
  private dangerOsc: OscillatorNode | null = null; private dangerGain: GainNode | null = null;
  private dangerLfo: OscillatorNode | null = null; private isDangerActive = false;
  private musicState: MusicState = 'calm'; private oscGains: GainNode[] = []; private lfoNodes: OscillatorNode[] = [];
  private comboOsc: OscillatorNode | null = null; private comboGain: GainNode | null = null;
```

NEW:
```typescript
  private ctx: AudioContext | null = null; private bgmGain: GainNode | null = null;
  private bgmPlaying = false;
  private dangerOsc: OscillatorNode | null = null; private dangerGain: GainNode | null = null;
  private dangerLfo: OscillatorNode | null = null; private isDangerActive = false;
  private musicState: MusicState = 'calm';
  private melodyReverb: ConvolverNode | null = null;
  private melodyIdx = 0; private schedTimer = 0; private nextNoteTime = 0; private currentBpm = 72;
```

Add the MUSIC import. Update line 2:

OLD:
```typescript
import { AUDIO, AUDIO_ENHANCED, STORAGE_KEY, DEFAULT_DATA } from '../config/GameConfig';
```

NEW:
```typescript
import { AUDIO, AUDIO_ENHANCED, MUSIC, STORAGE_KEY, DEFAULT_DATA } from '../config/GameConfig';
```

Replace `startMusic` method (OLD lines 90-104):

OLD:
```typescript
  startMusic(): void {
    if (this.muted || this.bgmPlaying) return;
    const ctx = this.getCtx(); if (!ctx) return;
    this.bgmPlaying = true; this.musicState = 'calm'; this.oscGains = []; this.lfoNodes = [];
    this.bgmGain = ctx.createGain(); this.bgmGain.gain.value = AUDIO.BGM_VOLUME * 0.3; this.bgmGain.connect(ctx.destination);
    [130.8, 146.8, 164.8, 196.0, 220.0].forEach((freq, i) => {
      const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = freq;
      const g = ctx.createGain(); g.gain.value = i < 3 ? 0.06 : 0; this.oscGains.push(g);
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.3 + i * 0.05; this.lfoNodes.push(lfo);
      const lg = ctx.createGain(); lg.gain.value = 0.03;
      lfo.connect(lg).connect(g.gain); lfo.start();
      osc.connect(g).connect(this.bgmGain!); osc.start();
      this.bgmOscs.push(osc, lfo);
    });
  }
```

NEW:
```typescript
  startMusic(): void {
    if (this.muted || this.bgmPlaying) return;
    const ctx = this.getCtx(); if (!ctx) return;
    this.bgmPlaying = true; this.musicState = 'calm'; this.melodyIdx = 0;
    const sp = MUSIC.STATES[this.musicState];
    this.currentBpm = sp.bpm;
    this.bgmGain = ctx.createGain(); this.bgmGain.gain.value = sp.gain; this.bgmGain.connect(ctx.destination);
    this.melodyReverb = this.createReverb(ctx);
    this.melodyReverb.connect(this.bgmGain);
    this.nextNoteTime = ctx.currentTime; this.scheduleMelody();
  }
```

Replace `stopMusic` method (OLD lines 106-111):

OLD:
```typescript
  stopMusic(): void {
    this.bgmPlaying = false; this.removeComboOsc(0);
    for (const o of this.bgmOscs) { try { o.stop(); } catch { /* ok */ } }
    this.bgmOscs = []; this.oscGains = []; this.lfoNodes = [];
    this.bgmGain?.disconnect(); this.bgmGain = null;
  }
```

NEW:
```typescript
  stopMusic(): void {
    this.bgmPlaying = false;
    if (this.schedTimer) { clearTimeout(this.schedTimer); this.schedTimer = 0; }
    this.melodyReverb?.disconnect(); this.melodyReverb = null;
    this.bgmGain?.disconnect(); this.bgmGain = null;
  }
```

Replace `setMusicState` and `getMusicState` (OLD lines 113-118):

OLD:
```typescript
  setMusicState(s: MusicState): void {
    if (s === this.musicState || !this.ctx || this.muted) return;
    this.musicState = s; this.applyMusicState(s);
  }

  getMusicState(): MusicState { return this.musicState; }
```

NEW:
```typescript
  setMusicState(s: MusicState): void {
    if (s === this.musicState || !this.ctx || this.muted) return;
    this.musicState = s;
    const sp = MUSIC.STATES[s];
    this.currentBpm = sp.bpm;
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.linearRampToValueAtTime(sp.gain, this.ctx.currentTime + 0.8);
    }
  }

  getMusicState(): MusicState { return this.musicState; }
```

Replace `destroy` (OLD line 129):

OLD:
```typescript
  destroy(): void { this.stopDangerTone(); this.removeComboOsc(0); this.stopMusic(); this.ctx?.close(); this.ctx = null; }
```

NEW:
```typescript
  destroy(): void { this.stopDangerTone(); this.stopMusic(); this.ctx?.close(); this.ctx = null; }
```

DELETE these three methods entirely (OLD lines 131-153):
- `applyMusicState` (lines 131-137)
- `addComboOsc` (lines 139-146)
- `removeComboOsc` (lines 148-153)

ADD three new private methods — insert BEFORE `guardCtx()` (before old line 155):

```typescript
  private createReverb(ctx: AudioContext): ConvolverNode {
    const convolver = ctx.createConvolver();
    const rate = ctx.sampleRate, len = rate * MUSIC.REVERB_DURATION;
    const buf = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, MUSIC.REVERB_DECAY);
    }
    convolver.buffer = buf;
    return convolver;
  }

  private playMelodyNote(freq: number, startTime: number, durSec: number): void {
    if (!this.ctx || !this.melodyReverb) return;
    const ctx = this.ctx;
    // Main triangle oscillator
    const osc = ctx.createOscillator(); osc.type = 'triangle'; osc.frequency.value = freq;
    const g = ctx.createGain();
    // ADSR: quick attack, exponential decay
    g.gain.setValueAtTime(0.001, startTime);
    g.gain.linearRampToValueAtTime(1, startTime + MUSIC.ATTACK);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + durSec * MUSIC.DECAY_FACTOR);
    osc.connect(g).connect(this.melodyReverb!);
    osc.start(startTime); osc.stop(startTime + durSec);
    // Detuned sine overtone for warmth
    const ov = ctx.createOscillator(); ov.type = 'sine'; ov.frequency.value = freq; ov.detune.value = MUSIC.OVERTONE_DETUNE;
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.001, startTime);
    og.gain.linearRampToValueAtTime(MUSIC.OVERTONE_GAIN_MULT, startTime + MUSIC.ATTACK);
    og.gain.exponentialRampToValueAtTime(0.001, startTime + durSec * MUSIC.DECAY_FACTOR);
    ov.connect(og).connect(this.melodyReverb!);
    ov.start(startTime); ov.stop(startTime + durSec);
    // Harmony (perfect 5th) in combo state
    if (MUSIC.STATES[this.musicState].harmony) {
      const ho = ctx.createOscillator(); ho.type = 'triangle'; ho.frequency.value = freq * MUSIC.HARMONY_RATIO;
      const hg = ctx.createGain();
      hg.gain.setValueAtTime(0.001, startTime);
      hg.gain.linearRampToValueAtTime(MUSIC.HARMONY_GAIN_MULT, startTime + MUSIC.ATTACK);
      hg.gain.exponentialRampToValueAtTime(0.001, startTime + durSec * MUSIC.DECAY_FACTOR);
      ho.connect(hg).connect(this.melodyReverb!);
      ho.start(startTime); ho.stop(startTime + durSec);
    }
  }

  private scheduleMelody(): void {
    if (!this.bgmPlaying || !this.ctx) return;
    const ctx = this.ctx;
    while (this.nextNoteTime < ctx.currentTime + MUSIC.SCHEDULE_AHEAD) {
      const [freq, beats] = MUSIC.MELODY[this.melodyIdx % MUSIC.MELODY.length];
      const durSec = (60 / this.currentBpm) * beats;
      if (freq > 0) this.playMelodyNote(freq, this.nextNoteTime, durSec);
      this.nextNoteTime += durSec;
      this.melodyIdx++;
    }
    this.schedTimer = window.setTimeout(() => this.scheduleMelody(), MUSIC.SCHEDULE_INTERVAL);
  }
```

Update `duckMusic` to restore to state-aware gain (OLD lines 162-168):

OLD:
```typescript
  private duckMusic(): void {
    if (!this.bgmGain || !this.ctx) return;
    this.bgmGain.gain.linearRampToValueAtTime(AUDIO_ENHANCED.MUSIC_DUCK_VOLUME, this.ctx.currentTime + AUDIO_ENHANCED.MUSIC_DUCK_RAMP);
    setTimeout(() => {
      if (this.bgmGain && this.ctx) this.bgmGain.gain.linearRampToValueAtTime(AUDIO.BGM_VOLUME * 0.3, this.ctx.currentTime + 0.1);
    }, 200);
  }
```

NEW:
```typescript
  private duckMusic(): void {
    if (!this.bgmGain || !this.ctx) return;
    this.bgmGain.gain.linearRampToValueAtTime(AUDIO_ENHANCED.MUSIC_DUCK_VOLUME, this.ctx.currentTime + AUDIO_ENHANCED.MUSIC_DUCK_RAMP);
    setTimeout(() => {
      if (this.bgmGain && this.ctx) {
        const targetGain = MUSIC.STATES[this.musicState].gain;
        this.bgmGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.1);
      }
    }, 200);
  }
```

**Step 3: Verify LOC count**

After all edits, count lines:
```bash
wc -l src/game/AudioManager.ts
```

Expected: ~230-240 LOC (must be <= 400).

```bash
wc -l src/config/GameConfig.ts
```

Expected: ~391 LOC (must be <= 400).

**Step 4: Verify build compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors.

**Step 5: Manual audio verification**

```bash
npm run dev -- --port 3002
```

1. Start game, verify warm melodic pentatonic BGM plays (not dark ambient)
2. Let game idle in calm state — verify gentle 72 BPM melody
3. Fill container partially — verify tense state (108 BPM, louder)
4. Trigger combo chain — verify combo state (132 BPM, harmony 5th added)
5. Trigger merge (to test duckMusic) — verify volume dips and restores smoothly
6. Toggle mute on/off — verify music stops and resumes
7. Game over — verify music stops cleanly
8. New game — verify music restarts from beginning
9. Open/close browser tab — verify no scheduler errors in console
10. destroy() — verify no lingering setTimeout errors

**Step 6: Regression test**

```bash
npx playwright test tests/gameplay-visual.spec.ts
```

Expected: All existing tests pass (or screenshots need update due to sprite change from Task 1).

**Acceptance Criteria:**
- [ ] MUSIC config block added to GameConfig.ts with melody, states, ADSR, reverb params
- [ ] AudioManager.ts BGM section fully rewritten
- [ ] All SFX methods unchanged (playDrop, playLand, playMerge, playRewardChime, playGameOver, startDangerTone, stopDangerTone)
- [ ] Public API signatures unchanged (startMusic, stopMusic, setMusicState, getMusicState, toggleMute, isMuted, destroy)
- [ ] Warm melodic F-major pentatonic BGM plays
- [ ] Three states transition smoothly: calm (72 BPM) -> tense (108 BPM) -> combo (132 BPM + 5th harmony)
- [ ] Convolver reverb adds room warmth
- [ ] Lookahead scheduler provides jitter-free timing
- [ ] ADSR envelope: quick attack (5ms), exponential decay -> music box timbre
- [ ] duckMusic() works during melody (volume dips and restores to current state gain)
- [ ] destroy() clears scheduler timer (no stale setTimeout callbacks)
- [ ] AudioManager.ts <= 400 LOC (estimated ~234)
- [ ] GameConfig.ts <= 400 LOC (estimated ~391)
- [ ] No changes to GameScene.ts or MenuScene.ts
- [ ] TypeScript compiles without errors

---

### Execution Order

Task 1 --> Task 2 --> Task 3 (sequential, each with its own commit)

- Task 1 is pure asset replacement (no code changes)
- Task 2 depends on Task 1 (new sprites need overflow to look right)
- Task 3 is independent of Task 1/2 but ordered last since it is highest risk

### Dependencies

- Task 2 depends on Task 1 (overflow matters most for new portrait sprites)
- Task 3 is independent but shares GameConfig.ts with Task 2 (add MUSIC block after VISUAL block added in Task 2)

---

## Flow Coverage Matrix (REQUIRED)

| # | User Flow Step | Covered by Task | Status |
|---|----------------|-----------------|--------|
| 1 | Game loads, sprites appear | Task 1 | ✓ |
| 2 | Animals drop with correct visual | Task 1, Task 2 | ✓ |
| 3 | Animals exceed physics circle visually | Task 2 | ✓ |
| 4 | Idle animations work with new scale | Task 2 | ✓ |
| 5 | Glow visible on tier 5+ with new scale | Task 2 | ✓ |
| 6 | Music starts on game begin | Task 3 | ✓ |
| 7 | Music transitions calm→tense→combo | Task 3 | ✓ |
| 8 | Music ducks on merge SFX | - | existing (duckMusic unchanged) |
| 9 | Music stops on game over | - | existing (stopMusic unchanged) |
| 10 | Mute toggle works | - | existing (toggleMute unchanged) |

**GAPS:** None — all steps covered.

---

## Tests (MANDATORY)

### What to test
- [x] All 8 sprites load (no colored-circle fallback)
- [x] Sprite scale exceeds physics circle (visually verify)
- [x] Idle breathing animation proportional to new scale
- [x] Glow ring visible on tier 5+ (GLOW_OUTER_STRENGTH adjusted)
- [x] BGM plays warm melodic music on game start
- [x] Music state transitions: calm → tense → combo (no audio glitch)
- [x] destroy() mid-sequence: no console errors from stale scheduler callbacks
- [x] Edge case: AudioContext suspended (mobile) → startMusic recovers after user gesture
- [x] Edge case: duckMusic() during melody note → smooth volume dip and restore

### How to test
- Visual: Run dev server, drop animals, verify artwork and scale
- Audio: Listen to BGM in each state, verify warmth/melody
- Regression: Run existing Playwright tests (`npx playwright test`)
- Manual: Mobile Safari test for AudioContext resume

### TDD Order
1. Task 1: Copy sprites → verify visually
2. Task 2: Add config + apply scale → verify visually
3. Task 3: Rewrite music → verify aurally + verify destroy() safety

---

## Definition of Done

### Functional
- [x] All 8 new transparent sprites render correctly in-game
- [x] Animals visually exceed physics circle by ~25%
- [x] Background music sounds warm, melodic, pentatonic (not dark ambient)
- [x] Three music states (calm/tense/combo) transition smoothly

### Tests
- [x] No colored-circle fallbacks (all sprites loaded)
- [x] Existing Playwright tests pass (or screenshots updated)
- [x] destroy() safety verified

### Technical
- [x] AudioManager.ts ≤ 400 LOC
- [x] Animal.ts ≤ 400 LOC
- [x] GameConfig.ts ≤ 400 LOC
- [x] No changes to GameScene.ts or MenuScene.ts

---

## Autopilot Log

### Task 1/3: Replace Sprite Assets — 2026-03-05
- Coder: completed (8 files: public/assets/animals/ml_sprite_tier*.png)
- Tester: passed (TSC clean, assets verified)
- Spec Reviewer: approved (cumulative)
- Code Quality: approved (cumulative)
- Commit: d1ca082

### Task 2/3: Sprite Scale Overflow + Glow — 2026-03-05
- Coder: completed (2 files: GameConfig.ts, Animal.ts)
- Tester: passed (TSC clean)
- Spec Reviewer: approved (cumulative)
- Code Quality: approved (cumulative)
- Commit: 1247b2a

### Task 3/3: Rewrite Background Music — 2026-03-05
- Coder: completed (2 files: AudioManager.ts, GameConfig.ts)
- Tester: passed (10/10 Playwright tests, TSC clean)
- Spec Reviewer: approved
- Code Quality: approved (notes: GameConfig 390/400 LOC pre-existing concern)
- Exa Verify: no issues — lookahead scheduler is standard Web Audio pattern
- Commit: 81cf4e2
