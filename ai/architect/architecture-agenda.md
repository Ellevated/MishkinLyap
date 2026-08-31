# Architecture Agenda — Zverata (Зверята)

**Date:** 2026-03-04
**Round:** 1
**Source:** ai/blueprint/business-blueprint.md

---

## Context

Client-side HTML5 casual drop-merge game with cute animals. Phaser 3 + Matter.js + TypeScript + Vite. Published on Yandex Games platform. NO backend, NO database (localStorage only), NO auth, NO user accounts. Pure client-side game with SDK integration for ads and leaderboards.

**Board Constraints:**
- Stack: TypeScript + Phaser 3.90 + Matter.js (built-in) + Vite 5.x
- Reference: sgbj/suika-clone (structural pattern)
- Assets: Kenney.nl CC0
- SDK: Yandex Games (ads + leaderboard + storage)
- Timeline: 7 days development, 3 weeks total cycle
- Target: Women 35-65, 55+ audience
- Monetization: Ads only (interstitial + rewarded + sticky banner)

---

## Implied Domains (from Business Blueprint)

This is a simple client-side game. "Domains" here = game modules, not DDD bounded contexts:

1. **Game Core** — Physics, drop mechanics, merge logic, scoring, game state
2. **Presentation** — Scenes, UI, animations, particles, sound
3. **SDK Integration** — Yandex Games SDK wrapper, ad management, leaderboard, storage
4. **Config** — Animal progression chain, constants, tuning parameters

---

## Open Architecture Questions

### AQ-1: Physics Tuning
Matter.js gravity, restitution, friction coefficients for satisfying drop-merge feel. Container walls. Collision detection for merge triggers.

### AQ-2: Game State Machine
States: Menu → Playing → GameOver → (Ad) → Menu. How to manage transitions? Phaser scenes vs single scene with states?

### AQ-3: SDK Wrapper Pattern
Mock for local dev vs real SDK in production. How to abstract Yandex-specific code for potential reuse with other platforms?

### AQ-4: Responsive Design
Portrait + landscape support. Mobile + desktop. How to handle different aspect ratios? Phaser scale manager config.

### AQ-5: Merge Detection Algorithm
When two same-tier animals touch → merge into next tier. How to detect? Matter.js collision events? Debounce? Chain merges?

### AQ-6: Build Pipeline
Vite config → production build → ZIP packaging → Yandex-compatible output. Asset optimization.

### AQ-7: Reusability for Game 2
If founder evolves into portfolio (Strategy 3), what should be generic vs game-specific from Day 1?

### AQ-8: Animation Architecture
Merge effect (0.2s scale + particles), drop effect, game over effect. Phaser tweens vs custom animation system?

---

## Persona Assignments

### Domain Architect (Eric Evans lens)
- What are the bounded contexts for a client-side game? Module boundaries.
- How do Game Core, Presentation, SDK, and Config interact?
- Interface contracts between modules.
- Focus: AQ-2 (state machine), AQ-5 (merge detection), AQ-7 (reusability)

### Data Architect (Kleppmann lens)
- No database, but: what data flows through the game? Score, highscore, tier state, SDK responses.
- localStorage schema for persistence (highscore, settings).
- Yandex SDK storage API vs localStorage.
- Type definitions: Animal, Tier, Score, GameState.
- Focus: AQ-5 (merge data model)

### Ops/Observability (Charity Majors lens)
- No server, but: how to know if game works in production?
- Error tracking in browser? SDK error callbacks.
- Analytics: what metrics matter? Session length, merge count, ad impressions.
- Build + deploy pipeline: Vite → ZIP → Yandex console.
- Focus: AQ-6 (build pipeline)

### Security Architect
- Client-side game = no traditional attack surface.
- But: SDK integration security. CSP headers. No external requests except Yandex SDK.
- Score manipulation? (Not critical — no prizes)
- Focus: SDK integration safety, CSP compliance for Yandex

### Evolutionary Architect (Neal Ford lens)
- What fitness functions protect the game from degrading?
- File size < 100MB budget (Yandex limit).
- Performance: 60fps on mobile, physics stability.
- Focus: AQ-7 (reusability), AQ-4 (responsive), future-proofing

### DX / Pragmatist (Dan McKinley lens)
- Innovation tokens: Phaser is the 1 token. Everything else = boring tech.
- Dev workflow: hot reload, SDK mock, easy testing.
- Focus: AQ-3 (SDK wrapper), AQ-6 (build pipeline), developer experience

### LLM Architect (Erik Schluntz lens)
- No LLM in the game itself.
- BUT: game is built BY LLM (Claude Code). How should code be structured for AI-assisted development?
- File size limits, clear module boundaries, self-documenting types.
- Focus: AQ-7 (reusability), code structure for AI maintenance

### Devil's Advocate (Fred Brooks lens)
- Is Phaser overkill for this? Could vanilla Canvas + Matter.js be simpler?
- Is TypeScript overkill for a 1-week game?
- Challenge every "nice to have" in architecture.
- What's the minimum architecture that ships in 7 days?
