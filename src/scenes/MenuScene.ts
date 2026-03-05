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
import { AudioManager } from '../game/AudioManager';
import { DailyStreakManager } from '../game/DailyStreakManager';

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
      fontFamily: BRAND.FONT_DISPLAY,
      align: 'center',
    }).setOrigin(0.5);

    // Best score
    const scoreManager = new ScoreManager(this);
    const best = scoreManager.getBestScore();
    if (best > 0) {
      this.add.text(width / 2, height * 0.42, `Рекорд: ${best}`, {
        fontSize: '22px',
        color: BRAND.TEXT_SECONDARY,
        fontFamily: BRAND.FONT_BODY,
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
      fontFamily: BRAND.FONT_BODY,
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

    // Bestiary button
    const bestBtnY = btnY + 70;
    const bestBtn = this.add.rectangle(width / 2, bestBtnY, 200, 52, 0xede0c4);
    bestBtn.setStrokeStyle(2, 0x8a6420);
    bestBtn.setInteractive({ useHandCursor: true });
    this.add.text(width / 2, bestBtnY, 'Зверята', {
      fontSize: '20px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_BODY, fontStyle: 'bold',
    }).setOrigin(0.5);
    bestBtn.on('pointerover', () => bestBtn.setFillStyle(0xe8c47a));
    bestBtn.on('pointerout', () => bestBtn.setFillStyle(0xede0c4));
    bestBtn.on('pointerup', () => this.scene.start('Bestiary'));

    // Leaderboard button
    const lbBtnY = bestBtnY + 60;
    const lbBtn = this.add.rectangle(width / 2, lbBtnY, 200, 52, 0xede0c4);
    lbBtn.setStrokeStyle(2, 0x8a6420);
    lbBtn.setInteractive({ useHandCursor: true });
    this.add.text(width / 2, lbBtnY, 'Рейтинг', {
      fontSize: '20px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_BODY, fontStyle: 'bold',
    }).setOrigin(0.5);
    lbBtn.on('pointerover', () => lbBtn.setFillStyle(0xe8c47a));
    lbBtn.on('pointerout', () => lbBtn.setFillStyle(0xede0c4));
    lbBtn.on('pointerup', () => this.scene.start('Leaderboard', { returnTo: 'Menu' }));

    // Mute toggle
    const audio = new AudioManager();
    const muteBtn = this.add.text(width - 20, 20, audio.isMuted() ? '🔇' : '🔊', {
      fontSize: '32px',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

    muteBtn.on('pointerup', () => {
      const muted = audio.toggleMute();
      muteBtn.setText(muted ? '🔇' : '🔊');
    });

    // Daily streak
    const streakMgr = new DailyStreakManager();
    const checkIn = streakMgr.checkIn();

    // Streak badge (under mute icon)
    if (checkIn.streak > 0) {
      this.add.text(width - 20, 60, `${checkIn.streak}`, {
        fontSize: '20px', color: '#D4A24C', fontFamily: BRAND.FONT_DISPLAY,
      }).setOrigin(1, 0);
    }

    // Daily reward popup (first visit of the day)
    if (checkIn.isNewDay) {
      this.showStreakPopup(width, height, checkIn);
    }

    // Show banner
    this.bridge?.showBanner();
  }

  private showStreakPopup(
    width: number, height: number,
    info: import('../game/DailyStreakManager').StreakCheckInResult,
  ): void {
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x3d2b1f, 0.5);
    overlay.setInteractive().setDepth(20);

    const py = height * 0.35;
    this.add.rectangle(width / 2, py + 40, 280, 220, 0xf0e5ca).setStrokeStyle(3, 0xd6c6a9).setDepth(21);

    this.add.text(width / 2, py - 30, `День ${info.streak}!`, {
      fontSize: '28px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_DISPLAY,
    }).setOrigin(0.5).setDepth(21);

    let msg = `Бонус: x${info.rewardMultiplier}\nк первой игре`;
    if (info.streakRecovered) msg = 'Щит спас серию!\n' + msg;
    else if (info.streakBroken) msg = 'Новая серия!\n' + msg;

    this.add.text(width / 2, py + 25, msg, {
      fontSize: '18px', color: BRAND.TEXT_SECONDARY, fontFamily: BRAND.FONT_BODY, align: 'center',
    }).setOrigin(0.5).setDepth(21);

    const btn = this.add.rectangle(width / 2, py + 85, 180, 48, 0xd4a24c).setStrokeStyle(2, 0x8a6420).setDepth(21);
    btn.setInteractive({ useHandCursor: true });
    this.add.text(width / 2, py + 85, 'Играть!', {
      fontSize: '20px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_BODY, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(21);
    btn.on('pointerup', () => this.scene.start('Game'));
  }
}
