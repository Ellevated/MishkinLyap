/**
 * Module: GameConfig
 * Role: ALL game constants — physics, animals, layout, ads, persistence
 * Uses: nothing (leaf module)
 * Used by: every other module
 * Does NOT: contain logic, import other modules
 */

export interface AnimalConfig {
  readonly tier: number;
  readonly name: string;
  readonly radius: number;
  readonly score: number;
  readonly key: string;
}

export const ANIMALS: readonly AnimalConfig[] = [
  { tier: 1, name: 'hamster', radius: 28, score: 2,  key: 'hamster'  },
  { tier: 2, name: 'rabbit',  radius: 38, score: 6,  key: 'rabbit'   },
  { tier: 3, name: 'kitten',  radius: 50, score: 12, key: 'kitten'   },
  { tier: 4, name: 'cat',     radius: 63, score: 20, key: 'cat'      },
  { tier: 5, name: 'dog',     radius: 78, score: 30, key: 'dog'      },
  { tier: 6, name: 'fox',     radius: 95, score: 42, key: 'fox'      },
  { tier: 7, name: 'panda',   radius: 114,score: 56, key: 'panda'    },
  { tier: 8, name: 'bear',    radius: 135,score: 72, key: 'bear'     },
] as const;

export const PHYSICS = {
  GRAVITY_Y: 1.5,
  RESTITUTION: 0.3,
  FRICTION: 0.5,
  FRICTION_AIR: 0.01,
} as const;

export const GAME = {
  WIDTH: 480,
  HEIGHT: 854,
  SPAWN_MAX_TIER: 5,
  DROP_COOLDOWN_MS: 500,
  GAME_OVER_LINE_Y: 120,
  CONTAINER_WALL_THICKNESS: 20,
  CONTAINER_TOP_Y: 100,
} as const;

export const ADS = {
  MIN_SESSION_BEFORE_INTERSTITIAL_MS: 60_000,
  INTERSTITIAL_COOLDOWN_MS: 180_000,
  AD_TIMEOUT_MS: 10_000,
} as const;

export const STORAGE_KEY = 'zverata_v1';
export const STORAGE_VERSION = 1;

export interface PersistedData {
  v: number;
  best: number;
  sound: boolean;
}

export const DEFAULT_DATA: PersistedData = { v: 1, best: 0, sound: true };
