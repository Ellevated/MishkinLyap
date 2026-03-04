/**
 * Module: Animal
 * Role: Game entity — Phaser Container wrapping Matter.js circle body with tier data
 * Uses: config/GameConfig (ANIMALS, AnimalConfig)
 * Used by: game/AnimalSpawner (creates), game/MergeDetector (reads tier + flags)
 * Does NOT: Manage own lifecycle, detect merges, calculate score
 */

import Phaser from 'phaser';
import { ANIMALS, PHYSICS } from '../config/GameConfig';
import type { AnimalConfig } from '../config/GameConfig';

const SETTLED_VELOCITY_THRESHOLD = 0.3;

export class Animal extends Phaser.GameObjects.Container {
  public readonly tier: number;
  public readonly config: AnimalConfig;
  public isMerging = false;
  public isSettled = false;
  public body!: MatterJS.BodyType;

  constructor(scene: Phaser.Scene, x: number, y: number, tier: number) {
    super(scene, x, y);

    this.tier = tier;
    this.config = ANIMALS[tier - 1];
    const radius = this.config.radius;
    // Visual: sprite if loaded, fallback to colored circle
    if (scene.textures.exists(this.config.key)) {
      const sprite = scene.add.image(0, 0, this.config.key);
      sprite.setDisplaySize(radius * 2, radius * 2);
      this.add(sprite);
    } else {
      const circle = scene.add.circle(0, 0, radius, this.config.color);
      circle.setStrokeStyle(2, 0x3d2b1f, 0.3);
      this.add(circle);
      const label = scene.add.text(0, 0, String(tier), {
        fontSize: `${Math.max(16, radius * 0.6)}px`,
        color: '#3D2B1F',
        fontFamily: 'Marmelad, sans-serif',
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
  }

  private syncPosition(): void {
    if (!this.body) return;
    this.setPosition(this.body.position.x, this.body.position.y);

    // Check settled state
    if (!this.isSettled && !this.isMerging) {
      const vx = this.body.velocity.x;
      const vy = this.body.velocity.y;
      const speed = Math.sqrt(vx * vx + vy * vy);
      if (speed < SETTLED_VELOCITY_THRESHOLD) {
        this.isSettled = true;
      }
    }
  }

  destroyAnimal(): void {
    this.scene?.events.off('update', this.syncPosition, this);
    if (this.body) {
      this.scene?.matter.world.remove(this.body);
    }
    this.destroy();
  }
}
