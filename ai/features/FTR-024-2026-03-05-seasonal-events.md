# Feature: [FTR-024] Seasonal Events & Limited-Time Content
**Status:** queued | **Priority:** P1 | **Date:** 2026-03-05

## Why
Сезонные события (Score 2.30) + FOMO Limited-Time (Score 2.40): сезонные темы + ограниченные акции = свежесть контента без нового кода. Candy Crush: seasonal events = #1 причина возврата lapsed users. Monopoly Go: FOMO-таймеры увеличивают DAU на 30% в event-дни. Для ЦА 55+: "Новогодний мишка" = тёплые эмоции + мягкий FOMO без агрессии.

## Context
Depends on FTR-018 (getServerTime() on bridge), FTR-005 (GameScene).

**Verified Yandex SDK APIs:**
- `ysdk.serverTime()` — Unix ms timestamp, tamper-proof. Confirmed in Sprint 3 research.
- `ysdk.getFlags({ defaultFlags })` → `Promise<Record<string, string>>` — remote config from Yandex Console. Allows changing active season WITHOUT redeploying game. Source: yandex.com/dev/games/doc/en/sdk/sdk-config
- **NO** server-side event scheduling — client determines active event using serverTime + config

**Design decision:** NO new animal sprites per season. MVP uses tint + particles + UI decorations. Full sprite replacement deferred to when art assets are available.

## Research Reference
- S10: Сезонные события (Score 2.30)
- M8: FOMO: Limited-Time Events (Score 2.40)
- Merged into single spec: both are time-limited themed content with urgency mechanics

---

## Scope
**In scope:** SeasonManager with config-driven events, remote config override via ysdk.getFlags(), visual theme (bg tint, particles, container border), score multiplier during events, menu banner with countdown timer, event indicator during gameplay
**Out of scope:** New animal sprites per season (needs art), seasonal achievements, seasonal leaderboards, seasonal music (see FTR-025 for adaptive audio), seasonal rewards in lucky spin

---

## Allowed Files
**New files allowed:**
1. `src/game/SeasonManager.ts` — event schedule, active season detection, theme config (~70 LOC)

**Modify:**
2. `src/scenes/MenuScene.ts` — event banner with countdown, seasonal tint (+15 lines)
3. `src/scenes/GameScene.ts` — apply seasonal particles, container border tint, score multiplier (+10 lines)
4. `src/scenes/PreloadScene.ts` — load seasonal particle texture (+5 lines)
5. `src/config/GameConfig.ts` — add SEASONS config, SeasonConfig type (+15 lines)
6. `src/sdk/IGamePlatform.ts` — add getFlags() method (+2 lines)
7. `src/sdk/YandexPlatform.ts` — implement getFlags() via ysdk.getFlags() (+8 lines)
8. `src/sdk/MockPlatform.ts` — mock getFlags() with defaults (+5 lines)

**FORBIDDEN:** Animal.ts, MergeDetector.ts, PhysicsManager.ts, ScoreManager.ts, AudioManager.ts, AnimalSpawner.ts.

---

## Design

### Config Constants

```typescript
export interface SeasonConfig {
  id: string;
  name: string;           // Display name (e.g., "Зимний фестиваль")
  startMonth: number;     // 1-12 (inclusive)
  startDay: number;
  endMonth: number;
  endDay: number;
  bgTint: number;         // hex tint for background (overlay)
  borderTint: number;     // hex tint for container border
  particleColor: number;  // particle color
  particleType: 'snow' | 'leaves' | 'hearts' | 'stars' | 'none';
  scoreMult: number;      // score multiplier during event (1.5 = +50%)
  emoji: string;          // for UI badges
}

export const SEASONS: SeasonConfig[] = [
  {
    id: 'winter',
    name: 'Зимний фестиваль',
    startMonth: 12, startDay: 15,
    endMonth: 1, endDay: 15,
    bgTint: 0xD6EAF8,        // light blue
    borderTint: 0x87CEEB,
    particleColor: 0xFFFFFF,  // white snowflakes
    particleType: 'snow',
    scoreMult: 1.5,
    emoji: '❄️',
  },
  {
    id: 'spring',
    name: 'Весенний праздник',
    startMonth: 3, startDay: 1,
    endMonth: 3, endDay: 15,
    bgTint: 0xEAF5E4,        // light green
    borderTint: 0x90EE90,
    particleColor: 0xFFB7C5,  // pink petals
    particleType: 'leaves',
    scoreMult: 1.5,
    emoji: '🌸',
  },
  {
    id: 'valentines',
    name: 'День Влюблённых',
    startMonth: 2, startDay: 10,
    endMonth: 2, endDay: 16,
    bgTint: 0xFFE4E1,        // light pink
    borderTint: 0xFF69B4,
    particleColor: 0xFF1493,  // hearts
    particleType: 'hearts',
    scoreMult: 1.5,
    emoji: '💕',
  },
  {
    id: 'newyear',
    name: 'Новогодний мишка!',
    startMonth: 12, startDay: 25,
    endMonth: 1, endDay: 5,
    bgTint: 0xFFF8DC,        // gold cream
    borderTint: 0xFFD700,
    particleColor: 0xFFD700,  // gold stars
    particleType: 'stars',
    scoreMult: 2.0,           // New Year special: ×2!
    emoji: '🎄',
  },
] as const;

export const DEFAULT_SEASON: SeasonConfig = {
  id: 'default',
  name: '',
  startMonth: 1, startDay: 1,
  endMonth: 12, endDay: 31,
  bgTint: 0x000000,     // no tint (transparent overlay)
  borderTint: 0x000000,
  particleColor: 0x000000,
  particleType: 'none',
  scoreMult: 1.0,
  emoji: '',
};
```

### IPlatformBridge Extension

```typescript
// Add to IPlatformBridge
/** Get remote config flags from platform. Returns key-value pairs. */
getFlags(defaults: Record<string, string>): Promise<Record<string, string>>;
```

**YandexPlatform:**
```typescript
async getFlags(defaults: Record<string, string>): Promise<Record<string, string>> {
  try {
    const flags = await this.sdk.getFlags({ defaultFlags: defaults });
    return flags as Record<string, string>;
  } catch {
    return { ...defaults };
  }
}
```

**MockPlatform:**
```typescript
async getFlags(defaults: Record<string, string>): Promise<Record<string, string>> {
  return { ...defaults };
}
```

### SeasonManager (~70 LOC)

```typescript
/**
 * Module: SeasonManager
 * Role: Determines active season from serverTime + remote config, provides theme
 * Uses: config/GameConfig (SEASONS), IPlatformBridge (getServerTime, getFlags)
 * Used by: MenuScene (event banner), GameScene (particles + multiplier)
 * Does NOT: Modify game state, manage score, display UI
 */
```

**Public API:**
- `static async create(bridge: IPlatformBridge): Promise<SeasonManager>` — async factory (loads flags)
- `getActiveSeason(): SeasonConfig` — returns current season or default
- `isEventActive(): boolean` — true if non-default season
- `getTimeRemainingMs(): number` — ms until event ends (for countdown)
- `getScoreMultiplier(): number` — 1.0 if no event, 1.5-2.0 during event

**Season detection logic:**
```typescript
static async create(bridge: IPlatformBridge): Promise<SeasonManager> {
  // 1. Check remote config override
  const flags = await bridge.getFlags({ active_season: 'auto' });
  const override = flags['active_season'];

  // 2. If override is a specific season ID, use it
  if (override && override !== 'auto') {
    const season = SEASONS.find(s => s.id === override);
    if (season) return new SeasonManager(season, bridge);
  }

  // 3. Auto-detect from server time
  const serverTime = bridge.getServerTime();
  const now = new Date(serverTime);
  const month = now.getMonth() + 1;
  const day = now.getDate();

  for (const season of SEASONS) {
    if (isDateInRange(month, day, season.startMonth, season.startDay, season.endMonth, season.endDay)) {
      return new SeasonManager(season, bridge);
    }
  }

  return new SeasonManager(DEFAULT_SEASON, bridge);
}

/** Handle cross-year ranges (e.g., Dec 15 → Jan 15) */
private static isDateInRange(m: number, d: number, sm: number, sd: number, em: number, ed: number): boolean {
  const current = m * 100 + d;
  const start = sm * 100 + sd;
  const end = em * 100 + ed;

  if (start <= end) {
    return current >= start && current <= end;
  }
  // Cross-year: Dec→Jan
  return current >= start || current <= end;
}
```

**Countdown:**
```typescript
getTimeRemainingMs(): number {
  if (!this.isEventActive()) return 0;
  const now = new Date(this.bridge.getServerTime());
  const endDate = new Date(now.getFullYear(), this.season.endMonth - 1, this.season.endDay, 23, 59, 59);
  // If end is in next year (cross-year event), adjust
  if (endDate < now) endDate.setFullYear(endDate.getFullYear() + 1);
  return endDate.getTime() - now.getTime();
}
```

### MenuScene Integration (+15 lines)

If event active, show banner above play buttons:
```
Layout with event:
  Title: Y = 180
  ❄️ Зимний фестиваль! ❄️   Y = 260 (event banner)
  Осталось: 3д 12ч 45м       Y = 285 (countdown, updates in update())
  ×1.5 бонус к очкам!        Y = 305 (multiplier badge)
  Best: Y = 340
  [Играть]  Y = 400
  ...
```

```typescript
// In create(), after SeasonManager.create():
if (this.seasonManager.isEventActive()) {
  const season = this.seasonManager.getActiveSeason();

  // Event banner
  this.add.text(width / 2, 260, `${season.emoji} ${season.name} ${season.emoji}`, {
    fontFamily: BRAND.FONT_DISPLAY,
    fontSize: '22px',
    color: '#3D2B1F',
  }).setOrigin(0.5);

  // Countdown (updated in update())
  this.countdownText = this.add.text(width / 2, 285, '', {
    fontFamily: BRAND.FONT_BODY,
    fontSize: '16px',
    color: BRAND.TEXT_SECONDARY,
  }).setOrigin(0.5);

  // Multiplier badge
  this.add.text(width / 2, 305, `×${season.scoreMult} бонус к очкам!`, {
    fontFamily: BRAND.FONT_BODY,
    fontSize: '14px',
    color: '#D4A24C',
  }).setOrigin(0.5);
}
```

**Countdown update in MenuScene.update():**
```typescript
update(): void {
  if (this.countdownText && this.seasonManager?.isEventActive()) {
    const ms = this.seasonManager.getTimeRemainingMs();
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    this.countdownText.setText(`Осталось: ${days}д ${hours}ч ${mins}м`);
  }
}
```

### GameScene Integration (+10 lines)

**Particles:**
```typescript
// In create(), after SeasonManager loaded:
const season = this.seasonManager.getActiveSeason();
if (season.particleType !== 'none') {
  // Simple particle emitter — falling particles from top
  const particles = this.add.particles(0, -10, 'particle', {
    x: { min: 0, max: GAME.WIDTH },
    y: -10,
    speedY: { min: 30, max: 80 },
    lifespan: 6000,
    quantity: 1,
    frequency: 500,
    tint: season.particleColor,
    scale: { start: 0.5, end: 0.2 },
    alpha: { start: 0.6, end: 0 },
  });
  particles.setDepth(1); // behind animals, above background
}
```

**Score multiplier:**
```typescript
// In onMerge(), alongside combo multiplier:
const seasonMult = this.seasonManager.getScoreMultiplier();
const finalScore = Math.round(result.scoreAwarded * comboMultiplier * seasonMult);
```

**Container border tint (subtle):**
```typescript
// If event active, tint the container walls
if (season.bgTint !== 0x000000) {
  // Add subtle overlay rectangle at low alpha
  this.add.rectangle(GAME.WIDTH / 2, GAME.HEIGHT / 2, GAME.WIDTH, GAME.HEIGHT, season.bgTint, 0.08)
    .setDepth(0); // behind everything
}
```

### Particle Asset

PreloadScene needs a simple white circle texture for particles:
```typescript
// In preload():
// Generate particle texture (no external asset needed)
const particleGfx = this.make.graphics({ x: 0, y: 0, add: false });
particleGfx.fillStyle(0xffffff);
particleGfx.fillCircle(4, 4, 4);
particleGfx.generateTexture('particle', 8, 8);
particleGfx.destroy();
```

This creates a simple 8×8 white circle at runtime — no asset file needed. Tinting is applied per-season.

---

## Implementation Plan

### Task 1: SDK getFlags + SeasonManager + config
**Type:** code
**Files:**
  - modify: `src/sdk/IGamePlatform.ts` — add getFlags() method
  - modify: `src/sdk/YandexPlatform.ts` — implement via ysdk.getFlags()
  - modify: `src/sdk/MockPlatform.ts` — mock with defaults
  - modify: `src/config/GameConfig.ts` — add SEASONS config, SeasonConfig type, DEFAULT_SEASON
  - create: `src/game/SeasonManager.ts` — async factory, date-range detection, remote override, countdown
**Acceptance:** SeasonManager detects active season from serverTime, supports remote override via getFlags(), calculates countdown correctly for cross-year events

### Task 2: Wire seasonal visuals to scenes
**Type:** code
**Files:**
  - modify: `src/scenes/PreloadScene.ts` — generate particle texture
  - modify: `src/scenes/MenuScene.ts` — event banner, countdown timer, multiplier badge
  - modify: `src/scenes/GameScene.ts` — seasonal particles, bg tint overlay, score multiplier
**Acceptance:** Active season shows banner on menu with countdown, particles fall during gameplay, score multiplier applied to all merges, no visuals when no event active

### Execution Order
1 → 2

---

## Tests

### What to test
- [ ] No event active outside configured dates — no banner, no particles, multiplier = 1.0
- [ ] Event active during configured dates — banner, particles, multiplier applied
- [ ] Countdown timer updates correctly (days/hours/minutes)
- [ ] Cross-year event (Dec→Jan) detected correctly
- [ ] Remote config override: `active_season: 'winter'` forces winter theme regardless of date
- [ ] Remote config `active_season: 'auto'` uses date-based detection
- [ ] Score multiplier applies to all merges during event (×1.5 or ×2)
- [ ] Particles visible but don't obscure gameplay (low alpha, behind animals)
- [ ] Background tint subtle and not overwhelming
- [ ] MockPlatform returns defaults (no event by default)

### How to test
- Manual: Set system date to Dec 25 → verify "Новогодний мишка!" banner + gold particles
- Manual: Set system date to July → verify no seasonal effects
- Manual: Play during event → verify score values are multiplied
- Dev: Override MockPlatform.getFlags to return `{ active_season: 'winter' }` → verify forced winter theme

---

## Definition of Done

### Functional
- [ ] Seasonal events auto-activate by date
- [ ] Remote config can force/disable events
- [ ] Visual theme changes during events (particles, tint, banner)
- [ ] Score multiplier rewards event participation
- [ ] Countdown creates urgency without aggression

### Technical
- [ ] `npm run build` succeeds
- [ ] SeasonManager.ts ≤ 80 LOC
- [ ] GameScene additions ≤ 15 lines
- [ ] MenuScene additions ≤ 20 lines
- [ ] No console errors
- [ ] No performance impact from particles (single emitter, low frequency)
- [ ] Cross-year date ranges handled correctly
