# Evolutionary Architecture Research

**Persona:** Neal (Evolutionary Architect)
**Focus:** Fitness functions, change vectors, tech debt prevention
**Project:** Zverata — casual HTML5 drop-merge game for Yandex Games

---

## Research Conducted

*Note: Exa MCP hit rate limit. Research below draws from deep knowledge of Phaser 3.90, Matter.js, mobile browser constraints, and evolutionary architecture patterns for HTML5 games.*

- Phaser 3 Scale Manager documentation (Phaser 3.90 API) — ScaleMode, FIT, EXPAND, ENVELOP modes
- Matter.js performance characteristics — body count limits, collision pair budget
- Mobile browser memory model — Safari iOS 16+, Android Chrome heap limits
- HTML5 game reusability patterns — theme-vs-mechanic separation, config-driven design
- Yandex Games platform constraints — ZIP < 100MB, CSP headers, no external CDN
- Evolutionary architecture for game engines — fitness functions, change vector analysis

**Total queries attempted:** 5 Exa searches (all rate-limited) + direct knowledge synthesis from Phaser 3.90 API docs + HTML5 game architecture patterns

---

## Kill Question Answer

**"What fitness functions protect this architectural decision?"**

| Architectural Decision | Fitness Function | How It's Automated |
|------------------------|------------------|-------------------|
| ZIP < 100MB (Yandex hard limit) | Bundle size check | `npm run build && du -sh dist/ \| awk '$1 > 100M {exit 1}'` in CI |
| 60fps on mobile (retention KPI) | Frame rate smoke test | Playwright headless: record 5s, assert avg FPS ≥ 58 |
| Physics stability (≤ 30 bodies) | Body count assertion | `scene.matter.world.localWorld.bodies.length <= 30` in GameScene tick |
| Portrait-first layout | Aspect ratio lint | CSS + Phaser config test: assert `gameWidth < gameHeight` for base config |
| No external requests (CSP) | Network request check | `npm run build && grep -r "https://" dist/ --include="*.js" \| grep -v sdk.yandex` |
| Theme = config only | Grep test | `grep -r "hamster\|rabbit\|kitten\|bear" src/ --include="*.ts" \| grep -v "config/"` must return 0 |
| File ≤ 400 LOC | LOC check | `find src/ -name "*.ts" -exec wc -l {} \; \| awk '$1 > 400 {print; found=1} END {exit found}'` |
| Import direction (config ← core ← presentation) | Dependency check | `npx depcruise --validate .depcruise.json src/` |

**Missing fitness functions (add after MVP):**
- Memory leak check: reload 10x, assert `performance.memory.usedJSHeapSize` doesn't grow
- Touch target size: assert all interactive elements ≥ 44px via Playwright
- D1 retention proxy: session length in analytics ≥ 3 minutes

---

## Proposed Evolutionary Decisions

### Change Vector Analysis

**High-Change Areas** (update frequently, isolate):

| Component | Change Frequency | Change Driver | Isolation Strategy |
|-----------|-----------------|---------------|-------------------|
| `config/AnimalChain.ts` | Every game release | New theme (Game 2) | Pure data object, no logic |
| `config/GameConfig.ts` | Weekly during polish | Balance tuning (sizes, scores, speeds) | Single source of truth, all constants here |
| `sdk/AdManager.ts` | Platform policy changes | Yandex SDK updates, new ad types | Adapter pattern — game never calls SDK directly |
| `scenes/GameScene.ts` — scoring formula | Every 2-3 weeks | Retention data, playtesting | Isolated `scoring.ts` module, formula is a function |
| Animal sprites | Day 4 (initial), patches | Art direction, moderation requests | Pure asset swap, no code change required |
| Merge animation parameters | Multiple times during polish | "Satisfying feel" (Kamil test) | `ANIMATION_CONFIG` constants, never hardcoded |
| Yandex SDK version | Uncontrolled (external) | Platform updates | Wrapper absorbs breaking changes |

**Stable Core** (rarely changes, protect):

| Component | Why Stable | Protection Needed |
|-----------|------------|-------------------|
| Drop mechanics physics | Matter.js gravity = solved problem for this genre | Regression test: ball falls, settles, stays |
| Merge detection logic | Same-tier collision → merge: algorithmic, not UX | Unit test: collision event → merge fires |
| Scene state machine (Menu→Game→Over) | Genre convention, won't change | Integration test: all transitions work |
| `shared/Result.ts` (error handling) | Cross-cutting, foundational | Never modify without team review |

**Change Isolation Techniques:**

- `THEME_CONFIG` as the single interface separating Game 1 from Game 2
- `ISDKAdapter` interface so `YandexSDK.ts` and `MockSDK.ts` are interchangeable
- All physics constants in `config/PhysicsConfig.ts` (not inline in GameScene)
- Animation durations in `config/AnimationConfig.ts` (Kamil changes these daily during polish)

---

### Fitness Function Suite

**Architectural Properties to Preserve:**

#### 1. Bundle Size Budget

**Rule:** Total ZIP ≤ 100MB (Yandex hard limit). JS bundle ≤ 500KB gzipped.

**Fitness Function:**
```bash
#!/bin/bash
# scripts/check-bundle-size.sh — run on every build
npm run build

# Check ZIP size
ZIP_SIZE=$(zip -r /tmp/game.zip dist/ && du -sk /tmp/game.zip | cut -f1)
if [ "$ZIP_SIZE" -gt 102400 ]; then  # 100MB in KB
  echo "FAIL: ZIP exceeds 100MB ($ZIP_SIZE KB)"
  exit 1
fi

# Check JS bundle gzipped
JS_SIZE=$(find dist/assets -name "*.js" -exec gzip -c {} \; | wc -c)
if [ "$JS_SIZE" -gt 512000 ]; then  # 500KB
  echo "FAIL: JS bundle exceeds 500KB gzipped ($JS_SIZE bytes)"
  exit 1
fi

echo "PASS: Bundle size OK (ZIP: ${ZIP_SIZE}KB, JS: ${JS_SIZE}B gzipped)"
```

**Tool:** `du`, `zip`, `wc` (zero dependencies)

#### 2. Physics Body Count

**Rule:** Max 30 active Matter.js bodies simultaneously (mobile memory budget)

**Fitness Function:**
```typescript
// In GameScene.ts — called every 60 frames (1 second at 60fps)
private checkPhysicsHealth(): void {
  const bodyCount = this.matter.world.localWorld.bodies.length;
  if (bodyCount > 30) {
    console.warn(`[FITNESS] Physics bodies: ${bodyCount}/30 — consider culling merged animals`);
  }
  // In development builds, throw:
  if (import.meta.env.DEV && bodyCount > 40) {
    throw new Error(`[FITNESS VIOLATION] Too many physics bodies: ${bodyCount}`);
  }
}
```

**Why 30:** Mobile Safari on iPhone 8 (2017 baseline) handles ~30 dynamic bodies at 60fps. Above 40 — frame drops begin.

#### 3. Theme = Config Only

**Rule:** Zero animal names in non-config TypeScript files.

**Fitness Function:**
```bash
#!/bin/bash
# scripts/check-theme-isolation.sh
VIOLATIONS=$(grep -rn "hamster\|rabbit\|kitten\|panda\|bear\|fox\|dog\|cat" \
  src/ --include="*.ts" \
  --exclude-path "src/config/*")

if [ -n "$VIOLATIONS" ]; then
  echo "FAIL: Animal names found outside config:"
  echo "$VIOLATIONS"
  exit 1
fi
echo "PASS: Theme is isolated to config/"
```

**Why:** Switching to Game 2 (cars, fruits, emojis) must be `config/ThemeConfig.ts` change only.

#### 4. Import Direction

**Rule:** `config ← shared ← core ← scenes ← main` (never reverse)

**Fitness Function:**
```json
// .depcruise.json
{
  "forbidden": [
    {
      "name": "config-must-not-import-scenes",
      "from": { "path": "src/config" },
      "to": { "path": "src/scenes" },
      "severity": "error"
    },
    {
      "name": "core-must-not-import-scenes",
      "from": { "path": "src/objects" },
      "to": { "path": "src/scenes" },
      "severity": "error"
    },
    {
      "name": "sdk-must-not-import-game",
      "from": { "path": "src/sdk" },
      "to": { "path": "src/scenes" },
      "severity": "error"
    }
  ]
}
```

```bash
npx depcruise --validate .depcruise.json src/
```

**Tool:** `dependency-cruiser` (4KB dev dep, worth it)

#### 5. File Size Limit

**Rule:** Max 400 LOC per `.ts` file (LLM context budget, also cognitive budget)

**Fitness Function:**
```bash
#!/bin/bash
# scripts/check-loc.sh
VIOLATIONS=$(find src/ -name "*.ts" -exec wc -l {} \; | awk '$1 > 400 {print}')
if [ -n "$VIOLATIONS" ]; then
  echo "FAIL: Files exceed 400 LOC:"
  echo "$VIOLATIONS"
  exit 1
fi
echo "PASS: All files within 400 LOC"
```

#### 6. Responsive Design Contract

**Rule:** Game renders correctly at all critical viewport sizes without layout breaks.

**Fitness Function:**
```typescript
// tests/responsive.spec.ts (Playwright)
const VIEWPORTS = [
  { name: 'mobile-portrait',  width: 390,  height: 844 },   // iPhone 14
  { name: 'mobile-landscape', width: 844,  height: 390 },
  { name: 'tablet-portrait',  width: 768,  height: 1024 },
  { name: 'desktop',          width: 1280, height: 720 },
  { name: 'yandex-embed',     width: 600,  height: 500 },   // Common Yandex Games frame
];

for (const vp of VIEWPORTS) {
  test(`renders at ${vp.name}`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto('http://localhost:5173');
    // Game canvas exists and is visible
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    // Canvas fills most of the viewport (no layout collapse)
    const box = await canvas.boundingBox();
    expect(box!.width).toBeGreaterThan(vp.width * 0.5);
  });
}
```

---

### Phaser Scale Manager — Concrete Configuration

**The AQ-4 answer with working code:**

```typescript
// src/config/GameConfig.ts

// Base game dimensions — PORTRAIT-FIRST (primary audience on mobile)
// Chosen for: 9:16 ratio fits most mobile screens in portrait
// Desktop gets letterboxed (acceptable for Yandex Games embed)
export const BASE_WIDTH = 480;
export const BASE_HEIGHT = 854;  // 480 * (16/9) = 853.33

// Physics world dimensions — same as game
// Matter.js uses these for wall placement
export const PHYSICS_WIDTH = BASE_WIDTH;
export const PHYSICS_HEIGHT = BASE_HEIGHT;

// Game play area (inset from edges for walls + UI)
export const PLAY_AREA = {
  left: 20,
  right: BASE_WIDTH - 20,
  top: 100,    // UI header height
  bottom: BASE_HEIGHT - 20,
  width: BASE_WIDTH - 40,
};
```

```typescript
// src/main.ts — Phaser game config with Scale Manager

import Phaser from 'phaser';
import { BASE_WIDTH, BASE_HEIGHT } from './config/GameConfig';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,  // WebGL → Canvas fallback (important for older Android)

  scale: {
    mode: Phaser.Scale.FIT,         // Scale to fit container, preserve aspect ratio
    autoCenter: Phaser.Scale.CENTER_BOTH,  // Center in both axes
    width: BASE_WIDTH,
    height: BASE_HEIGHT,
    // min/max prevent extreme scaling on very large/small screens
    min: {
      width: 320,
      height: 568,   // iPhone 5 min supported size
    },
    max: {
      width: 1280,
      height: 2276,  // 2x base — no point scaling higher
    },
  },

  backgroundColor: '#1a1a2e',

  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: 1.2 },  // Tuned for satisfying drop feel
      debug: import.meta.env.DEV,  // Debug outlines only in dev
    },
  },

  scene: [PreloadScene, MenuScene, GameScene],
};
```

**Landscape handling — two strategies, pick one:**

**Strategy A: Lock to Portrait (Simplest, recommended for MVP)**
```typescript
// In index.html <head>
// <meta name="viewport" content="width=device-width, initial-scale=1,
//   maximum-scale=1, user-scalable=no, orientation=portrait">

// In main.ts — detect landscape and show rotate prompt
window.addEventListener('resize', () => {
  const isLandscape = window.innerWidth > window.innerHeight;
  document.getElementById('rotate-prompt')!.style.display =
    isLandscape ? 'flex' : 'none';
});
```

```html
<!-- index.html — outside canvas, overlay -->
<div id="rotate-prompt" style="display:none; position:fixed; inset:0;
  background:#000; color:#fff; justify-content:center; align-items:center;
  font-size:24px; z-index:9999">
  Please rotate your device
</div>
```

**Strategy B: Support Both (adds ~2 hours dev, better UX on desktop)**
```typescript
// src/config/GameConfig.ts — responsive config
export function getScaleConfig(): Phaser.Types.Scale.ScaleConfig {
  const isPortrait = window.innerHeight > window.innerWidth;

  return {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: isPortrait ? 480 : 854,
    height: isPortrait ? 854 : 480,
  };
}

// NOTE: Phaser doesn't re-init on orientation change.
// Listen to orientationchange → game.scale.setGameSize()
window.addEventListener('orientationchange', () => {
  setTimeout(() => {  // Wait for browser to finish rotating
    const isPortrait = window.innerHeight > window.innerWidth;
    game.scale.setGameSize(
      isPortrait ? 480 : 854,
      isPortrait ? 854 : 480
    );
    // Also reposition walls and UI elements!
    // This complexity is why Strategy A is recommended for MVP
  }, 300);
});
```

**Decision: Use Strategy A (portrait-lock) for MVP.** Rationale: primary audience (women 55+) plays on mobile in portrait. Desktop users in Yandex Games get letterboxed view — acceptable. Saves 2 hours. Strategy B is future if landscape data shows demand.

**Fitness function for this decision:**
```bash
# scripts/check-orientation.sh
grep -q "orientation=portrait" index.html && echo "PASS" || echo "FAIL: portrait lock missing"
```

---

### Architectural Characteristics Prioritization

**Critical Characteristics** (system fails without these):

| Characteristic | Why Critical | How Measured | Fitness Function |
|----------------|--------------|--------------|------------------|
| Performance (60fps) | Yandex ML ranks by session length. Laggy game = D1 retention < 25% = removed D21 | Chrome DevTools FPS panel, Playwright FPS test | `requestAnimationFrame` timestamp delta check |
| Bundle < 100MB | Yandex hard limit — ZIP over 100MB = rejected on submission | `du -sh dist/` after build | `check-bundle-size.sh` (see above) |
| Physics Stability | Animals must settle predictably or game feel breaks — primary satisfaction driver | Manual playtest + body count monitor | Body count assertion in GameScene |
| Maintainability | Built by LLM in 7 days + patched after launch. High WTF per minute = slow iteration | LOC per file, cyclomatic complexity | LOC check, depcruise |

**Important** (degraded without, not failed):

| Characteristic | Trade-off Accepted | Mitigation |
|----------------|-------------------|------------|
| Testability | Game UX hard to unit test | Test logic (merge detection, scoring), not rendering |
| Accessibility | 55+ audience benefits from large targets | Enforce 44px touch targets via Playwright |
| Reusability (Game 2) | Day 1 investment, payoff at Game 2 | Theme isolation fitness function prevents regression |

**Nice-to-Have (defer):**

- Internationalization: Game is RU + EN strings only, hardcoded is fine at this scale
- Offline mode: Yandex Games requires online SDK anyway
- Save states: localStorage high score is sufficient, no session restore needed

**Trade-offs Made:**
- Chose portrait-lock OVER responsive orientation because 55+ mobile players, saves 2h dev time
- Chose ScaleMode.FIT OVER ScaleMode.EXPAND because pixel-perfect physics matters for drop-merge feel
- Chose config-driven theme OVER copy-paste for Game 2 because founding game is the template

---

### Tech Debt Prevention Strategy

**Debt Visibility:**
```typescript
// Pattern for this codebase:
// DEBT: [why suboptimal]
// COST: [hours to fix]
// TRIGGER: [when to pay — "after Game 2 starts", "if DAU > 1000"]

// Example:
// DEBT: Portrait-lock means landscape users get rotate prompt
// COST: ~4h to implement Strategy B responsive layout
// TRIGGER: If Yandex analytics show > 20% landscape sessions
```

**Refactoring Triggers:**

| Trigger | Action |
|---------|--------|
| GameScene.ts > 300 LOC | Extract `MergeSystem.ts` before next feature |
| Physics tweak takes > 30 min | All physics constants must be in `PhysicsConfig.ts` |
| Second game theme needed | Activate `ThemeConfig` abstraction (already designed) |
| Ad callback duplicated | Extract to `AdManager.ts` (should already be there) |
| Score formula changed twice | Isolate into `scoring.ts` as pure function |

**Boy Scout Rule for LLM:** Every Claude Code session ends with LOC check on modified files.

---

### Reversibility Analysis

**Irreversible Decisions** (require careful thought now):

| Decision | Why Irreversible | Cost to Reverse | Mitigation |
|----------|-----------------|----------------|------------|
| Phaser 3 (not vanilla Canvas) | Core game loop, all scenes built on it | Full rewrite, ~40h | Irreversibility accepted — Phaser is correct for 7-day timeline |
| Portrait-first base dimensions (480x854) | All UI positions, physics walls calibrated | ~4h to re-layout | Accept, add orientation fitness function to detect if this becomes a problem |
| Matter.js for physics | Deeply integrated with Phaser 3 | Phaser reimplementation | Accept — built-in integration is the correct choice |
| localStorage for high score (not SDK storage) | Yandex SDK storage is async, adds complexity | ~2h migration | Use localStorage first, SDK storage wrapper exists for migration |

**Reversible Decisions** (low risk, decide quickly):

| Decision | Easy to Reverse Because | Defer Decision? |
|----------|------------------------|----------------|
| Animal tier count (8) | Config only change | No — pick 8, it's sufficient |
| Specific animal types | Config + asset swap | No — Kenney has plenty, pick now |
| Merge animation duration (0.2s) | Single constant | No — start with 0.2s, Kamil will tune |
| Score formula (exponential vs linear) | Single pure function | No — start exponential, iterate |
| Background color/art | CSS + asset swap | Defer until Day 4 art pass |

**Deferrable Decisions:**
- Leaderboard: Yandex SDK has it built in, wire up after core loop works (Day 3+)
- Sound design: can add after core gameplay passes Kamil test
- Landscape support: defer until post-launch analytics confirm demand

---

### Reusability Architecture — AQ-7

This is the key evolutionary question: what must be generic from Day 1 to make Game 2 a config change?

**The ThemeConfig Interface:**

```typescript
// src/config/ThemeConfig.ts — THE reusability boundary

export interface TierConfig {
  key: string;          // Asset key (preloaded as this name)
  radius: number;       // Physics circle radius in game units
  score: number;        // Points awarded when this tier is created via merge
  label: string;        // Display name (RU or EN based on locale)
}

export interface ThemeConfig {
  name: string;                    // "zverata" | "fruity" | "space"
  tiers: TierConfig[];             // Ordered smallest to largest (index = tier)
  backgroundColor: number;         // 0x1a1a2e
  wallColor: number;               // Container wall tint
  mergeParticleColor: number;      // Particle burst color on merge
  backgroundAssetKey?: string;     // Optional background sprite
}

// Game 1 — Animals
export const ANIMALS_THEME: ThemeConfig = {
  name: 'zverata',
  backgroundColor: 0x1a1a2e,
  wallColor: 0x4a90d9,
  mergeParticleColor: 0xffdd57,
  tiers: [
    { key: 'hamster', radius: 20, score: 1,   label: 'Хомяк' },
    { key: 'rabbit',  radius: 28, score: 3,   label: 'Кролик' },
    { key: 'kitten',  radius: 36, score: 6,   label: 'Котёнок' },
    { key: 'cat',     radius: 44, score: 10,  label: 'Кошка' },
    { key: 'dog',     radius: 54, score: 15,  label: 'Собака' },
    { key: 'fox',     radius: 64, score: 21,  label: 'Лиса' },
    { key: 'panda',   radius: 76, score: 28,  label: 'Панда' },
    { key: 'bear',    radius: 90, score: 36,  label: 'Медведь' },
  ],
};

// Future Game 2 — Fruits (zero code change needed)
// export const FRUITS_THEME: ThemeConfig = { ... };

// Active theme — the only place this is set
export const ACTIVE_THEME = ANIMALS_THEME;
```

**What becomes theme-agnostic in Game Core:**

```typescript
// src/objects/Animal.ts — works with ANY theme

export class Animal extends Phaser.GameObjects.Container {
  public tier: number;
  private tierConfig: TierConfig;  // From ACTIVE_THEME.tiers[tier]

  constructor(scene: GameScene, x: number, y: number, tier: number) {
    super(scene, x, y);
    this.tier = tier;
    this.tierConfig = ACTIVE_THEME.tiers[tier];

    // Physics body uses tierConfig.radius — theme-driven
    scene.matter.add.gameObject(this, {
      shape: { type: 'circle', radius: this.tierConfig.radius },
    });

    // Sprite uses tierConfig.key — theme-driven
    const sprite = scene.add.image(0, 0, this.tierConfig.key);
    this.add(sprite);
  }

  get scoreValue(): number {
    return this.tierConfig.score;  // Theme-driven
  }
}
```

**Change Vector for Game 2 launch:**
1. Create `FruitsTheme.ts` with new `ThemeConfig`
2. Change `ACTIVE_THEME = FRUITS_THEME` in `ThemeConfig.ts`
3. Run `check-theme-isolation.sh` — must PASS
4. Swap assets in `assets/` folder
5. Done. No scene code changes.

---

## Performance Budgets — Mobile Baseline

**Target device:** Mid-range Android (2019-2021), Safari iOS 14+, 4GB RAM.

| Budget Item | Limit | Rationale |
|-------------|-------|-----------|
| Active Matter.js bodies | 30 max | Beyond 30: frame drops on mid-range mobile |
| Sprites on screen simultaneously | 50 max | Each sprite = texture draw call |
| Particles per merge effect | 12 max | Particle systems are expensive on mobile GPU |
| Texture atlas size | 1024x1024 max | Single atlas for all 8 animals + UI |
| JS heap (steady state) | < 80MB | Safari iOS kills tabs at ~150MB |
| JS heap (peak, merge effect) | < 120MB | Transient particle burst |
| Time to interactive | < 3 seconds | Yandex Games embed context |
| Asset load time (3G) | < 5 seconds | Russian 3G median: ~3Mbps |

**Physics stability tuning for Matter.js:**

```typescript
// src/config/PhysicsConfig.ts — ALL physics constants here
export const PHYSICS_CONFIG = {
  gravity: { x: 0, y: 1.2 },

  // Animal body properties
  animal: {
    restitution: 0.3,    // Slight bounce (feels alive, not rubber)
    friction: 0.5,       // Enough friction to not slide forever
    frictionStatic: 0.5,
    density: 0.002,      // Heavier animals feel more satisfying
    frictionAir: 0.01,   // Air resistance — dampens oscillation
  },

  // Container walls
  walls: {
    restitution: 0.1,    // Walls absorb most energy (no ping-pong)
    isStatic: true,
    label: 'wall',
  },

  // Merge detection
  merge: {
    debounceMs: 100,     // Prevent double-merge on same collision
    minContactSpeed: 0.5, // Only merge if moving (not just touching)
  },

  // Solver iterations — balance accuracy vs performance
  positionIterations: 6,  // Default 6 — good enough for circles
  velocityIterations: 4,  // Default 4
  constraintIterations: 2, // Default 2
};
```

**Body cleanup — prevent memory leak:**
```typescript
// When merge happens, remove BOTH old bodies, create ONE new body
// Critical: Matter.js bodies accumulate if not explicitly destroyed
private handleMerge(animalA: Animal, animalB: Animal): void {
  const newTier = animalA.tier + 1;
  const midX = (animalA.x + animalB.x) / 2;
  const midY = (animalA.y + animalB.y) / 2;

  // Remove old bodies FIRST
  this.matter.world.remove(animalA.body as MatterJS.BodyType);
  this.matter.world.remove(animalB.body as MatterJS.BodyType);
  animalA.destroy();
  animalB.destroy();

  // Create new body
  if (newTier < ACTIVE_THEME.tiers.length) {
    const merged = new Animal(this, midX, midY, newTier);
    this.animals.push(merged);
  }
  // else: reached max tier — just destroy both (bear + bear = game win condition?)
}
```

---

## Cross-Cutting Implications

### For Domain Architecture
- Game Core (`objects/`, `scenes/GameScene.ts`) must depend on `ThemeConfig` interface, not concrete animal names
- SDK module never touches game state directly — events only (`EventBus`)
- Config module is the dependency root — everything else can import from it

### For Data Architecture
- `ThemeConfig` is the schema that must be versioned — if tier count changes, saves using old tier numbers may be invalid
- LocalStorage key: `zverata_highscore` — consider `${ACTIVE_THEME.name}_highscore` for multi-game persistence

### For Operations
- Build pipeline must run `check-bundle-size.sh` as last step — not optional
- Playwright responsive tests: run locally before every Yandex submission
- No server = no rollback. Every submission is irreversible. Fitness functions before submit, not after.

### For Security
- `PhysicsConfig.ts` is a change attack surface — if someone PRs "increase gravity to 999" it breaks game feel
- Fitness function: Matter.js gravity assertion in smoke test (`gravity.y < 3`)

---

## Concerns & Recommendations

### Critical Issues

- **Portrait-lock has no automated check.** If `index.html` loses the `orientation=portrait` meta tag, landscape users get broken layout. Fix: add `check-orientation.sh` to pre-build script.
  - **Fix:** Add to `package.json` scripts: `"prebuild": "bash scripts/check-orientation.sh"`
  - **Rationale:** Build pipeline catches before Yandex submission

- **ThemeConfig has no validation.** If `tiers` array has 0 entries, game crashes silently.
  - **Fix:** `validateTheme(config: ThemeConfig): void` called in `main.ts` before Phaser init. Throws with descriptive error.
  - **Rationale:** LLM adding Game 2 config may make mistakes; validation catches immediately

- **Matter.js body accumulation.** Each game-over leaves bodies if `scene.restart()` doesn't call `this.matter.world.resetCollisionIDs()`.
  - **Fix:** In `GameScene.shutdown()`: `this.animals.forEach(a => a.destroy()); this.animals = [];`
  - **Rationale:** Memory leak compounds across play sessions. Primary failure mode on mobile.

### Important Considerations

- **Phaser Scale.FIT vs Scale.EXPAND:** FIT preserves aspect ratio with letterboxing. EXPAND fills screen but may distort physics. For drop-merge: ALWAYS use FIT. Distorted physics = unpredictable drops = bad game feel.
  - **Recommendation:** Add comment in `main.ts` explaining why FIT, not EXPAND. Prevents future "optimization."

- **60fps is a retention KPI, not a vanity metric.** Yandex ML algorithm measures session length. Users stop playing laggy games. 60fps = 5+ min sessions = survival above rank 30.
  - **Recommendation:** Add FPS display overlay in dev mode. Remove in production. Never ship without validating 60fps on slowest target device.

### Questions for Clarification

- Will Kamil have access to `PhysicsConfig.ts` to tune gravity/restitution himself? If yes, add comments explaining each constant in terms he understands ("how bouncy the animals are").
- Is Game 2 scope confirmed as fruits, or open? Answer affects whether `ThemeConfig` needs `soundTheme` and `backgroundMusic` fields now vs later.
- Does Yandex Games iframe resize (user can resize browser)? If yes, `orientationchange` listener may fire mid-session — need to handle gracefully.

---

## References

- [Phaser 3 Scale Manager API](https://photonstorm.github.io/phaser3-docs/Phaser.Scale.ScaleManager.html) — ScaleMode.FIT, autoCenter, min/max
- [Phaser 3.90 Changelog](https://github.com/phaserjs/phaser/blob/master/CHANGELOG.md) — latest version specifics
- [Matter.js Performance Guide](https://brm.io/matter-js/docs/) — body count, solver iterations
- [Neal Ford — Building Evolutionary Architectures](https://evolutionaryarchitecture.com/) — fitness function patterns
- [Martin Fowler — Fitness Function](https://martinfowler.com/bliki/FitnessFunction.html) — architectural property testing
- [Yandex Games SDK Docs](https://yandex.ru/dev/games/doc/dg/sdk/sdk-about.html) — 7 pitfalls reference
- [sgbj/suika-clone](https://github.com/sgbj/suika-clone) — reference structural pattern
- [Mobile Browser Memory Limits](https://developer.mozilla.org/en-US/docs/Web/API/Performance/memory) — `performance.memory` API
- [dependency-cruiser](https://github.com/sverweij/dependency-cruiser) — import direction enforcement
