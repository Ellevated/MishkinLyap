/**
 * Module: ComboTracker
 * Role: Tracks consecutive merges within time window, provides multiplier
 * Uses: config/GameConfig (COMBO)
 * Used by: GameScene (onMerge handler)
 * Does NOT: Detect merges, calculate base score, manage particles
 */

import { COMBO } from '../config/GameConfig';

export class ComboTracker {
  private count = 0;
  private lastMergeTime = 0;

  /** Called on each merge. Returns current combo count. */
  registerMerge(): number {
    const now = Date.now();
    if (now - this.lastMergeTime < COMBO.WINDOW_MS) {
      this.count++;
    } else {
      this.count = 1;
    }
    this.lastMergeTime = now;
    return this.count;
  }

  /** Score multiplier based on current combo count */
  getMultiplier(): number {
    const idx = Math.min(this.count, COMBO.MULTIPLIERS.length - 1);
    return COMBO.MULTIPLIERS[idx];
  }

  getCount(): number {
    return this.count;
  }

  reset(): void {
    this.count = 0;
    this.lastMergeTime = 0;
  }
}
