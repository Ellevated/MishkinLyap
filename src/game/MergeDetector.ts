/**
 * Module: MergeDetector
 * Role: Listens for Matter.js collisions, validates merge conditions (5-guard), emits merge events
 * Uses: config/GameConfig (ANIMALS), config/GameEvents (EVENTS), objects/Animal
 * Used by: scenes/GameScene (creates and wires)
 * Emits: EVENTS.ANIMAL_MERGED { MergeResult }
 * Does NOT: Create or destroy Animals, calculate score, handle input
 */

import Phaser from 'phaser';
import { ANIMALS } from '../config/GameConfig';
import { EVENTS } from '../config/GameEvents';
import { Animal } from '../objects/Animal';

export interface MergeResult {
  removedA: Animal;
  removedB: Animal;
  newTier: number;
  mergeX: number;
  mergeY: number;
  scoreAwarded: number;
  isFinalTier: boolean;
}

const MAX_TIER = 8;

export class MergeDetector {
  private scene: Phaser.Scene;
  private enabled = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.scene.matter.world.on(
      'collisionstart',
      this.onCollision,
      this,
    );
  }

  /** Start listening for collisions */
  enable(): void {
    this.enabled = true;
  }

  /** Stop listening (during game over, ads) */
  disable(): void {
    this.enabled = false;
  }

  private onCollision(
    event: Phaser.Physics.Matter.Events.CollisionStartEvent,
  ): void {
    if (!this.enabled) return;

    for (const pair of event.pairs) {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      const animalA = (bodyA as any).gameObject as Animal | undefined;
      const animalB = (bodyB as any).gameObject as Animal | undefined;

      if (this.shouldMerge(bodyA, bodyB, animalA, animalB)) {
        this.executeMerge(animalA!, animalB!);
      }
    }
  }

  /**
   * 5-Guard Pattern (INVARIANT — most critical code in the game)
   * All 5 guards must pass for a merge to occur.
   */
  private shouldMerge(
    bodyA: MatterJS.BodyType,
    bodyB: MatterJS.BodyType,
    animalA: Animal | undefined,
    animalB: Animal | undefined,
  ): boolean {
    // Guard 1: Both bodies are Animals (not walls)
    if (bodyA.label !== 'animal' || bodyB.label !== 'animal') return false;
    if (!animalA || !animalB) return false;

    // Guard 2: Both have the same tier
    if (animalA.tier !== animalB.tier) return false;

    // Guard 3: Neither has isMerging === true
    if (animalA.isMerging || animalB.isMerging) return false;

    // Guard 4: Neither tier is 8 (Bear, final)
    if (animalA.tier >= MAX_TIER) return false;

    // Guard 5: Both have isSettled === true
    if (!animalA.isSettled || !animalB.isSettled) return false;

    return true;
  }

  private executeMerge(animalA: Animal, animalB: Animal): void {
    // Set isMerging FIRST to prevent double-merge
    animalA.isMerging = true;
    animalB.isMerging = true;

    const newTier = animalA.tier + 1;
    const mergeX = (animalA.body.position.x + animalB.body.position.x) / 2;
    const mergeY = (animalA.body.position.y + animalB.body.position.y) / 2;
    const scoreAwarded = ANIMALS[newTier - 1]?.score ?? 0;

    const result: MergeResult = {
      removedA: animalA,
      removedB: animalB,
      newTier,
      mergeX,
      mergeY,
      scoreAwarded,
      isFinalTier: newTier >= MAX_TIER,
    };

    this.scene.events.emit(EVENTS.ANIMAL_MERGED, result);
  }

  destroy(): void {
    this.scene.matter.world.off('collisionstart', this.onCollision, this);
  }
}
