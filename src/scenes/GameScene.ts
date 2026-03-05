/**
 * Module: GameScene
 * Role: Pure orchestrator — creates managers, wires events, manages state machine
 * Uses: PhysicsManager, MergeDetector, AnimalSpawner, ScoreManager, InputHandler, AudioManager, ComboTracker, EffectsManager
 * Used by: MenuScene (scene.start), main.ts (scene list)
 */

import Phaser from 'phaser';
import { GAME, BRAND, ANIMALS, ADS } from '../config/GameConfig';
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
import { EffectsManager } from '../game/EffectsManager';
import { MissionTracker } from '../game/MissionTracker';

type GamePhase = 'playing' | 'frozen' | 'game-over';

export class GameScene extends Phaser.Scene {
  private physicsManager!: PhysicsManager;
  private merge!: MergeDetector;
  private spawner!: AnimalSpawner;
  private score!: ScoreManager;
  private inputHandler!: InputHandler;
  private audio!: AudioManager;
  private combo!: ComboTracker;
  private effects!: EffectsManager;
  private missionTracker!: MissionTracker;
  private bridge!: IPlatformBridge;
  private phase: GamePhase = 'playing';
  private scoreText!: Phaser.GameObjects.Text;
  private nextPreview!: Phaser.GameObjects.Image | Phaser.GameObjects.Arc;
  private comboText!: Phaser.GameObjects.Text;
  private comboFadeTimer?: Phaser.Time.TimerEvent;
  private dropCooldown = false;
  private gameOverTimer = 0;
  private displayedScore = 0;
  private continuesUsed = 0;
  private sessionStats = { mergeCount: 0, highestTier: 1, isNewRecord: false };

  constructor() { super('Game'); }

  create(): void {
    this.bridge = this.registry.get('bridge') as IPlatformBridge;
    this.phase = 'playing';
    this.gameOverTimer = 0;
    this.displayedScore = 0;
    this.continuesUsed = 0;
    this.sessionStats = { mergeCount: 0, highestTier: 1, isNewRecord: false };
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
    this.effects = new EffectsManager(this, 75);
    this.missionTracker = new MissionTracker();
    this.missionTracker.loadOrReset();

    // Wire events
    this.events.on(EVENTS.DROP_REQUESTED, this.onDropRequested, this);
    this.events.on(EVENTS.ANIMAL_MERGED, this.onMerge, this);
    this.events.on(EVENTS.SCORE_UPDATED, this.onScoreUpdated, this);
    this.merge.enable();
    this.inputHandler.enable();
    this.audio.startMusic();
    this.bridge?.gameplayStart();
    this.events.once('shutdown', this.shutdown, this);

    // Visual container walls
    const bounds = this.physicsManager.getContainerBounds();
    this.add.rectangle(
      GAME.CONTAINER_WALL_THICKNESS / 2, (bounds.top + GAME.HEIGHT) / 2,
      GAME.CONTAINER_WALL_THICKNESS, GAME.HEIGHT - bounds.top, 0xd6c6a9,
    ).setOrigin(0.5);
    this.add.rectangle(
      GAME.WIDTH - GAME.CONTAINER_WALL_THICKNESS / 2, (bounds.top + GAME.HEIGHT) / 2,
      GAME.CONTAINER_WALL_THICKNESS, GAME.HEIGHT - bounds.top, 0xd6c6a9,
    ).setOrigin(0.5);
    this.add.rectangle(
      GAME.WIDTH / 2, GAME.HEIGHT - GAME.CONTAINER_WALL_THICKNESS / 2,
      GAME.WIDTH, GAME.CONTAINER_WALL_THICKNESS, 0xd6c6a9,
    ).setOrigin(0.5);

    // UI
    this.scoreText = this.add.text(GAME.WIDTH / 2, 30, '0', {
      fontSize: '48px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_DISPLAY,
    }).setOrigin(0.5).setDepth(10);

    this.comboText = this.add.text(GAME.WIDTH / 2 + 80, 30, '', {
      fontSize: '32px', color: '#D4A24C', fontFamily: BRAND.FONT_DISPLAY,
    }).setOrigin(0.5).setDepth(10).setAlpha(0);

    this.add.line(0, 0,
      GAME.CONTAINER_WALL_THICKNESS, GAME.GAME_OVER_LINE_Y,
      GAME.WIDTH - GAME.CONTAINER_WALL_THICKNESS, GAME.GAME_OVER_LINE_Y,
      0xc44832, 0.3,
    ).setOrigin(0).setDepth(10);

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
      if (this.phase === 'playing') this.inputHandler.enable();
    });
  }

  private onMerge(result: MergeResult): void {
    const { mergeX, mergeY } = result;
    const comboCount = this.combo.registerMerge();
    const multiplier = this.combo.getMultiplier();
    this.audio.playMerge(comboCount);
    this.updateComboUI(comboCount);

    // Session stats + toasts
    this.sessionStats.mergeCount++;
    if (result.newTier > this.sessionStats.highestTier) this.sessionStats.highestTier = result.newTier;
    this.effects.triggerMergeToast(result.newTier, comboCount);

    // Missions + discover
    this.missionTracker.reportMerge(result.newTier);
    if (comboCount >= 2) this.missionTracker.reportCombo(comboCount);
    this.score.discoverTier(result.newTier);

    // Squash old animals
    this.tweens.add({
      targets: [result.removedA, result.removedB],
      scaleX: 0, scaleY: 0, duration: 100, ease: 'Power2',
      onComplete: () => {
        try { this.spawner.destroy(result.removedA); } catch { /* ok */ }
        try { this.spawner.destroy(result.removedB); } catch { /* ok */ }
      },
    });

    // VFX
    this.effects.emitMergeParticles(mergeX, mergeY, comboCount);
    this.effects.emitFlash(mergeX, mergeY);
    const finalScore = Math.round(result.scoreAwarded * multiplier);
    const label = multiplier > 1 ? `+${finalScore} x${multiplier}` : `+${finalScore}`;
    this.effects.emitFloatingScore(mergeX, mergeY, label);

    // Delayed new animal bounce-in
    this.time.delayedCall(120, () => {
      const newAnimal = this.spawner.spawnAtMerge(mergeX, mergeY, result.newTier);
      this.score.addScore(finalScore);
      this.tweens.add({
        targets: newAnimal,
        scaleX: { from: 0, to: 1.2 }, scaleY: { from: 0, to: 1.2 },
        duration: 100, ease: 'Back.easeOut',
        onComplete: () => {
          this.tweens.add({ targets: newAnimal, scaleX: 1, scaleY: 1, duration: 100, ease: 'Power2' });
        },
      });
    });
  }

  private onScoreUpdated(data: { score: number }): void {
    const from = this.displayedScore;
    const to = data.score;
    this.displayedScore = to;

    this.tweens.addCounter({
      from, to, duration: 300, ease: 'Power2',
      onUpdate: (tween) => this.scoreText.setText(String(Math.round(tween.getValue() ?? to))),
    });
    this.tweens.add({
      targets: this.scoreText, scaleX: 1.15, scaleY: 1.15, duration: 100, yoyo: true, ease: 'Power2',
    });

    if (!this.sessionStats.isNewRecord && to > this.score.getBestScore() && this.score.getBestScore() > 0) {
      this.sessionStats.isNewRecord = true;
      this.effects.showNewRecordToast();
    }
    if (to - from > 20) {
      this.scoreText.setColor('#D4A24C');
      this.time.delayedCall(200, () => this.scoreText.setColor(BRAND.TEXT_INK));
    }
  }

  private updateComboUI(count: number): void {
    if (count < 2) { this.comboText.setAlpha(0); return; }
    const colors = ['#D4A24C', '#E88C28', '#C44832', '#C03228'];
    this.comboText.setText(`x${Math.min(count, 5)}${count > 5 ? '+' : ''}`);
    this.comboText.setColor(colors[Math.min(count - 2, colors.length - 1)]);
    this.comboText.setAlpha(1);
    this.tweens.add({ targets: this.comboText, scaleX: 1.3, scaleY: 1.3, duration: 80, yoyo: true, ease: 'Power2' });
    if (this.comboFadeTimer) this.comboFadeTimer.destroy();
    this.comboFadeTimer = this.time.delayedCall(2200, () => {
      this.tweens.add({ targets: this.comboText, alpha: 0, duration: 300 });
    });
  }

  private checkGameOver(delta: number): void {
    const animals = this.spawner.getAnimals();
    let above = false;
    for (const a of animals) {
      if (a.isSettled && !a.isMerging && a.body.position.y < GAME.GAME_OVER_LINE_Y) { above = true; break; }
    }
    if (above) {
      this.gameOverTimer += delta;
      if (this.gameOverTimer > 2000) this.triggerGameOver();
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
    const isNewRecord = this.score.checkAndSaveBest();
    if (isNewRecord) this.bridge?.saveHighScore(this.score.getBestScore());
    this.missionTracker.reportScore(this.score.getScore());
    this.missionTracker.reportGamePlayed();
    this.input.enabled = false;
    this.scene.launch('GameOver', {
      score: this.score.getScore(), best: this.score.getBestScore(), ...this.sessionStats,
      canContinue: this.continuesUsed < ADS.MAX_CONTINUES_PER_GAME,
    });
    this.scene.pause();
  }

  continueAfterAd(): void {
    const animals = [...this.spawner.getAnimals()];
    for (const a of animals) {
      if (a.body.position.y < GAME.GAME_OVER_LINE_Y + 50) this.spawner.destroy(a);
    }
    this.phase = 'playing';
    this.gameOverTimer = 0;
    this.continuesUsed++;
    this.input.enabled = true;
    this.merge.enable();
    this.inputHandler.enable();
    this.audio.startMusic();
    this.bridge?.gameplayStart();
  }

  restartGame(): void { this.scene.restart(); }

  private updateNextPreview(): void {
    if (this.nextPreview) this.nextPreview.destroy();
    const cfg = ANIMALS[this.spawner.peekNextTier() - 1];
    if (this.textures.exists(cfg.key)) {
      this.nextPreview = this.add.image(GAME.WIDTH - 50, 50, cfg.key).setDisplaySize(40, 40).setDepth(10);
    } else {
      this.nextPreview = this.add.circle(GAME.WIDTH - 50, 50, 20, cfg.color).setDepth(10) as any;
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
