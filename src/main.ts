/**
 * Module: main
 * Role: Entry point — global error handlers, SDK init, Phaser boot
 * Uses: sdk/IGamePlatform, sdk/YandexPlatform, sdk/MockPlatform, config/GameConfig
 * Used by: index.html (script tag)
 * Does NOT: contain game logic, manage scenes
 */

import Phaser from 'phaser';
import { GAME, PHYSICS } from './config/GameConfig';
import type { IPlatformBridge } from './sdk/IGamePlatform';
import { YandexPlatform } from './sdk/YandexPlatform';
import { MockPlatform } from './sdk/MockPlatform';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { BestiaryScene } from './scenes/BestiaryScene';
import { LeaderboardScene } from './scenes/LeaderboardScene';
import { MissionsScene } from './scenes/MissionsScene';
import { AchievementsScene } from './scenes/AchievementsScene';

function logError(context: string, err: unknown): void {
  console.error(`[MishkinLyap] ${context}:`, err);
}

// Global error handlers
window.onerror = (_msg, _src, _line, _col, err) => {
  logError('window.onerror', err);
};
window.onunhandledrejection = (event) => {
  logError('unhandledrejection', event.reason);
};

function createBridge(): IPlatformBridge {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (window as any).YaGames !== 'undefined') {
    return new YandexPlatform();
  }
  return new MockPlatform();
}

async function boot(): Promise<void> {
  const bridge = createBridge();
  await bridge.init();

  const debugParam = new URLSearchParams(window.location.search).get('debug');
  const showDebug = debugParam !== null ? debugParam === '1' : __DEV__;

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: GAME.WIDTH,
    height: GAME.HEIGHT,
    parent: 'game',
    backgroundColor: '#F5EDD8',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'matter',
      matter: {
        gravity: { x: 0, y: PHYSICS.GRAVITY_Y },
        debug: showDebug,
      },
    },
    scene: [PreloadScene, MenuScene, GameScene, GameOverScene, BestiaryScene, LeaderboardScene, MissionsScene, AchievementsScene],
    callbacks: {
      preBoot: (g) => {
        g.registry.set('bridge', bridge);
      },
    },
  });

  // Expose for testing/debugging
  (window as any).__PHASER_GAME__ = game;
}

boot().catch((err) => logError('boot', err));
