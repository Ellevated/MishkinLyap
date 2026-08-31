# Feature: [FTR-025] Adaptive Music
**Status:** queued | **Priority:** P2 | **Date:** 2026-03-05

## Why
Adaptive Music (Score 2.30): музыка реагирует на геймплей. Indiana University: адаптивная музыка увеличивает Flow State. Sites & Potter 2018: "everything merges with the game" — audio-visual sync создаёт immersion. Для мишек: тихий вальс в спокойные моменты → весёлая полька при комбо → напряжённые аккорды когда контейнер заполняется.

## Context
Depends on FTR-008 (AudioManager). Currently: AudioManager.ts (138 LOC) uses **procedural Web Audio API synthesis** — 5 oscillators with LFO modulation, single static loop. No audio files loaded.

**Key finding:** Current procedural approach is ideal for adaptive music because oscillator parameters can be changed in real-time without crossfading files. Adding/removing oscillators, changing LFO rates, adjusting frequencies — all smooth transitions.

**Current AudioManager.startMusic() creates:**
- 5 oscillators at fixed frequencies (130, 165, 196, 220, 262 Hz)
- GainNodes per oscillator
- LFO (low-frequency oscillator) for volume modulation
- All connected to single master gain

**Adaptation strategy:** Instead of multiple audio file tracks, enhance procedural system with game-state-aware parameters:
1. Change LFO rate (slow = calm, fast = tense)
2. Add/remove oscillators (more = intense)
3. Adjust frequency spread (tight = calm, wide = energetic)
4. Add rhythmic pulse in combo state

## Research Reference
- A12: Adaptive Music (Score 2.30)
- A7: Flow-Sustaining Ambient Loops (Score 3.00) — already implemented, this enhances it

---

## Scope
**In scope:** Music state machine (calm/tense/combo), smooth parameter transitions, container fill level detection, combo-triggered intensity boost, graceful state transitions (no abrupt changes)
**Out of scope:** Audio file tracks (would need music assets), per-season music (FTR-024 handles visual seasons), music preferences beyond mute toggle, layered stems approach

---

## Allowed Files
**Modify:**
1. `src/game/AudioManager.ts` — add music state machine, parameter transitions, setState API (+40 LOC, total ~178 LOC)
2. `src/scenes/GameScene.ts` — call audio.setMusicState() based on container fill + combo (+10 lines)

**FORBIDDEN:** GameConfig.ts, Animal.ts, MergeDetector.ts, PhysicsManager.ts, ScoreManager.ts, SDK files, other scenes.

---

## Design

### Music States

```typescript
type MusicState = 'calm' | 'tense' | 'combo';
```

| State | LFO Rate | Oscillators Active | Freq Range | Volume | Trigger |
|-------|----------|-------------------|------------|--------|---------|
| calm | 0.3 Hz | 3 of 5 (low freqs) | 130-196 Hz | 0.25 | Container <40% full |
| tense | 0.8 Hz | 4 of 5 (add mid) | 130-262 Hz | 0.30 | Container 40-75% full |
| combo | 1.5 Hz | 5 of 5 (all) | 130-330 Hz | 0.35 | Active combo ×3+ or container >75% |

### AudioManager Changes (+40 LOC)

**New private fields:**
```typescript
private musicState: MusicState = 'calm';
private stateTransitionTimer: number = 0;
private oscillatorGains: GainNode[] = [];  // per-oscillator volume control
private lfoNode: OscillatorNode | null = null;
```

**New public API:**
```typescript
/** Set music state — transitions smoothly over 800ms */
setMusicState(state: MusicState): void {
  if (state === this.musicState || !this.ctx || this.isMuted()) return;
  this.musicState = state;
  this.transitionToState(state);
}

getMusicState(): MusicState {
  return this.musicState;
}
```

**State transition implementation:**
```typescript
private transitionToState(state: MusicState): void {
  const now = this.ctx!.currentTime;
  const transitionTime = 0.8; // 800ms smooth transition

  // Define state parameters
  const params = {
    calm:  { lfoRate: 0.3, activeOscillators: 3, masterVol: 0.25, extraFreq: 0 },
    tense: { lfoRate: 0.8, activeOscillators: 4, masterVol: 0.30, extraFreq: 0 },
    combo: { lfoRate: 1.5, activeOscillators: 5, masterVol: 0.35, extraFreq: 330 },
  };

  const p = params[state];

  // 1. Smooth LFO rate change
  if (this.lfoNode) {
    this.lfoNode.frequency.linearRampToValueAtTime(p.lfoRate, now + transitionTime);
  }

  // 2. Fade oscillators in/out
  this.oscillatorGains.forEach((gain, i) => {
    const targetVol = i < p.activeOscillators ? p.masterVol / p.activeOscillators : 0;
    gain.gain.linearRampToValueAtTime(targetVol, now + transitionTime);
  });

  // 3. Add extra high oscillator for combo excitement
  if (state === 'combo' && p.extraFreq > 0) {
    this.addComboOscillator(p.extraFreq, transitionTime);
  } else {
    this.removeComboOscillator(transitionTime);
  }
}
```

**Combo oscillator (rhythmic pulse):**
```typescript
private comboOsc: OscillatorNode | null = null;
private comboGain: GainNode | null = null;

private addComboOscillator(freq: number, rampTime: number): void {
  if (this.comboOsc || !this.ctx) return;

  this.comboOsc = this.ctx.createOscillator();
  this.comboGain = this.ctx.createGain();

  this.comboOsc.type = 'triangle';
  this.comboOsc.frequency.setValueAtTime(freq, this.ctx.currentTime);
  this.comboGain.gain.setValueAtTime(0, this.ctx.currentTime);
  this.comboGain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + rampTime);

  this.comboOsc.connect(this.comboGain);
  this.comboGain.connect(this.masterGain!);
  this.comboOsc.start();
}

private removeComboOscillator(rampTime: number): void {
  if (!this.comboOsc || !this.comboGain || !this.ctx) return;

  this.comboGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + rampTime);
  const osc = this.comboOsc;
  const gain = this.comboGain;
  setTimeout(() => {
    osc.stop();
    osc.disconnect();
    gain.disconnect();
  }, rampTime * 1000 + 100);

  this.comboOsc = null;
  this.comboGain = null;
}
```

**Refactor startMusic() to save references:**
Currently startMusic() creates oscillators but doesn't save individual GainNodes. Need to save them for per-oscillator volume control.

```typescript
startMusic(): void {
  // ... existing oscillator creation
  // ADD: save individual gain nodes to this.oscillatorGains
  // ADD: save LFO reference to this.lfoNode
  // Start in 'calm' state (only 3 oscillators audible)
  this.musicState = 'calm';
  this.transitionToState('calm');
}
```

**Cleanup in destroy():**
```typescript
// Add to existing destroy():
this.removeComboOscillator(0); // immediate cleanup
this.oscillatorGains = [];
this.lfoNode = null;
```

### GameScene Integration (+10 lines)

**Container fill detection:**
```typescript
// In update() or checkGameOver() — calculate fill level
private updateMusicState(): void {
  const animals = this.spawner.getActiveAnimals();
  if (!animals.length) return;

  // Estimate fill: highest animal Y position relative to container
  const containerHeight = GAME.HEIGHT - GAME.CONTAINER_TOP_Y;
  let highestY = GAME.HEIGHT;
  for (const a of animals) {
    if (a.y < highestY) highestY = a.y;
  }
  const fillRatio = 1 - ((highestY - GAME.CONTAINER_TOP_Y) / containerHeight);

  // Determine music state
  const comboActive = this.combo.getCount() >= 3;
  if (comboActive || fillRatio > 0.75) {
    this.audio.setMusicState('combo');
  } else if (fillRatio > 0.4) {
    this.audio.setMusicState('tense');
  } else {
    this.audio.setMusicState('calm');
  }
}
```

**Call from update():**
```typescript
update(time: number, delta: number): void {
  this.checkGameOver(delta);
  // Add: update music state every ~500ms (not every frame)
  this.musicUpdateTimer = (this.musicUpdateTimer || 0) + delta;
  if (this.musicUpdateTimer > 500) {
    this.musicUpdateTimer = 0;
    this.updateMusicState();
  }
}
```

**AnimalSpawner extension needed:**
GameScene needs to access active animals for fill calculation. Current AnimalSpawner.ts has `private animals: Set<Animal>`. Need to expose:

```typescript
// Add to AnimalSpawner:
getActiveAnimals(): Animal[] {
  return [...this.animals].filter(a => a.active);
}
```

Wait — this adds a dependency on AnimalSpawner modification, which wasn't in the original Allowed Files. Let me reconsider.

Alternative: GameScene can track highest animal Y directly from the physics bodies. Or use the existing game-over check logic (checkGameOver already monitors animal positions).

Better approach: Extract fill ratio from checkGameOver logic without modifying AnimalSpawner:

```typescript
// GameScene already iterates bodies in checkGameOver
// We can calculate fill level from the same data
private getContainerFillRatio(): number {
  let highestY = GAME.HEIGHT;
  this.matter.world.getAllBodies().forEach(body => {
    if ((body as any).label === 'animal' && body.position.y < highestY) {
      highestY = body.position.y;
    }
  });
  const containerHeight = GAME.HEIGHT - GAME.CONTAINER_TOP_Y;
  return Math.max(0, Math.min(1, 1 - ((highestY - GAME.CONTAINER_TOP_Y) / containerHeight)));
}
```

This uses Matter.js world directly — no AnimalSpawner modification needed.

---

## Implementation Plan

### Task 1: Add music state machine to AudioManager
**Type:** code
**Files:**
  - modify: `src/game/AudioManager.ts` — add MusicState type, setMusicState(), transitionToState(), combo oscillator management, save oscillator/LFO references in startMusic() (+40 LOC)
**Acceptance:** AudioManager.setMusicState('calm'/'tense'/'combo') smoothly transitions music parameters over 800ms, combo adds extra oscillator, removing combo fades it out

### Task 2: Wire music state to GameScene
**Type:** code
**Files:**
  - modify: `src/scenes/GameScene.ts` — add updateMusicState(), getContainerFillRatio(), call from update() every 500ms (+10 lines)
**Acceptance:** Music reacts to container fill level and combo activity — calm when empty, tense when filling, intense during combo

### Execution Order
1 → 2

---

## Tests

### What to test
- [ ] Music starts in 'calm' state (soft, slow, 3 oscillators)
- [ ] Music transitions to 'tense' when container ~50% full (faster LFO, more oscillators)
- [ ] Music transitions to 'combo' during ×3+ combo (extra oscillator, bright sound)
- [ ] Transitions are smooth (800ms, no clicks or pops)
- [ ] Music returns to 'calm' when container empties (after merges clear space)
- [ ] Combo oscillator properly cleaned up (no audio leak)
- [ ] Muted state respected — no state changes when muted
- [ ] Music state resets on scene restart
- [ ] No audio glitches when rapidly switching states
- [ ] Performance: no frame drops from audio processing

### How to test
- Manual: Start game → music is soft/slow (calm)
- Manual: Fill container halfway → music becomes more active (tense)
- Manual: Get ×3 combo → notice extra brightness in music (combo)
- Manual: Clear space via merges → music calms back down
- Manual: Toggle mute during tense state → no errors
- Manual: Restart game → music starts calm again

---

## Definition of Done

### Functional
- [ ] Music audibly reacts to game state
- [ ] 3 distinct moods (calm, tense, combo) recognizable
- [ ] Transitions feel natural, not abrupt
- [ ] Music enhances game feel without distracting

### Technical
- [ ] `npm run build` succeeds
- [ ] AudioManager.ts ≤ 185 LOC after changes
- [ ] GameScene additions ≤ 15 lines
- [ ] No audio leaks (oscillators properly stopped/disconnected)
- [ ] No console errors
- [ ] No performance impact (state check every 500ms, not per frame)
