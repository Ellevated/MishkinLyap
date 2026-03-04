/**
 * Module: MenuScene
 * Role: Title screen with play button and best score display
 * Uses: config/GameConfig (GAME, BRAND), config/GameEvents, sdk/IGamePlatform
 * Used by: PreloadScene (transitions to), GameOverScene (return to menu)
 * Does NOT: Contain game logic, manage physics
 */

import Phaser from 'phaser';
import { GAME, BRAND } from '../config/GameConfig';
import type { IPlatformBridge } from '../sdk/IGamePlatform';
import { ScoreManager } from '../game/ScoreManager';

export class MenuScene extends Phaser.Scene {
  private bridge!: IPlatformBridge;

  constructor() {
    super('Menu');
  }

  create(): void {
    this.bridge = this.registry.get('bridge') as IPlatformBridge;
    const { width, height } = this.scale;

    // Background
    this.cameras.main.setBackgroundColor(BRAND.BG_CREAM);

    // Title
    this.add.text(width / 2, height * 0.25, 'Мишкин\nЛяп', {
      fontSize: '48px',
      color: BRAND.TEXT_INK,
      fontFamily: 'Marmelad, sans-serif',
      align: 'center',
    }).setOrigin(0.5);

    // Best score
    const scoreManager = new ScoreManager(this);
    const best = scoreManager.getBestScore();
    if (best > 0) {
      this.add.text(width / 2, height * 0.42, `Рекорд: ${best}`, {
        fontSize: '22px',
        color: BRAND.TEXT_SECONDARY,
        fontFamily: 'Nunito, sans-serif',
      }).setOrigin(0.5);
    }

    // Play button
    const btnY = height * 0.55;
    const btn = this.add.rectangle(width / 2, btnY, 200, 56, 0xd4a24c, 1);
    btn.setStrokeStyle(2, 0x8a6420);
    btn.setInteractive({ useHandCursor: true });

    const btnText = this.add.text(width / 2, btnY, 'Играть', {
      fontSize: '22px',
      color: BRAND.TEXT_INK,
      fontFamily: 'Nunito, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    btn.on('pointerover', () => btn.setFillStyle(0xe8c47a));
    btn.on('pointerout', () => btn.setFillStyle(0xd4a24c));
    btn.on('pointerdown', () => {
      btn.setScale(0.95);
    });
    btn.on('pointerup', () => {
      btn.setScale(1);
      this.scene.start('Game');
    });

    // Show banner
    this.bridge?.showBanner();
  }
}
