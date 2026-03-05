/**
 * Module: MissionsScene
 * Role: Displays daily missions with progress bars
 * Uses: config/GameConfig (BRAND, GAME, MISSIONS, MISSION_POOL), game/MissionTracker
 * Used by: MenuScene (navigation)
 */
import Phaser from 'phaser';
import { BRAND, GAME, MISSIONS, MISSION_POOL } from '../config/GameConfig';
import { MissionTracker } from '../game/MissionTracker';

export class MissionsScene extends Phaser.Scene {
  constructor() { super('Missions'); }

  create(): void {
    const w = GAME.WIDTH;
    this.cameras.main.setBackgroundColor(BRAND.BG_CREAM);

    this.add.text(w / 2, 30, 'Задания', {
      fontSize: '36px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_DISPLAY,
    }).setOrigin(0.5);
    this.add.text(w / 2, 65, 'на сегодня', {
      fontSize: '20px', color: BRAND.TEXT_SECONDARY, fontFamily: BRAND.FONT_BODY,
    }).setOrigin(0.5);

    const tracker = new MissionTracker();
    const missions = tracker.loadOrReset();
    let y = 110;
    let completedCount = 0;

    for (const m of missions) {
      const tpl = MISSION_POOL.find(t => t.id === m.templateId);
      if (!tpl) continue;
      const done = m.completed;
      if (done) completedCount++;

      const icon = done ? '\u2713' : '\u2610';
      const text = tpl.text.replace('{target}', String(tpl.target));
      this.add.text(30, y, `${icon} ${text}`, {
        fontSize: '18px', color: done ? '#4A7A30' : BRAND.TEXT_INK,
        fontFamily: BRAND.FONT_BODY, fontStyle: done ? 'bold' : '',
      }).setOrigin(0, 0.5);
      y += 30;

      // Progress bar
      const barX = 30; const barW = 280; const barH = 14;
      this.add.rectangle(barX + barW / 2, y, barW, barH, 0xd6c6a9).setOrigin(0.5);
      const ratio = Math.min(m.progress / tpl.target, 1);
      if (ratio > 0) {
        const fillColor = done ? 0x4a7a30 : 0xd4a24c;
        this.add.rectangle(barX + (barW * ratio) / 2, y, barW * ratio, barH, fillColor).setOrigin(0.5);
      }

      this.add.text(barX + barW + 15, y, `${Math.min(m.progress, tpl.target)}/${tpl.target}`, {
        fontSize: '14px', color: BRAND.TEXT_SECONDARY, fontFamily: BRAND.FONT_BODY,
      }).setOrigin(0, 0.5);
      y += 45;
    }

    // Summary
    y += 10;
    this.add.line(0, 0, 30, y, w - 30, y, 0xd6c6a9).setOrigin(0);
    y += 20;
    this.add.text(w / 2, y, `Все задания: ${completedCount}/${missions.length}`, {
      fontSize: '18px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_BODY,
    }).setOrigin(0.5);
    y += 28;

    const bonusColor = tracker.isAllCompleted() ? '#4A7A30' : BRAND.TEXT_SECONDARY;
    this.add.text(w / 2, y, `Награда: x${MISSIONS.ALL_COMPLETE_BONUS} к счёту`, {
      fontSize: '16px', color: bonusColor, fontFamily: BRAND.FONT_BODY,
      fontStyle: tracker.isAllCompleted() ? 'bold' : '',
    }).setOrigin(0.5);

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
