# Cross-Cutting Rules — Zverata

**Date:** 2026-03-04
**Architecture:** B — Modular Standard
**Source:** ai/architect/architectures.md

---

## All rules are CODE, not prose. Copy-paste ready.

---

## 1. Error Handling

**Rule:** Never throw in game code. Always degrade gracefully.

```typescript
// Pattern: SDK calls always resolve
function showAdWithTimeout(
  bridge: IPlatformBridge,
  type: 'interstitial' | 'rewarded',
): Promise<{ shown: boolean; rewarded?: boolean }> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      logError(`ad_${type}_timeout`);
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

**Pattern: localStorage always degrades to defaults**

```typescript
function loadData(): PersistedData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DATA };
    const data = JSON.parse(raw);
    // validate every field...
    return validated;
  } catch { return { ...DEFAULT_DATA }; }
}

function saveData(data: PersistedData): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* silent */ }
}
```

---

## 2. Logging

**No Sentry.** Structured `console.error` with JSON payloads visible in Yandex debug panel.

```typescript
// Shared utility — can live in main.ts or a small utils.ts

function logError(event: string, error?: unknown, meta?: Record<string, unknown>): void {
  console.error(JSON.stringify({
    level: 'error',
    event,
    error: String(error),
    ...meta,
    ts: Date.now(),
  }));
}
```

**Global error capture:**

```typescript
// main.ts — top of file

window.onerror = (msg, src, line, col, err) => {
  logError('uncaught_error', err, { msg: String(msg), src: String(src), line, col });
};

window.onunhandledrejection = (e) => {
  logError('unhandled_rejection', e.reason);
};
```

---

## 3. Module Header Protocol

**Required on every file > 80 LOC.**

```typescript
/**
 * Module: {FileName}
 * Role: {one sentence}
 * Uses: {dependencies}
 * Used by: {dependents}
 * Emits: {events emitted, if any}
 * Does NOT: {explicit exclusions — prevents scope creep}
 */
```

**Example:**

```typescript
/**
 * Module: MergeDetector
 * Role: Listens for Matter.js collisions, validates merge conditions, emits merge events
 * Uses: config/GameConfig (ANIMALS), config/GameEvents (EVENTS), objects/Animal
 * Used by: scenes/GameScene (creates and wires)
 * Emits: EVENTS.ANIMAL_MERGED (payload: MergeResult)
 * Does NOT: Create or destroy Animals, calculate score, handle input
 */
```

---

## 4. State Machine Pattern

```typescript
type GamePhase = 'menu' | 'playing' | 'frozen' | 'game-over' | 'ad';

const TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  menu:       ['playing'],
  playing:    ['frozen', 'game-over'],
  frozen:     ['playing'],
  'game-over': ['ad', 'menu', 'playing'],
  ad:         ['menu', 'playing', 'game-over'],
};

function canTransition(from: GamePhase, to: GamePhase): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}
```

**Rule:** All state changes go through `canTransition()`. No direct assignment of phase.

---

## 5. Merge Detection Invariant (5-Guard Pattern)

The single most critical runtime check. Must pass ALL 5 guards before merging:

```typescript
// game/MergeDetector.ts — inside collision handler

function shouldMerge(animalA: Animal, animalB: Animal): boolean {
  // Guard 1: Both are Animals (not walls)
  if (!animalA || !animalB) return false;

  // Guard 2: Same tier
  if (animalA.tier !== animalB.tier) return false;

  // Guard 3: Neither is already merging
  if (animalA.isMerging || animalB.isMerging) return false;

  // Guard 4: Not final tier (Bear)
  if (animalA.tier >= ANIMALS.length) return false;

  // Guard 5: Both are settled (not still falling)
  if (!animalA.isSettled || !animalB.isSettled) return false;

  return true;
}
```

**On merge trigger:**
1. Set `isMerging = true` on BOTH animals FIRST (prevents double-merge)
2. Calculate merge position (midpoint)
3. Destroy both old animals
4. Spawn new animal (tier + 1) at merge position
5. Emit `EVENTS.ANIMAL_MERGED` with `MergeResult`

---

## 6. Ad Policy Rules

| Rule | Value | Why |
|------|-------|-----|
| No ads before first game over | — | #1 cause of uninstall for 55+ (Business Blueprint Decision #10) |
| Min session before interstitial | 60,000 ms | Platform best practice |
| Interstitial cooldown | 180,000 ms | Anti-spam |
| Rewarded = player-initiated only | — | 55+ tolerant when they choose (AARP data) |
| Ad timeout watchdog | 10,000 ms | Prevents game freeze |
| Audio pause during ad | — | Yandex SDK Pitfall #3 |

---

## 7. Fitness Functions (Pre-Submit Checks)

```bash
#!/bin/bash
# scripts/preflight.mjs — run as part of `npm run ship`

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

# 5. File LOC check (400 max for src, 600 for tests)
for f in $(find src/ -name '*.ts'); do
  lines=$(wc -l < "$f")
  if [ "$lines" -gt 400 ]; then
    echo "FAIL: $f exceeds 400 LOC ($lines)"; FAIL=1
  fi
done

# 6. TypeScript compiles
npx tsc --noEmit || { echo "FAIL: TypeScript errors"; FAIL=1; }

# 7. Import direction (dependency-cruiser)
npx depcruise --validate .depcruise.json src/ || { echo "FAIL: Import direction violation"; FAIL=1; }

# 8. Animal names only in config/
if grep -rn 'hamster\|rabbit\|kitten\|panda\|bear\|fox\|dog\|cat' \
  src/ --include='*.ts' | grep -v 'src/config/' | grep -v 'GameConfig' | grep -q .; then
  echo "FAIL: Animal names outside config/"
  FAIL=1
fi

# 9. Module headers on files > 80 LOC
for f in $(find src/ -name '*.ts'); do
  lines=$(wc -l < "$f")
  if [ "$lines" -gt 80 ] && ! grep -q 'Module:' "$f"; then
    echo "FAIL: $f ($lines LOC) missing module header"
    FAIL=1
  fi
done

echo ""
[ "$FAIL" -eq 0 ] && echo "ALL CHECKS PASSED" || { echo "CHECKS FAILED"; exit 1; }
```

---

## 8. Responsive Design

**Portrait-lock: 480x854.**

```typescript
// Phaser config in main.ts

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME.WIDTH,   // 480
  height: GAME.HEIGHT, // 854
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: PHYSICS.GRAVITY_Y },
      debug: __DEV__,
    },
  },
  scene: [PreloadScene, MenuScene, GameScene, GameOverScene],
};
```

**Rule:** No landscape mode for MVP. `Scale.FIT` handles all aspect ratios by letterboxing.

---

## 9. Build Pipeline

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

**`npm run ship`** = single command from source to Yandex-ready ZIP.

**Vite config:**

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
        manualChunks: undefined,  // single bundle
        entryFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]',
      },
    },
  },
  server: { port: 3000, host: true },
  define: { __DEV__: 'import.meta.env.DEV' },
});
```

---

## 10. Innovation Token Budget

| Technology | Tokens | Status |
|-----------|--------|--------|
| Phaser 3.90 | 1.0 | Core engine — unavoidable |
| TypeScript | 0.5 | Standard, near-zero risk |
| Vite | 0.0 | Industry standard bundler |
| **Total** | **1.5** | **Budget: 3. Reserve: 1.5** |

**Rule:** No new dependencies without burning an innovation token. Evaluate before adding.
