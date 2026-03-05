/**
 * Module: LuckySpinScene
 * Role: Animated wheel display, spin button, reward popup
 * Uses: SpinRewardManager, config/GameConfig (SPIN, BRAND), sdk/IGamePlatform
 * Used by: MenuScene (scene transition)
 */
import Phaser from 'phaser';
import { SPIN, BRAND } from '../config/GameConfig';
import type { SpinReward } from '../config/GameConfig';
import type { IPlatformBridge } from '../sdk/IGamePlatform';
import { SpinRewardManager } from '../game/SpinRewardManager';

export class LuckySpinScene extends Phaser.Scene {
  private mgr!: SpinRewardManager;
  private bridge!: IPlatformBridge;
  private wheel!: Phaser.GameObjects.Container;
  private spinning = false;
  private uiGroup: Phaser.GameObjects.GameObject[] = [];

  constructor() { super('LuckySpin'); }

  create(): void {
    this.bridge = this.registry.get('bridge') as IPlatformBridge;
    this.mgr = new SpinRewardManager();
    this.spinning = false; this.uiGroup = [];
    const { width: w } = this.scale;
    this.cameras.main.setBackgroundColor(BRAND.BG_CREAM);
    this.add.text(20, 20, '← Меню', { fontSize: '20px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_BODY })
      .setInteractive({ useHandCursor: true }).on('pointerup', () => this.scene.start('Menu'));
    this.add.text(w / 2, 60, 'Колесо Удачи', { fontSize: '32px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_DISPLAY }).setOrigin(0.5);
    this.drawWheel();
    this.refreshUI();
  }

  private drawWheel(): void {
    const { width: w, height: h } = this.scale;
    const cx = w / 2, cy = h * 0.38, r = 140;
    const segs = SPIN.SEGMENTS, arc = (Math.PI * 2) / segs.length;
    this.wheel = this.add.container(cx, cy);
    segs.forEach((seg, i) => {
      const a = i * arc - Math.PI / 2, g = this.add.graphics();
      g.fillStyle(seg.color, 1); g.slice(0, 0, r, a, a + arc, false); g.fillPath();
      g.lineStyle(2, 0x3D2B1F, 0.3); g.strokePath(); this.wheel.add(g);
      const la = a + arc / 2, lr = r * 0.65;
      this.wheel.add(this.add.text(Math.cos(la) * lr, Math.sin(la) * lr, seg.label,
        { fontFamily: BRAND.FONT_BODY, fontSize: '18px', color: '#3D2B1F', align: 'center' },
      ).setOrigin(0.5).setAngle(Phaser.Math.RadToDeg(la) + 90));
    });
    this.add.triangle(cx, cy - r - 15, 0, 0, -12, -20, 12, -20, 0xC44832).setDepth(10);
  }

  private refreshUI(): void {
    this.uiGroup.forEach(o => o.destroy()); this.uiGroup = [];
    const { width: w, height: h } = this.scale, y = h * 0.68;
    if (this.mgr.canFreeSpin()) this.addBtn(w / 2, y, 'Крутить!', 0xd4a24c, () => this.doSpin(true), true);
    else if (this.mgr.canAdSpin()) this.addBtn(w / 2, y, 'За рекламу +1', 0xede0c4, () => this.adSpin(), false);
    else this.ui(this.add.text(w / 2, y, 'Приходи завтра!', { fontSize: '22px', color: BRAND.TEXT_SECONDARY, fontFamily: BRAND.FONT_BODY }).setOrigin(0.5));
    const bonus = this.mgr.getPendingBonus();
    if (bonus) {
      const lbl = bonus.type === 'score_multiplier' ? `Бонус: ×${bonus.value}` : `Бонус: +${bonus.value}`;
      this.ui(this.add.text(w / 2, h * 0.78, lbl, { fontSize: '18px', color: '#4A7A30', fontFamily: BRAND.FONT_BODY, fontStyle: 'bold' }).setOrigin(0.5));
    }
  }

  private addBtn(x: number, y: number, label: string, color: number, fn: () => void, pulse: boolean): void {
    const r = this.add.rectangle(x, y, 220, 52, color).setStrokeStyle(2, 0x8a6420).setInteractive({ useHandCursor: true });
    const t = this.add.text(x, y, label, { fontSize: '20px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_BODY, fontStyle: 'bold' }).setOrigin(0.5);
    r.on('pointerover', () => r.setFillStyle(0xe8c47a)); r.on('pointerout', () => r.setFillStyle(color));
    r.on('pointerdown', () => r.setScale(0.95)); r.on('pointerup', () => { r.setScale(1); fn(); });
    if (pulse) this.tweens.add({ targets: r, scaleX: 1.05, scaleY: 1.05, duration: 500, yoyo: true, repeat: -1 });
    this.uiGroup.push(r, t);
  }

  private ui(obj: Phaser.GameObjects.GameObject): void { this.uiGroup.push(obj); }

  private async adSpin(): Promise<void> {
    try { if ((await this.bridge.showRewarded()).rewarded) { this.doSpin(false); return; } } catch { /* ok */ }
    const e = this.add.text(this.scale.width / 2, 100, 'Реклама недоступна', { fontSize: '16px', color: '#C44832', fontFamily: BRAND.FONT_BODY }).setOrigin(0.5).setDepth(20);
    this.time.delayedCall(2000, () => this.tweens.add({ targets: e, alpha: 0, duration: 300, onComplete: () => e.destroy() }));
  }

  private doSpin(isFree: boolean): void {
    if (this.spinning) return; this.spinning = true;
    const reward = this.mgr.spin(isFree), idx = this.mgr.getSegmentIndex(reward);
    const slice = 360 / SPIN.SEGMENTS.length, target = 270 - (idx * slice + slice / 2);
    const rots = Phaser.Math.Between(SPIN.MIN_ROTATIONS, SPIN.MAX_ROTATIONS) * 360;
    this.tweens.add({ targets: this.wheel, angle: rots + target, duration: SPIN.SPIN_DURATION_MS, ease: 'Cubic.easeOut',
      onComplete: () => { this.spinning = false; this.showReward(reward); } });
  }

  private showReward(reward: SpinReward): void {
    const { width: w, height: h } = this.scale;
    const ov = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.5).setInteractive().setDepth(30);
    const msg = reward.type === 'extra_spin' ? 'Ещё один спин!'
      : reward.type === 'score_multiplier' ? `×${reward.value} очков\nв следующей игре!` : `+${reward.value} очков\nв следующей игре!`;
    const t = this.add.text(w / 2, h * 0.4, msg, { fontFamily: BRAND.FONT_DISPLAY, fontSize: '28px', color: '#FFD700', align: 'center' }).setOrigin(0.5).setDepth(31).setScale(0);
    this.tweens.add({ targets: t, scale: 1, duration: 300, ease: 'Back.easeOut' });
    const cleanup = () => { ov.destroy(); t.destroy(); };
    if (reward.type === 'extra_spin') this.time.delayedCall(800, () => { cleanup(); this.doSpin(true); });
    else this.time.delayedCall(1500, () => { cleanup(); this.refreshUI(); });
  }
}
