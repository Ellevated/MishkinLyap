/**
 * Module: PauseScene
 * Role: Confirm-exit overlay — "Выйти в меню?" with Да/Нет buttons
 * Uses: config/GameConfig (BRAND)
 * Used by: GameScene (launches as overlay on exit button tap)
 */

import Phaser from 'phaser';
import { BRAND } from '../config/GameConfig';

export class PauseScene extends Phaser.Scene {
  constructor() { super('Pause'); }

  create(): void {
    const { width: w, height: h } = this.scale;
    this.scene.bringToTop();

    // Dark overlay (blocks input to game)
    this.add.rectangle(w / 2, h / 2, w, h, 0x3d2b1f, 0.5).setInteractive();

    // Panel
    const py = h * 0.38;
    this.add.rectangle(w / 2, py, 280, 180, 0xf0e5ca).setStrokeStyle(3, 0xd6c6a9);

    // Question
    this.add.text(w / 2, py - 50, 'Выйти в меню?', {
      fontSize: '24px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_DISPLAY,
    }).setOrigin(0.5);

    // "Да" button
    const yesBtn = this.add.rectangle(w / 2 - 60, py + 20, 100, 48, 0xc44832)
      .setStrokeStyle(2, 0x8a6420).setInteractive({ useHandCursor: true });
    this.add.text(w / 2 - 60, py + 20, 'Да', {
      fontSize: '20px', color: '#FFFFFF', fontFamily: BRAND.FONT_BODY, fontStyle: 'bold',
    }).setOrigin(0.5);
    yesBtn.on('pointerdown', () => yesBtn.setScale(0.95));
    yesBtn.on('pointerup', () => {
      yesBtn.setScale(1);
      this.scene.stop();
      this.scene.stop('Game');
      this.scene.start('Menu');
    });

    // "Нет" button
    const noBtn = this.add.rectangle(w / 2 + 60, py + 20, 100, 48, 0x4a7a30)
      .setStrokeStyle(2, 0x8a6420).setInteractive({ useHandCursor: true });
    this.add.text(w / 2 + 60, py + 20, 'Нет', {
      fontSize: '20px', color: '#FFFFFF', fontFamily: BRAND.FONT_BODY, fontStyle: 'bold',
    }).setOrigin(0.5);
    noBtn.on('pointerdown', () => noBtn.setScale(0.95));
    noBtn.on('pointerup', () => {
      noBtn.setScale(1);
      this.scene.stop();
      this.scene.resume('Game');
    });
  }
}
