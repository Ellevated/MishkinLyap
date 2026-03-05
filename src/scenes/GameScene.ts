/**
 * Module: GameScene
 * Role: Pure orchestrator — creates managers, wires events, manages state machine
 * Uses: PhysicsManager, MergeDetector, AnimalSpawner, ScoreManager, InputHandler, AudioManager, ComboTracker, EffectsManager
 * Used by: MenuScene (scene.start), main.ts (scene list)
 */

import Phaser from 'phaser';
import { GAME, BRAND, ANIMALS, ADS, PHYSICS, UNDO, MYSTERY, AUDIO_ENHANCED, JUICE } from '../config/GameConfig';
import type { MysteryRewardType, GameMode } from '../config/GameConfig';
import type { SeasonManager } from '../game/SeasonManager';
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
import { AchievementManager } from '../game/AchievementManager';
import { GameModeManager } from '../game/GameModeManager';
import { MysteryRewardManager } from '../game/MysteryRewardManager';
import { TutorialManager } from '../game/TutorialManager';
import { ACHIEVEMENTS } from '../config/GameConfig';

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
  private achievements!: AchievementManager;
  private modeManager!: GameModeManager;
  private mysteryRewards!: MysteryRewardManager;
  private tutorial!: TutorialManager;
  private bridge!: IPlatformBridge;
  private phase: GamePhase = 'playing';
  private scoreText!: Phaser.GameObjects.Text;
  private nextPreview!: Phaser.GameObjects.Image | Phaser.GameObjects.Arc;
  private comboText!: Phaser.GameObjects.Text;
  private comboFadeTimer?: Phaser.Time.TimerEvent;
  private dropCooldown = false;
  private dropCooldownTimer?: Phaser.Time.TimerEvent;
  private gameOverTimer = 0;
  private displayedScore = 0;
  private continuesUsed = 0;
  private undosRemaining = 0;
  private undoAvailable = false;
  private undoTimer?: Phaser.Time.TimerEvent;
  private undoBtn?: Phaser.GameObjects.Text;
  private seasonMult = 1;
  private sessionStats = { mergeCount: 0, highestTier: 1, isNewRecord: false };

  constructor() { super('Game'); }

  create(data?: { mode?: GameMode }): void {
    this.bridge = this.registry.get('bridge') as IPlatformBridge;
    const mode: GameMode = data?.mode || 'classic';
    this.modeManager = new GameModeManager(mode, this.bridge);
    this.phase = 'playing';
    this.gameOverTimer = 0;
    this.displayedScore = 0;
    this.continuesUsed = 0;
    this.undosRemaining = UNDO.MAX_PER_GAME;
    this.undoAvailable = false;
    this.sessionStats = { mergeCount: 0, highestTier: 1, isNewRecord: false };
    this.cameras.main.setBackgroundColor(BRAND.BG_CREAM);

    // Create managers
    this.physicsManager = new PhysicsManager(this);
    this.physicsManager.createWalls();
    this.merge = new MergeDetector(this);
    this.score = new ScoreManager(this);
    this.spawner = new AnimalSpawner(this, this.physicsManager);
    if (mode === 'daily') {
      this.spawner.setRngFunction((min, max) => this.modeManager.getSpawnTier(min, max));
    }
    this.inputHandler = new InputHandler(this);
    this.audio = new AudioManager();
    this.combo = new ComboTracker();
    this.effects = new EffectsManager(this, 75);
    this.missionTracker = new MissionTracker();
    this.missionTracker.loadOrReset();
    this.achievements = new AchievementManager();
    this.mysteryRewards = new MysteryRewardManager();
    this.tutorial = new TutorialManager(this, this.score);

    // Adjust gravity for relaxation mode
    if (mode === 'relaxation') {
      (this as any).matter.world.setGravity(0, PHYSICS.GRAVITY_Y * this.modeManager.getGravityMultiplier());
    }

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
    const wt = GAME.CONTAINER_WALL_THICKNESS, wallH = GAME.HEIGHT - bounds.top, wallY = (bounds.top + GAME.HEIGHT) / 2;
    this.add.rectangle(wt / 2, wallY, wt, wallH, 0xd6c6a9).setOrigin(0.5);
    this.add.rectangle(GAME.WIDTH - wt / 2, wallY, wt, wallH, 0xd6c6a9).setOrigin(0.5);
    this.add.rectangle(GAME.WIDTH / 2, GAME.HEIGHT - wt / 2, GAME.WIDTH, wt, 0xd6c6a9).setOrigin(0.5);

    // Seasonal effects
    const seasonMgr = this.registry.get('seasonManager') as SeasonManager | undefined;
    this.seasonMult = seasonMgr?.getScoreMultiplier() ?? 1;
    const season = seasonMgr?.getActiveSeason();
    if (season && season.particleType !== 'none' && this.textures.exists('particle')) {
      this.add.particles(0, -10, 'particle', { x: { min: 0, max: GAME.WIDTH }, y: -10, speedY: { min: 30, max: 80 }, lifespan: 6000, quantity: 1, frequency: 500, tint: season.particleColor, scale: { start: 0.5, end: 0.2 }, alpha: { start: 0.6, end: 0 } }).setDepth(1);
    }
    if (season?.bgTint) this.add.rectangle(GAME.WIDTH / 2, GAME.HEIGHT / 2, GAME.WIDTH, GAME.HEIGHT, season.bgTint, 0.08).setDepth(0);

    // UI
    this.scoreText = this.add.text(GAME.WIDTH / 2, 30, '0', { fontSize: '48px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_DISPLAY }).setOrigin(0.5).setDepth(10);
    this.comboText = this.add.text(GAME.WIDTH / 2 + 80, 30, '', { fontSize: '32px', color: '#D4A24C', fontFamily: BRAND.FONT_DISPLAY }).setOrigin(0.5).setDepth(10).setAlpha(0);
    if (mode !== 'relaxation') {
      this.add.line(0, 0, wt, GAME.GAME_OVER_LINE_Y, GAME.WIDTH - wt, GAME.GAME_OVER_LINE_Y, 0xc44832, 0.3).setOrigin(0).setDepth(10);
    }
    if (mode !== 'classic') {
      this.add.text(10, 10, mode === 'daily' ? 'Ежедневная' : 'Без стресса', { fontSize: '14px', color: BRAND.TEXT_SECONDARY, fontFamily: BRAND.FONT_BODY }).setDepth(10);
    }

    this.updateNextPreview();

    // Undo button (hidden by default)
    this.undoBtn = this.add.text(50, 50, '↩', {
      fontSize: '32px', color: BRAND.TEXT_INK, fontFamily: BRAND.FONT_BODY,
    }).setOrigin(0.5).setDepth(10).setAlpha(0).setInteractive({ useHandCursor: true });
    this.undoBtn.on('pointerup', () => this.executeUndo());

    // Lock undo when dropped animal touches anything
    this.matter.world.on('collisionstart', (_e: any, a: any, b: any) => {
      if (!this.undoAvailable) return;
      const last = this.spawner.peekLastSpawned();
      if (!last?.body) return;
      if (a === last.body || b === last.body) { this.undoAvailable = false; this.hideUndoBtn(); }
    });
  }

  update(_time: number, delta: number): void {
    if (this.phase !== 'playing') return;
    this.mysteryRewards.update(this.time.now);
    this.tutorial.checkStuck(delta);
    this.checkGameOver(delta);
  }

  private onDropRequested(data: { x: number }): void {
    if (this.phase !== 'playing' || this.dropCooldown) return;
    this.dropCooldown = true;
    this.inputHandler.disable();
    this.audio.playDrop();
    this.spawner.spawnAtDrop(data.x);
    const dropped = this.spawner.peekLastSpawned();
    if (dropped) this.effects.startTrail(dropped);
    this.tutorial.onDrop();
    this.updateNextPreview();
    this.dropCooldownTimer = this.time.delayedCall(GAME.DROP_COOLDOWN_MS, () => {
      this.dropCooldown = false;
      if (this.phase === 'playing') this.inputHandler.enable();
    });
    // Show undo if available
    if (this.undosRemaining > 0) {
      this.undoAvailable = true;
      this.showUndoBtn();
      this.undoTimer?.destroy();
      this.undoTimer = this.time.delayedCall(UNDO.WINDOW_MS, () => { this.undoAvailable = false; this.hideUndoBtn(); });
    }
  }

  private onMerge(result: MergeResult): void {
    const { mergeX, mergeY } = result;
    const comboCount = this.combo.registerMerge();
    const multiplier = this.combo.getMultiplier();
    this.audio.playMerge(comboCount);
    if (result.newTier >= AUDIO_ENHANCED.REWARD_MIN_TIER) this.audio.playRewardChime();
    this.effects.hitStop();
    if (result.newTier >= JUICE.SHAKE_MIN_TIER) this.effects.screenShake();
    this.updateComboUI(comboCount);

    this.tutorial.onMerge();
    this.sessionStats.mergeCount++; if (result.newTier > this.sessionStats.highestTier) this.sessionStats.highestTier = result.newTier;
    this.effects.triggerMergeToast(result.newTier, comboCount);

    this.missionTracker.reportMerge(result.newTier); if (comboCount >= 2) this.missionTracker.reportCombo(comboCount);
    this.showAchievementToasts(this.achievements.reportMerge(result.newTier));
    if (comboCount >= 2) this.showAchievementToasts(this.achievements.reportCombo(comboCount));
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

    // Mystery reward check
    const reward = this.mysteryRewards.checkMerge();
    const boostMult = reward === 'score_boost' ? MYSTERY.SCORE_BOOST_MULT : 1;
    const goldenMult = this.mysteryRewards.getGoldenMultiplier();

    // VFX
    this.effects.emitMergeParticles(mergeX, mergeY, comboCount);
    this.effects.emitFlash(mergeX, mergeY);
    const totalMult = multiplier * boostMult * goldenMult * this.seasonMult;
    const finalScore = Math.round(result.scoreAwarded * totalMult);
    const label = totalMult > 1 ? `+${finalScore} x${Math.round(totalMult)}` : `+${finalScore}`;
    this.effects.emitFloatingScore(mergeX, mergeY, label);
    if (reward) this.handleMysteryReward(reward, mergeX, mergeY);

    // Delayed new animal bounce-in
    this.time.delayedCall(120, () => {
      const newAnimal = this.spawner.spawnAtMerge(mergeX, mergeY, result.newTier);
      if (result.newTier >= JUICE.GLOW_MIN_TIER) newAnimal.setGlow();
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

    this.tweens.addCounter({ from, to, duration: 300, ease: 'Power2', onUpdate: (tween) => this.scoreText.setText(String(Math.round(tween.getValue() ?? to))) });
    this.tweens.add({ targets: this.scoreText, scaleX: 1.15, scaleY: 1.15, duration: 100, yoyo: true, ease: 'Power2' });

    if (!this.sessionStats.isNewRecord && to > this.score.getBestScore() && this.score.getBestScore() > 0) {
      this.sessionStats.isNewRecord = true; this.effects.showNewRecordToast();
    }
    if (to - from > 20) {
      this.scoreText.setColor('#D4A24C');
      this.time.delayedCall(200, () => this.scoreText.setColor(BRAND.TEXT_INK));
    }
    this.tutorial.onScoreReached(to);
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
    if (!this.modeManager.hasGameOver()) return;
    const animals = this.spawner.getAnimals();
    let above = false;
    for (const a of animals) {
      if (a.isSettled && !a.isMerging && a.body.position.y < GAME.GAME_OVER_LINE_Y) { above = true; break; }
    }
    if (above) {
      this.gameOverTimer += delta;
      if (this.gameOverTimer > 500) this.audio.startDangerTone();
      if (this.gameOverTimer > 2000) this.triggerGameOver();
    } else {
      this.gameOverTimer = 0;
      this.audio.stopDangerTone();
    }
  }

  private triggerGameOver(): void {
    this.phase = 'game-over';
    this.inputHandler.disable();
    this.merge.disable();
    this.audio.stopDangerTone(); this.audio.playGameOver();
    this.audio.stopMusic();
    this.bridge?.gameplayStop();
    const isNewRecord = this.score.checkAndSaveBest();
    if (isNewRecord) this.bridge?.saveHighScore(this.score.getBestScore());
    const mode = this.modeManager.getMode();
    if (mode === 'daily') this.score.checkAndSaveDailyBest(this.modeManager.getDailyDateString());
    this.missionTracker.reportScore(this.score.getScore());
    this.missionTracker.reportGamePlayed();
    this.showAchievementToasts(this.achievements.reportGameEnd(this.score.getScore()));
    this.input.enabled = false;
    this.scene.launch('GameOver', {
      score: this.score.getScore(), best: this.score.getBestScore(), ...this.sessionStats,
      canContinue: this.continuesUsed < ADS.MAX_CONTINUES_PER_GAME,
      mode,
    });
    this.scene.pause();
  }

  continueAfterAd(): void {
    for (const a of [...this.spawner.getAnimals()]) { if (a.body.position.y < GAME.GAME_OVER_LINE_Y + 50) this.spawner.destroy(a); }
    this.phase = 'playing'; this.gameOverTimer = 0; this.continuesUsed++;
    this.input.enabled = true; this.merge.enable(); this.inputHandler.enable();
    this.audio.startMusic(); this.bridge?.gameplayStart();
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

  private showAchievementToasts(ids: string[]): void {
    for (const id of ids) {
      const ach = ACHIEVEMENTS.find(a => a.id === id);
      if (ach) this.flashText(GAME.WIDTH / 2, -30, `🏆 ${ach.name}!`, '#D4A24C', 22, { y: 8, hold: 1500 });
    }
  }

  private executeUndo(): void {
    if (!this.undoAvailable || this.undosRemaining <= 0 || !this.spawner.undoLastDrop()) return;
    this.undoAvailable = false;
    this.undosRemaining--;
    this.undoTimer?.destroy();
    this.hideUndoBtn();
    this.updateNextPreview();
    this.dropCooldownTimer?.destroy();
    this.dropCooldown = false;
    if (this.phase === 'playing') this.inputHandler.enable();
    this.flashText(GAME.WIDTH / 2, GAME.HEIGHT * 0.4, 'Отмена!', '#4A7A30', 28);
  }

  /** Reusable flash text: appears, holds, fades out */
  private flashText(x: number, y: number, msg: string, color: string, size: number, opts?: { y?: number; hold?: number }): void {
    const t = this.add.text(x, y, msg, { fontSize: `${size}px`, color, fontFamily: BRAND.FONT_DISPLAY }).setOrigin(0.5).setDepth(20);
    const targetY = opts?.y ?? y - 30;
    this.tweens.add({ targets: t, y: targetY, duration: 300, ease: 'Back.easeOut',
      onComplete: () => this.time.delayedCall(opts?.hold ?? 400, () => this.tweens.add({ targets: t, alpha: 0, y: targetY - 20, duration: 300, onComplete: () => t.destroy() })),
    });
  }

  private showUndoBtn(): void { if (this.undoBtn) this.tweens.add({ targets: this.undoBtn, alpha: 1, duration: 150 }); }
  private hideUndoBtn(): void { if (this.undoBtn) this.tweens.add({ targets: this.undoBtn, alpha: 0, duration: 150 }); }

  private handleMysteryReward(type: MysteryRewardType, x: number, y: number): void {
    const showText = (t: string) => {
      const txt = this.add.text(x, y - 30, t, {
        fontSize: '32px', color: '#FFD700', fontFamily: BRAND.FONT_DISPLAY, stroke: '#3D2B1F', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(20);
      this.tweens.add({ targets: txt, y: y - 80, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 800, onComplete: () => txt.destroy() });
    };
    if (type === 'score_boost') { showText('×3!'); }
    else if (type === 'golden_mode') {
      this.mysteryRewards.activateGoldenMode(this.time.now);
      showText('Золотой режим!');
      const bar = this.add.rectangle(GAME.WIDTH / 2, 4, GAME.WIDTH, 6, 0xffd700).setDepth(20);
      this.tweens.add({ targets: bar, scaleX: 0, duration: MYSTERY.GOLDEN_DURATION_MS, onComplete: () => bar.destroy() });
    } else {
      this.score.addScore(MYSTERY.SCORE_SHOWER_BONUS);
      showText(`+${MYSTERY.SCORE_SHOWER_BONUS}`);
    }
  }

  shutdown(): void {
    this.audio?.destroy();
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.matter?.world?.removeAllListeners();
    this.events.off(EVENTS.DROP_REQUESTED, this.onDropRequested, this);
    this.events.off(EVENTS.ANIMAL_MERGED, this.onMerge, this);
    this.events.off(EVENTS.SCORE_UPDATED, this.onScoreUpdated, this);
    this.tutorial?.destroy();
    this.inputHandler?.destroy();
    this.merge?.destroy();
    this.spawner?.destroyAll();
  }
}
