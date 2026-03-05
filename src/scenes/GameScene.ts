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
import { AudioManager } from '../game/AudioManager';
import { ComboTracker } from '../game/ComboTracker';

type GamePhase = 'playing' | 'frozen' | 'game-over';

export class GameScene extends Phaser.Scene {
  private physicsManager!: PhysicsManager;
  private merge!: MergeDetector;
  private spawner!: AnimalSpawner;
  private score!: ScoreManager;
  private inputHandler!: InputHandler;
  private audio!: AudioManager;
  private bridge!: IPlatformBridge;
  private phase: GamePhase = 'playing';
  private scoreText!: Phaser.GameObjects.Text;
  private nextPreview!: Phaser.GameObjects.Image | Phaser.GameObjects.Arc;
  private gameOverLine!: Phaser.GameObjects.Line;
  private dropCooldown = false;
  private gameOverTimer = 0;
  private combo!: ComboTracker;
  private comboText!: Phaser.GameObjects.Text;
  private comboFadeTimer?: Phaser.Time.TimerEvent;
  private displayedScore = 0;

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
    this.audio = new AudioManager();
    this.combo = new ComboTracker();

    // Wire events
    this.events.on(EVENTS.DROP_REQUESTED, this.onDropRequested, this);
    this.events.on(EVENTS.ANIMAL_MERGED, this.onMerge, this);
    this.events.on(EVENTS.SCORE_UPDATED, this.onScoreUpdated, this);

    this.merge.enable();
    this.inputHandler.enable();
    this.audio.startMusic();
    this.bridge?.gameplayStart();

    // Wire shutdown to Phaser lifecycle for proper cleanup on restart
    this.events.once('shutdown', this.shutdown, this);

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
      fontFamily: BRAND.FONT_DISPLAY,
    }).setOrigin(0.5).setDepth(10);

    // UI: combo counter (hidden by default)
    this.comboText = this.add.text(GAME.WIDTH / 2 + 80, 30, '', {
      fontSize: '32px',
      color: '#D4A24C',
      fontFamily: BRAND.FONT_DISPLAY,
    }).setOrigin(0.5).setDepth(10).setAlpha(0);

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
    this.audio.playDrop();
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

    // Combo tracking + escalating pitch audio (A1)
    const comboCount = this.combo.registerMerge();
    const multiplier = this.combo.getMultiplier();
    this.audio.playMerge(comboCount);
    this.updateComboUI(comboCount);

    // Squash old animals before destroy
    this.tweens.add({
      targets: [result.removedA, result.removedB],
      scaleX: 0,
      scaleY: 0,
      duration: 100,
      ease: 'Power2',
      onComplete: () => {
        try { this.spawner.destroy(result.removedA); } catch { /* already destroyed */ }
        try { this.spawner.destroy(result.removedB); } catch { /* already destroyed */ }
      },
    });

    // Burst particles at merge point (escalate by combo)
    this.emitMergeParticles(mergeX, mergeY, comboCount);

    // White flash on merge
    const flash = this.add.circle(mergeX, mergeY, 20, 0xffffff, 0.8).setDepth(15);
    this.tweens.add({
      targets: flash, scaleX: 2, scaleY: 2, alpha: 0, duration: 100,
      onComplete: () => flash.destroy(),
    });

    // Floating score number at merge point (with multiplier)
    const finalScore = Math.round(result.scoreAwarded * multiplier);
    const label = multiplier > 1 ? `+${finalScore} x${multiplier}` : `+${finalScore}`;
    const floatText = this.add.text(mergeX, mergeY, label, {
      fontSize: '24px', color: '#D4A24C', fontFamily: BRAND.FONT_DISPLAY,
      stroke: '#3D2B1F', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(15);
    this.tweens.add({
      targets: floatText, y: mergeY - 60, alpha: 0, duration: 800, ease: 'Power2',
      onComplete: () => floatText.destroy(),
    });

    // Delayed new animal bounce-in
    this.time.delayedCall(120, () => {
      const newAnimal = this.spawner.spawnAtMerge(mergeX, mergeY, result.newTier);
      this.score.addScore(finalScore);

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

  /** Organic merge particles — escalate by combo level */
  private emitMergeParticles(x: number, y: number, combo = 1): void {
    const colors = combo >= 4
      ? [0xd4a24c, 0xf0b832, 0xe8c47a] // gold sparkles for high combo
      : [0x5a8c3c, 0xd4a24c, 0xc44832]; // forest, ochre, red
    const count = Math.min(7 + (combo - 1) * 3, 18);
    for (let i = 0; i < count; i++) {
      const color = colors[i % colors.length];
      const baseSize = Math.min(3 + combo, 8);
      const particle = this.add.circle(x, y, Phaser.Math.Between(baseSize - 1, baseSize + 2), color);
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
    const from = this.displayedScore;
    const to = data.score;
    this.displayedScore = to;

    // Animated count-up
    this.tweens.addCounter({
      from, to, duration: 300, ease: 'Power2',
      onUpdate: (tween) => {
        this.scoreText.setText(String(Math.round(tween.getValue() ?? to)));
      },
    });

    // Scale pulse
    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.15, scaleY: 1.15, duration: 100, yoyo: true, ease: 'Power2',
    });

    // Color flash for big scores
    if (to - from > 20) {
      this.scoreText.setColor('#D4A24C');
      this.time.delayedCall(200, () => this.scoreText.setColor(BRAND.TEXT_INK));
    }
  }

  private updateComboUI(count: number): void {
    if (count < 2) {
      this.comboText.setAlpha(0);
      return;
    }
    // Show combo text with color escalation
    const colors = ['#D4A24C', '#E88C28', '#C44832', '#C03228'];
    const colorIdx = Math.min(count - 2, colors.length - 1);
    this.comboText.setText(`x${Math.min(count, 5)}${count > 5 ? '+' : ''}`);
    this.comboText.setColor(colors[colorIdx]);
    this.comboText.setAlpha(1);
    // Scale pulse
    this.tweens.add({
      targets: this.comboText,
      scaleX: 1.3, scaleY: 1.3, duration: 80, yoyo: true, ease: 'Power2',
    });
    // Fade out after combo window
    if (this.comboFadeTimer) this.comboFadeTimer.destroy();
    this.comboFadeTimer = this.time.delayedCall(2200, () => {
      this.tweens.add({
        targets: this.comboText, alpha: 0, duration: 300,
      });
    });
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
    this.audio.playGameOver();
    this.audio.stopMusic();
    this.bridge?.gameplayStop();
    this.score.checkAndSaveBest();

    // Disable input on this scene so GameOverScene overlay can receive clicks
    this.input.enabled = false;

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
    this.audio?.destroy();
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.events.off(EVENTS.DROP_REQUESTED, this.onDropRequested, this);
    this.events.off(EVENTS.ANIMAL_MERGED, this.onMerge, this);
    this.events.off(EVENTS.SCORE_UPDATED, this.onScoreUpdated, this);
    this.inputHandler?.destroy();
    this.merge?.destroy();
    this.spawner?.destroyAll();
  }
}
