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

export type GameMode = 'classic' | 'daily' | 'relaxation';

export const MODES = {
  RELAXATION_GRAVITY_MULT: 0.7,
} as const;

export const ADS = {
  MIN_SESSION_BEFORE_INTERSTITIAL_MS: 60_000,
  INTERSTITIAL_COOLDOWN_MS: 180_000,
  AD_TIMEOUT_MS: 10_000,
  MAX_CONTINUES_PER_GAME: 1,
} as const;

export const AUDIO = {
  PITCH_VARIATION: 0.05,
  COMBO_PITCH_STEP: 0.06,
  MAX_PITCH_RATE: 2.0,
  BGM_VOLUME: 0.3,
  SFX_VOLUME: 0.6,
} as const;

export const AUDIO_ENHANCED = {
  REWARD_CHIME_BASE_FREQ: 523,
  REWARD_CHIME_INTERVALS: [0, 4, 7, 12],
  REWARD_CHIME_NOTE_DURATION: 0.12,
  DANGER_FREQ: 165,
  DANGER_PULSE_RATE: 2,
  MUSIC_DUCK_VOLUME: 0.08,
  MUSIC_DUCK_RAMP: 0.05,
  REWARD_MIN_TIER: 4,
} as const;

export const JUICE = {
  HIT_STOP_MS: 50,
  SHAKE_DURATION: 150,
  SHAKE_INTENSITY: 0.003,
  SHAKE_MIN_TIER: 4,
  GLOW_MIN_TIER: 5,
  GLOW_COLOR: 0xFFD700,
  GLOW_OUTER_STRENGTH: 6,
  GLOW_PULSE_MAX: 6,
  GLOW_PULSE_DURATION: 800,
  TRAIL_LIFESPAN: 150,
  TRAIL_FREQUENCY: 40,
  TRAIL_ALPHA: 0.4,
} as const;

export const VISUAL = {
  /** Sprite scale overflow — ratio beyond physics circle. 1.0 = exact fit, 1.25 = 25% overflow */
  SPRITE_OVERFLOW: 1.25,
} as const;

export const FEVER = {
  THRESHOLD: 4,
  DURATION_MS: 5000,
  SCORE_MULTIPLIER: 1.5,
  BG_TINT: 0xFFF3E0,
  BG_ALPHA: 0.12,
  PARTICLE_COUNT: 20,
  PARTICLE_COLORS: [0xFFD700, 0xFF6347, 0xFF69B4],
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

export const UNDO = {
  MAX_PER_GAME: 1,
  WINDOW_MS: 800,
} as const;

export type MysteryRewardType = 'score_boost' | 'golden_mode' | 'score_shower';
export const MYSTERY = {
  BASE_CHANCE: 0.1,
  PITY_THRESHOLD: 20,
  SCORE_BOOST_MULT: 3,
  GOLDEN_DURATION_MS: 5000,
  GOLDEN_MULT: 2,
  SCORE_SHOWER_BONUS: 100,
} as const;

export type SpinRewardType = 'score_bonus' | 'score_multiplier' | 'extra_spin';

export interface SpinReward {
  type: SpinRewardType;
  value: number;
  label: string;
  color: number;
  weight: number;
}

export const SPIN = {
  SEGMENTS: [
    { type: 'score_bonus', value: 100, label: '+100', color: 0xEDE0C4, weight: 35 },
    { type: 'score_multiplier', value: 2, label: '×2', color: 0xD4A24C, weight: 25 },
    { type: 'score_bonus', value: 500, label: '+500', color: 0xE8D5A3, weight: 20 },
    { type: 'extra_spin', value: 0, label: 'Ещё!', color: 0x4A7A30, weight: 10 },
    { type: 'score_bonus', value: 1000, label: '+1000', color: 0xFFD700, weight: 7 },
    { type: 'score_multiplier', value: 3, label: '×3!', color: 0xC44832, weight: 3 },
  ] as readonly SpinReward[],
  SPIN_DURATION_MS: 4000,
  MIN_ROTATIONS: 5,
  MAX_ROTATIONS: 8,
  MAX_AD_SPINS_PER_DAY: 2,
} as const;

export interface SpinData {
  lastSpinDate: string;
  adSpinsToday: number;
  pendingBonus: { type: 'score_bonus' | 'score_multiplier'; value: number } | null;
}

export const DEFAULT_SPIN: SpinData = {
  lastSpinDate: '', adSpinsToday: 0, pendingBonus: null,
};

export interface SkinDef { id: string; name: string; tint: number; unlockLabel: string; unlockCheck: (s: { bestScore: number; totalGames: number; totalMerges: number; highestTier: number }) => boolean; }
export const SKINS: SkinDef[] = [
  { id: 'default', name: 'Обычные', tint: 0, unlockLabel: 'Всегда', unlockCheck: () => true },
  { id: 'golden', name: 'Золотые', tint: 0xFFD700, unlockLabel: '10000 очков', unlockCheck: s => s.bestScore >= 10000 },
  { id: 'rosy', name: 'Розовые', tint: 0xFFB6C1, unlockLabel: '50 мерджей', unlockCheck: s => s.totalMerges >= 50 },
  { id: 'arctic', name: 'Ледяные', tint: 0x87CEEB, unlockLabel: '100 игр', unlockCheck: s => s.totalGames >= 100 },
  { id: 'shadow', name: 'Тёмные', tint: 0x696969, unlockLabel: 'Медведь', unlockCheck: s => s.highestTier >= 8 },
];

export interface SkinData { unlockedSkins: string[]; activeSkin: string; }
export const DEFAULT_SKIN: SkinData = { unlockedSkins: ['default'], activeSkin: 'default' };

export const STATS_DISPLAY = {
  SHOW_CHALLENGE_MIN_GAMES: 3,
  SHOW_INVESTMENT_MIN_GAMES: 5,
  GOAL_GRADIENT_THRESHOLD: 0.6,
} as const;

export const TUTORIAL = {
  STEPS: [
    { id: 'tap_to_drop', hint: 'Нажмите, чтобы бросить зверька!' },
    { id: 'first_merge', hint: 'Одинаковые зверята сливаются!' },
    { id: 'keep_going', hint: 'Собирайте всех зверят!' },
  ],
  STUCK_THRESHOLD_MS: 5000,
  HINT_FADE_MS: 300,
} as const;

export interface SeasonConfig {
  id: string; name: string;
  startMonth: number; startDay: number; endMonth: number; endDay: number;
  bgTint: number; borderTint: number; particleColor: number;
  particleType: 'snow' | 'leaves' | 'hearts' | 'stars' | 'none';
  scoreMult: number; emoji: string;
}

export const SEASONS: readonly SeasonConfig[] = [
  { id: 'winter', name: 'Зимний фестиваль', startMonth: 12, startDay: 15, endMonth: 1, endDay: 15,
    bgTint: 0xD6EAF8, borderTint: 0x87CEEB, particleColor: 0xFFFFFF, particleType: 'snow', scoreMult: 1.5, emoji: '❄️' },
  { id: 'spring', name: 'Весенний праздник', startMonth: 3, startDay: 1, endMonth: 3, endDay: 15,
    bgTint: 0xEAF5E4, borderTint: 0x90EE90, particleColor: 0xFFB7C5, particleType: 'leaves', scoreMult: 1.5, emoji: '🌸' },
  { id: 'valentines', name: 'День Влюблённых', startMonth: 2, startDay: 10, endMonth: 2, endDay: 16,
    bgTint: 0xFFE4E1, borderTint: 0xFF69B4, particleColor: 0xFF1493, particleType: 'hearts', scoreMult: 1.5, emoji: '💕' },
  { id: 'newyear', name: 'Новогодний мишка!', startMonth: 12, startDay: 25, endMonth: 1, endDay: 5,
    bgTint: 0xFFF8DC, borderTint: 0xFFD700, particleColor: 0xFFD700, particleType: 'stars', scoreMult: 2.0, emoji: '🎄' },
];

export const DEFAULT_SEASON: SeasonConfig = {
  id: 'default', name: '', startMonth: 1, startDay: 1, endMonth: 12, endDay: 31,
  bgTint: 0x000000, borderTint: 0x000000, particleColor: 0x000000, particleType: 'none', scoreMult: 1.0, emoji: '',
};

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

export const MISSIONS = {
  DAILY_COUNT: 3,
  ALL_COMPLETE_BONUS: 1.5,
} as const;

export type MissionType = 'merges' | 'score' | 'games' | 'tier_created' | 'combo';

export interface MissionTemplate {
  readonly id: string;
  readonly text: string;
  readonly type: MissionType;
  readonly target: number;
}

export const MISSION_POOL: readonly MissionTemplate[] = [
  { id: 'merges_10',  text: 'Сделайте {target} мерджей',  type: 'merges',       target: 10 },
  { id: 'merges_25',  text: 'Сделайте {target} мерджей',  type: 'merges',       target: 25 },
  { id: 'score_3000', text: 'Наберите {target} очков',     type: 'score',        target: 3000 },
  { id: 'score_8000', text: 'Наберите {target} очков',     type: 'score',        target: 8000 },
  { id: 'games_3',    text: 'Сыграйте {target} раунда',   type: 'games',        target: 3 },
  { id: 'games_5',    text: 'Сыграйте {target} раундов',  type: 'games',        target: 5 },
  { id: 'tier_cat',   text: 'Создайте кота (тир 4)',      type: 'tier_created', target: 4 },
  { id: 'tier_fox',   text: 'Создайте лису (тир 6)',      type: 'tier_created', target: 6 },
  { id: 'combo_3',    text: 'Соберите комбо x{target}',   type: 'combo',        target: 3 },
  { id: 'combo_5',    text: 'Соберите комбо x{target}',   type: 'combo',        target: 5 },
] as const;

export interface ActiveMission {
  templateId: string;
  progress: number;
  completed: boolean;
}

export interface MissionSaveData {
  date: string;
  active: ActiveMission[];
  allCompleted: boolean;
}

export const DEFAULT_MISSIONS: MissionSaveData = {
  date: '', active: [], allCompleted: false,
};

export interface CareerStats {
  totalMerges: number;
  totalScore: number;
  gamesPlayed: number;
  highestTier: number;
  maxCombo: number;
}

export const DEFAULT_CAREER: CareerStats = {
  totalMerges: 0, totalScore: 0, gamesPlayed: 0, highestTier: 1, maxCombo: 0,
};

export interface AchievementDef {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly check: (s: CareerStats) => boolean;
  readonly progress?: (s: CareerStats) => number;
  readonly target?: number;
}

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { id: 'first_merge',  name: 'Первый мердж',   description: 'Сделайте первое слияние',    icon: '🐹', check: s => s.totalMerges >= 1, progress: s => s.totalMerges, target: 1 },
  { id: 'merges_50',    name: 'Мерджер',         description: 'Сделайте 50 слияний',        icon: '🔄', check: s => s.totalMerges >= 50, progress: s => s.totalMerges, target: 50 },
  { id: 'merges_500',   name: 'Мердж-мастер',    description: 'Сделайте 500 слияний',       icon: '⭐', check: s => s.totalMerges >= 500, progress: s => s.totalMerges, target: 500 },
  { id: 'create_cat',   name: 'Котик!',          description: 'Создайте кота (тир 4)',      icon: '🐱', check: s => s.highestTier >= 4, progress: s => s.highestTier, target: 4 },
  { id: 'create_fox',   name: 'Лисичка!',        description: 'Создайте лису (тир 6)',      icon: '🦊', check: s => s.highestTier >= 6, progress: s => s.highestTier, target: 6 },
  { id: 'create_panda', name: 'Панда!',          description: 'Создайте панду (тир 7)',     icon: '🐼', check: s => s.highestTier >= 7, progress: s => s.highestTier, target: 7 },
  { id: 'create_bear',  name: 'МЕДВЕДЬ!',        description: 'Создайте медведя (тир 8)',   icon: '🐻', check: s => s.highestTier >= 8, progress: s => s.highestTier, target: 8 },
  { id: 'score_5k',     name: 'Пять тысяч',      description: 'Наберите 5000 за карьеру',   icon: '💫', check: s => s.totalScore >= 5000, progress: s => s.totalScore, target: 5000 },
  { id: 'score_50k',    name: 'Полтинник',        description: 'Наберите 50000 за карьеру',  icon: '🏆', check: s => s.totalScore >= 50000, progress: s => s.totalScore, target: 50000 },
  { id: 'games_10',     name: 'Завсегдатай',      description: 'Сыграйте 10 раундов',       icon: '🎮', check: s => s.gamesPlayed >= 10, progress: s => s.gamesPlayed, target: 10 },
  { id: 'games_100',    name: 'Ветеран',          description: 'Сыграйте 100 раундов',      icon: '🎖️', check: s => s.gamesPlayed >= 100, progress: s => s.gamesPlayed, target: 100 },
  { id: 'combo_5',      name: 'Каскадёр',         description: 'Соберите комбо x5',          icon: '🔥', check: s => s.maxCombo >= 5, progress: s => s.maxCombo, target: 5 },
] as const;

export interface DailyChallengeData {
  date: string;
  bestScore: number;
  completed: boolean;
}

export const DEFAULT_DAILY: DailyChallengeData = {
  date: '', bestScore: 0, completed: false,
};

export interface PersistedData {
  v: number;
  best: number;
  sound: boolean;
  discoveredTiers: number[];
  streak: StreakData;
  missions: MissionSaveData;
  career: CareerStats;
  unlockedAchievements: string[];
  dailyChallenge: DailyChallengeData;
  tutorialDone: boolean;
  spinData: SpinData;
  skinData: SkinData;
}

export const DEFAULT_DATA: PersistedData = {
  v: 1, best: 0, sound: true, discoveredTiers: [1, 2, 3],
  streak: { ...DEFAULT_STREAK }, missions: { ...DEFAULT_MISSIONS },
  career: { ...DEFAULT_CAREER }, unlockedAchievements: [],
  dailyChallenge: { ...DEFAULT_DAILY }, tutorialDone: false,
  spinData: { ...DEFAULT_SPIN },
  skinData: { ...DEFAULT_SKIN },
};
