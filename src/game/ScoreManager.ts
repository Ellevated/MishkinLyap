/**
 * Module: ScoreManager
 * Role: Manages score accumulation, highscore persistence to localStorage
 * Uses: config/GameConfig (STORAGE_KEY, PersistedData, DEFAULT_DATA), config/GameEvents (EVENTS)
 * Used by: scenes/GameScene (creates, calls addScore)
 * Emits: EVENTS.SCORE_UPDATED { score: number, best: number }
 * Does NOT: Display score UI, call SDK, detect merges
 */

import Phaser from 'phaser';
import {
  STORAGE_KEY,
  STORAGE_VERSION,
  DEFAULT_DATA,
  DEFAULT_STREAK,
  DEFAULT_MISSIONS,
  DEFAULT_CAREER,
  DEFAULT_DAILY,
} from '../config/GameConfig';
import type { PersistedData } from '../config/GameConfig';
import { EVENTS } from '../config/GameEvents';

export class ScoreManager {
  private scene: Phaser.Scene;
  private score = 0;
  private best: number;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const data = this.loadData();
    this.best = data.best;
  }

  /** Add score from merge. Emits EVENTS.SCORE_UPDATED. */
  addScore(points: number): void {
    this.score += points;
    this.scene.events.emit(EVENTS.SCORE_UPDATED, {
      score: this.score,
      best: this.best,
    });
  }

  getScore(): number {
    return this.score;
  }

  getBestScore(): number {
    return this.best;
  }

  /** Check if current score beats best, save if yes. Returns true if new record. */
  checkAndSaveBest(): boolean {
    if (this.score > this.best) {
      this.best = this.score;
      const current = this.loadData();
      this.saveData({ ...current, best: this.best });
      return true;
    }
    return false;
  }

  /** Reset current session score to 0 for new game */
  reset(): void {
    this.score = 0;
  }

  /** Load persisted data from localStorage with validation and migration */
  loadData(): PersistedData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_DATA };

      const parsed = JSON.parse(raw);
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        typeof parsed.v !== 'number' ||
        typeof parsed.best !== 'number'
      ) {
        return { ...DEFAULT_DATA };
      }

      // Migration: if version doesn't match, keep best score but reset version
      if (parsed.v !== STORAGE_VERSION) {
        return {
          v: STORAGE_VERSION, best: parsed.best, sound: parsed.sound ?? true,
          discoveredTiers: parsed.discoveredTiers ?? [1, 2, 3],
          streak: parsed.streak ?? { ...DEFAULT_STREAK },
          missions: parsed.missions ?? { ...DEFAULT_MISSIONS },
          career: parsed.career ?? { ...DEFAULT_CAREER },
          unlockedAchievements: parsed.unlockedAchievements ?? [],
          dailyChallenge: parsed.dailyChallenge ?? { ...DEFAULT_DAILY },
        };
      }

      // Patch: add missing fields from later features
      if (!Array.isArray(parsed.discoveredTiers)) parsed.discoveredTiers = [1, 2, 3];
      if (!parsed.streak) parsed.streak = { ...DEFAULT_STREAK };
      if (!parsed.missions) parsed.missions = { ...DEFAULT_MISSIONS };
      if (!parsed.career) parsed.career = { ...DEFAULT_CAREER };
      if (!Array.isArray(parsed.unlockedAchievements)) parsed.unlockedAchievements = [];
      if (!parsed.dailyChallenge) parsed.dailyChallenge = { ...DEFAULT_DAILY };

      return parsed as PersistedData;
    } catch {
      return { ...DEFAULT_DATA };
    }
  }

  /** Mark a tier as discovered. Returns true if newly discovered. */
  discoverTier(tier: number): boolean {
    const data = this.loadData();
    if (data.discoveredTiers.includes(tier)) return false;
    data.discoveredTiers.push(tier);
    data.discoveredTiers.sort((a, b) => a - b);
    this.saveData(data);
    return true;
  }

  /** Get daily best score for given date. Returns 0 if different day. */
  getDailyBest(dateStr: string): number {
    const data = this.loadData();
    return data.dailyChallenge.date === dateStr ? data.dailyChallenge.bestScore : 0;
  }

  /** Check and save daily best. Returns true if new daily record. */
  checkAndSaveDailyBest(dateStr: string): boolean {
    const data = this.loadData();
    if (data.dailyChallenge.date !== dateStr) {
      data.dailyChallenge = { date: dateStr, bestScore: this.score, completed: true };
      this.saveData(data);
      return true;
    }
    if (this.score > data.dailyChallenge.bestScore) {
      data.dailyChallenge.bestScore = this.score;
      data.dailyChallenge.completed = true;
      this.saveData(data);
      return true;
    }
    return false;
  }

  getDiscoveredTiers(): number[] {
    return this.loadData().discoveredTiers;
  }

  /** Save persisted data to localStorage */
  saveData(data: PersistedData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage full or disabled — silently fail
    }
  }
}
