/**
 * Module: TutorialManager
 * Role: 3-step tutorial on first launch + stuck hints
 * Uses: config/GameConfig (TUTORIAL, BRAND), ScoreManager (persistence)
 * Used by: GameScene (created in create(), events wired)
 * Does NOT: Modify physics, manage score, control spawning
 */

import Phaser from 'phaser';
import { TUTORIAL, BRAND } from '../config/GameConfig';
import { ScoreManager } from './ScoreManager';

export class TutorialManager {
  private scene: Phaser.Scene;
  private scoreMgr: ScoreManager;
  private completed: boolean;
  private currentStep = 0;
  private stuckTimer = 0;
  private hintText: Phaser.GameObjects.Text | null = null;
  private hintBg: Phaser.GameObjects.Rectangle | null = null;

  constructor(scene: Phaser.Scene, scoreMgr: ScoreManager) {
    this.scene = scene;
    this.scoreMgr = scoreMgr;
    const data = scoreMgr.loadData();
    this.completed = data.tutorialDone;
    if (!this.completed) this.showCurrentHint();
  }

  isActive(): boolean { return !this.completed; }

  onDrop(): void {
    this.stuckTimer = 0;
    if (this.currentStep === 0) this.advanceStep();
  }

  onMerge(): void {
    this.stuckTimer = 0;
    if (this.currentStep === 1) this.advanceStep();
  }

  onScoreReached(score: number): void {
    if (this.currentStep === 2 && score >= 200) this.advanceStep();
  }

  checkStuck(delta: number): void {
    if (this.completed) return;
    this.stuckTimer += delta;
    if (this.stuckTimer >= TUTORIAL.STUCK_THRESHOLD_MS) {
      this.showCurrentHint();
      this.stuckTimer = 0;
    }
  }

  private advanceStep(): void {
    this.hideHint();
    this.currentStep++;
    if (this.currentStep >= TUTORIAL.STEPS.length) {
      this.completed = true;
      const data = this.scoreMgr.loadData();
      data.tutorialDone = true;
      this.scoreMgr.saveData(data);
    } else {
      this.scene.time.delayedCall(500, () => this.showCurrentHint());
    }
  }

  private showCurrentHint(): void {
    if (this.completed || this.currentStep >= TUTORIAL.STEPS.length) return;
    this.hideHint();
    const w = this.scene.scale.width;
    const y = this.scene.scale.height * 0.25;
    const step = TUTORIAL.STEPS[this.currentStep];
    this.hintBg = this.scene.add.rectangle(w / 2, y, w * 0.8, 50, 0x3d2b1f, 0.85).setDepth(100).setAlpha(0);
    this.hintText = this.scene.add.text(w / 2, y, step.hint, {
      fontFamily: BRAND.FONT_BODY, fontSize: '20px', color: '#FFFFFF', align: 'center',
    }).setOrigin(0.5).setDepth(101).setAlpha(0);
    this.scene.tweens.add({ targets: [this.hintBg, this.hintText], alpha: 1, duration: TUTORIAL.HINT_FADE_MS });
  }

  private hideHint(): void {
    if (!this.hintText) return;
    const bg = this.hintBg, txt = this.hintText;
    this.hintText = null; this.hintBg = null;
    this.scene.tweens.add({ targets: [bg, txt], alpha: 0, duration: TUTORIAL.HINT_FADE_MS,
      onComplete: () => { bg?.destroy(); txt?.destroy(); },
    });
  }

  destroy(): void { this.hintText?.destroy(); this.hintBg?.destroy(); }
}
