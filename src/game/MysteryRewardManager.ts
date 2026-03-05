/**
 * Module: MysteryRewardManager
 * Role: Decides if a mystery reward triggers on merge, selects reward type
 * Uses: config/GameConfig (MYSTERY)
 * Used by: GameScene (onMerge)
 * Does NOT: Display UI, modify score, play sounds
 */

import { MYSTERY } from '../config/GameConfig';
import type { MysteryRewardType } from '../config/GameConfig';

export class MysteryRewardManager {
  private mergesSinceReward = 0;
  private goldenActive = false;
  private goldenEndTime = 0;

  /** Check if this merge triggers a mystery reward */
  checkMerge(): MysteryRewardType | null {
    this.mergesSinceReward++;
    const triggered = this.mergesSinceReward >= MYSTERY.PITY_THRESHOLD
      || Math.random() < MYSTERY.BASE_CHANCE;
    if (!triggered) return null;

    this.mergesSinceReward = 0;
    const roll = Math.random();
    if (roll < 0.5) return 'score_boost';
    if (roll < 0.8) return 'golden_mode';
    return 'score_shower';
  }

  activateGoldenMode(time: number): void {
    this.goldenActive = true;
    this.goldenEndTime = time + MYSTERY.GOLDEN_DURATION_MS;
  }

  isGoldenMode(): boolean { return this.goldenActive; }

  getGoldenMultiplier(): number { return this.goldenActive ? MYSTERY.GOLDEN_MULT : 1; }

  /** Call every frame to check golden mode expiry */
  update(time: number): void {
    if (this.goldenActive && time >= this.goldenEndTime) {
      this.goldenActive = false;
    }
  }
}
