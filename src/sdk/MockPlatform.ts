/**
 * Module: MockPlatform
 * Role: Development mock for IPlatformBridge — simulates SDK with delays
 * Uses: sdk/IGamePlatform
 * Used by: main.ts (when YaGames is undefined)
 * Does NOT: call real SDK, persist data across reloads
 */

import type { IPlatformBridge } from './IGamePlatform';

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

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
