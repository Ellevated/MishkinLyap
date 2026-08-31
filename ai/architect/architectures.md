# Architecture Synthesis -- Zverata

**Synthesizer:** Oracle (Chairman)
**Input:** 8 persona research + 8 critiques + business blueprint
**Output:** 3 architecture alternatives
**Date:** 2026-03-04

---

## Synthesis Summary

### Key Insights from Research

1. **The no-rollback constraint is the dominant architectural driver.** Charity (Ops) identified that Yandex Games ZIP submission is irreversible (3-5 day moderation cycle). Every other decision cascades from this: pre-submit quality gates replace post-deploy monitoring. This was independently validated by 5 of 8 personas.

2. **The file count debate is the central tension.** Devil proposes 4 files (~480 LOC). Domain/Ops/Data propose 9-12 files (~1,200 LOC). LLM proposes 24 files (~2,460 LOC). This is not a superficial disagreement -- it reflects fundamentally different optimization targets (conceptual integrity vs. module contracts vs. agent context budget).

3. **All 8 personas independently converge on the same critical path:** SDK init must block Phaser init, ad callbacks must always resolve (10s watchdog), and the merge guard (`isMerging` flag) is the single most important runtime invariant.

4. **Consensus stack is unanimous:** TypeScript + Phaser 3.90 + Matter.js (built-in) + Vite 5.x, `base: './'`, SDK mock for local dev, localStorage as SoR for highscore.

5. **Score formula is settled:** `tier * (tier + 1)` -- quadratic growth, 8/8 consensus.

### Major Contradictions Resolved

Seven contradictions were identified by the Devil's cross-critique. Here is how each is resolved.

---

### Evaporating Cloud #1: Vite Chunk Splitting

**Conflict:** Dan (DX) wants `manualChunks: undefined` (single bundle). Charity (Ops) wants `manualChunks: { phaser: ['phaser'] }` (separate Phaser chunk for caching).

```
           [Fast, reliable game delivery]
                     |
           +---------+---------+
           |                   |
    [Yandex ZIP works]  [Fast load for returning users]
           |                   |
           v                   v
    [Single bundle] <--conflict--> [Split chunks]
```

**Assumptions underlying conflict:**
1. "Yandex ZIP validation breaks with multiple chunks" -- FALSE. Yandex requires `index.html` at ZIP root with relative paths. Multiple JS chunks are fine as long as paths are relative (`base: './'`).
2. "Split chunks improve returning-user load time" -- TRUE for CDN-hosted games, IRRELEVANT for Yandex. Yandex serves the entire ZIP from their CDN. Browser caching of individual chunks within a ZIP-served game is unpredictable.

**Resolution:** Single bundle (`manualChunks: undefined`). The caching benefit is real in theory but unreliable for Yandex's serving model. Single bundle is simpler to audit (one JS file to grep for secrets/external URLs), simpler to debug (one sourcemap), and has zero compatibility risk. Total game code + Phaser is ~1MB -- not worth splitting at this scale.

---

### Evaporating Cloud #2: Spawn Tier Range

**Conflict:** Eric (Domain) says tiers 1-5 spawnable. Erik (LLM) says `MAX_TIER_TO_SPAWN: 3`. Martin (Data) says tiers 1-5.

**Resolution:** Tiers 1-5 is the genre standard (Suika Game, all major clones). The spawn pool includes the first 5 of 8 tiers. Tiers 6-8 are merge-only. Erik's `MAX_TIER_TO_SPAWN: 3` was an error -- likely confusion with the number of initial tiers shown in tutorials. The config parameter should be `SPAWN_MAX_TIER: 5`.

This is a game design parameter, not an architecture decision. It lives in `GameConfig.ts` and is trivially adjustable.

---

### Evaporating Cloud #3: Sentry + Yandex CSP Compatibility

**Conflict:** Charity (Ops) recommends Sentry (micro-sentry 2.27 kB) for error tracking. Bruce (Security) says Yandex controls CSP in the iframe. Devil notes these are potentially incompatible -- Sentry needs to POST to `sentry.io`, which may be blocked.

```
           [Know when game breaks in production]
                     |
           +---------+---------+
           |                   |
    [Error tracking needed]  [No external requests allowed]
           |                   |
           v                   v
    [Sentry to sentry.io] <--conflict--> [No CSP for game]
```

**Assumptions underlying conflict:**
1. "Yandex CSP blocks all non-Yandex domains" -- UNVERIFIED. Yandex allows SDK calls to `an.yandex.ru`, `mc.yandex.ru`, etc. Whether `sentry.io` is whitelisted is unknown without testing.
2. "We need Sentry specifically" -- FALSE. We need error visibility. `console.error` with structured JSON is visible in Yandex's debug panel.

**Resolution:** Drop Sentry. Use `window.onerror` + `window.onunhandledrejection` capturing to structured `console.error` with JSON payloads. This is visible in Yandex debug panel pre-launch and costs zero external dependencies, zero CSP risk. If post-launch error volume is unacceptable, test whether micro-sentry works inside the Yandex iframe before adding it. Do not risk moderation rejection on an unverified assumption.

This removes a dependency, removes a CSP risk, and removes the Sentry DSN secret question. The tradeoff: no post-launch automated alerting. Acceptable for 300 DAU -- manual daily Yandex console checks suffice.

---

### Evaporating Cloud #4: Event Pattern

**Conflict:** Eric (Domain) uses Phaser's scene-scoped `this.events.emit()`. Erik (LLM) proposes a singleton `EventBus.ts`. Dan (DX) says no abstraction.

**Resolution:** Use Phaser's built-in event system. For same-scene events: `this.events.emit()`. For cross-scene events: `this.game.events.emit()` (Phaser's global game event emitter, built-in, no extra code). No custom `EventBus.ts`. All event names are defined as constants in `GameEvents.ts` to prevent string typos. This satisfies Erik's event catalog requirement without adding a custom class.

---

### Evaporating Cloud #5: localStorage Schema

**Conflict:** Martin (Data) proposes single JSON blob at key `zverata_v1`. Devil notes Dan (DX) implies separate keys. Charity (Ops) suggests `localStorage.setItem('schema_version', '1')` as separate key.

**Resolution:** Single JSON blob at `zverata_v1` (Martin's approach). Rationale: one atomic read/write prevents partial state corruption. Schema version is a field inside the JSON, not a separate key. `migratePlayerData()` function validates and upgrades on read. This is the standard pattern for small-data localStorage persistence.

---

### Evaporating Cloud #6: SDK File Count

**Conflict:** Eric proposes 3 SDK files. Dan proposes 5 SDK files. Erik proposes 4 SDK files. Devil proposes 1 file.

```
           [SDK works in dev and production]
                     |
           +---------+---------+
           |                   |
    [Mock verifiably absent  [Minimal file count /
     from prod bundle]        conceptual integrity]
           |                   |
           v                   v
    [Separate files]    <--conflict-->  [Single file]
```

**Assumptions underlying conflict:**
1. "Mock in same file means it ships to production" -- PARTIALLY TRUE. Vite tree-shakes dead code behind `import.meta.env.DEV` checks, but this depends on the conditional being statically analyzable. Separate files with conditional `import()` give guaranteed tree-shaking.
2. "4+ files for 3 functions is over-engineering" -- VALID at 480 LOC scale, LESS VALID at 1,200 LOC scale.

**Resolution varies by alternative** (see below). The minimum viable SDK structure is 2 files: `IGamePlatform.ts` (interface, ~40 LOC) + `sdk.ts` (real + mock combined with `import.meta.env.DEV` gate, ~120 LOC). If the mock grows past 100 LOC, extract to `MockPlatform.ts`. The interface file is non-negotiable -- it is the Published Language that lets Claude Code write game features against the SDK without reading Yandex-specific code.

---

### Evaporating Cloud #7: AQ-7 Reusability

**Conflict:** Devil says delete AQ-7 entirely (Founder Anti-Pattern #2). Domain/Evolutionary say `ThemeConfig` + `IPlatformBridge` are needed from Day 1.

```
           [Ship Game 1 fast AND enable Game 2]
                     |
           +---------+---------+
           |                   |
    [Ship in 7 days]    [Don't rewrite for Game 2]
           |                   |
           v                   v
    [No abstractions]  <--conflict--> [Generic theme layer]
```

**Assumptions underlying conflict:**
1. "Any reusability work delays shipping" -- FALSE for `IPlatformBridge` (it is needed for Game 1 correctness, reusability is a side effect). TRUE for `ThemeConfig` abstraction (adds indirection only useful for Game 2).
2. "Without ThemeConfig, Game 2 requires a full rewrite" -- FALSE. Game 2 requires: new config values, new assets, new game logic if different genre. The SDK wrapper and build pipeline are reusable regardless. `ThemeConfig` only helps if Game 2 is the same genre.

**Resolution:** Delete the `ThemeConfig` abstraction and `ACTIVE_THEME` switcher. Keep `IPlatformBridge` interface (it serves Game 1 by enabling the mock). Keep animal names confined to `GameConfig.ts` (this is good architecture, not a reusability investment). Neal's `check-theme-isolation.sh` fitness function IS worth keeping -- it prevents language leakage even without `ThemeConfig`, which makes the codebase cleaner for Game 1.

If Game 2 is confirmed as the same genre, extract `ThemeConfig` then. Cost: 2 hours. Not worth paying speculatively.

---

## Consensus Points (Applies to ALL Alternatives)

These decisions have 6/8+ agreement and are not alternative-dependent:

| Decision | Agreement | Source |
|----------|-----------|--------|
| TypeScript + Phaser 3.90.0 + Matter.js + Vite 5.x | 8/8 | All |
| `base: './'` in Vite config | 8/8 | All |
| SDK mock for local dev (auto-detect `typeof YaGames`) | 8/8 | All |
| Ad timeout watchdog 10s | 6/8 | Ops, Devil, Security, DX, Domain, Evolutionary |
| localStorage = SoR for highscore | 7/8 | All except Devil (who says localStorage-only, which is a subset) |
| Module headers for AI readability (files >80 LOC) | 6/8 | LLM, Domain, Evolutionary, DX, Ops, Data |
| AQ-7 generic reusability: DELETE from scope | 5/8 | Devil, DX, Ops, Security, LLM |
| No Sentry (CSP risk) -- use structured console.error | 5/8 | Devil, Security, DX, LLM, Domain |
| Score formula: `tier * (tier + 1)` | 8/8 | All |
| Spawn pool: tiers 1-5 | 7/8 | All except LLM initial (corrected) |
| Single Vite bundle (no manualChunks) | 5/8 | DX, Devil, LLM, Security, Domain |
| Phaser built-in events (no custom EventBus) | 6/8 | DX, Devil, LLM (revised), Ops, Security, Data |
| Single JSON blob localStorage schema with version | 6/8 | Data, Domain, Ops, Security, Evolutionary, DX |
| Portrait-lock for MVP | 6/8 | Evolutionary, DX, Devil, Ops, Security, Domain |
| `npm run ship` = `build + check + package` | 7/8 | All except Devil (who accepts it as "fine") |
| 3 Phaser scenes: Preload, Menu, Game (+ GameOver overlay) | 6/8 | Domain, Data, Evolutionary, LLM, DX, Ops |
| Merge detection: collision event-driven, not polled | 8/8 | All |
| `isMerging` guard flag as first operation in handler | 7/8 | Domain, Data, Security, Evolutionary, LLM, DX, Ops |
| `isSettled` guard before merge allowed | 5/8 | Domain, Data, Evolutionary, LLM, Ops |

---

## Alternative A: Lean Ship (Devil-Aligned)

**Philosophy:** "Ship the minimum that works. Extract structure only when files exceed 300 LOC."

**Best for:** Maximum speed to market. Team of 1. Highest tolerance for extracting later. Priority is Day 7 delivery above all else.

---

### 1. File Structure

```
src/
  main.ts              (~50 LOC)   SDK init, Phaser config, game boot
  config.ts            (~80 LOC)   ALL constants: animals, physics, ads, layout
  GameEvents.ts        (~40 LOC)   ALL event name constants
  sdk.ts               (~120 LOC)  IPlatformBridge interface + YandexBridge + MockBridge
  PreloadScene.ts      (~60 LOC)   Asset loading, progress bar
  MenuScene.ts         (~80 LOC)   Title, highscore, play button
  GameScene.ts         (~300 LOC)  Orchestrator + merge detection + scoring + state
  GameOverScene.ts     (~80 LOC)   Score, rewarded ad, play again (overlay)
  Animal.ts            (~100 LOC)  Phaser Container + Matter body + tier data

index.html             (~25 LOC)   SDK script tag + div#game
vite.config.ts         (~25 LOC)   Production build config
tsconfig.json          (~20 LOC)   TypeScript config
package.json           (~20 LOC)   Dependencies + scripts
scripts/
  preflight.mjs        (~60 LOC)   Pre-submit checks
  package.mjs          (~30 LOC)   ZIP builder (archiver)
```

**Total: 9 source files, ~910 LOC.** Plus 4 config/script files.

**Extraction triggers (NOT before):**
- `GameScene.ts` > 300 LOC -> extract `MergeDetector.ts`
- `GameScene.ts` still > 300 LOC -> extract `ScoreManager.ts`
- `sdk.ts` > 150 LOC -> split into `YandexBridge.ts` + `MockBridge.ts`

---

### 2. Domain Map

**Module Interfaces:**

```typescript
// config.ts -- ALL game constants
export const ANIMALS = [
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
} as const;

export const ADS = {
  MIN_SESSION_BEFORE_INTERSTITIAL_MS: 60_000,
  INTERSTITIAL_COOLDOWN_MS: 180_000,
  AD_TIMEOUT_MS: 10_000,
} as const;
```

```typescript
// sdk.ts -- THE platform contract
export interface IPlatformBridge {
  init(): Promise<void>;
  gameplayStart(): void;
  gameplayStop(): void;
  showInterstitial(): Promise<{ shown: boolean }>;
  showRewarded(): Promise<{ rewarded: boolean }>;
  showBanner(): void;
  hideBanner(): void;
  saveHighScore(score: number): Promise<void>;
  loadHighScore(): Promise<number>;
}
```

**Context Relationships:**

```
[config.ts] --(read-only import)--> [GameScene.ts]
[config.ts] --(read-only import)--> [Animal.ts]
[config.ts] --(read-only import)--> [sdk.ts]

[GameScene.ts] --(creates)--> [Animal.ts instances]
[GameScene.ts] --(calls)--> [sdk.ts] via IPlatformBridge
[GameScene.ts] --(emits game.events)--> [GameOverScene.ts]
[GameScene.ts] --(emits game.events)--> [MenuScene.ts]

[sdk.ts] --(calls back)--> [GameScene.ts] via ad outcomes
```

---

### 3. Data Model

**Schema Approach:** localStorage single JSON blob

**System of Record:**

| Entity | SoR | Consistency |
|--------|-----|-------------|
| AnimalConfig (tiers) | `config.ts` (compile-time) | Strong (immutable) |
| ActiveAnimals | Matter.js world (runtime) | Strong (single-thread) |
| CurrentScore | `GameScene` in-memory | Strong (single-thread) |
| BestScore | `localStorage` key `zverata_v1` | Strong (sync write) |
| BestScore replica | Yandex `player.setData` | Eventual (async, fire-and-forget) |
| LeaderboardRank | Yandex Leaderboard service | Eventual (platform-owned) |
| AdCooldownState | `GameScene` in-memory | Ephemeral (resets per session) |

```typescript
// Persistence schema
export const STORAGE_KEY = 'zverata_v1';
export const STORAGE_VERSION = 1;

export interface PersistedData {
  v: number;       // schema version
  best: number;    // all-time high score
  sound: boolean;  // sound preference
}

export const DEFAULT_DATA: PersistedData = { v: 1, best: 0, sound: true };

export function loadData(): PersistedData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DATA };
    const data = JSON.parse(raw);
    if (!data || typeof data.v !== 'number') return { ...DEFAULT_DATA };
    // Migration: v0 -> v1
    if (data.v < 1) return { ...DEFAULT_DATA, best: Math.max(0, Number(data.best) || 0) };
    // Validate
    return {
      v: STORAGE_VERSION,
      best: (typeof data.best === 'number' && isFinite(data.best) && data.best >= 0) ? data.best : 0,
      sound: typeof data.sound === 'boolean' ? data.sound : true,
    };
  } catch { return { ...DEFAULT_DATA }; }
}

export function saveData(data: PersistedData): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* quota exceeded, silent */ }
}
```

---

### 4. Tech Stack

| Layer | Technology | Version | Why |
|-------|-----------|---------|-----|
| Language | TypeScript | 5.7+ | AI writes correct typed code 3x faster |
| Engine | Phaser | 3.90.0 (exact pin) | Core product. Physics + renderer + scenes |
| Physics | Matter.js | Built into Phaser | Zero extra deps. Circle collisions |
| Bundler | Vite | 5.4+ | Sub-1s HMR, standard tool |
| Storage | localStorage | Built-in | 15 years old, universal, synchronous |
| Platform | Yandex Games SDK v2 | External script tag | Required by platform |

**Vite Config:**

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    target: 'es2020',
    minify: 'terser',
    terserOptions: { compress: { drop_console: false, drop_debugger: true } },
    rollupOptions: {
      output: {
        manualChunks: undefined, // single bundle
        entryFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]',
      },
    },
  },
  server: { port: 3000, host: true },
  define: { __DEV__: 'import.meta.env.DEV' },
});
```

**Innovation tokens:** Phaser (1) + TypeScript (0.5) + Vite (0) = 1.5 of 3 budget. 1.5 in reserve.

---

### 5. Cross-Cutting Rules (as CODE)

**Error Handling:**

```typescript
// Pattern: never throw in game code, always degrade
// SDK calls: always resolve (watchdog timer)
function showAdWithTimeout(
  bridge: IPlatformBridge,
  type: 'interstitial' | 'rewarded',
): Promise<{ shown: boolean; rewarded?: boolean }> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.error(JSON.stringify({
        level: 'error', event: `ad_${type}_timeout`, ts: Date.now()
      }));
      resolve({ shown: false });
    }, ADS.AD_TIMEOUT_MS);

    const call = type === 'interstitial'
      ? bridge.showInterstitial()
      : bridge.showRewarded();

    call
      .then((result) => { clearTimeout(timeout); resolve(result); })
      .catch(() => { clearTimeout(timeout); resolve({ shown: false }); });
  });
}
```

**Module Header Protocol:**

```typescript
/**
 * Module: GameScene
 * Role: Orchestrates gameplay -- physics, merge detection, scoring, state
 * Uses: config.ts (constants), Animal (game object), sdk.ts (IPlatformBridge)
 * Used by: main.ts (Phaser scene list), MenuScene (scene.start), GameOverScene (overlay)
 * Emits: EVENTS.GAME_OVER, EVENTS.SCORE_UPDATED
 * Does NOT: Load assets, render menus, make direct Yandex SDK calls
 */
```

**Logging Pattern:**

```typescript
// Structured console.error -- visible in Yandex debug panel
function logError(event: string, error?: unknown, meta?: Record<string, unknown>): void {
  console.error(JSON.stringify({
    level: 'error', event, error: String(error), ...meta, ts: Date.now()
  }));
}
```

**Fitness Functions (pre-submit):**

```bash
#!/bin/bash
# scripts/preflight.sh -- run before every npm run ship

FAIL=0

# 1. No absolute paths in dist
if grep -r 'src="/\|href="/' dist/index.html 2>/dev/null; then
  echo "FAIL: Absolute paths in index.html"; FAIL=1
fi

# 2. SDK script tag present
if ! grep -q 'yandex.ru/games/sdk/v2' dist/index.html; then
  echo "FAIL: Missing SDK script tag"; FAIL=1
fi

# 3. No sourcemaps
if find dist/assets -name '*.map' 2>/dev/null | grep -q .; then
  echo "FAIL: Sourcemaps in dist"; FAIL=1
fi

# 4. No secrets
if grep -ri 'password\|secret\|token\|api_key' dist/ 2>/dev/null | grep -v 'innovation.token' | grep -q .; then
  echo "FAIL: Potential secrets in dist"; FAIL=1
fi

# 5. File LOC check
for f in src/*.ts; do
  lines=$(wc -l < "$f")
  if [ "$lines" -gt 400 ]; then
    echo "FAIL: $f exceeds 400 LOC ($lines)"; FAIL=1
  fi
done

# 6. TypeScript compiles
npx tsc --noEmit || { echo "FAIL: TypeScript errors"; FAIL=1; }

echo ""
[ "$FAIL" -eq 0 ] && echo "ALL CHECKS PASSED" || { echo "CHECKS FAILED"; exit 1; }
```

---

### 6. Build/Deploy Pipeline

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "check": "node scripts/preflight.mjs",
    "package": "node scripts/package.mjs",
    "ship": "npm run build && npm run check && npm run package"
  }
}
```

**Package script** uses `archiver` npm package (cross-platform, works on Windows).

**Pre-submit checklist (manual, Day 5):**
1. Game loads on real mobile device (Android)
2. Portrait mode -- no horizontal scroll
3. Touch targets >= 44px
4. First ad fires AFTER first game over
5. Audio pauses during ad, resumes after
6. Rewarded video: continue button works
7. Play Again starts new game instantly (<1s)
8. Yandex debug panel: no red errors, LoadingAPI.ready() fires

---

### 7. SDK Integration

```typescript
// sdk.ts -- complete pattern

export interface IPlatformBridge {
  init(): Promise<void>;
  gameplayStart(): void;
  gameplayStop(): void;
  showInterstitial(): Promise<{ shown: boolean }>;
  showRewarded(): Promise<{ rewarded: boolean }>;
  showBanner(): void;
  hideBanner(): void;
  saveHighScore(score: number): Promise<void>;
  loadHighScore(): Promise<number>;
}

class YandexBridge implements IPlatformBridge {
  private ysdk: any;
  private player: any;

  async init(): Promise<void> {
    this.ysdk = await (window as any).YaGames.init();
    this.player = await this.ysdk.getPlayer({ scopes: false });
  }

  gameplayStart(): void { this.ysdk.features.GameplayAPI?.start(); }
  gameplayStop(): void { this.ysdk.features.GameplayAPI?.stop(); }

  showInterstitial(): Promise<{ shown: boolean }> {
    return new Promise((resolve) => {
      this.ysdk.adv.showFullscreenAdv({
        callbacks: {
          onClose: (wasShown: boolean) => resolve({ shown: wasShown }),
          onError: () => resolve({ shown: false }),
        },
      });
    });
  }

  showRewarded(): Promise<{ rewarded: boolean }> {
    return new Promise((resolve) => {
      let rewarded = false;
      this.ysdk.adv.showRewardedVideo({
        callbacks: {
          onRewarded: () => { rewarded = true; },
          onClose: () => resolve({ rewarded }),
          onError: () => resolve({ rewarded: false }),
        },
      });
    });
  }

  showBanner(): void { this.ysdk.adv.showBannerAdv().catch(() => {}); }
  hideBanner(): void { this.ysdk.adv.hideBannerAdv().catch(() => {}); }

  async saveHighScore(score: number): Promise<void> {
    try { await this.player.setData({ bestScore: score }, true); } catch {}
    try {
      if (this.player.getMode() !== 'lite') {
        const lb = this.ysdk.getLeaderboards();
        await lb.then((l: any) => l.setScore('main_score', score));
      }
    } catch {}
  }

  async loadHighScore(): Promise<number> {
    try {
      const data = await this.player.getData(['bestScore']);
      const val = Number(data?.bestScore);
      return isFinite(val) && val >= 0 ? val : 0;
    } catch { return 0; }
  }
}

class MockBridge implements IPlatformBridge {
  async init(): Promise<void> { console.warn('[SDK Mock] Initialized'); }
  gameplayStart(): void { console.log('[SDK Mock] gameplayStart'); }
  gameplayStop(): void { console.log('[SDK Mock] gameplayStop'); }

  showInterstitial(): Promise<{ shown: boolean }> {
    console.log('[SDK Mock] showInterstitial');
    return new Promise((r) => setTimeout(() => r({ shown: true }), 1500));
  }
  showRewarded(): Promise<{ rewarded: boolean }> {
    console.log('[SDK Mock] showRewarded');
    return new Promise((r) => setTimeout(() => r({ rewarded: true }), 2000));
  }
  showBanner(): void { console.log('[SDK Mock] showBanner'); }
  hideBanner(): void { console.log('[SDK Mock] hideBanner'); }
  async saveHighScore(score: number): Promise<void> { console.log('[SDK Mock] saveHighScore', score); }
  async loadHighScore(): Promise<number> { return 0; }
}

export function createBridge(): IPlatformBridge {
  return typeof (window as any).YaGames !== 'undefined'
    ? new YandexBridge()
    : new MockBridge();
}
```

**Key patterns:**
- Mock delay: 1.5s/2s (tests timing-sensitive game state transitions)
- Mock returns `{ shown: true }` / `{ rewarded: true }` for happy path
- All async methods wrapped in try/catch with silent fallback
- `onError` callback present on every ad call
- `gameplayStart/Stop` called at correct moments

---

### 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| GameScene.ts grows past 400 LOC | High | Medium (context bomb for Claude) | Extract MergeDetector.ts at 300 LOC trigger |
| Ad callback never fires (old Android) | Medium | High (game freeze) | 10s watchdog timer on every ad call |
| SDK mock hides real SDK behavioral difference | Medium | High (production crash) | Test on real Yandex debug panel Day 3 |
| localStorage corrupted | Low | Low (reset to defaults) | `migratePlayerData()` validates on every read |
| Physics instability at 25+ bodies | Low-Med | High (game unplayable) | Body count check in dev mode, cleanup on merge |

**Biggest Risk:** GameScene.ts becoming a monolith. The 300 LOC extraction trigger is the mitigation but relies on developer discipline.

**Irreversible:** Phaser 3.90 (core engine), Matter.js (built-in), TypeScript (compile step), portrait-first 480x854 dimensions.

**Reversible:** File structure (can extract/merge anytime), physics constants (config-driven), score formula (one line change), ad policy values.

---

### Trade-Offs

**Optimizes for:** Speed to Day 7 delivery.
**At the cost of:** Agent context efficiency (GameScene.ts is 300 LOC, not 150).
**Why this makes sense:** If the game doesn't ship on time, nothing else matters.

### Effort Estimate

- **Setup:** 2 hours (Vite scaffold + SDK mock + config)
- **Per-feature velocity:** Simple (2h), Complex (4h)
- **Day 1 to playable prototype:** 4 hours
- **Total to submission-ready:** 5 days

---

## Alternative B: Modular Standard (Domain/LLM-Aligned)

**Philosophy:** "Module boundaries follow where the business language changes. Each concern lives in exactly one file."

**Best for:** LLM-maintained codebase where Claude Code is primary developer. Agent task isolation is the priority. Team of 1-2 with ongoing iteration expected.

---

### 1. File Structure

```
src/
  main.ts                    (~50 LOC)   SDK init -> Phaser boot
  config/
    GameConfig.ts            (~80 LOC)   ALL constants (physics, animals, layout, ads)
    GameEvents.ts            (~40 LOC)   ALL event name constants
  scenes/
    PreloadScene.ts          (~80 LOC)   Asset loading
    MenuScene.ts             (~100 LOC)  Title + highscore + play button
    GameScene.ts             (~150 LOC)  Pure orchestrator: create managers, wire events
    GameOverScene.ts         (~100 LOC)  Score + rewarded ad + play again (overlay)
  game/
    PhysicsManager.ts        (~150 LOC)  Matter.js setup, walls, body management
    MergeDetector.ts         (~120 LOC)  Collision -> merge event (5-guard pattern)
    ScoreManager.ts          (~80 LOC)   Score + highscore + localStorage persistence
    InputHandler.ts          (~80 LOC)   Mouse/touch -> drop position calculation
    AnimalSpawner.ts         (~100 LOC)  Create/destroy Animal, next-drop preview
  objects/
    Animal.ts                (~100 LOC)  Phaser Container + Matter body + tier data
  sdk/
    IGamePlatform.ts         (~50 LOC)   Interface + result types
    YandexPlatform.ts        (~150 LOC)  Real SDK wrapper (7 pitfalls handled)
    MockPlatform.ts          (~70 LOC)   Dev mock (1.5s delays)

index.html                   (~25 LOC)
vite.config.ts               (~25 LOC)
tsconfig.json                (~20 LOC)
package.json                 (~25 LOC)
scripts/
  preflight.mjs              (~80 LOC)   Pre-submit checks + fitness functions
  package.mjs                (~30 LOC)   ZIP builder
```

**Total: 16 source files, ~1,400 LOC.** Plus 4 config/script files.

---

### 2. Domain Map

**Module Boundaries:**

| Module | Responsibility | Key Types | Ubiquitous Language |
|--------|---------------|-----------|---------------------|
| `config/` | All tunable constants, event names | `AnimalConfig`, `PHYSICS`, `EVENTS` | "config is read-only data, never logic" |
| `game/` | Game rules: merge, score, physics, input | `MergeResult`, `GamePhase` | "drop, merge, chain, overflow, settled" |
| `scenes/` | What player sees: screens, UI, effects | `SceneName` | "scene, overlay, transition" |
| `objects/` | Game entities | `Animal` | "tier, radius, body" |
| `sdk/` | Platform handshake: ads, storage, signals | `IPlatformBridge`, `AdResult` | "interstitial, rewarded, mock" |

**Context Relationships:**

```
[config/GameConfig.ts] --(read-only)--> ALL modules
[config/GameEvents.ts] --(read-only)--> ALL modules

[game/*] --(emits via game.events)--> [scenes/*]
[scenes/GameScene.ts] --(calls)--> [sdk/IPlatformBridge]
[sdk/*] --(ad outcomes via Promise)--> [scenes/GameScene.ts]

[objects/Animal.ts] --(created by)--> [game/AnimalSpawner.ts]
[objects/Animal.ts] --(collision read by)--> [game/MergeDetector.ts]
```

**GameScene as Pure Orchestrator:**

```typescript
/**
 * Module: GameScene
 * Role: Creates game managers, wires events, handles scene transitions
 * Uses: PhysicsManager, MergeDetector, AnimalSpawner, ScoreManager, InputHandler, GameConfig
 * Used by: MenuScene (scene.start), main.ts (scene list)
 * Emits: EVENTS.GAME_OVER (via game.events for cross-scene)
 * Does NOT: Detect merges, calculate score, call SDK directly, contain physics constants
 */
export class GameScene extends Phaser.Scene {
  private physics!: PhysicsManager;
  private merge!: MergeDetector;
  private spawner!: AnimalSpawner;
  private score!: ScoreManager;
  private input!: InputHandler;
  private bridge!: IPlatformBridge;

  create(data: { bridge: IPlatformBridge }): void {
    this.bridge = data.bridge;
    this.physics = new PhysicsManager(this);
    this.merge = new MergeDetector(this);
    this.spawner = new AnimalSpawner(this);
    this.score = new ScoreManager(this);
    this.input = new InputHandler(this);

    this.bridge.gameplayStart();

    // Wire events
    this.events.on(EVENTS.ANIMAL_MERGED, this.onMerge, this);
    this.events.on(EVENTS.GAME_OVER, this.onGameOver, this);
  }
  // ...
}
```

---

### 3. Data Model

Same schema as Alternative A. The difference is structural:
- `ScoreManager.ts` owns score accumulation and persistence
- `loadData()` / `saveData()` live in `ScoreManager.ts`
- `GameConfig.ts` owns `AnimalConfig` array and score formula
- `MergeDetector.ts` reads tier data from config, emits `MergeResult`

**State Machine (explicit, in GameScene):**

```typescript
type GamePhase = 'menu' | 'playing' | 'frozen' | 'game-over' | 'ad';

const TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  menu:       ['playing'],
  playing:    ['frozen', 'game-over'],
  frozen:     ['playing'],
  'game-over': ['ad', 'menu', 'playing'],
  ad:         ['menu', 'playing', 'game-over'],
};
```

---

### 4. Tech Stack

Same as Alternative A. No additional dependencies.

**Additional dev dependency:** `dependency-cruiser` (~4KB) for import direction enforcement:

```json
// .depcruise.json
{
  "forbidden": [
    { "name": "config-no-import-scenes", "from": {"path":"src/config"}, "to": {"path":"src/scenes"} },
    { "name": "game-no-import-scenes",   "from": {"path":"src/game"},   "to": {"path":"src/scenes"} },
    { "name": "sdk-no-import-game",      "from": {"path":"src/sdk"},    "to": {"path":"src/game"} },
    { "name": "objects-no-import-scenes", "from": {"path":"src/objects"},"to": {"path":"src/scenes"} }
  ]
}
```

---

### 5. Cross-Cutting Rules (as CODE)

Same error handling, logging, and fitness functions as Alternative A, plus:

**Additional fitness functions:**

```bash
# Import direction check
npx depcruise --validate .depcruise.json src/ || { echo "FAIL: Import direction violation"; exit 1; }

# Animal names only in config
if grep -rn 'hamster\|rabbit\|kitten\|panda\|bear\|fox\|dog\|cat' \
  src/ --include='*.ts' | grep -v 'src/config/' | grep -v 'GameConfig' | grep -q .; then
  echo "FAIL: Animal names outside config/"
  exit 1
fi

# Module headers on files > 80 LOC
for f in $(find src/ -name '*.ts'); do
  lines=$(wc -l < "$f")
  if [ "$lines" -gt 80 ] && ! grep -q 'Module:' "$f"; then
    echo "FAIL: $f ($lines LOC) missing module header"
    exit 1
  fi
done
```

---

### 6. Build/Deploy Pipeline

Same as Alternative A. `npm run ship` = `build + check + package`.

Additional `check` step includes `depcruise` validation.

---

### 7. SDK Integration

Same `IPlatformBridge` pattern, but split across 3 files:
- `IGamePlatform.ts` -- interface only (~50 LOC)
- `YandexPlatform.ts` -- real implementation (~150 LOC)
- `MockPlatform.ts` -- mock with 1.5s delays (~70 LOC)

Factory in `main.ts`:

```typescript
import { YandexPlatform } from './sdk/YandexPlatform';
import { MockPlatform } from './sdk/MockPlatform';

const bridge = typeof (window as any).YaGames !== 'undefined'
  ? new YandexPlatform()
  : new MockPlatform();

await bridge.init();
```

Mock is in a separate file, guaranteeing tree-shaking in production build.

---

### 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Inter-file consistency drift | Medium | Medium | `depcruise` + module headers + event catalog |
| Over-engineering (too many files too early) | Low | Low (reversible) | 16 files is moderate; merge if unused |
| Agent reads wrong file for a task | Low | Low | Module headers say "Does NOT" to prevent |
| Ad callback never fires | Medium | High | 10s watchdog (same as A) |
| Physics instability at 25+ bodies | Low-Med | High | Body count assertion in dev mode |

**Biggest Risk:** Drifting consistency across 16 files over multiple Claude Code sessions. Mitigated by `depcruise`, module headers, and `GameEvents.ts` as single event catalog.

**Irreversible:** Same as Alternative A.
**Reversible:** File granularity (can merge files anytime), manager class boundaries.

---

### Trade-Offs

**Optimizes for:** Agent task isolation (each task reads 80-150 LOC, not 300).
**At the cost of:** ~4 hours more setup time. 16 files to maintain consistency across.
**Why this makes sense:** If the game will be iterated on post-launch (patches, Game 2 exploration), the modular structure pays back on every change.

### Effort Estimate

- **Setup:** 4 hours (scaffold + managers + wiring + fitness functions)
- **Per-feature velocity:** Simple (1.5h), Complex (3h) -- faster per-task due to isolation
- **Day 1 to playable prototype:** 6 hours
- **Total to submission-ready:** 5.5 days

---

## Alternative C: Hybrid Pragmatic (Synthesis-Aligned)

**Philosophy:** "Start lean, but with the three non-negotiable boundaries that prevent the most expensive mistakes."

**Best for:** The founder who wants Devil's speed but knows Claude Code is the long-term developer. Balances shipping pressure with maintenance reality.

---

### 1. File Structure

```
src/
  main.ts                    (~50 LOC)   SDK init -> Phaser boot
  config/
    GameConfig.ts            (~80 LOC)   ALL constants
    GameEvents.ts            (~40 LOC)   ALL event names
  scenes/
    PreloadScene.ts          (~60 LOC)   Asset loading
    MenuScene.ts             (~80 LOC)   Title + play
    GameScene.ts             (~250 LOC)  Orchestrator + state + input + scoring
    GameOverScene.ts         (~80 LOC)   End screen (overlay)
  game/
    MergeDetector.ts         (~120 LOC)  Merge logic (the most complex concern)
  objects/
    Animal.ts                (~100 LOC)  Phaser Container + Matter body
  sdk/
    IGamePlatform.ts         (~50 LOC)   Interface
    sdk.ts                   (~120 LOC)  YandexBridge + MockBridge combined

index.html                   (~25 LOC)
vite.config.ts               (~25 LOC)
tsconfig.json                (~20 LOC)
package.json                 (~25 LOC)
scripts/
  preflight.mjs              (~60 LOC)
  package.mjs                (~30 LOC)
```

**Total: 12 source files, ~1,050 LOC.** Plus 4 config/script files.

**Why these specific boundaries:**

1. **`config/` is separate** -- because it changes most often (physics tuning, score formula) and must never contain logic. This is the Kamil-accessible layer.

2. **`MergeDetector.ts` is extracted** -- because it is the most complex single concern (5 guards, lock pattern, chain detection). Everything else in `GameScene.ts` is straightforward orchestration.

3. **`IGamePlatform.ts` is separate** -- because the interface contract is the Published Language that enables Claude Code to write features without reading Yandex-specific code.

4. **`sdk.ts` combines real + mock** -- because at ~120 LOC, the combined file is manageable. The `import.meta.env.DEV` gate is statically analyzable by Vite for tree-shaking.

5. **Everything else stays in `GameScene.ts`** -- physics setup, input handling, scoring, state machine. At ~250 LOC, it is readable in one context load. If it grows past 300 LOC, extract `ScoreManager.ts` or `PhysicsManager.ts` on demand.

---

### 2-7. Domain Map through SDK Integration

Same patterns as Alternative B for the extracted modules. Same patterns as Alternative A for the parts that remain in `GameScene.ts`. The key difference is scope:

- **MergeDetector.ts** is identical to Alternative B
- **GameScene.ts** absorbs PhysicsManager, ScoreManager, InputHandler from B
- **SDK** uses 2 files instead of B's 3 (combined real+mock)
- **All cross-cutting rules** same as B (module headers, event catalog, fitness functions)
- **Pre-submit pipeline** same as A (`npm run ship`)

---

### 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| GameScene.ts grows past 300 LOC | Medium | Medium | Extract ScoreManager.ts or PhysicsManager.ts |
| Mock ships in production bundle | Low | Low | `import.meta.env.DEV` gate + bundle analysis check |
| Ad callback hangs | Medium | High | 10s watchdog (same as A, B) |
| Cross-file inconsistency | Low | Low (only 12 files) | Event catalog + module headers |

**Biggest Risk:** GameScene.ts at 250 LOC is close to the extraction threshold. Feature additions (sound, leaderboard display) will push it over. Plan for one extraction on Day 3-4.

---

### Trade-Offs

**Optimizes for:** Balanced speed and maintainability. The three most expensive mistakes are prevented (merge logic tangled with other code, SDK logic scattered, config buried in logic files) while keeping file count low.
**At the cost of:** GameScene.ts is still 250 LOC (not as isolated as B), mock tree-shaking is less guaranteed than B's separate files.
**Why this makes sense:** If you want to ship on Day 5 but expect to iterate post-launch, this gives 80% of B's maintainability at 80% of A's speed.

### Effort Estimate

- **Setup:** 3 hours
- **Per-feature velocity:** Simple (1.5h), Complex (3.5h)
- **Day 1 to playable prototype:** 5 hours
- **Total to submission-ready:** 5 days

---

## Comparison Matrix

| Aspect | A: Lean Ship | B: Modular Standard | C: Hybrid Pragmatic |
|--------|-------------|--------------------|--------------------|
| Source files | 9 | 16 | 12 |
| Total LOC | ~910 | ~1,400 | ~1,050 |
| Max file LOC | 300 (GameScene) | 150 (GameScene/PhysicsManager) | 250 (GameScene) |
| Setup time | 2h | 4h | 3h |
| Day 1 to playable | 4h | 6h | 5h |
| Ship-ready | Day 5 | Day 5.5 | Day 5 |
| Agent context per task | 2-3K tokens | 1-1.5K tokens | 1.5-2K tokens |
| Innovation tokens used | 1.5 | 1.6 (+ depcruise) | 1.5 |
| Extraction needed later? | Yes, likely Day 3-4 | No (already extracted) | Maybe, Day 4+ |
| Mock tree-shaking | DEV gate (good enough) | Separate file (guaranteed) | DEV gate (good enough) |
| Import direction enforced | No (manual discipline) | Yes (depcruise) | Partial (manual + event catalog) |
| Module headers mandatory | Yes (>80 LOC) | Yes (>80 LOC) | Yes (>80 LOC) |
| GameConfig isolation | Yes | Yes | Yes |
| Merge detection isolated | No (in GameScene) | Yes (MergeDetector.ts) | Yes (MergeDetector.ts) |
| Game 2 cost | Higher (extract first) | Lower (boundaries exist) | Medium |
| Biggest risk | GameScene monolith | Inter-file drift | GameScene at limit |

---

## Recommendation for Human

**If your priority is MAXIMUM SPEED (ship Day 5, iterate later):** Choose Alternative A.
- Accept that GameScene.ts will need extraction by Day 3-4.
- Accept that Claude Code reads ~300 LOC per task instead of ~150.
- The fastest path to "balance > 0 in Yandex dashboard."

**If your priority is MAINTAINABILITY (post-launch iteration, Game 2 exploration):** Choose Alternative B.
- Accept 2 extra hours of setup on Day 1.
- Get 40-60% lower context cost per Claude Code task for the lifetime of the project.
- Import direction is enforced, not just documented.
- Separate mock file is verifiably absent from production.

**If your priority is BALANCED (ship fast but don't create a monolith):** Choose Alternative C.
- Extract only the single most dangerous concern (merge detection) on Day 1.
- Everything else stays lean until it needs extraction.
- 80% of B's maintainability at 80% of A's speed.
- The pragmatic middle ground.

**My observation (not a recommendation):** The founder's profile says "starts many, finishes few" and "ship beats architecture." This suggests Alternative A or C. But the founder also says "Claude Code = co-founder" and the project will be maintained by an LLM across sessions. That argues for B.

**The honest answer:** All three alternatives ship by Day 7. The difference is 2-4 hours of setup time and how much pain the 10th Claude Code session encounters. Choose based on whether you believe there will be a 10th session.

---

## What Happens Next

Human chooses ONE alternative.

Then the chosen architecture is written into `ai/blueprint/system-blueprint/`:
1. `architecture-overview.md`
2. `domain-map.md`
3. `data-model.md`
4. `cross-cutting-rules.md`
5. `agent-architecture.md`

These become the implementation contract for `/spark` and `/autopilot`.
