/**
 * Module: AnimalSpawner
 * Role: Creates and destroys Animal instances, manages next-drop preview
 * Uses: config/GameConfig (ANIMALS, GAME), objects/Animal, game/PhysicsManager
 * Used by: scenes/GameScene (creates, calls spawn methods)
 * Emits: EVENTS.ANIMAL_DROPPED { animal: Animal }
 * Does NOT: Handle input, detect merges, calculate score
 */

import Phaser from 'phaser';
import { GAME } from '../config/GameConfig';
import { EVENTS } from '../config/GameEvents';
import { Animal } from '../objects/Animal';
import { PhysicsManager } from './PhysicsManager';

export class AnimalSpawner {
  private scene: Phaser.Scene;
  private physics: PhysicsManager;
  private nextTier: number;
  private animals: Set<Animal> = new Set();
  private rngFn: ((min: number, max: number) => number) | null = null;

  constructor(scene: Phaser.Scene, physics: PhysicsManager) {
    this.scene = scene;
    this.physics = physics;
    this.nextTier = this.rollTier();
  }

  /** Create an Animal at drop position with pre-rolled tier */
  spawnAtDrop(x: number): Animal {
    const tier = this.nextTier;
    this.nextTier = this.rollTier();

    const y = GAME.GAME_OVER_LINE_Y + 30;
    const animal = new Animal(this.scene, x, y, tier);
    this.physics.addBody(animal.body);
    this.animals.add(animal);

    this.scene.events.emit(EVENTS.ANIMAL_DROPPED, { animal });
    return animal;
  }

  /** Create an Animal at merge position with specific tier */
  spawnAtMerge(x: number, y: number, tier: number): Animal {
    const animal = new Animal(this.scene, x, y, tier);
    this.physics.addBody(animal.body);
    this.animals.add(animal);
    return animal;
  }

  /** Remove an Animal from scene and physics world */
  destroy(animal: Animal): void {
    this.animals.delete(animal);
    if (animal.body) this.physics.removeBody(animal.body);
    animal.destroyAnimal();
  }

  /** Get the next animal tier for preview display */
  peekNextTier(): number {
    return this.nextTier;
  }

  /** Get all active animals */
  getAnimals(): ReadonlySet<Animal> {
    return this.animals;
  }

  /** Destroy all animals (for game restart) */
  destroyAll(): void {
    for (const animal of this.animals) {
      if (animal.body) this.physics.removeBody(animal.body);
      animal.destroyAnimal();
    }
    this.animals.clear();
  }

  /** Set custom RNG function (for daily challenge deterministic mode) */
  setRngFunction(fn: (min: number, max: number) => number): void {
    this.rngFn = fn;
    this.nextTier = this.rollTier(); // re-roll with new RNG
  }

  /** Roll random tier for next drop (1 to SPAWN_MAX_TIER) */
  private rollTier(): number {
    return this.rngFn ? this.rngFn(1, GAME.SPAWN_MAX_TIER) : Phaser.Math.Between(1, GAME.SPAWN_MAX_TIER);
  }
}
