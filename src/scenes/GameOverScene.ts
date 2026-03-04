/**
 * Module: GameOverScene
 * Role: Game over overlay — shows score, offers rewarded ad continue, play again, menu
 * Uses: config/GameConfig (ADS, BRAND), sdk/IGamePlatform, config/GameEvents
 * Used by: GameScene (launches as overlay)
 * Does NOT: Manage physics, detect merges, handle game state
 */

import Phaser from 'phaser';
import { ADS, BRAND } from '../config/GameConfig';
import type { IPlatformBridge } from '../sdk/IGamePlatform';

export class GameOverScene extends Phaser.Scene {
  private bridge!: IPlatformBridge;

  constructor() {
    super('GameOver');
  }

  create(data: { score: number; best: number }): void {
    this.bridge = this.registry.get('bridge') as IPlatformBridge;
    const { width, height } = this.scale;

    // Dim overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x3d2b1f, 0.6);

    // Panel
    const panelY = height * 0.35;
    const panel = this.add.rectangle(width / 2, panelY + 80, 320, 340, 0xf0e5ca);
    panel.setStrokeStyle(3, 0xd6c6a9);

    // Title
    this.add.text(width / 2, panelY - 20, 'Ой, ляп!', {
      fontSize: '36px',
      color: BRAND.TEXT_INK,
      fontFamily: 'Marmelad, sans-serif',
    }).setOrigin(0.5);

    // Score
    this.add.text(width / 2, panelY + 30, `Счёт: ${data.score}`, {
      fontSize: '28px',
      color: BRAND.TEXT_INK,
      fontFamily: 'Nunito, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Best
    this.add.text(width / 2, panelY + 65, `Рекорд: ${data.best}`, {
      fontSize: '18px',
      color: BRAND.TEXT_SECONDARY,
      fontFamily: 'Nunito, sans-serif',
    }).setOrigin(0.5);

    // Play Again button
    const playBtnY = panelY + 120;
    this.createButton(width / 2, playBtnY, 'Ещё разок', 0xd4a24c, () => {
      this.scene.stop();
      this.scene.get('Game').scene.restart();
    });

    // Menu button
    const menuBtnY = panelY + 185;
    this.createButton(width / 2, menuBtnY, 'Меню', 0xede0c4, () => {
      this.scene.stop('Game');
      this.scene.stop();
      this.scene.start('Menu');
    });
  }

  private createButton(
    x: number, y: number, label: string, color: number, onClick: () => void,
  ): void {
    const btn = this.add.rectangle(x, y, 220, 52, color);
    btn.setStrokeStyle(2, 0x8a6420);
    btn.setInteractive({ useHandCursor: true });

    this.add.text(x, y, label, {
      fontSize: '20px',
      color: BRAND.TEXT_INK,
      fontFamily: 'Nunito, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    btn.on('pointerover', () => btn.setFillStyle(0xe8c47a));
    btn.on('pointerout', () => btn.setFillStyle(color));
    btn.on('pointerdown', () => btn.setScale(0.95));
    btn.on('pointerup', () => {
      btn.setScale(1);
      onClick();
    });
  }
}
