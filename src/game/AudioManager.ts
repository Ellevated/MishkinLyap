/**
 * Module: AudioManager
 * Role: Centralized audio — plays sounds with pitch variation, handles combo escalation
 * Uses: config/GameConfig (AUDIO), Web Audio API
 * Used by: GameScene (wires events)
 */

import { AUDIO, STORAGE_KEY, DEFAULT_DATA } from '../config/GameConfig';
import type { PersistedData } from '../config/GameConfig';

export class AudioManager {
  private muted: boolean;
  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private bgmOscs: OscillatorNode[] = [];
  private bgmPlaying = false;

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
    if (this.muted) this.stopMusic();
    return this.muted;
  }

  isMuted(): boolean { return this.muted; }

  destroy(): void { this.stopMusic(); this.ctx?.close(); this.ctx = null; }

  private guardCtx(): AudioContext | null {
    if (this.muted) return null;
    return this.getCtx();
  }

  private rr(): number { return 1.0 + (Math.random() * 2 - 1) * AUDIO.PITCH_VARIATION; }

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
