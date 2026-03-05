/**
 * Module: Animal
 * Role: Game entity — Phaser Container wrapping Matter.js circle body with tier data
 * Uses: config/GameConfig (ANIMALS, AnimalConfig)
 * Used by: game/AnimalSpawner (creates), game/MergeDetector (reads tier + flags)
 * Does NOT: Manage own lifecycle, detect merges, calculate score
 */

import Phaser from 'phaser';
import { ANIMALS, PHYSICS, BRAND, JUICE } from '../config/GameConfig';
import type { AnimalConfig } from '../config/GameConfig';

const SETTLED_VELOCITY_THRESHOLD = 0.3;

export class Animal extends Phaser.GameObjects.Container {
  public readonly tier: number;
  public readonly config: AnimalConfig;
  public isMerging = false;
  public isSettled = false;
  public body!: MatterJS.BodyType;
  private wasSettled = false;
  private landTweenDone = false;
  private sprite: Phaser.GameObjects.Image | null = null;
  private baseFactor = 1;
  private idleTween?: Phaser.Tweens.Tween;
  private swayTween?: Phaser.Tweens.Tween;
  private glowFx: any = null;

  constructor(scene: Phaser.Scene, x: number, y: number, tier: number) {
    super(scene, x, y);

    this.tier = tier;
    this.config = ANIMALS[tier - 1];
    const radius = this.config.radius;
    // Visual: sprite if loaded, fallback to colored circle
    if (scene.textures.exists(this.config.key)) {
      this.sprite = scene.add.image(0, 0, this.config.key);
      const maxDim = Math.max(this.sprite.frame.width, this.sprite.frame.height);
      this.baseFactor = (radius * 2) / maxDim;
      this.sprite.setScale(this.baseFactor);
      this.add(this.sprite);
    } else {
      const circle = scene.add.circle(0, 0, radius, this.config.color);
      circle.setStrokeStyle(2, 0x3d2b1f, 0.3);
      this.add(circle);
      const label = scene.add.text(0, 0, String(tier), {
        fontSize: `${Math.max(16, radius * 0.6)}px`,
        color: '#3D2B1F',
        fontFamily: BRAND.FONT_DISPLAY,
        fontStyle: 'bold',
      }).setOrigin(0.5);
      this.add(label);
    }

    scene.add.existing(this);

    // Matter.js circle body
    const body = scene.matter.add.circle(x, y, radius, {
      restitution: PHYSICS.RESTITUTION,
      friction: PHYSICS.FRICTION,
      frictionAir: PHYSICS.FRICTION_AIR,
      label: 'animal',
    });

    // Link body ↔ Animal
    (body as any).gameObject = this;
    this.body = body;

    // Sync visual to body position
    scene.events.on('update', this.syncPosition, this);

    // Stretch tween on drop (squash → stretch during fall)
    this.setScale(1.1, 0.9);
    scene.tweens.add({
      targets: this,
      scaleX: 0.95,
      scaleY: 1.05,
      duration: 200,
      ease: 'Sine.easeInOut',
    });
  }

  private syncPosition(): void {
    if (!this.body) return;
    this.setPosition(this.body.position.x, this.body.position.y);

    // Continuously track settled state — must reset when animal gets bumped
    if (!this.isMerging) {
      const vx = this.body.velocity.x;
      const vy = this.body.velocity.y;
      const speed = Math.sqrt(vx * vx + vy * vy);
      this.isSettled = speed < SETTLED_VELOCITY_THRESHOLD;

      // Squash on landing (settled transition false→true)
      if (this.isSettled && !this.wasSettled && !this.landTweenDone) {
        this.landTweenDone = true;
        this.scene?.tweens?.add({
          targets: this, scaleX: 1.2, scaleY: 0.8, duration: 80, ease: 'Power2',
          onComplete: () => {
            this.scene?.tweens?.add({
              targets: this, scaleX: 1, scaleY: 1, duration: 150, ease: 'Back.easeOut',
            });
          },
        });
      }
      // Idle animations on settle/unsettle
      if (this.isSettled && !this.wasSettled) {
        this.scene?.time?.delayedCall(300, () => { if (this.isSettled && this.active) this.startIdle(); });
      } else if (!this.isSettled && this.wasSettled) {
        this.stopIdle();
      }
      this.wasSettled = this.isSettled;
    }
  }

  private startIdle(): void {
    if (!this.sprite || this.idleTween) return;
    const s = this.sprite, bf = this.baseFactor;
    this.idleTween = this.scene?.tweens?.add({
      targets: s, scaleX: bf * 1.04, scaleY: bf * 0.97, duration: 1200 + Math.random() * 400,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    this.swayTween = this.scene?.tweens?.add({
      targets: s, angle: { from: -1.7, to: 1.7 }, duration: 2000 + Math.random() * 600,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  private stopIdle(): void {
    this.idleTween?.stop(); this.idleTween = undefined;
    this.swayTween?.stop(); this.swayTween = undefined;
    if (this.sprite && this.active) { this.sprite.setScale(this.baseFactor); this.sprite.setAngle(0); }
  }

  setGlow(): void {
    if (!this.sprite || this.glowFx) return;
    this.glowFx = this.sprite.postFX?.addGlow(JUICE.GLOW_COLOR, JUICE.GLOW_OUTER_STRENGTH, 0, false, 0.1);
    if (this.glowFx) {
      this.scene.tweens.add({ targets: this.glowFx, outerStrength: JUICE.GLOW_PULSE_MAX, yoyo: true, loop: -1, ease: 'Sine.InOut', duration: JUICE.GLOW_PULSE_DURATION });
    }
  }

  clearGlow(): void {
    if (!this.glowFx || !this.sprite) return;
    this.scene?.tweens?.killTweensOf(this.glowFx);
    this.sprite.postFX?.remove(this.glowFx);
    this.glowFx = null;
  }

  destroy(fromScene?: boolean): void {
    this.clearGlow();
    this.stopIdle();
    this.scene?.events?.off('update', this.syncPosition, this);
    (this as any).body = null;
    super.destroy(fromScene);
  }

  setSkinTint(tint: number): void { if (tint && this.sprite) this.sprite.setTint(tint); }
  clearSkinTint(): void { this.sprite?.clearTint(); }

  /** Pulse highlight to suggest merge possibility */
  showMergeHint(): void {
    this.scene?.tweens?.add({ targets: this, alpha: 0.5, duration: 300, yoyo: true, repeat: 2 });
  }

  destroyAnimal(): void {
    this.destroy();
  }
}
