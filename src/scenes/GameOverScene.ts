/**
 * Module: GameOverScene
 * Role: Game over overlay — warm feedback, near-miss, session stats, play again
 * Uses: config/GameConfig (BRAND, ANIMALS), sdk/IGamePlatform
 * Used by: GameScene (launches as overlay)
 */

import Phaser from 'phaser';
import { BRAND, ANIMALS } from '../config/GameConfig';
import type { IPlatformBridge } from '../sdk/IGamePlatform';

interface GameOverData {
  score: number; best: number;
  mergeCount: number; highestTier: number; isNewRecord: boolean;
}

const WARM_MESSAGES = ['Отличная игра!', 'Так держать!', 'Вы молодец!', 'Браво!'];
const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }

  create(data: GameOverData): void {
    const bridge = this.registry.get('bridge') as IPlatformBridge;
    const { width, height } = this.scale;
    this.scene.bringToTop();

    // Dim overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x3d2b1f, 0.6);
    overlay.setInteractive();

    // Panel (taller to fit more info)
    const panelY = height * 0.3;
    const panelH = data.isNewRecord ? 420 : 400;
    this.add.rectangle(width / 2, panelY + panelH / 2 - 30, 320, panelH, 0xf0e5ca)
      .setStrokeStyle(3, 0xd6c6a9);

    let y = panelY - 15;

    // Title
    this.add.text(width / 2, y, 'Ой, ляп!', {
      fontSize: '36px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_DISPLAY,
    }).setOrigin(0.5);
    y += 50;

    // New record banner
    if (data.isNewRecord) {
      const banner = this.add.text(width / 2, y, 'Новый рекорд!', {
        fontSize: '24px', color: '#D4A24C', fontFamily: BRAND.FONT_DISPLAY,
      }).setOrigin(0.5);
      this.tweens.add({ targets: banner, scaleX: 1.1, scaleY: 1.1, duration: 300, yoyo: true, repeat: 2 });
      y += 35;
    }

    // Score
    this.add.text(width / 2, y, `Счёт: ${data.score}`, {
      fontSize: '28px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_BODY, fontStyle: 'bold',
    }).setOrigin(0.5);
    y += 32;

    this.add.text(width / 2, y, `Рекорд: ${Math.max(data.score, data.best)}`, {
      fontSize: '18px', color: BRAND.TEXT_SECONDARY, fontFamily: BRAND.FONT_BODY,
    }).setOrigin(0.5);
    y += 28;

    // Near-miss message
    if (!data.isNewRecord && data.best > 0 && data.score > data.best * 0.8) {
      const diff = data.best - data.score;
      this.add.text(width / 2, y, `Почти рекорд! Не хватило ${diff} очков`, {
        fontSize: '16px', color: '#C44832', fontFamily: BRAND.FONT_BODY,
      }).setOrigin(0.5);
      y += 24;
    }

    // Session stats
    const tierName = ANIMALS[data.highestTier - 1]?.name ?? '?';
    const statsLine = `Мерджей: ${data.mergeCount}  |  Лучший: ${tierName}`;
    this.add.text(width / 2, y, statsLine, {
      fontSize: '16px', color: BRAND.TEXT_SECONDARY, fontFamily: BRAND.FONT_BODY,
    }).setOrigin(0.5);
    y += 24;

    // Near-miss to next animal
    if (data.highestTier < 8) {
      const nextName = ANIMALS[data.highestTier]?.name ?? '?';
      this.add.text(width / 2, y, `До ${nextName} — совсем чуть-чуть!`, {
        fontSize: '16px', color: '#8B6040', fontFamily: BRAND.FONT_BODY, fontStyle: 'italic',
      }).setOrigin(0.5);
      y += 24;
    }

    // Warm message
    this.add.text(width / 2, y, pick(WARM_MESSAGES), {
      fontSize: '18px', color: '#4A7A30', fontFamily: BRAND.FONT_BODY,
    }).setOrigin(0.5);
    y += 38;

    // Play Again button (prominent, pulsing)
    const playBtn = this.createButton(width / 2, y, 'Ещё разок', 0xd4a24c, () => {
      this.scene.stop(); this.scene.stop('Game'); this.scene.start('Game');
    });
    this.tweens.add({
      targets: playBtn, scaleX: 1.03, scaleY: 1.03, duration: 600, yoyo: true, repeat: -1,
    });
    y += 60;

    // Menu button
    this.createButton(width / 2, y, 'Меню', 0xede0c4, () => {
      this.scene.stop(); this.scene.stop('Game'); this.scene.start('Menu');
    });
  }

  private createButton(
    x: number, y: number, label: string, color: number, onClick: () => void,
  ): Phaser.GameObjects.Rectangle {
    const btn = this.add.rectangle(x, y, 220, 52, color).setStrokeStyle(2, 0x8a6420);
    btn.setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontSize: '20px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_BODY, fontStyle: 'bold',
    }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(0xe8c47a));
    btn.on('pointerout', () => btn.setFillStyle(color));
    btn.on('pointerdown', () => btn.setScale(0.95));
    btn.on('pointerup', () => { btn.setScale(1); onClick(); });
    return btn;
  }
}
