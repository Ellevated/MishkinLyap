/** ComboTracker — consecutive merges within time window, fever detection */
import { COMBO, FEVER } from '../config/GameConfig';

export class ComboTracker {
  private count = 0;
  private lastMergeTime = 0;
  private _isFever = false;
  private feverEndTime = 0;

  get isFever(): boolean { return this._isFever; }

  /** Called on each merge. Returns current combo count. */
  registerMerge(): number {
    const now = Date.now();
    if (now - this.lastMergeTime < COMBO.WINDOW_MS) {
      this.count++;
    } else {
      this.count = 1;
      this._isFever = false;
    }
    this.lastMergeTime = now;
    if (this.count >= FEVER.THRESHOLD && !this._isFever) {
      this._isFever = true;
      this.feverEndTime = now + FEVER.DURATION_MS;
    }
    return this.count;
  }

  getMultiplier(): number {
    const idx = Math.min(this.count, COMBO.MULTIPLIERS.length - 1);
    return COMBO.MULTIPLIERS[idx];
  }

  getFeverMultiplier(): number { return this._isFever ? FEVER.SCORE_MULTIPLIER : 1.0; }

  checkFeverExpiry(): void {
    if (this._isFever && Date.now() > this.feverEndTime) this._isFever = false;
  }

  getCount(): number { return this.count; }

  reset(): void { this.count = 0; this.lastMergeTime = 0; this._isFever = false; }
}
