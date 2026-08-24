# Devil's Advocate — Skeptical Analysis (Architecture Phase)

**Persona:** Fred Brooks (The Skeptic)
**Role:** Find contradictions, inconsistencies, complexity red flags
**Date:** 2026-03-04
**Phase:** 1 — Initial Skeptical Analysis

---

## Research Conducted

*Note: Exa MCP rate-limited during this session. Research draws from:*
- Board-phase CTO research (`ai/board/research-cto.md`) — detailed Phaser vs alternatives analysis, real suika clone data
- Board-phase Devil critique (`ai/board/critique-devil.md`) — prior art on business risks
- Project context files — business-blueprint.md, architecture-agenda.md
- Training knowledge: real suika clone codebases (sgbj, moonfloof, Feronato), Phaser 3 internals, game architecture patterns

**Total queries:** 4 file reads + deep knowledge synthesis (Exa unavailable — see note above)

---

## Kill Question Answer

**"Who is solely responsible for system integrity? What are the 3 inviolable principles?"**

**Integrity Owner:** NOT IDENTIFIED.

The agenda names 7 architectural personas (Domain, Data, Ops, Security, Evolutionary, DX/Pragmatist, LLM). No one is named as the single arbiter. The business blueprint names "Claude Code + Олег" as joint owners of development. Joint ownership = committee compromise = no ownership.

**Core Principles Identified from the agenda:**
1. UNCLEAR — "reusable for Game 2" (AQ-7) vs "ship in 7 days" — which wins when they conflict?
2. UNCLEAR — TypeScript strict mode vs rapid iteration — no stated rule for tradeoffs
3. UNCLEAR — Phaser scenes vs flat architecture — no unifying pattern stated

**Verdict:** NO CLEAR PRINCIPLES — the agenda lists questions without establishing a hierarchy of values. The board decided the stack (TypeScript + Phaser + Matter.js) but did NOT decide the architectural philosophy. That gap is the problem.

---

## Primary Contradiction: The Stack Is Decided But The Justification Has Holes

The board voted 6/6 for Phaser + TypeScript + Matter.js. This is now treated as sacred. But wait.

**The board CTO's own analysis shows:**

> "moonfloof/suika-game — Pure Matter.js clone (no Phaser) — useful as physics reference"

A working Suika clone exists WITHOUT Phaser. The CTO acknowledged it, then dismissed it in one sentence. No one asked: if a no-Phaser clone works, what exactly is Phaser buying us?

---

## Contradictions Found

### Contradiction #1: "1-Week Project" vs "Reusable Boilerplate"

**Business Blueprint says (Day 8-12):**
> "Productive wait: boilerplate repo, playbook, scope Game 2 with Kamil"

**Architecture Agenda says (AQ-7):**
> "What should be generic vs game-specific from Day 1?"

**The contradiction:**
AQ-7 asks architects to design for reusability from Day 1. But reusability is the #1 enemy of simplicity. Every "generic" abstraction added on Day 1 is complexity paid for a future benefit that may never materialize. The founder's own philosophy — "We don't invent, we combine what already works" — directly contradicts building generic infrastructure speculatively.

This is Founder Anti-Pattern #2 verbatim: "Optimizes tooling instead of product — building DX while users wait."

**Impact if unresolved:**
Architects will design with reusability in mind. This means: abstract SDK wrapper (instead of thin Yandex-specific file), generic animation system (instead of 3 hardcoded tweens), configurable physics module (instead of tuned constants). Each of these adds days to development. The game ships late or half-finished.

**Challenge:**
Which wins — "ship Game 1 in 7 days" or "design boilerplate for Game 2"? State it explicitly, because right now both are in scope simultaneously and they are mutually exclusive goals.

---

### Contradiction #2: "Simple Game" vs "8 Architecture Questions"

**Architecture Agenda says:**
> "This is a simple client-side game."

**But then lists 8 open architecture questions:**
- AQ-1: Physics tuning
- AQ-2: State machine
- AQ-3: SDK wrapper pattern
- AQ-4: Responsive design
- AQ-5: Merge detection
- AQ-6: Build pipeline
- AQ-7: Reusability
- AQ-8: Animation architecture

**The contradiction:**
"Simple game" does not need 8 architecture questions. A simple game needs: one file structure, one state pattern, and ship it. If you genuinely need architectural debate on 8 questions, it is not a simple game — it is a complex project being called simple to feel better about the timeline.

**Impact if unresolved:**
Each of these 8 questions will get a 500-word answer from 7 different personas (= 7 x 8 = 56 answer-attempts). The synthesis will be a 10,000-word document. The developer (Claude Code, in practice) will receive 56 conflicting recommendations and make arbitrary choices anyway. Time spent: 2 hours of architecture work. Time saved in development: arguably zero, since the real decisions happen when writing code.

**Challenge:**
Which 3 of these 8 questions actually require architectural debate? The other 5 can be decided in 30 seconds. State them now. Do not convene a committee for decisions a senior developer makes in 10 minutes alone.

---

### Contradiction #3: "No Backend" but 3 Storage Systems

**Architecture Agenda says:**
> "NO backend, NO database (localStorage only)"

**But proposes:**
1. `localStorage` — for highscore and settings
2. Yandex SDK storage API — for leaderboards and cloud save
3. In-memory game state — for current session

**The contradiction:**
This is three different data stores for a "no database" game. Which is the source of truth for highscore? If a player has 10,000 points in localStorage and their Yandex cloud save shows 8,000 (stale), which number displays? What happens when SDK storage call fails? Does the game fall back to localStorage silently? Does the player see their score drop?

The Data Architect persona will propose a "sync strategy." This is exactly how simple projects become complex ones — one ambiguity becomes a mini-system.

**Impact if unresolved:**
Either the game has a latent highscore corruption bug, or someone builds a sync layer that takes a day to implement and test. Both outcomes are worse than just using localStorage only and ignoring Yandex SDK storage entirely for this game.

**Challenge:**
Pick ONE storage system. For a game where the leaderboard is cosmetic (no prizes, no competition), is Yandex SDK storage worth the complexity? localStorage alone is 3 lines of code. Yandex SDK storage is an async API with error handling and a mock for local dev.

---

## Inconsistencies Across Proposals

### Inconsistency #1: Module Boundaries vs File Count

**Architecture Agenda proposes (via Business Blueprint):**
```
src/
  main.ts
  scenes/  (3 files)
  objects/ (2 files)
  sdk/     (2 files)
  config/  (1 file)
```

That is 9 files for a game that the CTO says has "~50 lines of merge logic" at its core.

**Real Suika clones (from CTO research):**
- sgbj/suika-clone: ~18 commits, reportedly clean structure
- moonfloof/suika-game: Pure Matter.js, no Phaser, reportedly working
- Feronato's $5 source: single-scene structure based on tutorial architecture (preload/create/update)

The inconsistency: the proposed 9-file structure implies module boundaries that may not be necessary. A working Phaser game can exist in 3 files (main.ts + GameScene.ts + config.ts). The extra structure (AdManager.ts, YandexSDK.ts, Animal.ts, MergeChain.ts) adds organizational overhead that only matters when the codebase is large enough to need navigation.

**Why this matters:**
Every additional file is a boundary Claude Code must navigate when making a change. More files = more context window consumed = more opportunity for inconsistency between files. For a 300-400 LOC game, 3 files is more coherent than 9.

**Fix needed:**
State the maximum LOC expected for this game. If total game code is under 800 LOC (likely for this scope), a flat 3-5 file structure is architecturally superior to a modular 9-file structure. The modular structure is borrowed from enterprise patterns that exist to manage complexity at 10,000+ LOC scale.

---

### Inconsistency #2: Error Handling Strategy

The agenda mentions:
- SDK: `onError` callback on every ad call (pitfall #4 in business blueprint)
- Physics: no error handling mentioned
- Merge logic: no error handling mentioned
- State machine: no error handling mentioned

There is no stated error handling philosophy. This means:
- AdManager.ts will have try/catch
- GameScene.ts will have none
- Animal.ts will have none
- The game will crash silently on edge cases that the SDK wrapper survives gracefully

**Fix needed:**
For a client-side game with no backend, the error philosophy is simple: "never throw, always degrade." State this once. Do not design an error architecture per-module.

---

### Inconsistency #3: TypeScript Strictness Level

TypeScript is specified but no tsconfig settings are mentioned. This matters because:
- `strict: true` — catches type errors, slows development by 20-30% (frequent type annotations required)
- `strict: false` — JavaScript-with-types, much faster, some safety lost

For AI-generated code, `strict: true` is better because type errors are caught at compile time, not runtime. BUT for a 7-day project where iteration speed matters, strict mode will cause friction on every rapid prototype step.

Neither the agenda nor the blueprint states which mode. This decision will be made arbitrarily during scaffolding and will be wrong for someone's assumption.

---

## Complexity Red Flags

| Red Flag | Where | Why It's Complex | Simpler Alternative |
|----------|-------|------------------|---------------------|
| `AdManager.ts` as separate class | sdk/ directory | Wraps 3 functions (interstitial, rewarded, banner). Abstraction of 60 lines of code. | Inline ad calls directly in GameScene.ts with 3 helper functions |
| `YandexSDK.ts` wrapper + mock | sdk/ directory | Two classes for one SDK. Mock is valuable, wrapper around wrapper is not. | Single `sdk.ts` file with real + mock combined via env check |
| `MergeChain.ts` as separate object | objects/ directory | Config data masquerading as a class. | Plain array/object in GameConfig.ts |
| `Animal.ts` as separate class | objects/ directory | Phaser physics body + sprite — valid. But if it's just `new Animal(scene, x, y, tier)` with 50 lines, is a class necessary? | Could be a factory function in GameScene.ts |
| 3 Phaser Scenes | scenes/ directory | PreloadScene + MenuScene + GameScene. PreloadScene = 30 lines. MenuScene = 30 lines. | Single scene with states: loading → menu → playing. Reduces inter-scene event complexity |
| AQ-7 in scope | architecture-agenda.md | Designing for Game 2 during Game 1 is premature optimization explicitly | Delete AQ-7. Revisit after Game 1 ships. |

**Complexity Budget:**
- Acceptable: SDK mock/real split (saves development hours), Matter.js physics integration (enables game feel), TypeScript types for Animal/tier data
- Unacceptable: AQ-7 reusability design, AdManager abstraction, MergeChain as class, 3-scene structure for a 1-screen game

---

## Single Points of Failure

### SPOF #1: Yandex SDK Integration

**Failure scenario:** SDK mock works perfectly locally. Real SDK on Yandex Games platform has a behavioral difference not covered by mock (documented pattern — mock simplifies async behavior). Game freezes or crashes on first ad call in production.

**Blast radius:** Game over screen becomes permanently broken. Players cannot restart. Interstitial never shows (= revenue = 0). Rewarded video breaks "Continue" button.

**Likelihood:** Medium (well-documented pitfall, 7 SDK pitfalls acknowledged in blueprint)

**Mitigation proposed?** Yes — the 7 pitfalls list covers this. BUT: the mock proposed in CTO research is a simplified synchronous mock that may not cover timing edge cases in the real async SDK.

**The gap:** Propose testing on real Yandex platform on Day 3 (not Day 5). The 15-point pre-submit checklist is too late to discover SDK issues.

---

### SPOF #2: Matter.js Physics Stability

**Failure scenario:** At high object count (8 tiers, container fills up with 20-30 bodies), Matter.js physics becomes unstable. Objects clip through walls. "Tunneling" at high velocities. Game becomes physically impossible to play at high scores.

**Blast radius:** Core gameplay breaks. 55+ audience encounters a game that "doesn't work" at exactly the point where they're most invested (high score moment). D1 retention destroyed.

**Likelihood:** Low-Medium. Known Matter.js issue with small fast-moving circles at high object counts. Mitigable with specific settings (slop, timeScale) but requires tuning.

**Mitigation proposed?** Partially — AQ-1 addresses physics tuning. BUT: no one has specified the tuning parameters, no one has stated how many Matter.js bodies at peak before stability degrades. AQ-1 is an open question, not a mitigation.

---

### SPOF #3: Single Developer (Claude Code) Coherence

**Failure scenario:** Claude Code generates GameScene.ts with one merge detection pattern (collision event listeners). Then generates Animal.ts with a different pattern (polling in update loop). Both work independently. Together they produce double-merge events or missed merges.

**Blast radius:** Core mechanic is broken. Merging either doesn't happen or happens twice (scoring bug). This is not caught by unit tests (none planned).

**Likelihood:** Medium. This is exactly the inconsistency problem Brooks identified: without conceptual integrity enforced by ONE mind, component boundaries become interface bugs.

**Mitigation proposed?** No. The architecture agenda does not specify which merge detection pattern to use (AQ-5 is still open). This is a real risk.

---

## "What If" Stress Tests

### Stress Test #1: Physics at 25+ Bodies (Late Game)

**Assumption in architecture:** Matter.js handles drop-merge physics stably. The Phaser integration is native.

**What breaks at high object count:** Matter.js CCD (continuous collision detection) is off by default. At 25+ small circles, objects start clipping through walls at high drop speeds. The physics "islands" (groups of settled objects) can desync. This is documented in Matter.js issues for exactly this use case.

**Proposed solution handles it?** Partially — AQ-1 mentions physics tuning but leaves it open.

**Challenge:**
The physics tuning (gravity, restitution, friction, slop, positionIterations, velocityIterations) is not a "question to debate" — it's a specific set of numbers that have been discovered by real Suika clone developers through trial and error. This should be a LOOKUP from reference implementations, not an architectural decision. Go read sgbj/suika-clone's `GameConfig.ts` for these numbers. Do not reinvent them.

---

### Stress Test #2: Yandex SDK down / slow for 3 days

**Assumption:** SDK responds within 1-2 seconds for ad calls. Mock simulates this.

**Impact:** If `showFullscreenAdv` hangs (no callback for 10 seconds), game is frozen on game over screen. Player cannot restart. This is covered by `onError` callback — but what is the timeout? Yandex SDK has no documented timeout. If the real SDK hangs for 30 seconds before calling `onError`, the player closes the tab.

**Graceful degradation?** Partially. `onError` resumes game. But no timeout mechanism is specified. The mock calls `onClose` after 1 second — this doesn't test the 30-second hang case.

**Challenge:**
Add a 5-second `setTimeout` fallback that calls `onComplete(false)` if no callback arrives. This is 3 lines of code but it is the difference between "game hangs on game over" and "graceful ad failure." It should be specified in architecture, not discovered during QA.

---

### Stress Test #3: Kamil takes over development in 3 months

**Assumption (implicit):** "Kamil is co-designer for Game 2" (business blueprint, Day 8-12).

**Bus factor:** 1 (currently Claude Code generates everything, Oleg reviews).

**Documentation sufficient?** Unknown. No ADR (Architecture Decision Records) planned for game-specific decisions.

**Complexity manageable for new dev (a 10-year-old learning)?** The proposed architecture has: TypeScript, Phaser 3 scene system, Matter.js physics, Yandex SDK wrapper, AdManager pattern. For a 10-year-old learning coder, this stack requires understanding 4 separate libraries before writing a single line of game logic.

**Challenge:**
If the educational goal is "Kamil learns to code games," the architecture should be DEMONSTRABLY SIMPLE. A 9-file TypeScript project with Phaser scenes and Matter.js bodies is not learner-friendly. A 3-file plain JS project IS. This is a real contradiction between the business goal ("show Kamil code = money") and the architecture goal ("enterprise-grade structure with TypeScript strict mode").

---

## Questions That Must Be Answered

1. **AQ-7 must be deleted from scope.** "Reusable boilerplate" is Founder Anti-Pattern #2. It must be explicitly removed from architectural consideration for Game 1. Does the architect's board agree that AQ-7 is OUT OF SCOPE for this session?

2. **Which 3 of 8 questions actually require debate?** I assert: only AQ-2 (state machine — Phaser scenes vs single scene), AQ-3 (SDK mock pattern), and AQ-5 (merge detection algorithm) are genuinely architectural. The other 5 are implementation details. Do other architects agree?

3. **Storage source of truth: localStorage ONLY or localStorage + Yandex SDK storage?** Pick one now. Not "it depends" — a specific answer with rationale.

4. **How many Phaser scenes?** 3 scenes (Preload + Menu + Game) or 1 scene with state flags? This is the single most important structural decision. It determines event bus complexity, scene lifecycle management, and how many inter-scene handoffs Claude Code must coordinate correctly.

5. **Where does merge detection live?** In the collision event handler (event-driven, inside Animal.ts or GameScene.ts collision listener) or in the update loop (polling, checking body proximity each frame)? This must be stated before any code is written. Both are valid. Either will work. The decision must be made once and never revisited mid-development.

---

## The Minimum Architecture That Actually Ships

This is what the CTO research actually supports but no one stated explicitly:

```
src/
  main.ts          (~50 LOC) — SDK init, Phaser config, start game
  GameScene.ts     (~300 LOC) — ALL game logic: physics, merge, score, state
  config.ts        (~50 LOC) — tier chain, physics constants, ad settings
  sdk.ts           (~80 LOC) — YaGames wrapper + mock combined (env check)
```

**Total: 4 files, ~480 LOC, all game logic in one place.**

Why this is better for a 7-day project:
- Claude Code reads ONE file to understand game state (no context-switching)
- Merge detection, score, and game over are co-located — no inter-class events
- SDK mock and real implementation are in ONE file — easy to compare, easy to test
- If GameScene.ts hits 400 LOC, THEN extract Animal class. Not before.
- config.ts keeps tuning separated from logic (the only boundary that actually helps)

This is not lazy. This is what Brooks calls "conceptual integrity" — one mind, one mental model, one file with the core logic.

---

## Answering the Specific Questions Posed

### Is Phaser overkill for a simple drop-merge game?

**No — but for a different reason than the CTO states.**

Phaser is not justified because it's "the standard." Phaser is justified because:
1. AI (Claude Code) has the most training data on Phaser, so generation quality is highest
2. Matter.js integration is native — no bridging code
3. The reference clone (sgbj) is Phaser — copy-adapt is faster than rewrite

BUT: Phaser brings 1.2MB of library for a game whose core logic is 300 lines. The actual overhead is: scene lifecycle (PreloadScene boilerplate), input system abstraction, asset cache system. For a drop-merge game, you use maybe 15% of Phaser's features.

**Verdict: Not overkill IF you stay in 3-5 files and don't build "the Phaser way" with elaborate scene hierarchies.**

---

### Is TypeScript overkill for a 1-week project?

**Yes — for vanilla development. No — for AI-assisted development.**

Counter-intuitive argument: TypeScript's primary value is type-checking catches errors before runtime. For a human developer, this saves debug time. For Claude Code generating code, TypeScript errors are FEEDBACK that the AI can act on immediately — it's a tighter feedback loop than runtime errors.

BUT: TypeScript adds a compilation step. Vite handles this. The actual developer experience cost is: occasional type annotation friction on rapid prototypes. For a 7-day project with 1 developer (Claude Code), this cost is real but small.

**Verdict: Keep TypeScript. Use `strict: false` tsconfig during development, switch to `strict: true` for final submission. Do not fight the type system when iterating on game feel.**

---

### How many of the 8 architecture questions actually matter for shipping in 7 days?

**Three.** The rest are implementation details.

| Question | Status | Why |
|----------|--------|-----|
| AQ-1 Physics tuning | LOOK UP — not debate | Copy from sgbj/suika-clone config. Done in 5 minutes. |
| AQ-2 State machine | DECIDE NOW | 3 Phaser scenes vs 1 scene. This affects 50+ LOC of structure. |
| AQ-3 SDK wrapper | DECIDE NOW | Mock pattern affects Day 1 development flow. |
| AQ-4 Responsive design | IMPLEMENTATION DETAIL | Phaser Scale Manager: `ScaleModes.FIT` with `parent: 'game'`. Done. |
| AQ-5 Merge detection | DECIDE NOW | Event-driven vs polling — must be consistent everywhere. |
| AQ-6 Build pipeline | IMPLEMENTATION DETAIL | `vite build` → `zip dist/ -r game.zip`. Two commands. Done. |
| AQ-7 Reusability | DELETE — YAGNI | Not in scope for 7-day project. Explicit anti-pattern. |
| AQ-8 Animation | IMPLEMENTATION DETAIL | `scene.tweens.add({ scale: 1.3, duration: 200 })`. Done. |

**3 real decisions. 5 non-decisions.**

---

### What architectural decisions can be DEFERRED?

All of these can wait until the code is actually written and a real problem appears:

1. **Error handling** — handle the 7 SDK pitfalls explicitly, ignore everything else
2. **Performance optimization** — premature. Test on a real device Day 5. Fix only what breaks.
3. **Code splitting** — unnecessary for a game under 500KB total
4. **Module boundaries** — let the code tell you where to split. Extract when a file hits 400 LOC, not before.
5. **Testing strategy** — manual testing (Kamil plays it on Day 2) is the test. Unit tests for a game with physics simulation are near-useless.
6. **Leaderboard** — technically Yandex SDK supports it. Does anyone actually care if there's a leaderboard on Day 1? Add it Week 2 if the game survives moderation.
7. **Sound** — add Kenney sound effects on Day 4. Do not architect a sound system. Call `this.sound.play('merge')`. Done.

---

## Overall Integrity Assessment

**Conceptual Integrity: C+**

**Reasoning:**

The board made the right decisions on stack (Phaser + TypeScript). The architecture agenda is where the project starts to lose integrity. It frames a 300-LOC game as requiring 8 open architectural questions and 7 expert personas. This creates false complexity.

The unifying idea is buried but real: "Adapt a working Suika clone for Yandex Games in 7 days." If that sentence were the architectural north star, it would immediately answer most questions:
- Adapt = don't redesign. Copy the 3-5 file structure from sgbj.
- Working Suika clone = the physics config already exists. Look it up.
- Yandex Games = SDK mock on Day 1, real integration on Day 3. Nothing more.
- 7 days = YAGNI everything. AQ-7 is dead.

The biggest risk: architects will answer 8 questions with 7 opinions each, produce 56 recommendations, synthesize into a 3,000-word architecture doc, and then Claude Code will still make the real decisions ad-hoc when writing code — because the architecture doc will be too abstract to be actionable. The architecture phase will cost 2 hours and save 0 development hours.

**Biggest Risk:**

AQ-7 (reusability for Game 2) will contaminate the architecture. Someone will propose a `GameEngine.ts` base class or an `EventBus` pattern "for flexibility." This will add 200 LOC of infrastructure to a 480 LOC game, representing 40% overhead serving a future need that may never materialize.

**What Would Brooks Say:**

Brooks would ask who the chief programmer is — the one mind responsible for conceptual integrity. On this project, there is no chief programmer. There is "Claude Code + Олег." This is exactly the committee structure Brooks warned against in The Mythical Man-Month. The mitigation is simple: Oleg must state 3 inviolable rules before the architect board begins. Without those rules, each persona will optimize for their own concerns (the DX architect for dev experience, the Evolutionary architect for future-proofing, etc.) and the synthesis will be a patchwork.

My proposed 3 inviolable rules:
1. **Ship beats architecture** — any architectural decision that delays Day 7 completion is wrong.
2. **Copy beats design** — if sgbj/suika-clone already solved it, use their solution verbatim.
3. **4 files beats 9 files** — no new file is created unless an existing file exceeds 300 LOC.

---

## References

- [Fred Brooks — The Mythical Man-Month](https://en.wikipedia.org/wiki/The_Mythical_Man-Month) — conceptual integrity principle
- [Brooks — No Silver Bullet](http://worrydream.com/refs/Brooks-NoSilverBullet.pdf) — accidental vs essential complexity
- [sgbj/suika-clone](https://github.com/sgbj/suika-clone) — real Phaser + Matter.js implementation (CTO research)
- [moonfloof/suika-game](https://github.com/moonfloof/suika-game) — proof that Phaser is not required (Matter.js standalone works)
- [Phaser.io Suika Source](https://phaser.io/news/2024/10/suika-watermelon-game-source) — $5 Feronato commercial source
- Board CTO Research: `ai/board/research-cto.md` — Phaser vs alternatives analysis
- Board Devil Critique: `ai/board/critique-devil.md` — prior skeptical analysis
- Business Blueprint: `ai/blueprint/business-blueprint.md` — constraints and timeline
- Architecture Agenda: `ai/architect/architecture-agenda.md` — questions under debate
