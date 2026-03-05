/**
 * Module: MenuScene
 * Role: Title screen with mode selection, best score, streak
 * Uses: config/GameConfig (GAME, BRAND), sdk/IGamePlatform, ScoreManager, AudioManager, DailyStreakManager
 * Used by: PreloadScene (transitions to), GameOverScene (return to menu)
 * Does NOT: Contain game logic, manage physics
 */

import Phaser from 'phaser';
import { GAME, BRAND, STORAGE_KEY, DEFAULT_DATA, STATS_DISPLAY } from '../config/GameConfig';
import type { GameMode, PersistedData } from '../config/GameConfig';
import type { IPlatformBridge } from '../sdk/IGamePlatform';
import { ScoreManager } from '../game/ScoreManager';
import { AudioManager } from '../game/AudioManager';
import { DailyStreakManager } from '../game/DailyStreakManager';
import { SpinRewardManager } from '../game/SpinRewardManager';
import { SkinManager } from '../game/SkinManager';
import type { SeasonManager } from '../game/SeasonManager';

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
  private countdownText?: Phaser.GameObjects.Text;
  private seasonMgr?: SeasonManager;

  constructor() { super('Menu'); }

  create(): void {
    this.bridge = this.registry.get('bridge') as IPlatformBridge;
    this.seasonMgr = this.registry.get('seasonManager') as SeasonManager | undefined;
    const { width: w, height: h } = this.scale;
    this.cameras.main.setBackgroundColor(BRAND.BG_CREAM);

    // === Top bar: skin picker, mute, streak ===
    const skinMgr = new SkinManager();
    const skinCircle = this.add.circle(36, 36, 16, skinMgr.getActiveTint() || 0xF5EDD8)
      .setStrokeStyle(2, 0x8a6420).setInteractive({ useHandCursor: true });
    skinCircle.on('pointerup', () => this.showSkinPicker(w, h));

    const audio = new AudioManager();
    const muteBtn = this.add.text(w - 20, 20, audio.isMuted() ? '🔇' : '🔊', {
      fontSize: '32px',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    muteBtn.on('pointerup', () => { muteBtn.setText(audio.toggleMute() ? '🔇' : '🔊'); });

    const streakMgr = new DailyStreakManager();
    const checkIn = streakMgr.checkIn();
    if (checkIn.streak > 0) {
      this.add.text(w - 20, 60, `🔥${checkIn.streak}`, {
        fontSize: '20px', color: '#D4A24C', fontFamily: BRAND.FONT_DISPLAY,
      }).setOrigin(1, 0);
    }

    // === Mascot + Title (zone 10-35%) ===
    this.add.image(w / 2, h * 0.12, 'mascot').setDisplaySize(120, 120);
    this.add.text(w / 2, h * 0.25, 'Мишкин\nЛяп', {
      fontSize: '48px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_DISPLAY, align: 'center',
    }).setOrigin(0.5);

    // === Dynamic Y accumulator from zone 35% ===
    let y = h * 0.35;

    // Season event banner (optional zone)
    if (this.seasonMgr?.isEventActive()) {
      const season = this.seasonMgr.getActiveSeason();
      this.add.text(w / 2, y, `${season.emoji} ${season.name} ${season.emoji}`, {
        fontSize: '20px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_DISPLAY,
      }).setOrigin(0.5);
      y += 24;
      this.countdownText = this.add.text(w / 2, y, '', {
        fontSize: '14px', color: BRAND.TEXT_SECONDARY, fontFamily: BRAND.FONT_BODY,
      }).setOrigin(0.5);
      y += 20;
      this.add.text(w / 2, y, `×${season.scoreMult} бонус к очкам!`, {
        fontSize: '14px', color: '#D4A24C', fontFamily: BRAND.FONT_BODY,
      }).setOrigin(0.5);
      y += 28;
    }

    // Best score + challenge (zone after season)
    const scoreManager = new ScoreManager(this);
    const best = scoreManager.getBestScore();
    const persisted = this.loadPersisted();
    const career = persisted.career;
    if (career.gamesPlayed >= STATS_DISPLAY.SHOW_CHALLENGE_MIN_GAMES && best > 0) {
      this.add.text(w / 2, y, `Побейте рекорд: ${best.toLocaleString()}!`, {
        fontSize: '22px', color: '#D4A24C', fontFamily: BRAND.FONT_DISPLAY,
      }).setOrigin(0.5);
      y += 30;
    } else if (best > 0) {
      this.add.text(w / 2, y, `Рекорд: ${best}`, {
        fontSize: '22px', color: BRAND.TEXT_SECONDARY, fontFamily: BRAND.FONT_BODY,
      }).setOrigin(0.5);
      y += 30;
    }
    if (career.gamesPlayed >= STATS_DISPLAY.SHOW_INVESTMENT_MIN_GAMES) {
      this.add.text(w / 2, y, `${career.gamesPlayed} игр · ${career.totalMerges} мерджей`, {
        fontSize: '13px', color: BRAND.TEXT_SECONDARY, fontFamily: BRAND.FONT_BODY,
      }).setOrigin(0.5).setAlpha(0.7);
      y += 22;
    }

    // === Play mode buttons (main group) ===
    y = Math.max(y + 16, h * 0.48);
    btn(this, w / 2, y, 220, 52, 0xd4a24c, 'Играть', () => this.startGame('classic'));
    y += 62;

    btn(this, w / 2, y, 220, 52, 0xede0c4, 'Ежедневная', () => this.startGame('daily'));
    const dailyBest = scoreManager.getDailyBest(this.getTodayString());
    this.add.text(w / 2, y + 30, dailyBest > 0 ? `Рекорд: ${dailyBest}` : 'Новый день!', {
      fontSize: '14px', color: BRAND.TEXT_SECONDARY, fontFamily: BRAND.FONT_BODY,
    }).setOrigin(0.5);
    y += 72;

    btn(this, w / 2, y, 220, 52, 0xede0c4, 'Без стресса', () => this.startGame('relaxation'));
    y += 32;

    // === Visual separator between play and meta ===
    y += 20;

    // === Meta buttons (2x2 + 1 grid) ===
    const gridCols = 2, gridGapX = 12, gridGapY = 12;
    const metaBtnW = 104, metaBtnH = 44;
    const metaItems: { label: string; action: () => void; highlight?: boolean }[] = [
      { label: '🐾 Зверята', action: () => this.scene.start('Bestiary') },
      { label: '🏆 Рейтинг', action: () => this.scene.start('Leaderboard', { returnTo: 'Menu' }) },
      { label: '📋 Задания', action: () => this.scene.start('Missions') },
      { label: '🎖️ Награды', action: () => this.scene.start('Achievements') },
    ];

    const spinMgr = new SpinRewardManager();
    const spinAvail = spinMgr.canFreeSpin() || spinMgr.canAdSpin();

    for (let i = 0; i < metaItems.length; i++) {
      const col = i % gridCols, row = Math.floor(i / gridCols);
      const mx = w / 2 + (col - 0.5) * (metaBtnW + gridGapX);
      const my = y + row * (metaBtnH + gridGapY);
      btn(this, mx, my, metaBtnW, metaBtnH, 0xede0c4, metaItems[i].label, metaItems[i].action);
    }
    y += Math.ceil(metaItems.length / gridCols) * (metaBtnH + gridGapY) + 8;

    // Spin button (centered, full width)
    const spinBtn = btn(this, w / 2, y, 220, 44, 0xede0c4, spinAvail ? '🎡 Колесо ✨' : '🎡 Колесо', () => this.scene.start('LuckySpin'));
    if (spinAvail) this.tweens.add({ targets: spinBtn, scaleX: 1.03, scaleY: 1.03, duration: 600, yoyo: true, repeat: -1 });

    if (checkIn.isNewDay) this.showStreakPopup(w, h, checkIn);
    this.bridge?.showBanner();
  }

  update(): void {
    if (this.countdownText && this.seasonMgr?.isEventActive()) {
      const ms = this.seasonMgr.getTimeRemainingMs();
      const d = Math.floor(ms / 86400000), hr = Math.floor((ms % 86400000) / 3600000), m = Math.floor((ms % 3600000) / 60000);
      this.countdownText.setText(`Осталось: ${d}д ${hr}ч ${m}м`);
    }
  }

  private startGame(mode: GameMode): void {
    this.scene.start('Game', { mode });
  }

  private getTodayString(): string {
    const d = new Date(this.bridge?.getServerTime?.() ?? Date.now());
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private loadPersisted(): PersistedData {
    try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch { /* ok */ }
    return { ...DEFAULT_DATA };
  }

  private showSkinPicker(w: number, h: number): void {
    const skinMgr = new SkinManager(); const all = skinMgr.getAllSkins();
    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x3d2b1f, 0.5).setInteractive().setDepth(20);
    const py = h * 0.4;
    this.add.rectangle(w / 2, py, 300, 180, 0xf0e5ca).setStrokeStyle(3, 0xd6c6a9).setDepth(21);
    this.add.text(w / 2, py - 60, 'Шкурки', { fontSize: '24px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_DISPLAY }).setOrigin(0.5).setDepth(21);
    const sx = w / 2 - (all.length - 1) * 25;
    all.forEach((skin, i) => {
      const cx = sx + i * 50;
      const c = this.add.circle(cx, py - 10, 18, skin.tint || 0xF5EDD8).setStrokeStyle(3, skin.id === skinMgr.getActiveSkin().id ? 0x3D2B1F : 0xD6C6A9).setDepth(21);
      if (!skin.unlocked) { c.setAlpha(0.3); this.add.text(cx, py - 10, '🔒', { fontSize: '14px' }).setOrigin(0.5).setDepth(21); }
      else { c.setInteractive({ useHandCursor: true }); c.on('pointerup', () => { skinMgr.setActiveSkin(skin.id); this.scene.restart(); }); }
    });
    this.add.text(w / 2, py + 25, skinMgr.getActiveSkin().name, { fontSize: '16px', color: BRAND.TEXT_SECONDARY, fontFamily: BRAND.FONT_BODY }).setOrigin(0.5).setDepth(21);
    overlay.on('pointerup', () => this.scene.restart());
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
