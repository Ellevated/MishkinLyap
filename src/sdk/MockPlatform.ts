/**
 * Module: MockPlatform
 * Role: Development mock for IPlatformBridge — simulates SDK with delays
 * Uses: sdk/IGamePlatform
 * Used by: main.ts (when YaGames is undefined)
 * Does NOT: call real SDK, persist data across reloads
 */

import type { IPlatformBridge, LeaderboardEntry } from './IGamePlatform';

export class MockPlatform implements IPlatformBridge {
  private highScore = 0;

  async init(): Promise<void> {
    console.warn('[SDK Mock] Initialized — running in dev mode');
  }

  gameplayStart(): void {
    console.warn('[SDK Mock] gameplayStart');
  }

  gameplayStop(): void {
    console.warn('[SDK Mock] gameplayStop');
  }

  async showInterstitial(): Promise<{ shown: boolean }> {
    console.warn('[SDK Mock] showInterstitial — 1.5s delay');
    await this.delay(1500);
    return { shown: true };
  }

  async showRewarded(): Promise<{ rewarded: boolean }> {
    console.warn('[SDK Mock] showRewarded — 2.0s delay');
    await this.delay(2000);
    return { rewarded: true };
  }

  showBanner(): void {
    console.warn('[SDK Mock] showBanner');
  }

  hideBanner(): void {
    console.warn('[SDK Mock] hideBanner');
  }

  async saveHighScore(score: number): Promise<void> {
    console.warn(`[SDK Mock] saveHighScore: ${score}`);
    this.highScore = Math.max(this.highScore, score);
  }

  async loadHighScore(): Promise<number> {
    console.warn(`[SDK Mock] loadHighScore: ${this.highScore}`);
    return this.highScore;
  }

  getServerTime(): number { return Date.now(); }

  async getLeaderboardEntries(count: number): Promise<LeaderboardEntry[]> {
    console.warn('[SDK Mock] getLeaderboardEntries');
    const names = ['Мария П.', 'Ольга С.', 'Татьяна К.', 'Елена В.', 'Наталья Б.',
      'Людмила Г.', 'Светлана Д.', 'Ирина М.', 'Вы', 'Нина Л.'];
    return names.slice(0, count).map((name, i) => ({
      rank: i + 1, name,
      score: Math.max(10000 - i * 800 + Math.floor(Math.random() * 200), 100),
      isPlayer: name === 'Вы',
    }));
  }

  async getFlags(defaults: Record<string, string>): Promise<Record<string, string>> {
    return { ...defaults };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
