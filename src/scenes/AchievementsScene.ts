/**
 * Module: AchievementsScene
 * Role: Displays achievement grid with locked/unlocked states and progress
 * Uses: config/GameConfig (BRAND, GAME, ACHIEVEMENTS), game/AchievementManager
 * Used by: MenuScene (navigation)
 */
import Phaser from 'phaser';
import { BRAND, GAME } from '../config/GameConfig';
import { AchievementManager } from '../game/AchievementManager';

export class AchievementsScene extends Phaser.Scene {
  constructor() { super('Achievements'); }

  create(): void {
    const w = GAME.WIDTH;
    this.cameras.main.setBackgroundColor(BRAND.BG_CREAM);
    const mgr = new AchievementManager();
    const achs = mgr.getAchievements();
    const stats = mgr.getStats();
    const unlockedCount = achs.filter(a => a.unlocked).length;

    this.add.text(w / 2, 30, 'Награды', {
      fontSize: '36px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_DISPLAY,
    }).setOrigin(0.5);
    this.add.text(w / 2, 65, `${unlockedCount} / ${achs.length} 🏅`, {
      fontSize: '20px', color: BRAND.TEXT_SECONDARY, fontFamily: BRAND.FONT_BODY,
    }).setOrigin(0.5);

    let y = 100;
    for (const a of achs) {
      const alpha = a.unlocked ? 1 : 0.4;
      const mark = a.unlocked ? ' \u2713' : ' \uD83D\uDD12';
      const nameColor = a.unlocked ? BRAND.TEXT_INK : BRAND.TEXT_SECONDARY;

      this.add.text(30, y, a.icon, { fontSize: '24px' }).setOrigin(0, 0.5).setAlpha(alpha);
      this.add.text(65, y, `${a.name}${mark}`, {
        fontSize: '18px', color: nameColor, fontFamily: BRAND.FONT_BODY, fontStyle: a.unlocked ? 'bold' : '',
      }).setOrigin(0, 0.5);

      y += 22;
      this.add.text(65, y, a.description, {
        fontSize: '14px', color: BRAND.TEXT_SECONDARY, fontFamily: BRAND.FONT_BODY,
      }).setOrigin(0, 0.5);

      // Progress bar for locked achievements
      if (!a.unlocked && a.progress && a.target) {
        y += 18;
        const barX = 65; const barW = 200; const barH = 10;
        this.add.rectangle(barX + barW / 2, y, barW, barH, 0xd6c6a9).setOrigin(0.5);
        const current = a.progress(stats);
        const ratio = Math.min(current / a.target, 1);
        if (ratio > 0) {
          this.add.rectangle(barX + (barW * ratio) / 2, y, barW * ratio, barH, 0xd4a24c).setOrigin(0.5);
        }
        this.add.text(barX + barW + 10, y, `${current}/${a.target}`, {
          fontSize: '12px', color: BRAND.TEXT_SECONDARY, fontFamily: BRAND.FONT_BODY,
        }).setOrigin(0, 0.5);
      }
      y += 28;
    }

    // Back button
    const btnY = GAME.HEIGHT - 60;
    const btn = this.add.rectangle(w / 2, btnY, 200, 52, 0xede0c4).setStrokeStyle(2, 0x8a6420);
    btn.setInteractive({ useHandCursor: true });
    this.add.text(w / 2, btnY, 'Назад', {
      fontSize: '20px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_BODY, fontStyle: 'bold',
    }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(0xe8c47a));
    btn.on('pointerout', () => btn.setFillStyle(0xede0c4));
    btn.on('pointerup', () => this.scene.start('Menu'));
  }
}
