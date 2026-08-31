# Operations Architecture Research

**Persona:** Charity (Operations Engineer — Honeycomb lens)
**Focus:** Build pipeline, production observability, error tracking, analytics, SDK integration safety
**Project:** Zverata (Зверята) — HTML5 drop-merge game on Yandex Games

---

## Research Conducted

- [Phaser Vite TypeScript Template (phaserjs/template-vite-ts)](https://github.com/phaserjs/template-vite-ts) — official Phaser 3.90 + Vite 6 + TypeScript template, exact build config baseline
- [Develop, build and distribute Phaser games with Vite](https://emanueleferonato.com/2025/01/01/develop-build-and-distribute-your-html5-phaser-games-with-vite/) — production distribution workflow
- [Yandex Games SDK — Advertising](https://yandex.com/dev/games/doc/en/sdk/sdk-adv) — ad callbacks, error handling, banned patterns (setInterval)
- [Yandex Games SDK — Events](https://yandex.com/dev/games/doc/en/sdk/sdk-events) — game_api_pause/resume, gameplay markup requirements
- [Yandex Games SDK — SDK Methods Requirements 1.19](https://yandex.com/dev/games/doc/en/requirements/1/19) — moderation checklist for SDK usage
- [Yandex Games SDK — Game Requirements](https://yandex.com/dev/games/doc/en/concepts/requirements) — technical requirements for ZIP submission
- [Sentry Browser SDK](https://docs.sentry.io/platforms/javascript/) — client-side error tracking without backend
- [micro-sentry/browser](https://www.npmjs.com/package/@micro-sentry/browser) — 2.27 kB gzip lightweight alternative to full Sentry

**Total queries:** 7 web searches conducted (rate limit hit before code context query)

---

## Kill Question Answer

**"How will you know this broke in production?"**

**Scenario:** Game launches on Yandex Games, gets Novosti traffic (Day 1, 300-600 DAU). Players start sessions, game silently crashes on game over → no ad fires → revenue = 0. Founder sees 0₽ in dashboard and has no idea why.

**This is the exact scenario that kills indie games in the first week.**

**Debugging path without observability:**
1. Check Yandex Games console → no error data there
2. Open browser devtools on your own device → works fine
3. Ask "did anyone report a bug?" → no feedback mechanism
4. Ship a fix blindly → maybe works, maybe doesn't

**Debugging path WITH observability:**

1. **Alert fires:** Sentry reports JS exception spike — `TypeError: Cannot read property 'adv' of undefined` in `AdManager.ts:47` — seen 340 times in last 2 hours, 95% of sessions affected. Error correlates with SDK not initialized when Phaser init was called BEFORE `YaGames.init().then()`
2. **First look:** Sentry error dashboard → stack trace points to exact line. `ysdk` is null when `showFullscreenAdv()` is called
3. **Diagnosis:** SDK pitfall #1 from checklist — Phaser was initialized outside the `.then()` callback, so on some devices/browsers the SDK script loads after Phaser boot. Race condition, not reproducible on fast devices
4. **Mitigation:** Push fix (wrap Phaser init inside `YaGames.init().then()`). Vite build → ZIP → Yandex console upload → submit for re-review is too slow. **This is the gap: no hotfix path on Yandex Games.** You upload a ZIP and wait for moderation to re-check
5. **Resolution:** In future: local SDK mock catches this during dev. Pre-submit checklist item: run game in debug panel with Yandex SDK loaded

**Critical insight:** There is NO "deploy in 5 minutes and rollback" on Yandex Games. You upload a ZIP. Moderation takes 3-5 business days for updates (sometimes faster for patch fixes, unclear). **This means pre-production quality gates are your only defense.** The 3 AM incident is one you prevent before launch, not one you fix during the Novosti window.

**Observability gaps:**
- No structured error reporting by default in browser games
- No session replay to understand what users did before crash
- No way to push hotfix without going through Yandex moderation again
- Yandex Games console shows aggregate stats (DAU, session length, rating) — no error breakdown

---

## Proposed Ops Decisions

### Deployment Strategy

**Pattern:** Single-upload ZIP with pre-flight quality gates (there is no blue-green, no canary — Yandex Games is a ZIP-upload platform)

**Why this pattern:**
Yandex Games is not a hosting platform you control. You upload a ZIP file through their console. Updates go through the same moderation. This fundamentally changes the ops model: **deployment risk must be eliminated BEFORE the ZIP is uploaded, not mitigated after.**

The 7-day Novosti window is your production SLA. A broken game during Novosti = revenue loss that cannot be recovered. There is no rollback to previous version (Yandex may have one internally but it's not developer-accessible). Ship correct, ship once.

**Deployment Flow:**

```
┌──────────────────────────────┐
│  Code complete (Day 5)       │
└──────────┬───────────────────┘
           ↓
┌──────────────────────────────┐
│  npm run build               │  ← Vite production build
│  TypeScript strict check     │  ← tsc --noEmit (zero errors)
│  Bundle size check           │  ← must be < 100MB (Yandex limit)
│  Asset integrity check       │  ← all sprites/audio present in dist/
└──────────┬───────────────────┘
           ↓
┌──────────────────────────────┐
│  Local QA (Day 5 gate)       │  ← Олег + Камиль on real mobile
│  SDK mock: all 7 pitfalls    │  ← YandexSDK.ts mock verified
│  15-point checklist          │  ← binary pass/fail
│  No JS console errors        │  ← zero uncaught exceptions
│  Audio: pause on ad mock     │  ← pitfall #3 verified
└──────────┬───────────────────┘
           ↓
┌──────────────────────────────┐
│  npm run package             │  ← ZIP script (index.html in root)
│  ZIP size logged             │  ← must be < 100MB
│  index.html root check       │  ← automated verification
└──────────┬───────────────────┘
           ↓
┌──────────────────────────────┐
│  Yandex Debug Panel test     │  ← run with real SDK in debug mode
│  SDK methods check (1.19)    │  ← LoadingAPI.ready() fires
│  Ad callbacks verified       │  ← onError, onClose all present
└──────────┬───────────────────┘
           ↓
┌──────────────────────────────┐
│  Yandex Console Upload       │  ← Manual upload (Day 7)
│  Card Completion = green     │  ← all metadata filled
│  Submit for moderation       │
└──────────────────────────────┘
```

**Rollback Plan:**
- **Trigger:** Post-launch: rating drops below 30 OR game crashes reported by any user OR ad callbacks stop firing (0 revenue + game not over)
- **Time to rollback:** Cannot rollback instantaneously on Yandex Games. Fastest path: submit updated ZIP and request expedited review (contact support). Estimate 1-3 business days
- **Process:** Keep previous dist/ folder committed in git with tag `release-v1.0`. Can rebuild and resubmit ZIP from tag in <5 minutes. Waiting for moderation is the bottleneck
- **Mitigation:** Feature flags via Yandex RemoteConfig (ysdk.serverTime and env flags) — can disable features without resubmission if feature is config-controlled

**Database Migration Coordination:**
Not applicable. No database. localStorage schema changes are additive-only:
- Always read with defaults: `localStorage.getItem('highscore') ?? '0'`
- Never delete existing keys (old versions may still be cached on some devices)
- Schema versioning: store `localStorage.setItem('schema_version', '1')` — if version mismatch, migrate or reset

---

### Observability Model

**Context:** This is a client-side-only game. No server. No logs pipeline. "Observability" means:
1. **Error tracking** → Sentry (catches JS exceptions in production, sends to Sentry cloud)
2. **Analytics** → Yandex Metrica (already built into Yandex ecosystem, free, no GDPR complexity for RU users)
3. **SDK telemetry** → Structured console.error for SDK failures (visible in Yandex debug panel)
4. **Business metrics** → Yandex Games console (DAU, session length, rating, ad revenue)

**SLIs (Service Level Indicators):**

| What | SLI | Target | Measurement |
|------|-----|--------|-------------|
| Game boot | Time to first interactive (Phaser ready) | < 3s on mobile 4G | Sentry performance |
| Session | Completes at least 1 game over without crash | > 99% of sessions | Sentry error rate |
| Ad callback | onClose fires after every ad call | 100% | Custom event log |
| Game over screen | Appears within 1s of losing condition | > 99% | Sentry |
| Audio mute | Audio paused before ad, resumed after | 100% | SDK event test |

**SLOs (not external commitments — internal quality bars):**

- JS exception rate: < 0.1% of sessions (if Sentry shows > 1% → investigate immediately)
- Game load success: > 99% of visits result in Phaser boot (if < 95% → something broke in SDK init)
- Session length: median > 3 minutes (if < 2 min → game-feel problem, not tech)
- Novosti D1 target: rating > 4.0 (user experience proxy for technical stability)

**Error Budget:**

For the Novosti window (7 days, ~300-600 DAU):
- Acceptable crash rate: < 5 crashes/day total
- If Sentry shows > 20 unique JS errors in first 24h → treat as P1, consider resubmission
- Error budget exhausted = founder manually reviews top 3 Sentry errors same day

**Structured Error Logging (browser console — visible in Yandex debug panel):**

```typescript
// src/infra/logger.ts
const log = {
  info: (event: string, data?: Record<string, unknown>) =>
    console.log(JSON.stringify({ level: 'info', event, ...data, ts: Date.now() })),
  warn: (event: string, data?: Record<string, unknown>) =>
    console.warn(JSON.stringify({ level: 'warn', event, ...data, ts: Date.now() })),
  error: (event: string, err?: unknown, data?: Record<string, unknown>) => {
    console.error(JSON.stringify({ level: 'error', event, error: String(err), ...data, ts: Date.now() }));
    // Also send to Sentry
    if (typeof Sentry !== 'undefined') Sentry.captureException(err);
  },
};

// Usage in AdManager.ts
ysdk.adv.showFullscreenAdv({
  callbacks: {
    onError: (err) => log.error('ad_interstitial_error', err, { trigger: 'game_over' }),
    onClose: (wasShown) => log.info('ad_interstitial_close', { wasShown }),
  }
});
```

**Analytics Events (Yandex Metrica + localStorage counters):**

```typescript
// Events to track for business intelligence
type GameEvent =
  | 'session_start'
  | 'first_merge'           // engagement signal
  | 'merge_count'           // { count: number, tier: number }
  | 'max_tier_reached'      // { tier: number, animalName: string }
  | 'game_over'             // { score: number, mergeCount: number, sessionMs: number }
  | 'ad_interstitial_shown'
  | 'ad_interstitial_error'
  | 'ad_rewarded_offered'
  | 'ad_rewarded_shown'
  | 'ad_rewarded_skipped'
  | 'ad_banner_visible'
  | 'play_again_clicked'
  | 'rewarded_continue_clicked';
```

**Why Yandex Metrica:**
- Free, no additional SDK weight
- Already trusted in Yandex ecosystem (no CSP or cross-origin issues)
- Russian-language reports match founder's workflow
- Automatic session tracking, heatmaps, funnels

**Why Sentry (micro-sentry 2.27 kB gzip version):**
- Catches unhandled JS exceptions with stack traces
- Free tier: 5,000 errors/month — enough for this scale (300 DAU)
- Shows which browsers/devices crash (critical for 55+ audience on varied devices)
- Alerts via email when new error type appears

**Distributed Tracing:**
Not applicable for a client-side game with no services. Sentry breadcrumbs serve this purpose — they show the sequence of game events leading to a crash.

---

### Alerting Strategy

There is no automated alerting infrastructure (no PagerDuty, no on-call rotation — it's a 1-person team). The "alerting" model is:

1. **Sentry email notification** → new error type detected → founder checks within business hours
2. **Daily Yandex console check** → DAU trend, rating, revenue
3. **Sentry weekly digest** → error volume summary

**Manual monitoring schedule (Novosti window, 7 days):**

| Check | Frequency | What to look for | Action if bad |
|-------|-----------|-----------------|---------------|
| Sentry errors | Morning daily | New error types, error rate > 1% | Fix + resubmit |
| Yandex console rating | Daily | Rating < 4.0 after 50+ reviews | Game-feel patch |
| Yandex console DAU | Daily | Day-over-day drop > 30% | Investigate (bug or algorithm) |
| Ad revenue | Every 2-3 days | Revenue > 0₽ confirms ads firing | N/A if > 0 |
| Session length (Metrica) | Day 1 check | Median session < 2 min | UX review |

**Runbook: Game Crashes After Ad (most likely failure mode)**

```markdown
# Runbook: Post-Ad Game Crash

**Symptom:** Players report game freezes after watching an ad
**Cause candidates:**
  1. Audio not resumed after ad (pitfall #3) — game appears frozen but isn't
  2. game_api_resume event not handled — Phaser scene paused, never unpaused
  3. Phaser scene destroyed during ad (rare)

**Immediate action (< 30 min):**
1. Open Yandex debug panel on your device
2. Watch a rewarded ad
3. Check browser console for errors after ad closes
4. Verify `game_api_resume` event fires and Phaser resumes

**Investigation:**
- Sentry: filter errors to "AdManager" file
- Check: does `this.sound.resumeAll()` get called in onClose callback?
- Check: is `ysdk.on('game_api_resume', handler)` registered?

**Resolution:**
- Fix the ad callback code
- npm run build && npm run package
- Upload to Yandex console (patch submission)

**Prevention:**
- Add to SDK mock: simulate pause/resume cycle in local dev
- Add SDK pitfall #2 and #3 to automated checklist
```

---

### Build Pipeline — Concrete Implementation

**Vite Config for Yandex Games:**

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { execSync } from 'child_process';

export default defineConfig(({ mode }) => ({
  base: './',                    // CRITICAL: relative paths for ZIP deployment

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: mode === 'development',   // no sourcemaps in prod ZIP
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,   // keep console.error for SDK debugging
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        // Deterministic filenames — Yandex cache behavior
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]',
        // Manual chunks: separate Phaser from game code
        manualChunks: {
          phaser: ['phaser'],    // ~1MB — cache separately
        },
      },
    },
    // Target: modern browsers on Yandex Games (2023+ for 55+ audience)
    target: 'es2020',
    // Warn at 2MB total, Yandex limit is 100MB ZIP
    chunkSizeWarningLimit: 2048,
  },

  server: {
    port: 3000,
    host: true,               // expose on LAN for mobile testing
    https: false,             // local dev only
  },

  // Asset handling: inline small assets, file-copy large ones
  assetsInclude: ['**/*.atlas', '**/*.json'],

  define: {
    __DEV__: mode === 'development',
    __VERSION__: JSON.stringify(process.env.npm_package_version),
  },
}));
```

**SDK Mock Pattern (SDK Pitfall #6 solved):**

```typescript
// src/sdk/YandexSDK.ts
const IS_YANDEX = typeof YaGames !== 'undefined';

// Mock that mirrors real SDK interface exactly
const createMock = (): YSDKInterface => ({
  adv: {
    showFullscreenAdv: ({ callbacks } = {}) => {
      console.log('[SDK MOCK] showFullscreenAdv called');
      // Simulate ad timing: 2s delay, then close
      setTimeout(() => {
        callbacks?.onClose?.(true);
      }, 2000);
    },
    showRewardedVideo: ({ callbacks } = {}) => {
      console.log('[SDK MOCK] showRewardedVideo called');
      setTimeout(() => {
        callbacks?.onRewarded?.();
        callbacks?.onClose?.(true);
      }, 3000);
    },
    getBannerAdvStatus: () => Promise.resolve({ stickyAdvIsShowing: false }),
    showBannerAdv: () => Promise.resolve({ stickyAdvIsShowing: true }),
    hideBannerAdv: () => Promise.resolve({ stickyAdvIsShowing: false }),
  },
  isAvailableMethod: (method: string) => Promise.resolve(true),
  environment: {
    app: { id: '0' },
    browser: { lang: 'ru' },
    i18n: { lang: 'ru', tld: 'ru' },
    payload: undefined,
  },
  on: (event: string, handler: () => void) => {
    console.log(`[SDK MOCK] subscribed to ${event}`);
    // Simulate pause event when tab is hidden
    if (event === 'game_api_pause') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) handler();
      });
    }
  },
  off: () => {},
});

// Initialize: real SDK or mock
export async function initSDK(): Promise<YSDKInterface> {
  if (IS_YANDEX) {
    return YaGames.init();
  }
  console.warn('[SDK] Running with mock SDK — local development mode');
  return createMock();
}
```

**Build Scripts (package.json):**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "package": "node scripts/package.mjs",
    "check": "node scripts/preflight-check.mjs",
    "ship": "npm run build && npm run check && npm run package"
  }
}
```

**Pre-flight Check Script:**

```javascript
// scripts/preflight-check.mjs
import { readFileSync, statSync, existsSync } from 'fs';
import { resolve } from 'path';

const DIST = resolve('./dist');
const checks = [];

// 1. index.html in root of dist
const indexExists = existsSync(`${DIST}/index.html`);
checks.push({ name: 'index.html in dist root', pass: indexExists });

// 2. No absolute paths in index.html (would break ZIP deployment)
const indexContent = readFileSync(`${DIST}/index.html`, 'utf8');
const hasAbsolutePaths = /src="\/|href="\//.test(indexContent);
checks.push({ name: 'No absolute paths in index.html', pass: !hasAbsolutePaths });

// 3. SDK script tag present
const hasSDKScript = indexContent.includes('sdk.js');
checks.push({ name: 'Yandex SDK script tag present', pass: hasSDKScript });

// 4. Check total dist size
function getDirSize(dir) {
  const { readdirSync } = await import('fs');
  // simplified — use du-style check
}

// 5. No sourcemaps in production
const hasSourcemaps = existsSync(`${DIST}/assets`) &&
  readdirSync(`${DIST}/assets`).some(f => f.endsWith('.map'));
checks.push({ name: 'No sourcemaps in dist', pass: !hasSourcemaps });

// Report
let passed = 0, failed = 0;
for (const check of checks) {
  console.log(`${check.pass ? 'PASS' : 'FAIL'} ${check.name}`);
  check.pass ? passed++ : failed++;
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
```

**ZIP Packaging Script:**

```javascript
// scripts/package.mjs
import { execSync } from 'child_process';
import { statSync } from 'fs';
import { resolve } from 'path';

const DIST = resolve('./dist');
const OUT = resolve('./release/game.zip');
const MAX_MB = 90; // 90MB safety margin (Yandex limit = 100MB)

// Create ZIP with dist contents (index.html at root of ZIP)
execSync(`cd ${DIST} && zip -r ${OUT} .`, { stdio: 'inherit' });

// Check ZIP size
const stats = statSync(OUT);
const sizeMB = stats.size / (1024 * 1024);

console.log(`ZIP size: ${sizeMB.toFixed(1)} MB`);

if (sizeMB > MAX_MB) {
  console.error(`ERROR: ZIP exceeds ${MAX_MB}MB limit (${sizeMB.toFixed(1)} MB)`);
  process.exit(1);
}

console.log('Package ready:', OUT);
```

---

### Asset Optimization Strategy

**Sprite Assets (Kenney CC0 PNG):**

```
Input: individual PNG sprites (8 animals, ~200x200px each)
Goal: minimize HTTP requests within ZIP, reduce parse time

Approach: TexturePacker or free-tier spritesheet tool
Output: animals.png (single spritesheet) + animals.json (Phaser atlas format)
Expected: 8 individual pngs (~50KB each) → 1 atlas (~150KB) = 70% fewer requests

Compression: Use pngquant for 8-bit PNG compression
  pngquant --quality=65-85 animals.png --output animals-compressed.png
  Typical savings: 50-70% file size reduction with no visible quality loss

Audio: Provide both .ogg and .mp3
  - .ogg: smaller, better for Chrome/Firefox
  - .mp3: Safari fallback
  Phaser loads correct format automatically
  Use Web Audio API format (Phaser default) — NOT HTML5 Audio (crashes on some mobile)
```

**Bundle Size Budget:**

| Asset | Target Size |
|-------|-------------|
| Phaser 3 (minified) | ~900 KB |
| Game code (TS compiled) | < 100 KB |
| Sprite atlas | < 200 KB |
| Audio files | < 500 KB total |
| **Total ZIP** | **< 2 MB** (massively under 100MB limit) |

This game will be tiny. The 100MB limit is not a concern. Focus is on load time on mobile 4G — target < 3 seconds to first interactive.

**Vite asset inlining config:**

```typescript
// In vite.config.ts build section
build: {
  assetsInlineLimit: 4096,  // inline assets < 4KB as base64 (small UI icons)
  // Larger assets (spritesheet, audio) are file-referenced
}
```

---

### 15-Point Pre-Submit Checklist — Automated + Manual

**Automated (npm run check):**
1. `index.html` exists in dist root
2. No absolute paths (`/` prefix) in HTML/JS
3. Yandex SDK script tag present
4. Total ZIP size < 100MB
5. No `.map` sourcemap files in dist
6. No `localhost` or `127.0.0.1` references in dist
7. TypeScript: zero compile errors (`tsc --noEmit` exit code 0)

**Manual (human checklist — Day 5):**
8. Game loads on real mobile device (Android preferred — 55+ audience)
9. Portrait mode works without horizontal scroll
10. Touch targets: drop zone is minimum 44px height thumb-accessible
11. First ad fires AFTER first game over (not before)
12. Interstitial: audio pauses during ad, resumes after close
13. Rewarded video: "Continue" button works, game resumes at correct state
14. Game over → Play Again → new game starts instantly (< 1s)
15. Yandex debug panel: no red errors, SDK version current, `LoadingAPI.ready()` fires

**7 SDK Pitfalls Checklist (integrated into Day 3 gate):**

| # | Pitfall | Verification |
|---|---------|-------------|
| 1 | Phaser init inside `YaGames.init().then()` | Code review: grep for `new Phaser.Game` — must be inside `.then()` |
| 2 | Subscribe to `game_api_pause` / `game_api_resume` | Code review: grep for `ysdk.on('game_api_pause'` |
| 3 | `pauseAll()` audio before any ad | Test: watch ad in debug panel, verify audio stops |
| 4 | `onError` on every ad call | Code review: every `showFullscreenAdv` and `showRewardedVideo` has `onError` |
| 5 | `GameplayAPI.start/stop` at correct moments | Debug panel check: Gameplay Markup section shows green |
| 6 | SDK mock works locally | `npm run dev` → game loads without YaGames, mock console.warn visible |
| 7 | No `setInterval` for ads | Code review: grep for `setInterval` → must return 0 results |

---

### Development Workflow

**Hot Reload Setup:**

```
npm run dev
→ Vite dev server on localhost:3000
→ SDK mock activates (IS_YANDEX = false)
→ HMR: scene changes reflect without full reload
→ TypeScript errors shown in browser overlay
```

**Local Mobile Testing:**

```bash
# Vite binds to 0.0.0.0 with host: true
# Find your machine's LAN IP:
ipconfig  # Windows
# Open http://192.168.x.x:3000 on phone
# Same WiFi network required
```

**Yandex Debug Panel (pre-submit):**

```
1. Upload draft ZIP to Yandex console (mark as draft, no moderation)
2. In console: "Open with debug panel"
3. Debug panel shows: SDK version, method call log, errors
4. Run through: load → play → game over → interstitial ad → play again → rewarded video
5. All SDK calls must show green checkmarks
```

---

### Resilience Patterns

**No server = no cascading failures. But failure modes exist:**

| Failure | Impact | Mitigation | Degraded Mode |
|---------|--------|------------|--------------|
| `YaGames.init()` fails | Game never starts | SDK mock fallback — but in production this means Yandex infra issue | Show "refresh page" message |
| `showFullscreenAdv` times out | No ad shown, game stuck | `onError` callback must ALWAYS advance game state regardless | Game continues without ad (0 revenue for that session) |
| `showRewardedVideo` unavailable | Player can't continue after death | `onError` → hide "Continue" button, show "Play Again" only | Slightly worse UX, not broken |
| `localStorage` full | Highscore not saved | Wrap in try/catch, silent fail | Score shown but not persisted |
| Audio context blocked | No sound (mobile autoplay policy) | Unlock on first user interaction, catch AudioContext errors | Silent gameplay (still playable) |
| Phaser WebGL fail | Black screen | Configure `type: Phaser.AUTO` — fallbacks to Canvas automatically | Canvas mode (slightly worse perf) |

**Audio Context Pattern (mobile autoplay):**

```typescript
// In GameScene.ts — unlock audio on first touch
this.input.once('pointerdown', () => {
  if (this.sound.context.state === 'suspended') {
    this.sound.context.resume();
  }
});
```

**Ad Timeout Pattern:**

```typescript
// NEVER let ad call block game indefinitely
showInterstitialAd(ysdk: YSDKInterface, onComplete: () => void): void {
  const timeout = setTimeout(() => {
    log.warn('ad_interstitial_timeout', { ms: 10000 });
    onComplete(); // Advance game even if ad never responded
  }, 10_000);

  ysdk.adv.showFullscreenAdv({
    callbacks: {
      onClose: () => { clearTimeout(timeout); onComplete(); },
      onError: (err) => { clearTimeout(timeout); log.error('ad_error', err); onComplete(); },
    }
  });
}
```

---

## Cross-Cutting Implications

### For Domain Architecture
- SDK module must initialize FIRST before any other domain (physics, scenes) can start
- Game Core must expose a clean `pause()` / `resume()` interface for SDK events to call
- Single entry point in `main.ts` that orchestrates: SDK init → Phaser boot (not the other way around)

### For Data Architecture
- localStorage writes must be wrapped in try/catch (quota exceeded on some mobile browsers)
- Highscore must be readable without SDK (works even if YaGames.init() fails)
- Yandex Cloud Save API (ysdk.getPlayer().setData) is secondary — localStorage is primary, cloud is sync

### For API Design
- No HTTP endpoints. But `base: './'` in Vite config is non-negotiable — relative paths only
- All asset paths must be relative for ZIP deployment to work
- Phaser's `this.load.setBaseURL('')` — leave empty or set to `./`

### For Security
- CSP: Yandex Games platform controls CSP headers. Game runs in their iframe. Do not fight it.
- No external requests from game code (all Yandex SDK calls go through their endpoint)
- No eval(), no dynamic script injection — Yandex moderation checks for these

---

## Concerns & Recommendations

### Critical Issues

- **No hotfix path after submission:** Yandex Games moderation takes 3-5 days even for updates. If a P1 bug is found during Novosti window, you cannot fix it fast.
  - **Fix:** Invest more in pre-submit QA (Day 5 gate must be thorough). Use feature flags via RemoteConfig where possible.
  - **Rationale:** The 7-day Novosti window is a one-time opportunity. A broken launch cannot be recovered.

- **Ad callback error handling is non-optional:** If ANY ad callback (onClose, onError) is missing and the ad fails silently, the game will hang waiting for a state transition that never fires. This is SDK pitfall #4 and it WILL happen on some devices.
  - **Fix:** Add the 10-second timeout pattern to every ad call. Test with SDK mock that simulates ad errors.
  - **Rationale:** 55+ audience on older Android devices — ad network may return errors frequently.

- **Audio autoplay policy kills mobile experience:** Safari and some Android Chrome versions block audio until user interaction. If Phaser tries to play a sound on load, it silently fails. Users think the game is broken.
  - **Fix:** Unlock AudioContext on first user touch. Add a "tap to start" overlay that serves as both UX and audio unlock.
  - **Rationale:** 55+ audience on mobile = high probability of older iOS Safari with strict autoplay policy.

### Important Considerations

- **Sentry free tier is enough:** 5,000 errors/month is plenty for 300-600 DAU. Use micro-sentry (2.27 kB gzip) not full Sentry to minimize bundle impact.
  - **Recommendation:** Initialize Sentry before Phaser, after SDK init. Catch window.onerror and unhandledrejection.

- **Yandex Metrica setup:** Register counter at metrica.yandex.ru, add script to index.html (outside Phaser). Gives session analytics without any custom code.
  - **Recommendation:** Add game-specific events via `ym(counter, 'reachGoal', 'game_over', { score })` for funnel analysis.

- **Development on Windows with ZIP:** `zip` command in the packaging script requires either Git Bash, WSL, or a Node.js zip library. Recommend `archiver` npm package for cross-platform compatibility.
  - **Recommendation:** Use `archiver` in the package script:
    ```javascript
    import archiver from 'archiver';
    // archiver works on Windows without Unix tools
    ```

### Questions for Clarification

- Is Sentry account being set up? (Free tier, 5 min setup, significant value for debugging post-launch errors)
- Will Yandex Metrica counter be registered before submission? (Required to see retention data in Novosti window)
- What is the plan if moderation rejects after Novosti starts? (Game can be live and then pulled — what's the comms plan?)
- Does the game need to work offline? (Yandex supports offline caching for some games — adds complexity but improves ratings)

---

## References

- [Yandex Games SDK — Official Docs](https://yandex.com/dev/games/doc/en/sdk)
- [Yandex Games — Technical Requirements](https://yandex.com/dev/games/doc/en/concepts/requirements)
- [Yandex Games — SDK Methods Requirements (1.19)](https://yandex.com/dev/games/doc/en/requirements/1/19)
- [Yandex Games — Advertising Callbacks](https://yandex.com/dev/games/doc/en/sdk/sdk-adv)
- [Yandex Games — Pause/Resume Events](https://yandex.com/dev/games/doc/en/sdk/sdk-events)
- [phaserjs/template-vite-ts — Official Template](https://github.com/phaserjs/template-vite-ts)
- [Sentry Browser SDK](https://docs.sentry.io/platforms/javascript/)
- [micro-sentry — Lightweight Sentry client (2.27 kB)](https://www.npmjs.com/package/@micro-sentry/browser)
- [Google SRE Book — Production Readiness](https://sre.google/sre-book/table-of-contents/)
- [Emanuele Feronato — Phaser + Vite Distribution](https://emanueleferonato.com/2025/01/01/develop-build-and-distribute-your-html5-phaser-games-with-vite/)
