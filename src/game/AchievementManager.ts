/**
 * Module: AchievementManager
 * Role: Tracks career stats, checks achievement unlocks, persists state
 * Uses: config/GameConfig (CareerStats, ACHIEVEMENTS, STORAGE_KEY, DEFAULT_DATA, DEFAULT_CAREER)
 * Used by: GameScene (reports events), AchievementsScene (displays)
 * Does NOT: Display UI, play sounds, manage daily missions
 */
import {
  ACHIEVEMENTS, STORAGE_KEY, DEFAULT_DATA, DEFAULT_CAREER,
} from '../config/GameConfig';
import type { PersistedData, CareerStats, AchievementDef } from '../config/GameConfig';

export class AchievementManager {
  private stats: CareerStats;
  private unlocked: Set<string>;

  constructor() {
    const data = this.loadData();
    this.stats = { ...data.career };
    this.unlocked = new Set(data.unlockedAchievements);
  }

  /** Report a merge event. Returns newly unlocked achievement IDs. */
  reportMerge(tier: number): string[] {
    this.stats.totalMerges++;
    if (tier > this.stats.highestTier) this.stats.highestTier = tier;
    return this.checkAndSave();
  }

  /** Report game end. Returns newly unlocked achievement IDs. */
  reportGameEnd(score: number): string[] {
    this.stats.totalScore += score;
    this.stats.gamesPlayed++;
    return this.checkAndSave();
  }

  /** Report combo achieved. Returns newly unlocked achievement IDs. */
  reportCombo(count: number): string[] {
    if (count > this.stats.maxCombo) this.stats.maxCombo = count;
    return this.checkAndSave();
  }

  getStats(): CareerStats { return { ...this.stats }; }
  getUnlockedIds(): string[] { return [...this.unlocked]; }

  getAchievements(): Array<AchievementDef & { unlocked: boolean }> {
    return ACHIEVEMENTS.map(a => ({ ...a, unlocked: this.unlocked.has(a.id) }));
  }

  private checkAndSave(): string[] {
    const newlyUnlocked: string[] = [];
    for (const ach of ACHIEVEMENTS) {
      if (this.unlocked.has(ach.id)) continue;
      if (ach.check(this.stats)) {
        this.unlocked.add(ach.id);
        newlyUnlocked.push(ach.id);
      }
    }
    this.save();
    return newlyUnlocked;
  }

  private save(): void {
    const data = this.loadData();
    data.career = this.stats;
    data.unlockedAchievements = [...this.unlocked];
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ok */ }
  }

  private loadData(): PersistedData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_DATA, career: { ...DEFAULT_CAREER }, unlockedAchievements: [] };
      const p = JSON.parse(raw);
      if (!p.career) p.career = { ...DEFAULT_CAREER };
      if (!Array.isArray(p.unlockedAchievements)) p.unlockedAchievements = [];
      return p as PersistedData;
    } catch { return { ...DEFAULT_DATA, career: { ...DEFAULT_CAREER }, unlockedAchievements: [] }; }
  }
}
