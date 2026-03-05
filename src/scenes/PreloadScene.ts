/**
 * Module: PreloadScene
 * Role: Loads all game assets, shows loading progress, transitions to Menu
 * Uses: config/GameConfig (ANIMALS for asset keys)
 * Used by: main.ts (first scene in Phaser config)
 * Does NOT: Contain game logic, call SDK
 */

import Phaser from 'phaser';
import { ANIMALS, BRAND } from '../config/GameConfig';
import { LuckySpinScene } from './LuckySpinScene';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    // Progress bar
    const { width, height } = this.scale;
    const barW = width * 0.6;
    const barH = 20;
    const barX = (width - barW) / 2;
    const barY = height / 2;

    const bg = this.add.rectangle(width / 2, barY, barW + 4, barH + 4, 0xd6c6a9);
    bg.setStrokeStyle(2, 0x3d2b1f, 0.3);
    const fill = this.add.rectangle(barX + 2, barY, 0, barH, 0xd4a24c);
    fill.setOrigin(0, 0.5);

    const label = this.add.text(width / 2, barY - 30, 'Загрузка...', {
      fontSize: '18px',
      color: BRAND.TEXT_INK,
      fontFamily: BRAND.FONT_BODY,
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      fill.width = barW * value;
    });

    this.load.on('complete', () => {
      bg.destroy();
      fill.destroy();
      label.destroy();
    });

    // Load animal sprites
    for (const animal of ANIMALS) {
      this.load.image(
        animal.key,
        `assets/animals/ml_sprite_tier${animal.tier}_${animal.key}.png`,
      );
    }
  }

  create(): void {
    this.scene.add('LuckySpin', LuckySpinScene, false);
    this.scene.start('Menu');
  }
}
