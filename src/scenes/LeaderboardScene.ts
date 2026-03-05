/**
 * Module: LeaderboardScene
 * Role: Displays top-10 leaderboard with player highlight
 * Uses: config/GameConfig (BRAND, GAME), sdk/IGamePlatform
 * Used by: MenuScene, GameOverScene (navigation)
 */
import Phaser from 'phaser';
import { BRAND, GAME } from '../config/GameConfig';
import type { IPlatformBridge, LeaderboardEntry } from '../sdk/IGamePlatform';

interface LeaderboardData { returnTo: string; }

export class LeaderboardScene extends Phaser.Scene {
  constructor() { super('Leaderboard'); }

  create(data: LeaderboardData): void {
    const bridge = this.registry.get('bridge') as IPlatformBridge;
    const w = GAME.WIDTH;
    this.cameras.main.setBackgroundColor(BRAND.BG_CREAM);

    // Title
    this.add.text(w / 2, 40, 'Рейтинг', {
      fontSize: '36px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_DISPLAY,
    }).setOrigin(0.5);

    // Loading text
    const loading = this.add.text(w / 2, 300, 'Загрузка...', {
      fontSize: '20px', color: BRAND.TEXT_SECONDARY, fontFamily: BRAND.FONT_BODY,
    }).setOrigin(0.5);

    // Fetch entries
    bridge.getLeaderboardEntries(10).then((entries) => {
      loading.destroy();
      if (entries.length === 0) {
        this.add.text(w / 2, 300, 'Рейтинг пока пуст', {
          fontSize: '20px', color: BRAND.TEXT_SECONDARY, fontFamily: BRAND.FONT_BODY,
        }).setOrigin(0.5);
      } else {
        this.renderEntries(entries);
      }
    }).catch(() => {
      loading.setText('Не удалось загрузить');
    });

    // Back button
    const btnY = GAME.HEIGHT - 60;
    const btn = this.add.rectangle(w / 2, btnY, 200, 52, 0xede0c4).setStrokeStyle(2, 0x8a6420);
    btn.setInteractive({ useHandCursor: true });
    this.add.text(w / 2, btnY, 'Назад', {
      fontSize: '20px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_BODY, fontStyle: 'bold',
    }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(0xe8c47a));
    btn.on('pointerout', () => btn.setFillStyle(0xede0c4));
    btn.on('pointerup', () => this.scene.start(data.returnTo || 'Menu'));
  }

  private renderEntries(entries: LeaderboardEntry[]): void {
    const w = GAME.WIDTH;
    const startY = 90;
    const rowH = 44;

    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      const y = startY + i * rowH;

      // Alternating row bg + player highlight
      if (e.isPlayer) {
        this.add.rectangle(w / 2, y + rowH / 2, w - 40, rowH, 0xd4a24c, 0.25);
      } else if (i % 2 === 0) {
        this.add.rectangle(w / 2, y + rowH / 2, w - 40, rowH, 0xede0c4, 0.5);
      }

      const prefix = e.isPlayer ? '\u2605' : ' ';
      const rankText = `${prefix}${e.rank}.`;
      const style = e.isPlayer ? 'bold' : '';

      this.add.text(40, y + rowH / 2, rankText, {
        fontSize: '18px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_BODY, fontStyle: style,
      }).setOrigin(0, 0.5);

      this.add.text(90, y + rowH / 2, e.name, {
        fontSize: '18px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_BODY, fontStyle: style,
      }).setOrigin(0, 0.5);

      this.add.text(w - 40, y + rowH / 2, String(e.score), {
        fontSize: '18px', color: e.isPlayer ? '#D4A24C' : BRAND.TEXT_SECONDARY,
        fontFamily: BRAND.FONT_BODY, fontStyle: style,
      }).setOrigin(1, 0.5);
    }
  }
}
