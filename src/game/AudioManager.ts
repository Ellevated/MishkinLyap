/** AudioManager — procedural audio with pitch variation, ducking, danger tone, adaptive music */
import { AUDIO, AUDIO_ENHANCED, STORAGE_KEY, DEFAULT_DATA } from '../config/GameConfig';
import type { PersistedData } from '../config/GameConfig';

type MusicState = 'calm' | 'tense' | 'combo';

export class AudioManager {
  private muted: boolean;
  private ctx: AudioContext | null = null; private bgmGain: GainNode | null = null;
  private bgmOscs: OscillatorNode[] = []; private bgmPlaying = false;
  private dangerOsc: OscillatorNode | null = null; private dangerGain: GainNode | null = null;
  private dangerLfo: OscillatorNode | null = null; private isDangerActive = false;
  private musicState: MusicState = 'calm'; private oscGains: GainNode[] = []; private lfoNodes: OscillatorNode[] = [];
  private comboOsc: OscillatorNode | null = null; private comboGain: GainNode | null = null;

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

  playRewardChime(): void {
    const ctx = this.guardCtx(); if (!ctx) return;
    this.duckMusic(); const now = ctx.currentTime;
    AUDIO_ENHANCED.REWARD_CHIME_INTERVALS.forEach((semi, i) => {
      const f = AUDIO_ENHANCED.REWARD_CHIME_BASE_FREQ * Math.pow(2, semi / 12);
      const t = now + i * AUDIO_ENHANCED.REWARD_CHIME_NOTE_DURATION, d = AUDIO_ENHANCED.REWARD_CHIME_NOTE_DURATION;
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.1);
      osc.connect(g).connect(ctx.destination); osc.start(t); osc.stop(t + d + 0.15);
    });
  }

  playGameOver(): void {
    const ctx = this.guardCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(220, now + 0.5);
    gain.gain.setValueAtTime(AUDIO.SFX_VOLUME * 0.5, now); gain.gain.linearRampToValueAtTime(0, now + 0.6);
    osc.connect(gain).connect(ctx.destination); osc.start(now); osc.stop(now + 0.6);
  }

  startDangerTone(): void {
    if (this.isDangerActive) return;
    const ctx = this.guardCtx(); if (!ctx) return;
    this.isDangerActive = true;
    this.dangerOsc = ctx.createOscillator(); this.dangerGain = ctx.createGain(); this.dangerLfo = ctx.createOscillator();
    const lg = ctx.createGain();
    this.dangerOsc.type = 'triangle'; this.dangerOsc.frequency.setValueAtTime(AUDIO_ENHANCED.DANGER_FREQ, ctx.currentTime);
    this.dangerLfo.frequency.setValueAtTime(AUDIO_ENHANCED.DANGER_PULSE_RATE, ctx.currentTime);
    lg.gain.setValueAtTime(0.06, ctx.currentTime);
    this.dangerLfo.connect(lg).connect(this.dangerGain.gain);
    this.dangerGain.gain.setValueAtTime(0.06, ctx.currentTime);
    this.dangerOsc.connect(this.dangerGain).connect(ctx.destination);
    this.dangerOsc.start(); this.dangerLfo.start();
  }

  stopDangerTone(): void {
    if (!this.isDangerActive) return;
    this.isDangerActive = false;
    if (this.dangerGain && this.ctx) this.dangerGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
    const osc = this.dangerOsc, lfo = this.dangerLfo;
    setTimeout(() => { try { osc?.stop(); osc?.disconnect(); lfo?.stop(); lfo?.disconnect(); } catch { /* ok */ } }, 350);
    this.dangerOsc = null; this.dangerGain = null; this.dangerLfo = null;
  }

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

  stopMusic(): void {
    this.bgmPlaying = false; this.removeComboOsc(0);
    for (const o of this.bgmOscs) { try { o.stop(); } catch { /* ok */ } }
    this.bgmOscs = []; this.oscGains = []; this.lfoNodes = [];
    this.bgmGain?.disconnect(); this.bgmGain = null;
  }

  setMusicState(s: MusicState): void {
    if (s === this.musicState || !this.ctx || this.muted) return;
    this.musicState = s; this.applyMusicState(s);
  }

  getMusicState(): MusicState { return this.musicState; }

  toggleMute(): boolean {
    this.muted = !this.muted;
    this.saveMuteState(this.muted);
    if (this.muted) this.stopMusic();
    return this.muted;
  }

  isMuted(): boolean { return this.muted; }

  destroy(): void { this.stopDangerTone(); this.removeComboOsc(0); this.stopMusic(); this.ctx?.close(); this.ctx = null; }

  private applyMusicState(s: MusicState): void {
    if (!this.ctx) return; const now = this.ctx.currentTime, rt = 0.8;
    const p = { calm: [0.3, 3, 0.25], tense: [0.8, 4, 0.30], combo: [1.5, 5, 0.35] }[s] as [number, number, number];
    this.lfoNodes.forEach((lfo, i) => lfo.frequency.linearRampToValueAtTime(p[0] + i * 0.05, now + rt));
    this.oscGains.forEach((g, i) => g.gain.linearRampToValueAtTime(i < p[1] ? p[2] / p[1] : 0, now + rt));
    if (s === 'combo') this.addComboOsc(rt); else this.removeComboOsc(rt);
  }

  private addComboOsc(ramp: number): void {
    if (this.comboOsc || !this.ctx) return;
    this.comboOsc = this.ctx.createOscillator(); this.comboGain = this.ctx.createGain();
    this.comboOsc.type = 'triangle'; this.comboOsc.frequency.setValueAtTime(330, this.ctx.currentTime);
    this.comboGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.comboGain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + ramp);
    this.comboOsc.connect(this.comboGain).connect(this.bgmGain!); this.comboOsc.start();
  }

  private removeComboOsc(ramp: number): void {
    if (!this.comboOsc || !this.comboGain || !this.ctx) return;
    this.comboGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + ramp);
    const o = this.comboOsc, g = this.comboGain; this.comboOsc = null; this.comboGain = null;
    setTimeout(() => { try { o.stop(); o.disconnect(); g.disconnect(); } catch { /* ok */ } }, ramp * 1000 + 100);
  }

  private guardCtx(): AudioContext | null {
    if (this.muted) return null;
    return this.getCtx();
  }

  private rr(): number { return 1.0 + (Math.random() * 2 - 1) * AUDIO.PITCH_VARIATION; }

  private duckMusic(): void {
    if (!this.bgmGain || !this.ctx) return;
    this.bgmGain.gain.linearRampToValueAtTime(AUDIO_ENHANCED.MUSIC_DUCK_VOLUME, this.ctx.currentTime + AUDIO_ENHANCED.MUSIC_DUCK_RAMP);
    setTimeout(() => {
      if (this.bgmGain && this.ctx) this.bgmGain.gain.linearRampToValueAtTime(AUDIO.BGM_VOLUME * 0.3, this.ctx.currentTime + 0.1);
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
    const len = ctx.sampleRate * dur, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.3));
    const src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = rate;
    const g = ctx.createGain(); g.gain.value = vol;
    src.connect(g).connect(ctx.destination); src.start();
  }

  private loadMuteState(): boolean {
    try { const r = localStorage.getItem(STORAGE_KEY); if (r) return !(JSON.parse(r) as PersistedData).sound; } catch { /* ok */ }
    return false;
  }

  private saveMuteState(muted: boolean): void {
    try {
      const r = localStorage.getItem(STORAGE_KEY); const d: PersistedData = r ? JSON.parse(r) : { ...DEFAULT_DATA };
      d.sound = !muted; localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    } catch { /* ok */ }
  }
}
