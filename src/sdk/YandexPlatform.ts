/**
 * Module: YandexPlatform
 * Role: Real Yandex Games SDK wrapper — handles all 7 pitfalls
 * Uses: sdk/IGamePlatform
 * Used by: main.ts (when inside Yandex Games iframe)
 * Does NOT: import game modules, contain game logic
 *
 * Pitfalls handled:
 * #1 — init before Phaser (caller responsibility, main.ts)
 * #2 — game_api_pause/resume subscribed in init()
 * #3 — audio pause delegated to GameScene via AD_STARTED event
 * #4 — onError on every ad call
 * #5 — gameplayStart/Stop exposed
 * #6 — mock selection (caller responsibility, main.ts)
 * #7 — no setInterval for ads
 */

import type { IPlatformBridge, LeaderboardEntry } from './IGamePlatform';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const YaGames: {
  init(): Promise<any>;
};

function logError(context: string, err: unknown): void {
  console.error(`[YandexSDK] ${context}:`, err);
}

export class YandexPlatform implements IPlatformBridge {
  private sdk: any = null;
  private player: any = null;
  private lb: any = null;
  private onPause: (() => void) | null = null;
  private onResume: (() => void) | null = null;

  async init(): Promise<void> {
    try {
      this.sdk = await YaGames.init();
      // Register game_api_pause/resume (Pitfall #2)
      this.sdk.onEvent('game_api_pause', () => this.onPause?.());
      this.sdk.onEvent('game_api_resume', () => this.onResume?.());

      try {
        this.player = await this.sdk.getPlayer({ scopes: false });
      } catch (e) {
        logError('getPlayer', e);
      }

      try {
        this.lb = await this.sdk.getLeaderboards();
      } catch (e) {
        logError('getLeaderboards', e);
      }
    } catch (e) {
      logError('init', e);
      throw e;
    }
  }

  gameplayStart(): void {
    try {
      this.sdk?.features?.GameplayAPI?.start();
    } catch (e) {
      logError('gameplayStart', e);
    }
  }

  gameplayStop(): void {
    try {
      this.sdk?.features?.GameplayAPI?.stop();
    } catch (e) {
      logError('gameplayStop', e);
    }
  }

  showInterstitial(): Promise<{ shown: boolean }> {
    return new Promise((resolve) => {
      if (!this.sdk) {
        resolve({ shown: false });
        return;
      }
      this.sdk.adv.showFullscreenAdv({
        callbacks: {
          onOpen: () => this.onPause?.(),
          onClose: (wasShown: boolean) => {
            this.onResume?.();
            resolve({ shown: wasShown });
          },
          onError: (err: unknown) => {
            logError('showInterstitial', err);
            this.onResume?.();
            resolve({ shown: false });
          },
        },
      });
    });
  }

  showRewarded(): Promise<{ rewarded: boolean }> {
    return new Promise((resolve) => {
      if (!this.sdk) {
        resolve({ rewarded: false });
        return;
      }
      let wasRewarded = false;
      this.sdk.adv.showRewardedVideo({
        callbacks: {
          onOpen: () => this.onPause?.(),
          onRewarded: () => { wasRewarded = true; },
          onClose: () => {
            this.onResume?.();
            resolve({ rewarded: wasRewarded });
          },
          onError: (err: unknown) => {
            logError('showRewarded', err);
            this.onResume?.();
            resolve({ rewarded: false });
          },
        },
      });
    });
  }

  showBanner(): void {
    this.sdk?.adv?.showBannerAdv()?.catch(() => { /* fire and forget */ });
  }

  hideBanner(): void {
    this.sdk?.adv?.hideBannerAdv()?.catch(() => { /* fire and forget */ });
  }

  async saveHighScore(score: number): Promise<void> {
    try {
      if (this.player) {
        await this.player.setData({ best: score });
      }
    } catch (e) {
      logError('saveHighScore.setData', e);
    }
    try {
      if (this.lb) {
        await this.lb.setLeaderboardScore('score', score);
      }
    } catch (e) {
      logError('saveHighScore.leaderboard', e);
    }
  }

  async loadHighScore(): Promise<number> {
    try {
      if (this.player) {
        const data = await this.player.getData(['best']);
        return typeof data?.best === 'number' ? data.best : 0;
      }
    } catch (e) {
      logError('loadHighScore', e);
    }
    return 0;
  }

  async getLeaderboardEntries(count: number): Promise<LeaderboardEntry[]> {
    try {
      if (!this.lb) return [];
      const res = await this.lb.getLeaderboardEntries('score', {
        quantityTop: count,
        includeUser: true,
      });
      const entries: LeaderboardEntry[] = [];
      for (const e of res.entries) {
        entries.push({
          rank: e.rank,
          name: e.player.publicName || `Игрок ${e.rank}`,
          score: e.score,
          isPlayer: e.player.uniqueID === this.player?.getUniqueID(),
        });
      }
      return entries;
    } catch (e) {
      logError('getLeaderboardEntries', e);
      return [];
    }
  }

  getServerTime(): number {
    try { return this.sdk?.serverTime?.() ?? Date.now(); } catch { return Date.now(); }
  }

  /** Set callbacks for game pause/resume (used by GameScene to handle ads) */
  setPauseResumeCallbacks(onPause: () => void, onResume: () => void): void {
    this.onPause = onPause;
    this.onResume = onResume;
  }
}
