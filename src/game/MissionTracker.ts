/**
 * Module: MissionTracker
 * Role: Tracks daily mission progress, selects random missions, persists state
 * Uses: config/GameConfig (MISSIONS, MISSION_POOL, STORAGE_KEY, DEFAULT_DATA, DEFAULT_MISSIONS)
 * Used by: GameScene (reports events), MenuScene (reads state), MissionsScene (displays)
 * Does NOT: Display UI, manage score, detect merges
 */
import {
  MISSIONS, MISSION_POOL, STORAGE_KEY, DEFAULT_DATA, DEFAULT_MISSIONS,
} from '../config/GameConfig';
import type { PersistedData, ActiveMission, MissionSaveData, MissionType } from '../config/GameConfig';

export class MissionTracker {
  private missions: ActiveMission[] = [];
  private date = '';
  private allCompleted = false;

  /** Load today's missions or generate new ones if new day */
  loadOrReset(): ActiveMission[] {
    const data = this.loadData();
    const today = this.dateStr(new Date());

    if (data.missions.date === today && data.missions.active.length > 0) {
      this.date = today;
      this.missions = data.missions.active;
      this.allCompleted = data.missions.allCompleted;
      return this.missions;
    }

    // New day — pick 3 random missions with unique types
    this.date = today;
    this.missions = this.pickRandom(MISSIONS.DAILY_COUNT);
    this.allCompleted = false;
    this.save();
    return this.missions;
  }

  reportMerge(tier: number): void {
    let changed = false;
    for (const m of this.missions) {
      if (m.completed) continue;
      const tpl = MISSION_POOL.find(t => t.id === m.templateId);
      if (!tpl) continue;
      if (tpl.type === 'merges') { m.progress++; changed = true; }
      if (tpl.type === 'tier_created' && tier >= tpl.target) { m.progress = tpl.target; changed = true; }
    }
    if (changed) this.checkAndSave();
  }

  reportScore(score: number): void {
    let changed = false;
    for (const m of this.missions) {
      if (m.completed) continue;
      const tpl = MISSION_POOL.find(t => t.id === m.templateId);
      if (!tpl || tpl.type !== 'score') continue;
      m.progress = Math.min(m.progress + score, tpl.target);
      changed = true;
    }
    if (changed) this.checkAndSave();
  }

  reportGamePlayed(): void {
    let changed = false;
    for (const m of this.missions) {
      if (m.completed) continue;
      const tpl = MISSION_POOL.find(t => t.id === m.templateId);
      if (!tpl || tpl.type !== 'games') continue;
      m.progress++;
      changed = true;
    }
    if (changed) this.checkAndSave();
  }

  reportCombo(count: number): void {
    let changed = false;
    for (const m of this.missions) {
      if (m.completed) continue;
      const tpl = MISSION_POOL.find(t => t.id === m.templateId);
      if (!tpl || tpl.type !== 'combo') continue;
      if (count >= tpl.target) { m.progress = tpl.target; changed = true; }
    }
    if (changed) this.checkAndSave();
  }

  getMissions(): ActiveMission[] { return this.missions; }
  isAllCompleted(): boolean { return this.allCompleted; }

  private checkAndSave(): void {
    for (const m of this.missions) {
      const tpl = MISSION_POOL.find(t => t.id === m.templateId);
      if (tpl && m.progress >= tpl.target) m.completed = true;
    }
    this.allCompleted = this.missions.length > 0 && this.missions.every(m => m.completed);
    this.save();
  }

  private pickRandom(count: number): ActiveMission[] {
    const usedTypes = new Set<MissionType>();
    const result: ActiveMission[] = [];
    const pool = [...MISSION_POOL];
    // Shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    for (const tpl of pool) {
      if (result.length >= count) break;
      if (usedTypes.has(tpl.type)) continue;
      usedTypes.add(tpl.type);
      result.push({ templateId: tpl.id, progress: 0, completed: false });
    }
    return result;
  }

  private save(): void {
    const data = this.loadData();
    data.missions = { date: this.date, active: this.missions, allCompleted: this.allCompleted };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ok */ }
  }

  private dateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private loadData(): PersistedData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_DATA, missions: { ...DEFAULT_MISSIONS } };
      const p = JSON.parse(raw);
      if (!p.missions) p.missions = { ...DEFAULT_MISSIONS };
      return p as PersistedData;
    } catch { return { ...DEFAULT_DATA, missions: { ...DEFAULT_MISSIONS } }; }
  }
}
