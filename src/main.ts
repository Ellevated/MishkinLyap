/**
 * Module: main
 * Role: Entry point — global error handlers, SDK init, Phaser boot
 * Uses: sdk/IGamePlatform, sdk/YandexPlatform, sdk/MockPlatform, config/GameConfig
 * Used by: index.html (script tag)
 * Does NOT: contain game logic, manage scenes
 */

import Phaser from 'phaser';
import { GAME } from './config/GameConfig';
import type { IPlatformBridge } from './sdk/IGamePlatform';
import { YandexPlatform } from './sdk/YandexPlatform';
import { MockPlatform } from './sdk/MockPlatform';

function logError(context: string, err: unknown): void {
  console.error(`[Zverata] ${context}:`, err);
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

  new Phaser.Game({
    type: Phaser.AUTO,
    width: GAME.WIDTH,
    height: GAME.HEIGHT,
    parent: 'game',
    backgroundColor: '#1a1a2e',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'matter',
      matter: {
        gravity: { x: 0, y: GAME.HEIGHT * 0.002 },
        debug: __DEV__,
      },
    },
    scene: [],
    callbacks: {
      preBoot: (game) => {
        game.registry.set('bridge', bridge);
      },
    },
  });
}

boot().catch((err) => logError('boot', err));
