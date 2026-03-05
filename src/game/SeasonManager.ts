/** SeasonManager — detects active season from serverTime, provides theme config */
import { SEASONS, DEFAULT_SEASON } from '../config/GameConfig';
import type { SeasonConfig } from '../config/GameConfig';
import type { IPlatformBridge } from '../sdk/IGamePlatform';

export class SeasonManager {
  private season: SeasonConfig;
  private bridge: IPlatformBridge;

  constructor(bridge: IPlatformBridge) {
    this.bridge = bridge;
    this.season = this.detect();
  }

  /** Try remote config override (call after construction) */
  async tryRemoteOverride(): Promise<void> {
    try {
      const flags = await this.bridge.getFlags({ active_season: 'auto' });
      if (flags.active_season && flags.active_season !== 'auto') {
        const override = SEASONS.find(s => s.id === flags.active_season);
        if (override) this.season = override;
      }
    } catch { /* use date-based detection */ }
  }

  getActiveSeason(): SeasonConfig { return this.season; }
  isEventActive(): boolean { return this.season.id !== 'default'; }
  getScoreMultiplier(): number { return this.season.scoreMult; }

  getTimeRemainingMs(): number {
    if (!this.isEventActive()) return 0;
    const now = new Date(this.bridge.getServerTime());
    const end = new Date(now.getFullYear(), this.season.endMonth - 1, this.season.endDay, 23, 59, 59);
    if (end < now) end.setFullYear(end.getFullYear() + 1);
    return end.getTime() - now.getTime();
  }

  private detect(): SeasonConfig {
    const now = new Date(this.bridge.getServerTime());
    const m = now.getMonth() + 1, d = now.getDate();
    for (const s of SEASONS) {
      const cur = m * 100 + d, start = s.startMonth * 100 + s.startDay, end = s.endMonth * 100 + s.endDay;
      if (start <= end ? (cur >= start && cur <= end) : (cur >= start || cur <= end)) return s;
    }
    return DEFAULT_SEASON;
  }
}
