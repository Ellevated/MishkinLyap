/**
 * Module: GameScene
 * Role: Pure orchestrator — creates managers, wires events, manages state machine
 * Uses: PhysicsManager, MergeDetector, AnimalSpawner, ScoreManager, InputHandler, GameConfig, GameEvents
 * Used by: MenuScene (scene.start), main.ts (scene list)
 * Emits: EVENTS.GAME_OVER (to self)
 * Does NOT: Detect merges, calculate score, call SDK directly, contain physics constants
 */

import Phaser from 'phaser';
import { GAME, BRAND, ADS, ANIMALS } from '../config/GameConfig';
import { EVENTS } from '../config/GameEvents';
import type { IPlatformBridge } from '../sdk/IGamePlatform';
import { PhysicsManager } from '../game/PhysicsManager';
import { MergeDetector } from '../game/MergeDetector';
import type { MergeResult } from '../game/MergeDetector';
import { AnimalSpawner } from '../game/AnimalSpawner';
import { ScoreManager } from '../game/ScoreManager';
import { InputHandler } from '../game/InputHandler';

type GamePhase = 'playing' | 'frozen' | 'game-over';

export class GameScene extends Phaser.Scene {
  private physicsManager!: PhysicsManager;
  private merge!: MergeDetector;
  private spawner!: AnimalSpawner;
  private score!: ScoreManager;
  private inputHandler!: InputHandler;
  private bridge!: IPlatformBridge;
  private phase: GamePhase = 'playing';
  private scoreText!: Phaser.GameObjects.Text;
  private nextPreview!: Phaser.GameObjects.Image | Phaser.GameObjects.Arc;
  private gameOverLine!: Phaser.GameObjects.Line;
  private dropCooldown = false;
  private gameOverTimer = 0;

  constructor() {
    super('Game');
  }

  create(): void {
    this.bridge = this.registry.get('bridge') as IPlatformBridge;
    this.phase = 'playing';
    this.gameOverTimer = 0;
    this.cameras.main.setBackgroundColor(BRAND.BG_CREAM);

    // Create managers
    this.physicsManager = new PhysicsManager(this);
    this.physicsManager.createWalls();
    this.merge = new MergeDetector(this);
    this.score = new ScoreManager(this);
    this.spawner = new AnimalSpawner(this, this.physicsManager);
    this.inputHandler = new InputHandler(this);

    // Wire events
    this.events.on(EVENTS.DROP_REQUESTED, this.onDropRequested, this);
    this.events.on(EVENTS.ANIMAL_MERGED, this.onMerge, this);
    this.events.on(EVENTS.SCORE_UPDATED, this.onScoreUpdated, this);

    this.merge.enable();
    this.inputHandler.enable();
    this.bridge?.gameplayStart();

    // Visual container walls
    const bounds = this.physicsManager.getContainerBounds();
    this.add.rectangle(
      GAME.CONTAINER_WALL_THICKNESS / 2, (bounds.top + GAME.HEIGHT) / 2,
      GAME.CONTAINER_WALL_THICKNESS, GAME.HEIGHT - bounds.top,
      0xd6c6a9,
    ).setOrigin(0.5);
    this.add.rectangle(
      GAME.WIDTH - GAME.CONTAINER_WALL_THICKNESS / 2, (bounds.top + GAME.HEIGHT) / 2,
      GAME.CONTAINER_WALL_THICKNESS, GAME.HEIGHT - bounds.top,
      0xd6c6a9,
    ).setOrigin(0.5);
    this.add.rectangle(
      GAME.WIDTH / 2, GAME.HEIGHT - GAME.CONTAINER_WALL_THICKNESS / 2,
      GAME.WIDTH, GAME.CONTAINER_WALL_THICKNESS,
      0xd6c6a9,
    ).setOrigin(0.5);

    // UI: score display
    this.scoreText = this.add.text(GAME.WIDTH / 2, 30, '0', {
      fontSize: '48px',
      color: BRAND.TEXT_INK,
      fontFamily: 'Marmelad, sans-serif',
    }).setOrigin(0.5).setDepth(10);

    // UI: game over line
    this.gameOverLine = this.add.line(
      0, 0,
      GAME.CONTAINER_WALL_THICKNESS, GAME.GAME_OVER_LINE_Y,
      GAME.WIDTH - GAME.CONTAINER_WALL_THICKNESS, GAME.GAME_OVER_LINE_Y,
      0xc44832, 0.3,
    ).setOrigin(0).setDepth(10);

    // UI: next preview
    this.updateNextPreview();
  }

  update(_time: number, delta: number): void {
    if (this.phase !== 'playing') return;
    this.checkGameOver(delta);
  }

  private onDropRequested(data: { x: number }): void {
    if (this.phase !== 'playing' || this.dropCooldown) return;

    this.dropCooldown = true;
    this.inputHandler.disable();
    this.spawner.spawnAtDrop(data.x);
    this.updateNextPreview();

    this.time.delayedCall(GAME.DROP_COOLDOWN_MS, () => {
      this.dropCooldown = false;
      if (this.phase === 'playing') {
        this.inputHandler.enable();
      }
    });
  }

  private onMerge(result: MergeResult): void {
    const { mergeX, mergeY } = result;

    // Squash old animals before destroy
    this.tweens.add({
      targets: [result.removedA, result.removedB],
      scaleX: 0,
      scaleY: 0,
      duration: 100,
      ease: 'Power2',
      onComplete: () => {
        this.spawner.destroy(result.removedA);
        this.spawner.destroy(result.removedB);
      },
    });

    // Burst particles at merge point
    this.emitMergeParticles(mergeX, mergeY);

    // Delayed new animal bounce-in
    this.time.delayedCall(120, () => {
      const newAnimal = this.spawner.spawnAtMerge(mergeX, mergeY, result.newTier);
      this.score.addScore(result.scoreAwarded);

      this.tweens.add({
        targets: newAnimal,
        scaleX: { from: 0, to: 1.2 },
        scaleY: { from: 0, to: 1.2 },
        duration: 100,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: newAnimal,
            scaleX: 1,
            scaleY: 1,
            duration: 100,
            ease: 'Power2',
          });
        },
      });
    });
  }

  /** Organic merge particles — leaves, flowers, hearts in brand colors */
  private emitMergeParticles(x: number, y: number): void {
    const colors = [0x5a8c3c, 0xd4a24c, 0xc44832]; // forest, ochre, red
    const count = 7;
    for (let i = 0; i < count; i++) {
      const color = colors[i % colors.length];
      const particle = this.add.circle(x, y, Phaser.Math.Between(3, 6), color);
      const angle = (Math.PI * 2 / count) * i;
      const dist = Phaser.Math.Between(30, 60);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 400,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }

  private onScoreUpdated(data: { score: number }): void {
    this.scoreText.setText(String(data.score));
  }

  private checkGameOver(delta: number): void {
    const animals = this.spawner.getAnimals();
    let anyAboveLine = false;

    for (const animal of animals) {
      if (
        animal.isSettled &&
        !animal.isMerging &&
        animal.body.position.y < GAME.GAME_OVER_LINE_Y
      ) {
        anyAboveLine = true;
        break;
      }
    }

    if (anyAboveLine) {
      this.gameOverTimer += delta;
      if (this.gameOverTimer > 2000) {
        this.triggerGameOver();
      }
    } else {
      this.gameOverTimer = 0;
    }
  }

  private triggerGameOver(): void {
    this.phase = 'game-over';
    this.inputHandler.disable();
    this.merge.disable();
    this.bridge?.gameplayStop();
    this.score.checkAndSaveBest();

    this.scene.launch('GameOver', {
      score: this.score.getScore(),
      best: this.score.getBestScore(),
    });
    this.scene.pause();
  }

  restartGame(): void {
    this.scene.restart();
  }

  private updateNextPreview(): void {
    if (this.nextPreview) this.nextPreview.destroy();
    const nextTier = this.spawner.peekNextTier();
    const cfg = ANIMALS[nextTier - 1];

    if (this.textures.exists(cfg.key)) {
      this.nextPreview = this.add.image(
        GAME.WIDTH - 50, 50, cfg.key,
      ).setDisplaySize(40, 40).setDepth(10);
    } else {
      this.nextPreview = this.add.circle(
        GAME.WIDTH - 50, 50, 20, cfg.color,
      ).setDepth(10) as any;
    }
  }

  shutdown(): void {
    this.events.off(EVENTS.DROP_REQUESTED, this.onDropRequested, this);
    this.events.off(EVENTS.ANIMAL_MERGED, this.onMerge, this);
    this.events.off(EVENTS.SCORE_UPDATED, this.onScoreUpdated, this);
    this.inputHandler?.destroy();
    this.merge?.destroy();
    this.spawner?.destroyAll();
  }
}
