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
  readonly color: number;
}

export const ANIMALS: readonly AnimalConfig[] = [
  { tier: 1, name: 'hamster', radius: 18, score: 2,  key: 'hamster', color: 0xf0b832 },
  { tier: 2, name: 'bunny',   radius: 24, score: 6,  key: 'bunny',   color: 0x8bafc7 },
  { tier: 3, name: 'kitten',  radius: 32, score: 12, key: 'kitten',  color: 0xe88c28 },
  { tier: 4, name: 'cat',     radius: 40, score: 20, key: 'cat',     color: 0x9b6ba0 },
  { tier: 5, name: 'puppy',   radius: 50, score: 30, key: 'puppy',   color: 0xc17a56 },
  { tier: 6, name: 'fox',     radius: 60, score: 42, key: 'fox',     color: 0xc03228 },
  { tier: 7, name: 'panda',   radius: 72, score: 56, key: 'panda',   color: 0x3d2b1f },
  { tier: 8, name: 'bear',    radius: 85, score: 72, key: 'bear',    color: 0x5a8c3c },
] as const;

/** Brand colors from brandbook */
export const BRAND = {
  BG_CREAM: '#F5EDD8',
  BG_CREAM_HEX: 0xf5edd8,
  SURFACE: '#EDE0C4',
  BORDER: '#D6C6A9',
  TEXT_INK: '#3D2B1F',
  TEXT_SECONDARY: '#8B6040',
  CTA_OCHRE: '#D4A24C',
  CTA_OCHRE_HEX: 0xd4a24c,
  ACCENT_RED: '#C44832',
  SUCCESS: '#4A7A30',
  FONT_DISPLAY: "'Marmelad', 'Comfortaa', 'Nunito', sans-serif",
  FONT_BODY: "'Nunito', 'PT Sans', system-ui, sans-serif",
} as const;

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

export const AUDIO = {
  PITCH_VARIATION: 0.05,
  COMBO_PITCH_STEP: 0.06,
  MAX_PITCH_RATE: 2.0,
  BGM_VOLUME: 0.3,
  SFX_VOLUME: 0.6,
} as const;

export const COMBO = {
  WINDOW_MS: 2000,
  MULTIPLIERS: [1, 1, 1.5, 2, 2.5, 3] as readonly number[],
  MAX_DISPLAY: 5,
} as const;

export const STREAK = {
  REWARDS: [1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 2.0] as readonly number[],
  MAX_DISPLAY: 7,
  SHIELD_RESET_DAY: 1, // Monday
} as const;

export const STORAGE_KEY = 'mishkin_lyap_v1';
export const STORAGE_VERSION = 1;

export interface StreakData {
  count: number;
  lastPlayDate: string;
  shieldAvailable: boolean;
  lastShieldReset: string;
  todayClaimed: boolean;
}

export const DEFAULT_STREAK: StreakData = {
  count: 0, lastPlayDate: '', shieldAvailable: true, lastShieldReset: '', todayClaimed: false,
};

export interface PersistedData {
  v: number;
  best: number;
  sound: boolean;
  discoveredTiers: number[];
  streak: StreakData;
}

export const DEFAULT_DATA: PersistedData = {
  v: 1, best: 0, sound: true, discoveredTiers: [1, 2, 3], streak: { ...DEFAULT_STREAK },
};
