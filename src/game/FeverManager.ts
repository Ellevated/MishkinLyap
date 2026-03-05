/** FeverManager — visual fever effects during high combo streaks */
import Phaser from 'phaser';
import { FEVER, BRAND } from '../config/GameConfig';
import type { EffectsManager } from './EffectsManager';

export class FeverManager {
  private scene: Phaser.Scene;
  private effects: EffectsManager;
  private active = false;
  private overlay: Phaser.GameObjects.Rectangle | null = null;
  private feverText: Phaser.GameObjects.Text | null = null;

  constructor(scene: Phaser.Scene, effects: EffectsManager) {
    this.scene = scene; this.effects = effects;
  }

  isActive(): boolean { return this.active; }

  activateFever(): void {
    if (this.active) return;
    this.active = true;
    const { width: w, height: h } = this.scene.cameras.main;

    this.overlay = this.scene.add.rectangle(w / 2, h / 2, w, h, FEVER.BG_TINT, 0).setDepth(0);
    this.scene.tweens.add({ targets: this.overlay, alpha: FEVER.BG_ALPHA, duration: 300 });

    this.feverText = this.scene.add.text(w / 2, h * 0.15, 'FEVER!', {
      fontSize: '36px', color: '#FFD700', fontFamily: BRAND.FONT_DISPLAY,
      stroke: '#3D2B1F', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100).setScale(0);
    this.scene.tweens.add({ targets: this.feverText, scale: 1, duration: 300, ease: 'Back.easeOut',
      onComplete: () => {
        if (this.feverText) this.scene.tweens.add({ targets: this.feverText, scale: 1.1, yoyo: true, loop: -1, duration: 500, ease: 'Sine.InOut' });
      },
    });
    this.effects.emitFeverParticles(w / 2, h * 0.3);
  }

  deactivateFever(): void {
    if (!this.active) return;
    this.active = false;
    if (this.overlay) {
      this.scene.tweens.add({ targets: this.overlay, alpha: 0, duration: 500,
        onComplete: () => { this.overlay?.destroy(); this.overlay = null; } });
    }
    if (this.feverText) {
      this.scene.tweens.killTweensOf(this.feverText);
      this.scene.tweens.add({ targets: this.feverText, alpha: 0, scale: 0.5, duration: 300,
        onComplete: () => { this.feverText?.destroy(); this.feverText = null; } });
    }
  }

  destroy(): void { this.deactivateFever(); }
}
