/**
 * Module: BestiaryScene
 * Role: Collection screen — shows all 8 animals, silhouettes for undiscovered
 * Uses: config/GameConfig (ANIMALS, BRAND, GAME), game/ScoreManager
 * Used by: MenuScene (navigation)
 */

import Phaser from 'phaser';
import { ANIMALS, BRAND, GAME } from '../config/GameConfig';
import { ScoreManager } from '../game/ScoreManager';

const ANIMAL_NAMES: Record<string, string> = {
  hamster: 'Хомячок', bunny: 'Зайчик', kitten: 'Котёнок', cat: 'Кошка',
  puppy: 'Собачка', fox: 'Лисичка', panda: 'Панда', bear: 'Мишка',
};

export class BestiaryScene extends Phaser.Scene {
  constructor() { super('Bestiary'); }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(BRAND.BG_CREAM);

    const sm = new ScoreManager(this);
    const discovered = sm.getDiscoveredTiers();
    const total = ANIMALS.length;
    const found = discovered.length;

    // Title + progress
    this.add.text(width / 2, 40, 'Зверята', {
      fontSize: '36px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_DISPLAY,
    }).setOrigin(0.5);

    this.add.text(width / 2, 80, `${found} из ${total}`, {
      fontSize: '20px', color: BRAND.TEXT_SECONDARY, fontFamily: BRAND.FONT_BODY,
    }).setOrigin(0.5);

    // Grid: 4 cols x 2 rows
    const cols = 4;
    const cellW = 100;
    const cellH = 120;
    const gridW = cols * cellW;
    const startX = (width - gridW) / 2 + cellW / 2;
    const startY = 140;

    ANIMALS.forEach((cfg, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = startX + col * cellW;
      const cy = startY + row * cellH;
      const isDiscovered = discovered.includes(cfg.tier);

      if (this.textures.exists(cfg.key)) {
        const img = this.add.image(cx, cy, cfg.key).setDisplaySize(64, 64);
        if (!isDiscovered) {
          img.setTint(0x000000);
          img.setAlpha(0.3);
        }
      } else {
        const circle = this.add.circle(cx, cy, 30, isDiscovered ? cfg.color : 0x333333);
        if (!isDiscovered) circle.setAlpha(0.3);
      }

      this.add.text(cx, cy + 42, isDiscovered ? (ANIMAL_NAMES[cfg.key] ?? cfg.name) : '???', {
        fontSize: '14px', color: isDiscovered ? BRAND.TEXT_INK : BRAND.TEXT_SECONDARY,
        fontFamily: BRAND.FONT_BODY,
      }).setOrigin(0.5);
    });

    // Progress bar
    const barY = startY + 2 * cellH + 30;
    const barW = 280;
    const barH = 16;
    this.add.rectangle(width / 2, barY, barW + 4, barH + 4, 0xd6c6a9).setStrokeStyle(1, 0x8a6420, 0.3);
    const fillW = (barW * found) / total;
    if (fillW > 0) {
      this.add.rectangle(width / 2 - barW / 2 + fillW / 2, barY, fillW, barH, 0xd4a24c);
    }

    // Back button
    const btnY = barY + 60;
    const btn = this.add.rectangle(width / 2, btnY, 180, 48, 0xede0c4).setStrokeStyle(2, 0x8a6420);
    btn.setInteractive({ useHandCursor: true });
    this.add.text(width / 2, btnY, 'Назад', {
      fontSize: '20px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_BODY, fontStyle: 'bold',
    }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(0xe8c47a));
    btn.on('pointerout', () => btn.setFillStyle(0xede0c4));
    btn.on('pointerup', () => this.scene.start('Menu'));
  }
}
