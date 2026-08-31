# Developer Experience Architecture Research

**Persona:** Dan McKinley (DX Architect / Pragmatist)
**Focus:** Innovation tokens, boring tech, developer workflow
**Project:** Zverata — Yandex Games HTML5 drop-merge game
**Date:** 2026-03-04

---

## Research Conducted

Note: Exa MCP hit rate limit. Research below is drawn from direct knowledge of the stack —
Phaser 3.x + Vite + TypeScript ecosystem, Yandex Games SDK documentation,
and sgbj/suika-clone reference architecture (well-known open source project).

- Phaser 3 official Vite TypeScript template (github.com/phaserjs/template-vite-ts) — canonical starter
- sgbj/suika-clone — reference for drop-merge structure in Phaser
- Yandex Games SDK documentation — mock patterns, init lifecycle
- Dan McKinley "Choose Boring Technology" — token budget framework
- Phaser 3 scene lifecycle and hot module replacement behavior
- Vite HMR + game dev workflow patterns (iframes, full reload)
- TypeScript overhead vs. AI-assisted dev productivity

**Total queries attempted:** 5 web searches + 2 code context searches
**Result:** Rate limited by Exa free tier. Proceeding from direct knowledge.

---

## Kill Question Answer

**"Is this solving a business problem or engineering curiosity?"**

| Proposed Technology | Business Problem Solved | Engineering Curiosity | Verdict |
|---------------------|------------------------|-----------------------|---------|
| Phaser 3.90 | Physics + renderer + scene management for drop-merge game — core product | No, it IS the product | Keep (1 token) |
| Matter.js (built-in to Phaser) | Satisfying drop physics = retention. Already bundled — no extra cost | No | Keep (0 extra tokens — it's free inside Phaser) |
| TypeScript | AI writes correct code 3x faster. Catch merge-logic bugs before run. Kamil reads typed code | Mild overhead, but ROI positive | Keep (0.5 token — it's boring enough now) |
| Vite 5.x | Sub-second HMR = faster iteration loop. Standard tool, huge ecosystem | No | Keep (0 tokens — Vite IS boring) |
| Yandex SDK wrapper/mock | Enables local dev without SDK. Prevents hard crash during dev | No, enables the whole workflow | Keep (0 tokens — it's just an if-statement) |
| Custom animation system | None — Phaser Tweens exist | Yes, pure engineering curiosity | Cut. Use Phaser.Tweens |
| State management library (Redux/Zustand) | None — it's a single-file game state | Yes, massively overkill | Cut. Use plain class |
| CSS framework for UI | None — Phaser renders everything to canvas | Yes | Cut. Phaser Text + Containers |
| React/Vue for UI overlays | None — Phaser has UI primitives | Yes, resume-driven | Cut |
| Custom physics engine | None — Matter.js handles drop-merge | Yes | Cut |
| Jest/Vitest test suite for game | Minimal — game logic is thin, most is visual | Mild curiosity | Defer. Manual QA is sufficient for 7 days |

**Innovation tokens spent on business:** 1.5 (Phaser + TypeScript)
**Innovation tokens spent on infrastructure:** 0

**We have 1.5 tokens in reserve. This is a healthy budget.**

---

## Proposed DX Decisions

### Innovation Token Accounting

**Token Budget:** 3 tokens total

| # | Technology | Boring Alternative | Why Innovate Here? | Token Cost |
|---|------------|-------------------|--------------------|------------|
| 1 | Phaser 3.90 | Vanilla Canvas + Matter.js | Physics + renderer + scene graph = 12-20h game instead of 40h game. Core to product. | 1 token |
| 2 | TypeScript | JavaScript | AI writes typed code correctly first time. Kamil reads types as documentation. Worth the 30-min tsconfig overhead. | 0.5 token |
| 3 | Vite 5.x | Webpack / plain HTML | Sub-1s HMR, zero config, standard tool. Boring enough by 2026 standards. | 0 tokens (it's boring now) |

**Total tokens spent: 1.5 of 3**

**Recommendations:**
- Keep: Phaser 3, TypeScript, Vite — all justified by product/velocity ROI
- Cut: Any state management library — plain TypeScript class is enough
- Cut: Any CSS/HTML UI framework — Phaser canvas renders everything
- Cut: Automated test framework — 7-day timeline, manual QA with Kamil is the right test suite
- Cut: Particle library — Phaser.GameObjects.Particles is built-in
- Defer: ESLint/Prettier config — add after Day 1 scaffold, not before
- Reclaimed tokens: 1.5 tokens remain — could be spent on Game 2 differentiation later

---

### Tech Stack: Boring First

**Boring Choices** (proven, low risk):

| Layer | Technology | Why Boring | Why Good Enough |
|-------|------------|------------|-----------------|
| Game Engine | Phaser 3 | 10+ years old, 36K GitHub stars, massive community | Handles physics, scenes, assets, input, audio — everything needed |
| Physics | Matter.js (Phaser built-in) | Bundled with Phaser, no extra dep | Drop-merge only needs circles + gravity + collision events |
| Language | TypeScript | Industry standard since 2016, boring by now | AI writes better TS than JS for structured game code |
| Bundler | Vite 5.x | Boring by 2026, used by millions | HMR + production build + tree-shake out of box |
| Storage | localStorage | 15 years old, universal | Highscore only — no server needed |
| Deployment | ZIP file | Yandex requirement | Single `npm run build` + zip = done |

**Stdlib-First (Phaser-Built-in-First) Approach:**

| Need | Built-in Solution | Avoid |
|------|------------------|-------|
| Particles | Phaser.GameObjects.Particles | Three.js, custom WebGL |
| Tweens/animation | Phaser.Tweens.TweenManager | GreenSock/GSAP (overkill, extra token) |
| Audio | Phaser.Sound.WebAudioSoundManager | Howler.js (unnecessary dep) |
| UI text | Phaser.GameObjects.Text | DOM overlay React app |
| Scenes/states | Phaser.Scene lifecycle | Custom state machine library |
| Input | Phaser.Input.InputPlugin | Hammer.js (unnecessary) |
| Asset loading | Phaser.Loader.LoaderPlugin | Custom asset pipeline |
| Timers | Phaser.Time.TimerEvent | setInterval (pitfall #7 from business blueprint) |

**Key rule: if Phaser has it built-in, use it. No extra deps.**

---

### SDK Wrapper Pattern (AQ-3)

This is the most important DX decision in the project. Get it wrong and every dev session requires a live Yandex environment.

**The Pattern: Interface + Two Implementations**

```typescript
// src/sdk/IYandexSDK.ts  — the interface (boring: just TypeScript)
interface IYandexSDK {
  init(): Promise<void>;
  showInterstitialAd(callbacks: AdCallbacks): void;
  showRewardedAd(callbacks: RewardedCallbacks): void;
  showBannerAd(): void;
  hideBannerAd(): void;
  gameplayStart(): void;
  gameplayStop(): void;
  getLeaderboard(): Promise<LeaderboardEntry[]>;
  setLeaderboardScore(score: number): Promise<void>;
  getStorage(): Promise<Record<string, unknown>>;
  setStorage(data: Record<string, unknown>): Promise<void>;
}

// src/sdk/YandexSDKReal.ts  — wraps real window.YaGames
// src/sdk/YandexSDKMock.ts  — fake implementation for local dev

// src/sdk/index.ts  — the switch (one if-statement, that's it)
export function createSDK(): IYandexSDK {
  if (typeof window.YaGames !== 'undefined') {
    return new YandexSDKReal();
  }
  return new YandexSDKMock();
}
```

**Why this is boring:**
- It's just an interface + if-statement. No dependency injection framework needed.
- Detection is automatic: YaGames exists on Yandex platform, undefined locally.
- Mock logs to console: `[SDK Mock] showInterstitialAd called` — Kamil can see what's happening.
- Same code ships to production. Zero config change needed.

**Mock behavior:**
- `showInterstitialAd` — logs, calls `onClose(true)` after 1 second (simulates ad dismissed)
- `showRewardedAd` — logs, calls `onRewarded()` after 1 second (simulates ad watched)
- `showBannerAd` — logs, no-op
- `getStorage` — reads from localStorage (so persistence works in dev)
- `setStorage` — writes to localStorage
- All async methods return resolved promises immediately

**Critical: Phaser init wrapping (pitfall #1 from business blueprint):**

```typescript
// src/main.ts
async function startGame() {
  const sdk = createSDK();
  await sdk.init();            // waits for YaGames.init() OR mock no-op
  sdk.gameplayStart();

  const game = new Phaser.Game(config);
  // Phaser starts AFTER SDK — as required
}

startGame();
```

**Pause/resume hooks (pitfall #2):**

```typescript
// In GameScene constructor or init:
window.addEventListener('game_api_pause', () => this.game.pause());
window.addEventListener('game_api_resume', () => this.game.resume());
// Mock fires these events on window blur/focus for local dev
```

---

### Vite Hot Reload with Phaser — The Gotcha

Phaser + Vite HMR has a well-known conflict: Phaser creates WebGL/Canvas contexts that don't survive module replacement. Full page reload is needed, not partial HMR.

**Solution: force full reload, not HMR:**

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',                    // relative paths for Yandex ZIP packaging
  server: {
    port: 3000,
    hot: true,                   // keep hot reload enabled
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined  // single bundle for Yandex compatibility
      }
    }
  }
});
```

In `main.ts`, add:
```typescript
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    // On any change: full page reload (Phaser needs it)
    window.location.reload();
  });
}
```

**Result:** Save a file → ~300ms full reload → back in game. Fast enough. Don't try to be clever with partial HMR — Phaser's canvas will break.

**Dev loop for Kamil:**
1. Change a number in `GameConfig.ts` (e.g., `GRAVITY: 1.5`)
2. Save → browser reloads in 300ms
3. Drop an animal → feels different
4. Iterate. This is teaching in real time.

---

### Is TypeScript Worth It for a 1-Week Game?

**Answer: Yes, and here's the math.**

| Factor | Without TS | With TS | Delta |
|--------|-----------|---------|-------|
| AI code generation | Claude generates loose JS, has to guess types | Claude generates typed code, correct first time | -30% iteration cycles |
| Bug: wrong tier number passed | Runtime crash during play | Compile error in editor, 0-second feedback | Saves ~20 min/bug |
| Kamil reading code | `function merge(a, b)` — what are a, b? | `function merge(a: Animal, b: Animal): Animal` — obvious | Teachable |
| tsconfig setup time | N/A | 15 minutes | -15 min, one time cost |
| Vite TypeScript support | N/A | Native, zero config | Free |
| Number of types needed | N/A | ~10 interfaces for whole game | Trivial |

**Verdict: TypeScript in 2026 is boring tech. The 0.5-token cost is worth it.**

The entire type surface is small:
```typescript
type TierNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
interface Animal { id: string; tier: TierNumber; body: MatterJS.BodyType; sprite: Phaser.GameObjects.Image; }
interface TierConfig { tier: TierNumber; name: string; texture: string; radius: number; score: number; color: number; }
interface GameState { score: number; highScore: number; isGameOver: boolean; isPaused: boolean; }
interface AdCallbacks { onOpen?: () => void; onClose: (wasShown: boolean) => void; onError?: (error: Error) => void; }
interface RewardedCallbacks { onRewarded: () => void; onClose: () => void; onError?: (error: Error) => void; }
```

That's the entire game typed. ~50 lines. Not a burden.

---

### Build vs Buy Analysis

**Core to Business** (build):

| Component | Why Build | Estimated Effort |
|-----------|-----------|-----------------|
| Merge detection logic | Core game mechanic, unique tuning | 2-3 hours |
| Animal progression config | Game design decision, changes often | 30 minutes |
| Game state machine | Simple: 4 states, fits in one class | 1 hour |
| Ad timing logic | Business rules: 60-sec minimum, event-triggered | 1 hour |

**Undifferentiated** (use existing):

| Need | Use | Savings |
|------|-----|---------|
| Physics simulation | Matter.js (built into Phaser) | 40+ hours |
| Rendering + scene graph | Phaser 3 | 40+ hours |
| Particle effects | Phaser.GameObjects.Particles | 4 hours |
| Tweens/easing | Phaser.Tweens | 2 hours |
| Asset loading + caching | Phaser.Loader | 4 hours |
| Audio management | Phaser.Sound | 2 hours |
| Touch/pointer input | Phaser.Input | 3 hours |

**Total savings from "use existing": ~95 hours in a 7-day project.**
Every hour of "build" instead of "use" costs ~14% of the entire dev timeline.

---

### File/Folder Structure for AI Context

Key constraint: Claude Code works best with files under 300-400 LOC.
Every file should be readable in one AI context window.
Keep the mental model flat — Kamil needs to find things too.

```
game/
  src/
    main.ts                 -- ~50 lines: SDK init, Phaser config, game boot
    config/
      GameConfig.ts         -- ~60 lines: ALL magic numbers in one place
      AnimalChain.ts        -- ~40 lines: 8-tier config array (name, texture, radius, score)
    scenes/
      PreloadScene.ts       -- ~60 lines: load all assets, show loading bar
      MenuScene.ts          -- ~80 lines: title, high score, play button
      GameScene.ts          -- ~250 lines: core gameplay loop (LARGEST file, still under limit)
    objects/
      Animal.ts             -- ~100 lines: Matter circle + Phaser sprite + tier data
      DropPreview.ts        -- ~60 lines: the "next animal" preview at top
      Wall.ts               -- ~40 lines: container walls (left, right, floor)
      ScoreDisplay.ts       -- ~50 lines: score text, animations on score change
    sdk/
      IYandexSDK.ts         -- ~40 lines: interface definition
      YandexSDKReal.ts      -- ~120 lines: real SDK wrapper (7 pitfalls handled here)
      YandexSDKMock.ts      -- ~80 lines: mock implementation
      index.ts              -- ~10 lines: createSDK() factory
      AdManager.ts          -- ~80 lines: timing rules, cooldowns, business logic
  public/
    assets/
      animals/              -- hamster.png, rabbit.png, ... (8 files)
      ui/                   -- background.png, logo.png
      audio/                -- merge.mp3, drop.mp3, gameover.mp3
  index.html                -- ~20 lines: Yandex SDK script tag, div#game, main.ts
  vite.config.ts            -- ~20 lines
  tsconfig.json             -- ~20 lines
  package.json              -- ~15 lines
```

**Total files: ~18 source files. Total estimated LOC: ~1,200.**

This fits in Claude's context window in a single pass. AI can refactor confidently.
Kamil can see the entire project in one browser tab.

**The GameConfig.ts principle:**
ALL tunable numbers live in ONE file. This is the most important DX decision for Kamil.

```typescript
// src/config/GameConfig.ts
export const GAME = {
  WIDTH: 480,
  HEIGHT: 640,
  GRAVITY: 2,             // <-- Камиль: сделай больше = быстрее падает
  WALL_THICKNESS: 20,
  DANGER_LINE_Y: 100,     // <-- выше этой линии = game over
  DROP_COOLDOWN_MS: 500,  // <-- время между бросками
  MERGE_SCORE_MULTIPLIER: 2,
} as const;

export const ADS = {
  INTERSTITIAL_COOLDOWN_MS: 3 * 60 * 1000,  // 3 минуты
  MIN_SESSION_MS: 60 * 1000,                  // 60 секунд до первой рекламы
} as const;
```

Kamil modifies numbers, saves, sees result in 300ms. This is how coding is taught.

---

### Developer Workflow

**Setup (one-time, target: under 10 minutes):**

```bash
# 1. Clone/init
git clone <repo>
cd game

# 2. Install (one command)
npm install

# 3. Start dev server (one command)
npm run dev
# Opens http://localhost:3000
# SDK mock active automatically
# Hot reload active
```

**package.json scripts (boring, minimal):**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "zip": "npm run build && cd dist && zip -r ../zverata.zip ."
  }
}
```

No Makefile. No shell script orchestration. No Docker (it's a browser game — a browser IS the runtime). `npm run dev` = done.

**Onboarding Time Targets:**

| Milestone | Target | How |
|-----------|--------|-----|
| First checkout to running game | < 5 minutes | npm install + npm run dev, that's it |
| First code change visible | < 10 minutes | Edit GameConfig.ts, see result |
| Understand project structure | < 30 minutes | 18 files, self-explaining names |
| Kamil's first working change | Day 1 | Change GRAVITY value, observe result |

**Dev Loop Speed:**

| Activity | Target | How |
|----------|--------|-----|
| Code change to visible in browser | < 300ms | Vite full-reload |
| Production build | < 30 seconds | Vite rollup, no complex pipeline |
| ZIP for submission | < 60 seconds | npm run zip |
| Find where to change X | < 2 minutes | Flat structure, obvious file names |

**Testing Strategy for 7-Day Timeline:**

Formal tests = innovation tokens wasted here. Manual QA with Kamil IS the test suite.

| What | How | Who |
|------|-----|-----|
| Drop mechanics feel | Play 5 minutes | Олег + Камиль |
| Merge detection correctness | Drop two same-tier animals | Олег |
| SDK mock events | Watch console.log output | Олег |
| Ad timing rules | Verify 60-sec minimum manually | Олег |
| Mobile layout | Chrome DevTools → iPhone SE + Pixel 7 | Олег |
| Real device test | Physical phone, Day 5 | Камиль |

**Exception:** Write one unit test for the merge detection algorithm if it's non-trivial.
Merge logic is business-critical and easy to regress. This is worth ~30 min.

---

### DX Metrics

These are real targets for this project's workflow:

| Metric | Target |
|--------|--------|
| Time: first commit to playable game | Day 1, 4 hours |
| Time: code change to visible result | < 300ms |
| Time to find "where does X happen" | < 2 minutes (18 files, flat structure) |
| Number of commands to start dev | 1 (npm run dev) |
| Number of tools Kamil must learn | 1 (browser + code editor) |
| Build artifact size | < 5MB unzipped (Yandex limit: 100MB) |
| npm install time | < 60 seconds |
| Cognitive load: how many concepts | 3 (Scenes, GameObjects, Physics) |

---

## Cross-Cutting Implications

### For Domain Architecture
- Flat module structure (not deep DDD hierarchies) — this is a game, not an enterprise app
- GameConfig.ts as single source of truth for tuning = no hunting for magic numbers
- SDK interface contract enables Domain Architect to spec GameScene without caring about Yandex

### For Data Architecture
- TypeScript interfaces make data contracts explicit and AI-readable
- `AnimalChain.ts` as pure data (no behavior) = easy to extend for Game 2 with different animals
- localStorage schema should mirror the SDK storage interface exactly — one swap if we go full SDK storage

### For Operations
- Vite build produces `dist/` — zero-config deploy to Yandex (just zip it)
- No server, no infrastructure, no CI pipeline needed for v1
- Browser DevTools = all the observability we have. Console.error = our alerting system.

### For Security
- All SDK calls go through the wrapper — no raw `window.YaGames` calls scattered in game code
- CSP is Yandex's problem (they control the iframe)

---

## Concerns & Recommendations

### Critical Issues

**1. Phaser init MUST be inside SDK init promise (pitfall #1)**
- Impact: Game crashes silently on production if Phaser starts before SDK
- Fix: The `startGame()` async wrapper pattern shown above. Non-negotiable.
- Rationale: Yandex SDK needs to be fully initialized before any YaGames API calls

**2. NO setInterval for ads (pitfall #7)**
- Impact: Yandex will reject the game or ban the account
- Fix: AdManager uses Phaser.Time.TimerEvent, not setInterval. Ad triggers are event-driven (game over, button press).
- Rationale: SDK compliance requirement

**3. Audio must pause before every ad (pitfall #3)**
- Impact: Jarring audio playing under ad = bad UX + possible SDK violation
- Fix: `this.sound.pauseAll()` in AdManager before `showInterstitialAd/showRewardedAd`, resume in `onClose`

### Important Considerations

**4. `base: './'` in vite.config is mandatory**
- Without this, asset paths are absolute and break inside Yandex's iframe
- One line, zero cost, prevents a hard-to-debug production issue

**5. Single bundle (no code splitting)**
- Yandex has specific requirements about `index.html` in ZIP root
- Code splitting creates multiple chunks, may confuse Yandex ZIP validator
- Fix: `manualChunks: undefined` in rollupOptions

**6. Mock must simulate 1-second ad delay**
- If mock resolves instantly, game logic assuming ads take time will never be tested
- A 1-second `setTimeout` in mock `onClose` catches real timing bugs in dev

### Questions for Architect Board

- AQ-4: Should we target portrait-only for v1 and add landscape in v1.1? (Recommendation: yes, portrait-only simplifies Phaser.Scale config significantly)
- AQ-6: Does Yandex require service worker or offline support? (Recommendation: no, skip — not required and adds complexity)
- Should Kamil get his own `KAMIL.md` explaining what each file does in plain language? (Recommendation: yes, 1-hour investment that pays off in teaching)

---

## Summary: The Boring Tech Decision

```
Token 1: Phaser 3  — the game engine is the product. This IS the innovation.
Token 0: Vite      — boring bundler. Not a token.
Token 0.5: TypeScript — boring language (by 2026). Not really a token.

Remaining: 1.5 tokens available for Game 2 differentiation.

Everything else: Use what Phaser gives you. Don't add deps.
```

**The most important line in this entire document:**

> The SDK wrapper is just an interface and an if-statement. That's it.
> Don't overcomplicate it. The mock needs to exist, not to be elegant.

---

## References

- [Dan McKinley — Choose Boring Technology](https://mcfunley.com/choose-boring-technology)
- [Phaser 3 Official Vite TypeScript Template](https://github.com/phaserjs/template-vite-ts) — canonical starting point
- [sgbj/suika-clone](https://github.com/sgbj/suika-clone) — structural reference for this project
- [Yandex Games SDK Documentation](https://yandex.ru/dev/games/doc/en/) — 7 pitfalls source
- Business Blueprint: `ai/blueprint/business-blueprint.md`
- Architecture Agenda: `ai/architect/architecture-agenda.md`
