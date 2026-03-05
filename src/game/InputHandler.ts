/**
 * Module: InputHandler
 * Role: Converts mouse/touch input to drop requests with x position
 * Uses: config/GameConfig (GAME), config/GameEvents (EVENTS)
 * Used by: scenes/GameScene (creates and enables/disables)
 * Emits: EVENTS.DROP_REQUESTED { x: number }
 * Does NOT: Create animals, manage cooldown timer (GameScene does)
 */

import Phaser from 'phaser';
import { GAME } from '../config/GameConfig';
import { EVENTS } from '../config/GameEvents';

export class InputHandler {
  private scene: Phaser.Scene;
  private enabled = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.scene.input.on('pointerdown', this.onPointerDown, this);
  }

  /** Enable input (during normal gameplay) */
  enable(): void {
    this.enabled = true;
  }

  /** Disable input (during cooldown, game over, ads) */
  disable(): void {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.enabled) return;

    const minX = GAME.CONTAINER_WALL_THICKNESS + 10;
    const maxX = GAME.WIDTH - GAME.CONTAINER_WALL_THICKNESS - 10;
    const x = Phaser.Math.Clamp(pointer.x, minX, maxX);

    this.scene.events.emit(EVENTS.DROP_REQUESTED, { x });
  }

  destroy(): void {
    // Input plugin may be null during scene shutdown
    this.scene?.input?.off('pointerdown', this.onPointerDown, this);
  }
}
