# CTO Research Report — Round 1

**Director:** Piyush Gupta (CTO lens)
**Date:** 2026-03-04
**Project:** Casual HTML5 Game for Yandex Games

---

## Kill Question Answer

**"If building from scratch — same stack? Same approach?"**

**YES — Phaser.js + Matter.js is the right call.** But with one important caveat: use an existing open-source Suika clone as a structural reference, NOT a blank-slate Phaser project. The evidence is overwhelming: multiple working clones exist on GitHub right now, tutorials are live, and Phaser's built-in Matter.js integration makes physics circles trivially easy. Starting from scratch with vanilla Canvas or PixiJS would be carrying in complexity we don't need.

The one thing I'd change from the founder's original vision: build on TypeScript + Vite (not plain JS), as all the modern clones do — better AI code generation, fewer bugs caught at compile time, zero performance cost.

---

## Focus Area 1: Build vs Buy

### Build (Core IP — our moat, even if thin)

| Component | Why build |
|-----------|-----------|
| Merge logic + progression chain | Our "fишка" — unique theme, custom progression (8-10 objects), score multipliers |
| Game over detection | Specific to our container design |
| UI/UX polish layer | Animations, juice, particle effects — what makes it feel "not a clone" |
| Ad trigger manager | Wrapper around Yandex SDK calls — thin but ours |

### Buy / Reuse (Commodity — don't touch)

| Component | Tool/Source | Reason |
|-----------|-------------|--------|
| Physics engine | Matter.js (via Phaser built-in) | Circles, collisions, gravity — solved problem |
| Game framework | Phaser 3 (latest: 3.90.0) | Input, scenes, asset loading, tweens — all included |
| SDK integration | Yandex Games SDK (`/sdk.js`) | Mandatory, just load it |
| Assets | Kenney.nl (CC0) or custom pixel art | Free, zero legal risk |
| Build tooling | Vite | Zero config, instant HMR, outputs ZIP-ready bundle |

### Case Studies

| Company | Decision | Outcome |
|---------|----------|---------|
| sgbj (open source) | Built Suika clone on Phaser + Matter.js | Working game in ~18 commits, deployed on GitHub Pages |
| Fernando Ruiz Rico | Built Halloween merge on Phaser (tutorial project) | Complete game with custom theme, clean code split across preload/create/update files |
| thanonup (GitHub) | Built Suika clone on PixiJS + Matter.js separately | Works but required manual bridge between PixiJS render and Matter.js physics — extra complexity |
| Emanuele Feronato | Sold Phaser + Box2D/Planck.js Suika source for $5 | Popular — proves demand, but Box2D is unnecessary complexity vs native Matter.js integration |

**Verdict:** The PixiJS + Matter.js path requires manual rendering-to-physics bridging. Phaser has it native. Don't pay that complexity tax.

---

## Focus Area 2: Tech Stack Trends

### Modern Casual HTML5 Game Stack (2024-2026)

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Phaser 3.85+** | 36,000+ GitHub stars, 2M+ npm downloads/month, batteries-included |
| Physics | **Matter.js** (bundled) | Circle bodies, collision events, gravity — exactly what drop-merge needs |
| Language | **TypeScript** | All modern clones use it; AI generates better typed code |
| Build | **Vite** | Instant dev server, builds ZIP in seconds |
| Assets | **Kenney.nl CC0** | 60,000+ assets, commercially usable, zero attribution required |

### Phaser vs Alternatives: Decision Matrix

| Engine | Setup Time | Physics | Matter.js Integration | AI Codegen Quality | Verdict |
|--------|-----------|---------|----------------------|-------------------|---------|
| **Phaser 3** | 15 min | Built-in (Arcade + Matter) | Native, zero config | Excellent (huge training data) | **Winner** |
| Vanilla Canvas | 0 min | DIY (hours) | Manual import | Good but no framework patterns | Too slow for 1 week |
| PixiJS | 30 min | None (need Matter.js separately) | Manual bridge required | Good | Overkill, wrong tool |
| Kaplay.js | 10 min | Built-in (simple) | No Matter.js | Limited training data | Good for beginners, lacks circle physics fidelity |
| melonJS | 20 min | Built-in | No | Limited | Not worth learning curve |

### Bundle Sizes (matters for Yandex Games 100MB limit)

| Engine | Bundle Size |
|--------|------------|
| Phaser 3 | ~1.2MB minified |
| PixiJS | ~450KB |
| Kaplay | ~300KB |
| Vanilla Canvas | ~0KB |

All are well within the 100MB limit. Bundle size is irrelevant here — choose by DX.

### Legacy / Pitfalls to Avoid

- **Box2D/Planck.js** — overcomplicated for circles, use Matter.js
- **Phaser 2** — dead, don't use
- **Kaboom.js** — abandoned by Replit in May 2024, community forked to Kaplay
- **Construct 3 / GDevelop** — visual editors, no good for AI-assisted code generation

---

## Focus Area 3: Developer Market & Hiring

*Not directly applicable (solo + AI setup), but relevant for "Камиль picks this up next" scenario.*

### Talent Availability

| Stack | Availability | Notes |
|-------|-------------|-------|
| Phaser.js | Medium-High | Large community, active Discord, 500+ tutorials |
| TypeScript | Very High | Industry standard, easy to hire |
| Vanilla JS Canvas | High | But no hiring advantage vs Phaser |
| Kaplay | Low | Too new, small ecosystem |

### Phaser Community Strength

- GitHub: 36,000+ stars, actively maintained (v3.90.0 released 2024)
- Official examples: 1,000+ live examples at phaser.io/examples
- Tutorials: Emanuele Feronato has 500+ Phaser tutorials
- Phaser Studio officially selling game templates ($5-45)
- Strong Stack Overflow presence

### For Камиль (10-year-old learning)

Phaser has the best "copy example → modify → see result" loop. The examples site is excellent. Kaplay has friendlier API syntax but worse physics for this use case.

---

## Focus Area 4: Drop Merge vs Alternatives — Implementation Complexity

### Genre Comparison by Implementation Hours (with AI assistance)

| Genre | Core Mechanic | Physics | State Machine | Assets Needed | Total Hours (AI-assisted) | Risk |
|-------|--------------|---------|---------------|---------------|--------------------------|------|
| **Drop Merge (Suika)** | Drop object, detect same-type collision, merge to next tier | Matter.js circles — native | Simple (drop → collide → merge → score) | 8-10 sprites | **12-20h** | Low — clones exist |
| Bubble Shooter | Aim, shoot, BFS for 3+ matches, floating island detection | Arcade Physics (simple ballistics) | Complex (grid state, color management, endgame) | Grid assets, shooter UI | **20-35h** | Medium — grid state is tricky |
| Endless Runner | Procedural obstacle spawn, character jump | Arcade (simple) | Medium (speed ramp, ground detection) | Tileset, character animations | **15-25h** | Medium — polish takes time |
| Idle/Clicker | Click → increment → auto-click | None | Simple (save/load state) | Minimal | **8-15h** | High — may fail 10-min moderation |
| 2048 (pure) | Grid merge, swipe | None | Medium | Minimal | **10-15h** | Medium — crowded, low retention |

### Why Drop Merge Wins on Implementation

1. **Open-source clones exist and are readable** — sgbj/suika-clone (Phaser + Matter.js), moonfloof/suika-game (Matter.js standalone), TomboFry/suika-game
2. **Physics is the hard part — already solved** by Matter.js circle bodies. No custom collision math.
3. **Merge logic is ~50 lines of code** — on collision, if `bodyA.label === bodyB.label && level < MAX_LEVEL`, destroy both, spawn next tier body at midpoint
4. **Game over is trivially simple** — check if any body's Y position exceeds danger line
5. **Natural ad trigger** — game over → interstitial before restart
6. **No grid state** — unlike Bubble Shooter, no BFS needed. Physics engine handles positioning.

### Bubble Shooter Hidden Complexity

Phaser's own tutorial requires 3 parts (April, September 2025) to cover:
- Hexagonal grid collision detection
- Depth-first search for connected bubble groups
- "Floating island" detection (detached bubble groups that fall)
- Smart color management (prevent unwinnable states)

This is 2-3x more implementation complexity than drop-merge for a 1-week deadline.

---

## Focus Area 5: Yandex Games SDK — Integration & Pitfalls

### SDK Overview

Yandex Games SDK (`/sdk.js`) is loaded via relative path from within the ZIP archive. It's mandatory for moderation.

```html
<!-- in index.html head -->
<script src="/sdk.js"></script>
```

### Initialization Pattern (required)

```javascript
// Must await SDK init before showing game
YaGames.init().then(ysdk => {
  window.ysdk = ysdk;
  // Only now start Phaser game
  startGame();
});
```

**Pitfall #1: Starting Phaser before SDK init.** If your game boots before `YaGames.init()` resolves, ads won't work and moderation fails. Fix: wrap Phaser `new Game(config)` inside the `.then()` callback.

### Ad Integration Pattern

```javascript
// Interstitial — after game over
function showInterstitialAd(onComplete) {
  // MUST pause Phaser physics and audio first
  scene.matter.pause();
  scene.sound.pauseAll();

  ysdk.adv.showFullscreenAdv({
    callbacks: {
      onOpen: () => { /* ad showing */ },
      onClose: (wasShown) => {
        scene.matter.resume();
        scene.sound.resumeAll();
        onComplete(wasShown);
      },
      onError: (error) => {
        // Always call onComplete even on error
        onComplete(false);
      }
    }
  });
}

// Rewarded video — for continue/bonus
function showRewardedAd(onRewarded, onCancel) {
  scene.matter.pause();
  scene.sound.pauseAll();

  ysdk.adv.showRewardedVideo({
    callbacks: {
      onRewarded: () => onRewarded(),
      onClose: () => {
        scene.matter.resume();
        scene.sound.resumeAll();
      },
      onError: (error) => onCancel()
    }
  });
}
```

### Mandatory SDK Events (moderation requirement — items 1.3, 4.7)

```javascript
// Subscribe to platform pause/resume events
ysdk.on('game_api_pause', () => {
  scene.scene.pause();
  scene.sound.pauseAll();
});

ysdk.on('game_api_resume', () => {
  scene.scene.resume();
  scene.sound.resumeAll();
});
```

**Pitfall #2: Not implementing `game_api_pause`/`game_api_resume`.** This is a moderation requirement. Games that don't handle browser tab switching, ad display, and window minimize/maximize will be rejected.

### Gameplay Lifecycle API (required for rankings/recommendations)

```javascript
// Call when gameplay actually starts (not on menu/loading)
ysdk.features.GameplayAPI.start();

// Call when gameplay stops (menu, game over, pause)
ysdk.features.GameplayAPI.stop();
```

**Pitfall #3: Calling GameplayAPI.start() during loading screens or menus.** Yandex uses this data for recommendation algorithms. Wrong implementation = lower algorithm score.

### Known SDK Pitfalls Summary

| Pitfall | Severity | Fix |
|---------|----------|-----|
| Starting game before SDK init | Critical — moderation fail | Wrap Phaser init in YaGames.init().then() |
| No game_api_pause handling | Critical — moderation fail | Subscribe to SDK events on init |
| Not pausing audio before interstitial | High — bad UX, ad fraud risk | Always pause Phaser sound before showFullscreenAdv |
| setInterval-based ad calls (not user-triggered) | High — ad fraud, revenue reduction | Only call on game over / explicit user action |
| Not calling GameplayAPI.start/stop | Medium — lower recommendations | Call at game start and game over |
| Testing locally without SDK mock | Medium — breaks development | Use Yandex local server tool or mock ysdk object |
| Forgetting onError callback | Medium — game freezes if ad fails | Always implement onError, always resume game |

### Local Development Without SDK

```javascript
// Mock SDK for local development
if (!window.YaGames) {
  window.ysdk = {
    adv: {
      showFullscreenAdv: ({ callbacks }) => {
        setTimeout(() => callbacks.onClose(true), 1000);
      },
      showRewardedVideo: ({ callbacks }) => {
        callbacks.onRewarded();
        callbacks.onClose();
      }
    },
    features: { GameplayAPI: { start: ()=>{}, stop: ()=>{} } },
    on: () => {}
  };
  startGame();
} else {
  YaGames.init().then(ysdk => { window.ysdk = ysdk; startGame(); });
}
```

---

## Focus Area 6: Free Assets for Casual Games

### Top Sources (all CC0 or free for commercial use)

| Source | Content | Best For |
|--------|---------|----------|
| **Kenney.nl** | 60,000+ assets, CC0, no attribution | Everything — UI, sprites, sounds |
| **kenney.itch.io** | Same + paid bundle ($19.95 all-in-one) | Complete packs |
| **OpenGameArt.org** | Huge variety, check license per asset | Custom art needs |
| **itch.io (free assets tag)** | Many free packs, check CC0 filter | Unique styles |
| **Freesound.org** | Sound effects, CC0 filter available | Merge sounds, UI clicks |
| **Google Fonts** | Typography | Score display, UI text |

### Specific Kenney Packs for Drop Merge

| Pack | Content | URL |
|------|---------|-----|
| Puzzle Pack 2 | 2D puzzle sprites including circles | kenney.nl/assets |
| UI Pack | 400+ UI sprites (buttons, panels, health bars) | kenney.nl/assets |
| 1-Bit Pack | 1000+ minimal sprites, good for prototype | kenney.itch.io |
| Kenney Fonts | Game-ready bitmap fonts | kenney.nl/assets |

**Sound Strategy:** Kenney's 1,200+ free sound effects include impact, pop, and merge sounds that can double as drop/merge audio.

**Art Strategy for 1 Week:** Use geometric shapes (colored circles of increasing size) styled consistently. No need for complex sprites — the physics IS the visual.

---

## Technical Recommendations

### Recommended Stack

```
Language:    TypeScript
Framework:   Phaser 3.90.0 (latest)
Physics:     Matter.js (Phaser built-in, zero config)
Build:       Vite 5.x
Assets:      Kenney.nl CC0
SDK:         Yandex Games SDK (mandatory)
Deploy:      ZIP bundle (Vite build output)
```

### Project Structure

```
src/
├── main.ts              # Phaser game config, SDK init wrapper
├── scenes/
│   ├── PreloadScene.ts  # Asset loading
│   ├── MenuScene.ts     # Start screen
│   └── GameScene.ts     # Core gameplay (drop, merge, score)
├── objects/
│   ├── Fruit.ts         # Matter.js circle + sprite + label
│   └── MergeChain.ts    # Progression config (8-10 levels)
├── sdk/
│   ├── YandexSDK.ts     # SDK wrapper + mock for dev
│   └── AdManager.ts     # Ad calls with pause/resume
└── config/
    └── GameConfig.ts    # Constants, sizing, tier definitions
```

### Build vs Buy Breakdown

**Build:**
- Merge progression chain (which object merges into what)
- Scoring system and multipliers
- Game over detection logic
- Visual theme/art direction
- Ad trigger placement (when exactly to show ads)

**Buy / Reuse:**
- Phaser 3 (framework)
- Matter.js (physics — via Phaser)
- Yandex Games SDK (mandatory platform SDK)
- Kenney.nl assets (sprites, sounds, fonts)
- Vite (build tooling)
- Reference architecture from sgbj/suika-clone (structural pattern)

### OQ-3 Decision: Genre — Drop Merge

**Recommendation: Drop Merge (Suika mechanic). Clear winner.**

| Criterion | Drop Merge | Bubble Shooter | Endless Runner |
|-----------|-----------|----------------|----------------|
| Implementation hours (AI-assisted) | 12-20h | 20-35h | 15-25h |
| Open-source references | 5+ working clones in Phaser/Matter.js | Yes, but complex | Some |
| Physics complexity | Low (circles, built-in) | None needed (but grid state hard) | Low |
| Fit for 1-week deadline | YES | Risky | Possible |
| Natural ad placement | Excellent (game over) | Good | Good |
| Audience fit (55+ women) | High (merge satisfaction, low skill) | High (familiar) | Low (reflex) |
| AI codegen quality | High (many examples in training data) | Medium | Medium |

**Concrete risk of Bubble Shooter:** Phaser's own official tutorial needed 3 separate multi-part episodes (April + September 2025) to cover the mechanics. For a 1-week AI-assisted solo project, this is a red flag.

### First-Principles Check

If building from scratch today with this constraint set (1 week, zero budget, AI-assisted, Yandex Games):

1. Would I choose TypeScript? YES — AI generates much better typed code.
2. Would I choose Phaser? YES — most open-source drop-merge clones use exactly this.
3. Would I choose Matter.js? YES — it's built into Phaser, zero setup for circle physics.
4. Would I choose Drop Merge genre? YES — lowest implementation complexity with highest "wow" factor.
5. Would I use an existing open-source clone as reference? **ABSOLUTELY YES** — we don't invent, we combine.

### Anti-Patterns to Avoid

1. **Starting with blank Phaser template** — use sgbj/suika-clone or Fernando's Halloween merge as structural reference. Read, understand, then adapt with custom theme.
2. **Implementing Bubble Shooter** — 2x complexity for same payout. Wrong call for 1-week constraint.
3. **Building SDK from scratch** — just load `/sdk.js`, wrap in a thin `AdManager.ts`
4. **Using PixiJS instead of Phaser** — requires manual physics bridge, no built-in scene management
5. **setInterval ad calls** — Yandex flags this as ad fraud. Only event-triggered calls.
6. **Not mocking SDK in development** — game will crash locally without the mock. Build the mock on Day 1.

---

## Research Sources

1. [sgbj/suika-clone — Phaser + Matter.js](https://github.com/sgbj/suika-clone) — Working Suika clone with TypeScript + Vite, confirms stack viability
2. [Phaser.io — Suika Watermelon Game Source](https://phaser.io/news/2024/10/suika-watermelon-game-source) — Official Phaser blog confirms this is the go-to stack; $5 commercial source available
3. [Fernando Ruiz Rico — Phaser Halloween Merge](https://fernandoruizrico.com/phaser-unit-10/) — Complete tutorial with code architecture (preload/create/update split)
4. [Phaser Examples — Circle Stack (Matter.js)](https://phaser.io/examples/v3.85.0/physics/matterjs/view/circle-stack) — Official code sample for Matter.js circle physics in Phaser
5. [Yandex Games SDK — Advertising](https://yandex.com/dev/games/doc/en/sdk/sdk-adv) — Official ad implementation docs with correct callback patterns
6. [Yandex Games SDK — Events](https://yandex.com/dev/games/doc/en/sdk/sdk-events) — game_api_pause/resume mandatory events, moderation requirements
7. [Phaser vs PixiJS Comparison 2025](https://generalistprogrammer.com/comparisons/phaser-vs-pixijs) — Data: Phaser 36K stars, 2M npm/month; PixiJS faster for rendering but wrong tool for game framework
8. [Bubble Shooter in Phaser — Part 2](https://phaser.io/news/2025/09/bubble-shooter-in-phaser-part-2) — Confirms BFS complexity, floating island detection, color management — too complex for 1 week
9. [Kenney Game Assets](https://kenney.nl/) — 60,000+ CC0 assets confirmed, 1200+ sound effects
10. [moonfloof/suika-game](https://github.com/moonfloof/suika-game) — Pure Matter.js clone (no Phaser) — useful as physics reference but Phaser version is better for our needs
