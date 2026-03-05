/** SkinManager — cosmetic tint skins, unlock via milestones, persistence */
import { SKINS, STORAGE_KEY, DEFAULT_DATA, DEFAULT_SKIN } from '../config/GameConfig';
import type { SkinDef, PersistedData } from '../config/GameConfig';

export class SkinManager {
  private unlockedSkins: Set<string>;
  private activeSkinId: string;

  constructor() {
    const data = this.loadData();
    const sd = data.skinData || { ...DEFAULT_SKIN };
    this.unlockedSkins = new Set(sd.unlockedSkins);
    this.unlockedSkins.add('default');
    this.activeSkinId = sd.activeSkin;
    this.autoCheckUnlocks(data);
  }

  getActiveSkin(): SkinDef { return SKINS.find(s => s.id === this.activeSkinId) ?? SKINS[0]; }
  getActiveTint(): number { return this.getActiveSkin().tint; }

  setActiveSkin(skinId: string): void {
    if (!this.unlockedSkins.has(skinId)) return;
    this.activeSkinId = skinId;
    this.save();
  }

  getAllSkins(): Array<SkinDef & { unlocked: boolean }> {
    return SKINS.map(s => ({ ...s, unlocked: this.unlockedSkins.has(s.id) }));
  }

  isUnlocked(skinId: string): boolean { return this.unlockedSkins.has(skinId); }

  private autoCheckUnlocks(data: PersistedData): void {
    const stats = {
      bestScore: data.best,
      totalGames: data.career.gamesPlayed,
      totalMerges: data.career.totalMerges,
      highestTier: data.career.highestTier,
    };
    let changed = false;
    for (const skin of SKINS) {
      if (!this.unlockedSkins.has(skin.id) && skin.unlockCheck(stats)) {
        this.unlockedSkins.add(skin.id);
        changed = true;
      }
    }
    if (changed) this.save();
  }

  private save(): void {
    const data = this.loadData();
    data.skinData = { unlockedSkins: [...this.unlockedSkins], activeSkin: this.activeSkinId };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ok */ }
  }

  private loadData(): PersistedData {
    try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch { /* ok */ }
    return { ...DEFAULT_DATA };
  }
}
