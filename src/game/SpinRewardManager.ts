/** SpinRewardManager — weighted random, spin availability, reward persistence */
import { SPIN, STORAGE_KEY, DEFAULT_DATA, DEFAULT_SPIN } from '../config/GameConfig';
import type { PersistedData, SpinReward } from '../config/GameConfig';

export class SpinRewardManager {
  private today(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  canFreeSpin(): boolean { return this.load().spinData.lastSpinDate !== this.today(); }
  canAdSpin(): boolean {
    const sd = this.load().spinData, t = this.today();
    return sd.lastSpinDate !== t || sd.adSpinsToday < SPIN.MAX_AD_SPINS_PER_DAY;
  }

  spin(isFree: boolean): SpinReward {
    const reward = this.pick(), data = this.load(), t = this.today();
    if (data.spinData.lastSpinDate !== t) data.spinData.adSpinsToday = 0;
    data.spinData.lastSpinDate = t;
    if (!isFree) data.spinData.adSpinsToday++;
    if (reward.type !== 'extra_spin') data.spinData.pendingBonus = { type: reward.type, value: reward.value };
    this.save(data); return reward;
  }

  getPendingBonus(): { type: string; value: number } | null { return this.load().spinData.pendingBonus; }
  consumeBonus(): { type: string; value: number } | null {
    const data = this.load(), b = data.spinData.pendingBonus;
    if (!b) return null;
    data.spinData.pendingBonus = null; this.save(data); return b;
  }

  getSegmentIndex(r: SpinReward): number {
    return SPIN.SEGMENTS.findIndex(s => s.type === r.type && s.value === r.value);
  }

  private pick(): SpinReward {
    const segs = SPIN.SEGMENTS, total = segs.reduce((s, seg) => s + seg.weight, 0);
    let roll = Math.random() * total;
    for (const seg of segs) { roll -= seg.weight; if (roll <= 0) return seg; }
    return segs[segs.length - 1];
  }

  private load(): PersistedData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_DATA, spinData: { ...DEFAULT_SPIN } };
      const p = JSON.parse(raw);
      if (!p.spinData) p.spinData = { ...DEFAULT_SPIN };
      return p as PersistedData;
    } catch { return { ...DEFAULT_DATA, spinData: { ...DEFAULT_SPIN } }; }
  }

  private save(d: PersistedData): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch { /* ok */ }
  }
}
