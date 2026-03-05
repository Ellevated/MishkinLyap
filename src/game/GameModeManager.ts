/**
 * Module: GameModeManager
 * Role: Creates mode-specific config — RNG for daily, gravity for relaxation
 * Uses: config/GameConfig (MODES, GameMode), sdk/IGamePlatform
 * Used by: GameScene (creates on scene start, reads config)
 * Does NOT: Manage score, display UI, detect merges
 */
import Phaser from 'phaser';
import { MODES } from '../config/GameConfig';
import type { GameMode } from '../config/GameConfig';
import type { IPlatformBridge } from '../sdk/IGamePlatform';

export class GameModeManager {
  private mode: GameMode;
  private dailyRng: Phaser.Math.RandomDataGenerator | null = null;
  private dateString = '';

  constructor(mode: GameMode, bridge: IPlatformBridge) {
    this.mode = mode;
    if (mode === 'daily') {
      const serverTime = bridge.getServerTime();
      const d = new Date(serverTime);
      const seed = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
      this.dailyRng = new Phaser.Math.RandomDataGenerator([seed]);
      this.dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  }

  getSpawnTier(min: number, max: number): number {
    if (this.dailyRng) return this.dailyRng.between(min, max);
    return Phaser.Math.Between(min, max);
  }

  hasGameOver(): boolean { return this.mode !== 'relaxation'; }

  getGravityMultiplier(): number {
    return this.mode === 'relaxation' ? MODES.RELAXATION_GRAVITY_MULT : 1.0;
  }

  getDailyDateString(): string { return this.dateString; }
  getMode(): GameMode { return this.mode; }
}
