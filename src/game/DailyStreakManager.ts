/**
 * Module: DailyStreakManager
 * Role: Tracks daily streak, provides rewards, manages shield
 * Uses: config/GameConfig (STREAK, STORAGE_KEY, DEFAULT_DATA, DEFAULT_STREAK)
 * Used by: MenuScene (check on entry)
 */

import { STREAK, STORAGE_KEY, DEFAULT_DATA, DEFAULT_STREAK } from '../config/GameConfig';
import type { PersistedData, StreakData } from '../config/GameConfig';

export interface StreakCheckInResult {
  streak: number;
  isNewDay: boolean;
  streakContinued: boolean;
  streakRecovered: boolean;
  streakBroken: boolean;
  rewardMultiplier: number;
}

export class DailyStreakManager {
  checkIn(): StreakCheckInResult {
    const data = this.loadData();
    const s = data.streak;
    const today = this.dateStr(new Date());

    if (s.lastPlayDate === today) {
      return {
        streak: s.count, isNewDay: false,
        streakContinued: false, streakRecovered: false, streakBroken: false,
        rewardMultiplier: this.getMultiplier(s.count),
      };
    }

    let continued = false, recovered = false, broken = false;
    const days = this.diffDays(s.lastPlayDate, today);

    if (days === 1) {
      s.count++;
      continued = true;
    } else if (days === 2 && s.shieldAvailable) {
      s.shieldAvailable = false;
      recovered = true;
    } else {
      s.count = 1;
      broken = s.lastPlayDate !== ''; // not broken on first ever play
    }

    // Weekly shield reset (Monday)
    const now = new Date();
    if (now.getDay() === STREAK.SHIELD_RESET_DAY) {
      const monday = this.dateStr(now);
      if (s.lastShieldReset !== monday) {
        s.shieldAvailable = true;
        s.lastShieldReset = monday;
      }
    }

    s.lastPlayDate = today;
    s.todayClaimed = true;
    if (s.count === 0) s.count = 1; // first ever play
    data.streak = s;
    this.saveData(data);

    return {
      streak: s.count, isNewDay: true, streakContinued: continued,
      streakRecovered: recovered, streakBroken: broken,
      rewardMultiplier: this.getMultiplier(s.count),
    };
  }

  getStreak(): number {
    return this.loadData().streak.count;
  }

  getRewardMultiplier(): number {
    return this.getMultiplier(this.loadData().streak.count);
  }

  private getMultiplier(count: number): number {
    const idx = Math.min(count, STREAK.REWARDS.length) - 1;
    return idx >= 0 ? STREAK.REWARDS[idx] : 1.0;
  }

  private dateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private diffDays(from: string, to: string): number {
    if (!from) return 999;
    const a = new Date(from); const b = new Date(to);
    return Math.round((b.getTime() - a.getTime()) / 86400000);
  }

  private loadData(): PersistedData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_DATA, streak: { ...DEFAULT_STREAK } };
      const parsed = JSON.parse(raw);
      if (!parsed.streak) parsed.streak = { ...DEFAULT_STREAK };
      return parsed as PersistedData;
    } catch { return { ...DEFAULT_DATA, streak: { ...DEFAULT_STREAK } }; }
  }

  private saveData(data: PersistedData): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ok */ }
  }
}
