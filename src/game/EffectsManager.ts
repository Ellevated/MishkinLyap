/**
 * Module: EffectsManager
 * Role: Visual effects — particles, flash, floating text, toasts
 * Uses: config/GameConfig (BRAND)
 * Used by: GameScene (merge effects, toasts)
 */

import Phaser from 'phaser';
import { BRAND, JUICE } from '../config/GameConfig';

const TOASTS = {
  goodMerge: ['Ого!', 'Здорово!', 'Отлично!', 'Класс!'],
  greatMerge: ['Вот это мердж!', 'Красота!', 'Потрясающе!'],
  maxMerge: ['МЕДВЕДЬ!', 'Невероятно!', 'Легенда!'],
  combo: ['Каскад!', 'Цепочка!', 'Комбо!', 'Серия!'],
  newRecord: ['Новый рекорд!'],
};
const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

export class EffectsManager {
  private scene: Phaser.Scene;
  private toastText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, toastY: number) {
    this.scene = scene;
    this.toastText = scene.add.text(scene.scale.width / 2, toastY, '', {
      fontSize: '28px', color: '#D4A24C', fontFamily: BRAND.FONT_DISPLAY,
    }).setOrigin(0.5).setDepth(10).setAlpha(0);
  }

  /** Merge toast based on tier and combo */
  triggerMergeToast(newTier: number, comboCount: number): void {
    if (newTier >= 8) this.showToast(pick(TOASTS.maxMerge));
    else if (newTier >= 6) this.showToast(pick(TOASTS.greatMerge));
    else if (newTier >= 4) this.showToast(pick(TOASTS.goodMerge));
    else if (comboCount >= 2) this.showToast(pick(TOASTS.combo));
  }

  showNewRecordToast(): void { this.showToast(pick(TOASTS.newRecord)); }

  /** Merge particles — escalate by combo level */
  emitMergeParticles(x: number, y: number, combo = 1): void {
    const colors = combo >= 4
      ? [0xd4a24c, 0xf0b832, 0xe8c47a]
      : [0x5a8c3c, 0xd4a24c, 0xc44832];
    const count = Math.min(7 + (combo - 1) * 3, 18);
    const baseSize = Math.min(3 + combo, 8);
    for (let i = 0; i < count; i++) {
      const particle = this.scene.add.circle(x, y,
        Phaser.Math.Between(baseSize - 1, baseSize + 2), colors[i % colors.length]);
      const angle = (Math.PI * 2 / count) * i;
      const dist = Phaser.Math.Between(30, 60);
      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist,
        alpha: 0, scaleX: 0.3, scaleY: 0.3, duration: 400, ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }

  /** White flash at merge point */
  emitFlash(x: number, y: number): void {
    const flash = this.scene.add.circle(x, y, 20, 0xffffff, 0.8).setDepth(15);
    this.scene.tweens.add({
      targets: flash, scaleX: 2, scaleY: 2, alpha: 0, duration: 100,
      onComplete: () => flash.destroy(),
    });
  }

  /** Floating "+N" score text */
  emitFloatingScore(x: number, y: number, text: string): void {
    const ft = this.scene.add.text(x, y, text, {
      fontSize: '24px', color: '#D4A24C', fontFamily: BRAND.FONT_DISPLAY,
      stroke: '#3D2B1F', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(15);
    this.scene.tweens.add({
      targets: ft, y: y - 60, alpha: 0, duration: 800, ease: 'Power2',
      onComplete: () => ft.destroy(),
    });
  }

  /** Freeze physics for hit-stop effect */
  hitStop(): void {
    const world = (this.scene as any).matter?.world;
    if (!world) return;
    world.pause();
    this.scene.time.delayedCall(JUICE.HIT_STOP_MS, () => world.resume());
  }

  /** Gentle screen shake for impactful merges */
  screenShake(): void {
    this.scene.cameras.main.shake(JUICE.SHAKE_DURATION, JUICE.SHAKE_INTENSITY);
  }

  /** Trail particles following a dropped animal (auto-stops after 600ms) */
  startTrail(target: Phaser.GameObjects.Container): void {
    if (!this.scene.textures.exists('trail_dot')) {
      const g = this.scene.add.graphics();
      g.fillStyle(0xffffff); g.fillCircle(3, 3, 3); g.generateTexture('trail_dot', 6, 6); g.destroy();
    }
    const emitter = this.scene.add.particles(0, 0, 'trail_dot', {
      follow: target, scale: { start: 0.5, end: 0 }, alpha: { start: JUICE.TRAIL_ALPHA, end: 0 },
      lifespan: JUICE.TRAIL_LIFESPAN, frequency: JUICE.TRAIL_FREQUENCY, quantity: 1, tint: 0xD6C6A9,
    });
    emitter.setDepth((target.depth || 0) - 1);
    this.scene.time.delayedCall(600, () => {
      emitter.stop();
      this.scene.time.delayedCall(JUICE.TRAIL_LIFESPAN + 50, () => emitter.destroy());
    });
  }

  private showToast(msg: string): void {
    this.toastText.setText(msg).setAlpha(1).setScale(0);
    this.scene.tweens.add({
      targets: this.toastText,
      scaleX: { from: 0, to: 1.2 }, scaleY: { from: 0, to: 1.2 }, duration: 100,
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.toastText, scaleX: 1, scaleY: 1, duration: 100,
          onComplete: () => {
            this.scene.time.delayedCall(600, () => {
              this.scene.tweens.add({ targets: this.toastText, alpha: 0, duration: 300 });
            });
          },
        });
      },
    });
  }
}
