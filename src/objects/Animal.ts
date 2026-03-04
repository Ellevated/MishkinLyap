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

// Fallback colors for placeholder circles (FTR-006 will replace with sprites)
const TIER_COLORS: readonly number[] = [
  0xffd93d, // 1: hamster — yellow
  0xff8fa3, // 2: rabbit — pink
  0xb5838d, // 3: kitten — mauve
  0x6d6875, // 4: cat — grey
  0xa2d2ff, // 5: dog — blue
  0xff6b35, // 6: fox — orange
  0x2b2d42, // 7: panda — dark
  0x8b4513, // 8: bear — brown
];

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
    const color = TIER_COLORS[tier - 1] ?? 0xffffff;

    // Visual: colored circle placeholder
    const circle = scene.add.circle(0, 0, radius, color);
    circle.setStrokeStyle(2, 0xffffff, 0.5);
    this.add(circle);

    // Tier label
    const label = scene.add.text(0, 0, String(tier), {
      fontSize: `${Math.max(16, radius * 0.6)}px`,
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(label);

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
