/**
 * Module: GameOverScene
 * Role: Game over overlay — feedback, continue via rewarded ad, interstitial on restart
 * Uses: config/GameConfig (BRAND, ANIMALS, ADS), sdk/IGamePlatform
 * Used by: GameScene (launches as overlay)
 */
import Phaser from 'phaser';
import { BRAND, ANIMALS, ADS } from '../config/GameConfig';
import type { GameMode } from '../config/GameConfig';
import type { IPlatformBridge } from '../sdk/IGamePlatform';
import type { GameScene } from './GameScene';
import { ShareManager } from '../game/ShareManager';

interface GameOverData {
  score: number; best: number; mergeCount: number;
  highestTier: number; isNewRecord: boolean; canContinue: boolean;
  mode?: GameMode;
}

const WARM = ['Отличная игра!', 'Так держать!', 'Вы молодец!', 'Браво!'];
const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)];
const txt = (s: Phaser.Scene, x: number, y: number, t: string, sz: string, c: string, fam: string = BRAND.FONT_BODY, style = '') =>
  s.add.text(x, y, t, { fontSize: sz, color: c, fontFamily: fam, fontStyle: style }).setOrigin(0.5);

export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }

  create(data: GameOverData): void {
    const bridge = this.registry.get('bridge') as IPlatformBridge;
    const { width: w, height: h } = this.scale;
    this.scene.bringToTop();
    this.add.rectangle(w / 2, h / 2, w, h, 0x3d2b1f, 0.6).setInteractive();

    const panelY = h * 0.3;
    const panelH = data.canContinue ? 580 : (data.isNewRecord ? 540 : 520);
    this.add.rectangle(w / 2, panelY + panelH / 2 - 30, 320, panelH, 0xf0e5ca).setStrokeStyle(3, 0xd6c6a9);

    let y = panelY - 15;
    txt(this, w / 2, y, 'Ой, ляп!', '36px', BRAND.TEXT_INK, BRAND.FONT_DISPLAY);
    y += 50;

    if (data.isNewRecord) {
      const b = txt(this, w / 2, y, 'Новый рекорд!', '24px', '#D4A24C', BRAND.FONT_DISPLAY);
      this.tweens.add({ targets: b, scaleX: 1.1, scaleY: 1.1, duration: 300, yoyo: true, repeat: 2 });
      y += 35;
    }

    txt(this, w / 2, y, `Счёт: ${data.score}`, '28px', BRAND.TEXT_INK, BRAND.FONT_BODY, 'bold');
    y += 32;
    txt(this, w / 2, y, `Рекорд: ${Math.max(data.score, data.best)}`, '18px', BRAND.TEXT_SECONDARY);
    y += 28;

    if (!data.isNewRecord && data.best > 0 && data.score > data.best * 0.8) {
      txt(this, w / 2, y, `Почти рекорд! Не хватило ${data.best - data.score} очков`, '16px', '#C44832');
      y += 24;
    }

    const tier = ANIMALS[data.highestTier - 1]?.name ?? '?';
    txt(this, w / 2, y, `Мерджей: ${data.mergeCount}  |  Лучший: ${tier}`, '16px', BRAND.TEXT_SECONDARY);
    y += 24;

    if (data.highestTier >= 4) {
      txt(this, w / 2, y, `Лучший момент: ${ANIMALS[data.highestTier - 1]?.name ?? '?'}!`, '16px', '#D4A24C');
      y += 24;
    } else if (data.highestTier < 8) {
      txt(this, w / 2, y, `До ${ANIMALS[data.highestTier]?.name ?? '?'} — совсем чуть-чуть!`, '16px', '#8B6040', BRAND.FONT_BODY, 'italic');
      y += 24;
    }

    txt(this, w / 2, y, pick(WARM), '18px', '#4A7A30');
    y += 38;

    if (data.canContinue) {
      const cb = this.btn(w / 2, y, 'Продолжить 📺', 0x4a7a30, () => { cb.disableInteractive(); this.doContinue(bridge); });
      this.tweens.add({ targets: cb, scaleX: 1.05, scaleY: 1.05, duration: 500, yoyo: true, repeat: -1 });
      y += 60;
    }

    const mode = data.mode || 'classic';
    const pb = this.btn(w / 2, y, 'Ещё разок', 0xd4a24c, () => { pb.disableInteractive(); this.doRestart(bridge, mode); });
    if (!data.canContinue) this.tweens.add({ targets: pb, scaleX: 1.03, scaleY: 1.03, duration: 600, yoyo: true, repeat: -1 });
    y += 60;

    this.btn(w / 2, y, 'Меню', 0xede0c4, () => { this.scene.stop(); this.scene.stop('Game'); this.scene.start('Menu'); });
    y += 60;
    this.btn(w / 2, y, 'Рейтинг', 0xede0c4, () => { this.scene.stop(); this.scene.stop('Game'); this.scene.start('Leaderboard', { returnTo: 'Menu' }); });
    y += 60;
    this.btn(w / 2, y, 'Поделиться 📸', 0xede0c4, () => {
      new ShareManager().captureAndShare(this, { score: data.score, best: Math.max(data.score, data.best), highestTier: data.highestTier });
    });
  }

  private async doContinue(bridge: IPlatformBridge): Promise<void> {
    try {
      if ((await bridge.showRewarded()).rewarded) {
        const gs = this.scene.get('Game') as GameScene;
        this.scene.stop(); this.scene.resume('Game'); gs.continueAfterAd();
        return;
      }
    } catch { /* ad failed */ }
    const e = txt(this, this.scale.width / 2, 50, 'Реклама недоступна', '16px', '#C44832').setDepth(30);
    this.time.delayedCall(2000, () => this.tweens.add({ targets: e, alpha: 0, duration: 300, onComplete: () => e.destroy() }));
  }

  private async doRestart(bridge: IPlatformBridge, mode: GameMode): Promise<void> {
    const last = (this.registry.get('lastInterstitialTime') as number) || 0;
    if (Date.now() - last > ADS.INTERSTITIAL_COOLDOWN_MS) {
      try { await bridge.showInterstitial(); this.registry.set('lastInterstitialTime', Date.now()); } catch { /* ok */ }
    }
    this.scene.stop(); this.scene.stop('Game'); this.scene.start('Game', { mode });
  }

  private btn(x: number, y: number, label: string, color: number, onClick: () => void): Phaser.GameObjects.Rectangle {
    const b = this.add.rectangle(x, y, 220, 52, color).setStrokeStyle(2, 0x8a6420);
    b.setInteractive({ useHandCursor: true });
    txt(this, x, y, label, '20px', BRAND.TEXT_INK, BRAND.FONT_BODY, 'bold');
    b.on('pointerover', () => b.setFillStyle(0xe8c47a));
    b.on('pointerout', () => b.setFillStyle(color));
    b.on('pointerdown', () => b.setScale(0.95));
    b.on('pointerup', () => { b.setScale(1); onClick(); });
    return b;
  }
}
