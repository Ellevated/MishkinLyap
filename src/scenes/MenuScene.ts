/**
 * Module: MenuScene
 * Role: Title screen with mode selection, best score, streak
 * Uses: config/GameConfig (GAME, BRAND), sdk/IGamePlatform, ScoreManager, AudioManager, DailyStreakManager
 * Used by: PreloadScene (transitions to), GameOverScene (return to menu)
 * Does NOT: Contain game logic, manage physics
 */

import Phaser from 'phaser';
import { GAME, BRAND } from '../config/GameConfig';
import type { GameMode } from '../config/GameConfig';
import type { IPlatformBridge } from '../sdk/IGamePlatform';
import { ScoreManager } from '../game/ScoreManager';
import { AudioManager } from '../game/AudioManager';
import { DailyStreakManager } from '../game/DailyStreakManager';

const btn = (s: Phaser.Scene, x: number, y: number, w: number, h: number, color: number, label: string, onClick: () => void) => {
  const r = s.add.rectangle(x, y, w, h, color).setStrokeStyle(2, 0x8a6420).setInteractive({ useHandCursor: true });
  s.add.text(x, y, label, { fontSize: '20px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_BODY, fontStyle: 'bold' }).setOrigin(0.5);
  r.on('pointerover', () => r.setFillStyle(0xe8c47a));
  r.on('pointerout', () => r.setFillStyle(color));
  r.on('pointerdown', () => r.setScale(0.95));
  r.on('pointerup', () => { r.setScale(1); onClick(); });
  return r;
};

export class MenuScene extends Phaser.Scene {
  private bridge!: IPlatformBridge;

  constructor() { super('Menu'); }

  create(): void {
    this.bridge = this.registry.get('bridge') as IPlatformBridge;
    const { width: w, height: h } = this.scale;
    this.cameras.main.setBackgroundColor(BRAND.BG_CREAM);

    // Title (moved up for 3 mode buttons)
    this.add.text(w / 2, h * 0.21, 'Мишкин\nЛяп', {
      fontSize: '48px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_DISPLAY, align: 'center',
    }).setOrigin(0.5);

    // Best score
    const scoreManager = new ScoreManager(this);
    const best = scoreManager.getBestScore();
    if (best > 0) {
      this.add.text(w / 2, h * 0.35, `Рекорд: ${best}`, {
        fontSize: '22px', color: BRAND.TEXT_SECONDARY, fontFamily: BRAND.FONT_BODY,
      }).setOrigin(0.5);
    }

    // Mode buttons
    let y = 400;
    btn(this, w / 2, y, 220, 52, 0xd4a24c, 'Играть', () => this.startGame('classic'));
    y += 65;

    btn(this, w / 2, y, 220, 52, 0xede0c4, 'Ежедневная', () => this.startGame('daily'));
    const dailyBest = scoreManager.getDailyBest(this.getTodayString());
    this.add.text(w / 2, y + 30, dailyBest > 0 ? `Рекорд: ${dailyBest}` : 'Новый день!', {
      fontSize: '14px', color: BRAND.TEXT_SECONDARY, fontFamily: BRAND.FONT_BODY,
    }).setOrigin(0.5);
    y += 75;

    btn(this, w / 2, y, 220, 52, 0xede0c4, 'Без стресса', () => this.startGame('relaxation'));
    y += 65;

    // Secondary buttons
    btn(this, w / 2, y, 200, 44, 0xede0c4, 'Зверята', () => this.scene.start('Bestiary'));
    y += 52;
    btn(this, w / 2, y, 200, 44, 0xede0c4, 'Рейтинг', () => this.scene.start('Leaderboard', { returnTo: 'Menu' }));
    y += 52;
    btn(this, w / 2, y, 200, 44, 0xede0c4, 'Задания', () => this.scene.start('Missions'));
    y += 52;
    btn(this, w / 2, y, 200, 44, 0xede0c4, 'Награды', () => this.scene.start('Achievements'));

    // Mute toggle
    const audio = new AudioManager();
    const muteBtn = this.add.text(w - 20, 20, audio.isMuted() ? '🔇' : '🔊', {
      fontSize: '32px',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    muteBtn.on('pointerup', () => { muteBtn.setText(audio.toggleMute() ? '🔇' : '🔊'); });

    // Daily streak
    const streakMgr = new DailyStreakManager();
    const checkIn = streakMgr.checkIn();
    if (checkIn.streak > 0) {
      this.add.text(w - 20, 60, `${checkIn.streak}`, {
        fontSize: '20px', color: '#D4A24C', fontFamily: BRAND.FONT_DISPLAY,
      }).setOrigin(1, 0);
    }
    if (checkIn.isNewDay) this.showStreakPopup(w, h, checkIn);

    this.bridge?.showBanner();
  }

  private startGame(mode: GameMode): void {
    this.scene.start('Game', { mode });
  }

  private getTodayString(): string {
    const d = new Date(this.bridge?.getServerTime?.() ?? Date.now());
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private showStreakPopup(
    w: number, h: number,
    info: import('../game/DailyStreakManager').StreakCheckInResult,
  ): void {
    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x3d2b1f, 0.5);
    overlay.setInteractive().setDepth(20);

    const py = h * 0.35;
    this.add.rectangle(w / 2, py + 40, 280, 220, 0xf0e5ca).setStrokeStyle(3, 0xd6c6a9).setDepth(21);
    this.add.text(w / 2, py - 30, `День ${info.streak}!`, {
      fontSize: '28px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_DISPLAY,
    }).setOrigin(0.5).setDepth(21);

    let msg = `Бонус: x${info.rewardMultiplier}\nк первой игре`;
    if (info.streakRecovered) msg = 'Щит спас серию!\n' + msg;
    else if (info.streakBroken) msg = 'Новая серия!\n' + msg;
    this.add.text(w / 2, py + 25, msg, {
      fontSize: '18px', color: BRAND.TEXT_SECONDARY, fontFamily: BRAND.FONT_BODY, align: 'center',
    }).setOrigin(0.5).setDepth(21);

    const popupBtn = this.add.rectangle(w / 2, py + 85, 180, 48, 0xd4a24c).setStrokeStyle(2, 0x8a6420).setDepth(21);
    popupBtn.setInteractive({ useHandCursor: true });
    this.add.text(w / 2, py + 85, 'Играть!', {
      fontSize: '20px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_BODY, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(21);
    popupBtn.on('pointerup', () => this.startGame('classic'));
  }
}
