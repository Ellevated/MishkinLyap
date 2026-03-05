/**
 * Module: IGamePlatform
 * Role: Platform bridge interface — Published Language for all game↔SDK communication
 * Uses: nothing (pure interface)
 * Used by: YandexPlatform, MockPlatform, main.ts, scenes/
 * Does NOT: contain implementation, import game modules
 */

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  isPlayer: boolean;
}

export interface IPlatformBridge {
  /** Initialize SDK. Must complete before Phaser boots. */
  init(): Promise<void>;

  /** Signal to platform: gameplay session started */
  gameplayStart(): void;

  /** Signal to platform: gameplay session stopped */
  gameplayStop(): void;

  /** Show fullscreen interstitial ad. Returns whether it was actually shown. */
  showInterstitial(): Promise<{ shown: boolean }>;

  /** Show rewarded video ad. Returns whether user watched and earned reward. */
  showRewarded(): Promise<{ rewarded: boolean }>;

  /** Show sticky banner ad */
  showBanner(): void;

  /** Hide sticky banner ad */
  hideBanner(): void;

  /** Persist high score to platform storage + leaderboard */
  saveHighScore(score: number): Promise<void>;

  /** Load high score from platform storage */
  loadHighScore(): Promise<number>;

  /** Get top leaderboard entries + player's entry */
  getLeaderboardEntries(count: number): Promise<LeaderboardEntry[]>;
}
