/**
 * Module: PhysicsManager
 * Role: Manages Matter.js world — creates container walls, adds/removes bodies
 * Uses: config/GameConfig (PHYSICS, GAME constants)
 * Used by: scenes/GameScene (creates in create())
 * Does NOT: Detect merges, create Animals, handle input
 */

import Phaser from 'phaser';
import { GAME, PHYSICS } from '../config/GameConfig';

export class PhysicsManager {
  private scene: Phaser.Scene;
  private trackedBodies: Set<MatterJS.BodyType> = new Set();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Create container walls: left, right, bottom as static rectangles */
  createWalls(): void {
    const { WIDTH, HEIGHT, CONTAINER_WALL_THICKNESS, CONTAINER_TOP_Y } = GAME;
    const wallHeight = HEIGHT - CONTAINER_TOP_Y;
    const halfThick = CONTAINER_WALL_THICKNESS / 2;

    // Left wall
    this.scene.matter.add.rectangle(
      halfThick,
      CONTAINER_TOP_Y + wallHeight / 2,
      CONTAINER_WALL_THICKNESS,
      wallHeight,
      { isStatic: true, label: 'wall', friction: 0.1 },
    );

    // Right wall
    this.scene.matter.add.rectangle(
      WIDTH - halfThick,
      CONTAINER_TOP_Y + wallHeight / 2,
      CONTAINER_WALL_THICKNESS,
      wallHeight,
      { isStatic: true, label: 'wall', friction: 0.1 },
    );

    // Bottom wall
    this.scene.matter.add.rectangle(
      WIDTH / 2,
      HEIGHT - halfThick,
      WIDTH,
      CONTAINER_WALL_THICKNESS,
      { isStatic: true, label: 'wall', friction: PHYSICS.FRICTION },
    );
  }

  /** Add a body to tracked set */
  addBody(body: MatterJS.BodyType): void {
    this.trackedBodies.add(body);
  }

  /** Remove a body from the world and tracked set */
  removeBody(body: MatterJS.BodyType): void {
    this.trackedBodies.delete(body);
    this.scene.matter.world.remove(body);
  }

  /** Get count of tracked (non-wall) bodies */
  getBodyCount(): number {
    return this.trackedBodies.size;
  }

  /** Get inner container bounds (after wall thickness) */
  getContainerBounds(): { left: number; right: number; top: number; bottom: number } {
    return {
      left: GAME.CONTAINER_WALL_THICKNESS,
      right: GAME.WIDTH - GAME.CONTAINER_WALL_THICKNESS,
      top: GAME.CONTAINER_TOP_Y,
      bottom: GAME.HEIGHT - GAME.CONTAINER_WALL_THICKNESS,
    };
  }
}
