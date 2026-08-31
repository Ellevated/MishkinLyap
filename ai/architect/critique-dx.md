# Developer Experience Cross-Critique

**Persona:** Dan (DX Architect / Pragmatist)
**Phase:** 2 — Peer Review
**Date:** 2026-03-04
**Project:** Zverata — HTML5 drop-merge game for Yandex Games

---

## My Phase 1 Position (Summary)

Innovation token accounting for a 7-day HTML5 game:
- Token 1: Phaser 3 — the game engine IS the product
- Token 0 (free): Vite 5 — boring bundler by 2026
- Token 0.5: TypeScript — boring enough, pays off for AI-assisted dev
- Remaining 1.5 tokens: reserve for Game 2 differentiation

Core DX decisions: SDK wrapper = interface + if-statement (nothing more), GameConfig.ts = single tuning file Kamil can touch, 18 files flat structure, manual QA over automated test framework, `npm run dev` and you're playing in under 5 minutes.

Kill question answer: everything in this stack solves a business problem. Zero engineering curiosity spending.

---

## Peer Analysis Reviews

---

### Analysis A (Domain Architect — Eric)

**Agreement:** Partially Agree

**Reasoning from DX perspective:**

Eric produces the most thorough domain boundary work of any peer. The four-module split (GameCore, Presentation, PlatformBridge, GameConfig) is conceptually clean and the linguistic test ("can Animal mean different things across modules?") is the right DDD question to ask. His `IPlatformBridge` interface is essentially the same pattern I called "IYandexSDK interface + if-statement" — we independently reached the same conclusion, which validates it.

His MergeSystem guard pattern with the `mergingIds: Set<string>` is solid. This is exactly the kind of logic that needs to be in one place — and he put it there correctly. The `isSettled` guard preventing mid-air merges from the sgbj/suika-clone gap is a genuine find. That's not in the reference implementation, and it will cause visible bugs on production. Good catch.

Where Eric loses me is the enterprise-grade scope of the interfaces. `IPlatformBridge` has 14 methods including optional leaderboard methods and `pauseAudio()` as a first-class platform concern. I count that at 1.5-2 abstraction layers deep for a game whose SDK wrapper is really 3 ad call types and a storage read/write. The `IGameEventSource` interface (what Presentation requires from GameCore) is clean in theory but adds an extra contract file that a 7-day project probably doesn't need typed separately.

The domain event table is excellent reference material — exactly the kind of thing that prevents Claude Code from re-architecting the event flow every session. High signal.

**Missed gaps:**
- No mention of the DX cost of the abstraction layers. `IPlatformBridge` with 14 methods creates 14 points where the mock can diverge from the real implementation. Every extra method is maintenance surface.
- The module header protocol (from LLM peer G/H) is not mentioned. Modules without headers are invisible to an agent starting fresh.
- No call-out of the `isSettled` timing gap on Yandex platform specifically — mobile devices have slower physics tick rates, which changes when "settled" triggers.

**Ranking:** 4/5 — Strongest domain work. Slight over-engineering on interface surface area.

**Integration with my position:** Keep the four-module split. Trim `IPlatformBridge` to the 7 methods actually needed for Game 1 (no optional leaderboard in MVP). The `IGameEventSource` interface can be inlined — no need for a separate contract file.

---

### Analysis B (Operations — Charity)

**Agreement:** Agree

**Reasoning from DX perspective:**

Charity's key insight is the one no one else states explicitly: "there is no rollback on Yandex Games." You upload a ZIP and wait for moderation. This fundamentally reshapes the ops model — all your quality gates must happen BEFORE the ZIP, not after. She nails this.

The 15-point pre-submit checklist (7 automated, 8 manual) is the right instrument for this constraint. Automated checks include exactly the things that bite HTML5 game developers: absolute paths in index.html, missing SDK script tag, sourcemaps in prod build. These are the 3 AM incidents you prevent with a grep.

The `npm run ship` = `build && check && package` script is exactly the boring-tech DX move. One command, verified output, ready to upload. No ceremony.

The `preflight-check.mjs` script has a syntactical issue (mixing async import inside non-async function) but the intent is right. The `archiver` recommendation for Windows ZIP compatibility is a practical detail none of the other peers caught — and this project runs on Windows (per the environment context).

The ad timeout pattern (10-second `setTimeout` fallback that always calls `onComplete`) is critical. Charity makes it concrete with code. This is the difference between "game hangs at game over" and "graceful failure." Every peer that mentions ad error handling talks about it abstractly; Charity provides the implementation.

From a pure DX standpoint: the pre-flight script adds a Node.js dependency (`archiver`) and a `scripts/` folder. That's an innovation token cost. BUT the alternative — discovering the ZIP has absolute paths after you've already submitted — is a week-long setback during the Novosti window. This is exactly the kind of infrastructure spend that HAS a clear business ROI.

**Missed gaps:**
- The `manualChunks: { phaser: ['phaser'] }` in her Vite config contradicts my own recommendation (and the domain peer's) to use a single bundle for Yandex compatibility. Code splitting creates multiple chunks and Yandex's ZIP validator expects `index.html` as a single entry point. This is a conflict that needs resolution before implementation.
- No mention of Kamil's workflow. The pre-submit checklist is Oleg's gate. What does Kamil's dev loop look like? Is his `npm run dev` experience protected?
- The Sentry recommendation (2.27 kB micro-sentry) adds a 3rd-party dependency and a CDN call if loaded remotely. Verify: does Sentry SDK need to be bundled into the ZIP or can it call out to sentry.io? If it calls out, it's a CSP issue. Charity doesn't address this.

**Ranking:** 4/5 — Best ops thinking, concrete implementations, catches the no-rollback constraint. The manualChunks conflict is a meaningful gap.

**Integration with my position:** Adopt the 15-point checklist, the `npm run ship` pattern, and the ad timeout pattern. Resolve the manualChunks conflict in favor of single bundle (Yandex ZIP compatibility takes priority over caching).

---

### Analysis C (Evolutionary Architect — Neal)

**Agreement:** Partially Agree

**Reasoning from DX perspective:**

Neal's fitness function suite is the most operationally useful output of any peer review. The specific shell scripts — `check-bundle-size.sh`, `check-theme-isolation.sh`, `check-loc.sh` — are grep tests and shell one-liners that take 30 minutes to write and prevent weeks of regressions. These are boring technology at its best: no framework, no CI service, just `find` and `wc -l`.

The `dependency-cruiser` recommendation for import direction enforcement is one abstraction I'd normally flag as an innovation token spend. But Neal justifies it: it's a 4KB dev dep, it's automated, and it protects the `config ← shared ← core ← scenes ← main` dependency rule that otherwise only survives through code review. Worth the token.

The `ThemeConfig` interface for Game 2 reusability is where I start to disagree. Neal (like Eric) is investing in AQ-7 reusability during Game 1. The check-theme-isolation fitness function is clever — grep for animal names outside config/ — but it's guarding an abstraction that Game 2 may never use. The `ACTIVE_THEME = ANIMALS_THEME` switcher adds indirection to a codebase where direct access is fine.

The physics body cleanup code (`handleMerge` removing bodies before creating new ones) is exactly the type of thing that should be in the architecture — it prevents the most common mobile performance failure (accumulating Matter.js bodies) and it's concrete enough to be actionable. Good.

The portrait-lock fitness function (`grep -q "orientation=portrait" index.html`) is a one-liner that catches a real deployment regression. No innovation token needed.

**Missed gaps:**
- The `DEBT:` comment pattern is excellent but Neal doesn't apply it to his own ThemeConfig recommendation. "DEBT: ThemeConfig adds indirection. COST: ~2h to remove. TRIGGER: if Game 2 never launches." He should eat his own cooking.
- Playwright responsive tests are listed but Playwright itself is not in the dependency list. Adding Playwright for 6 viewport checks is a large dev dep for a 7-day game project. The DX cost (another thing to install, configure, maintain) may exceed the value.
- No acknowledgment of the 7-day timeline tension. Several fitness functions assume CI exists. There is no CI. These are local pre-commit hooks at best.

**Ranking:** 3/5 — Strong on automated checks, weaker on scope calibration. ThemeConfig is premature complexity.

**Integration with my position:** Adopt the shell script fitness functions (bundle size, LOC, theme isolation). Drop the Playwright tests for Week 1 — add them if the game survives and reaches Week 3 iteration. Adopt dependency-cruiser as a dev dep.

---

### Analysis D (Security — Bruce)

**Agreement:** Agree

**Reasoning from DX perspective:**

Bruce opens with "I will not waste your time modeling SQL injection on a game with no database." That sentence alone saves 3 hours of pointless security theater. He applies the correct threat model: this is a compliance/operational risk problem disguised as a security problem.

His STRIDE analysis is proportionate. Spoofing: low (no auth). Tampering: low (no prizes). The real risk categories are "Platform Compliance" and "Information Disclosure via build artifacts." These are exactly the things that kill game launches, not XSS or CSRF.

The build artifact security section is directly actionable: `grep -ri "password|secret|token" dist/` before every ZIP. Free. Zero innovation token. Should be in the pre-submit checklist (and Charity's checklist already has it — good alignment).

The decision to NOT add a CSP meta tag is the most important security decision in this analysis, and it's the opposite of what most security practitioners would recommend reflexively. Bruce correctly identifies that adding your own CSP would break Yandex SDK's ad loading. This is the kind of platform-specific knowledge that saves a full moderation rejection cycle.

The `loadHighscore()` defensive read pattern (parseInt + clamp to 0-10M) is 4 lines that prevent display bugs from localStorage tampering. Exactly the right amount of defense: proportionate, zero cost.

The Vite CVE-2024-23331 analysis is clean: path traversal in dev server, zero impact on production ZIP, no action needed except keeping Vite updated. No panic, no over-reaction.

**Missed gaps:**
- Bruce doesn't address the Sentry SDK question that Charity raises. If Sentry makes a runtime call to sentry.io, that's an external network request that Yandex moderation can flag. This is a genuine security/compliance intersection point.
- The mock SDK tree-shaking verification is mentioned but not tested. "Vite's dead code elimination will tree-shake the mock" — but only if the mock is in a separate module and the import path is conditional. The `IS_YANDEX` check at module top-level does NOT guarantee tree-shaking. This needs a `vite-bundle-visualizer` check.

**Ranking:** 4/5 — Proportionate, pragmatic, directly actionable. The Sentry and tree-shaking gaps are real.

**Integration with my position:** Adopt the build artifact grep checklist. No CSP meta tag — confirmed. Add localStorage read validation to the SDK mock. Verify mock tree-shaking with bundle analysis.

---

### Analysis F (Devil's Advocate — Fred Brooks)

**Agreement:** Partially Agree

**Reasoning from DX perspective:**

Fred is my closest ally and my biggest concern simultaneously.

His Contradiction #1 (1-week project vs reusable boilerplate) is exactly right. This is Founder Anti-Pattern #2 verbatim: "Optimizes tooling instead of product — building DX while users wait." AQ-7 should be dead. The ThemeConfig abstraction, the `ACTIVE_THEME` switcher, the `GenericEventBus` in shared/ — all of these are infrastructure spend with no immediate business return. The fitness function from Neal that checks theme isolation is guarding an abstraction that doesn't need to exist yet.

His "3 real decisions, 5 non-decisions" table is the most useful distillation in the entire peer set:
- AQ-2 (state machine structure): Real decision. Must be made.
- AQ-3 (SDK mock pattern): Real decision. Must be made.
- AQ-5 (merge detection): Real decision. Must be made.
- AQ-1, AQ-4, AQ-6, AQ-8: Look up or trivial.
- AQ-7: Delete.

His "minimum architecture that ships" (4 files, ~480 LOC) is where I diverge. Fred is solving for conceptual integrity in one file. I'm solving for AI developer context budget. With Claude Code as the developer, a 300-LOC `GameScene.ts` is fine for a human reader, but it means every agent task reads 300 LOC to find the 20 lines it needs. The LLM peer (Analysis G/H) has the right model here: smaller files, lower per-task context cost.

Fred's claim that "more files = more Claude context switching" inverts the actual constraint. A 300-LOC monolithic GameScene doesn't reduce context reads — it increases them, because you always read the whole thing. Eight 100-LOC focused files let agents read exactly what they need.

The SPOF analysis is excellent and no other peer covers it with this specificity. SPOF #1 (SDK mock vs real SDK behavioral difference) is exactly right — test on real Yandex platform on Day 3, not Day 5. SPOF #3 (two independently generated components using different merge detection patterns) is a real Claude Code coherence risk that the architecture must prevent with explicit rules.

**Missed gaps:**
- Fred's "4 files beats 9 files" rule conflates human conceptual integrity with AI context management. For a human developer, fewer files = cleaner mental model. For Claude Code, more focused files = cheaper per-task context reads. This is the key DX distinction he misses.
- The TypeScript strict mode recommendation (loose during dev, strict for submission) is pragmatic but creates a workflow where builds fail differently at different stages. Better to set `strict: false` for speed and not toggle it — the AI-generated code is already typed enough with explicit interfaces.
- No mention of `GameConfig.ts` as the teaching tool for Kamil. This is the highest-value DX decision for the co-designer relationship.

**Ranking:** 4/5 — Best contradiction detection, best scope pruning. The "fewer files = better for LLM" argument is specifically wrong.

**Integration with my position:** Adopt the AQ-7 deletion. Adopt the 3 real decisions framing. Reject the 4-file minimum — use the 18-file flat structure I proposed, which splits concerns without deep hierarchies.

---

### Analysis G (Data Architect — Martin)

**Agreement:** Agree

**Reasoning from DX perspective:**

Martin's key contribution is resolving the three-storage-system contradiction that Fred correctly identified (in-memory + localStorage + Yandex SDK = 3 "sources of truth"). Martin's answer: localStorage is SoR, Yandex is replica, in-memory is ephemeral. This is clean and implementable.

The `PersistedPlayerData` schema with `schemaVersion: 1` and a `migratePlayerData()` function is the right investment even for a small game. Schema migration is one of those things that costs 30 minutes to do correctly on Day 1 and costs 2 days to fix when the player's highscore gets corrupted on v1.1. This is boring technology: a version field and a switch statement.

The `MERGE_CHAIN` array with the quadratic score formula (`tier * (tier + 1)`) is directly usable as-is. Copy-pasteable into GameConfig.ts. The radius progression rationale (each tier ≈ previous * 1.22) is the kind of design decision that prevents 3 hours of "why does the bear feel too small?" during playtesting.

The `REGISTRY_KEYS` pattern (typed constants instead of raw strings for Phaser registry) is a small thing that pays dividends when Claude Code generates `scene.registry.get('currntScore')` vs `scene.registry.get(REGISTRY_KEYS.CURRENT_SCORE)`. Typos in string keys are silent failures in Phaser registry. Typed constants make them compile errors.

The leaderboard `getLeaderboards()` deprecation warning is a real find — the old API is still in docs examples but deprecated in SDK 1.19+. This prevents a moderation flag.

**Missed gaps:**
- The `PersistedPlayerData` includes `totalGamesPlayed` and `lastPlayedAt`. These are analytics fields that add complexity to a type that should be minimal. For a 7-day project, bestScore + soundEnabled is enough. Keep the schema small until you know what analytics you actually need.
- The Yandex SDK mock in Martin's code calls `onClose?.(false)` immediately in `showFullscreenAdv` — no delay. Charity's ops research correctly identifies that a 0-delay mock doesn't test ad timing behaviors. Martin's mock won't catch the "game state assumes ad takes 2 seconds" bugs.
- No mention of the `flush: true` vs `flush: false` parameter for `player.setData`. Martin mentions it in a recommendation box but doesn't include it in the type definition or mock. This is a real API detail that affects save reliability on game over.

**Ranking:** 3/5 — Clean data modeling, good schema thinking. Slight schema bloat and the 0-delay mock is a concrete DX problem.

**Integration with my position:** Adopt the localStorage-as-SoR pattern. Adopt the `MERGE_CHAIN` array and radius progression. Trim `PersistedPlayerData` to essentials. Fix the mock delay to 1-2 seconds to match Charity's recommendation.

---

### Analysis H (LLM Architect — Erik)

**Agreement:** Agree

**Reasoning from DX perspective:**

Erik's lens is the one most aligned with my DX concern: the primary developer on this project is Claude Code, not a human. Every architectural decision must be evaluated against "how does an LLM navigate this?"

His kill question is exactly right: "Can Claude Code modify the merge logic without reading the physics file?" If the answer is no, the architecture is wrong. This is the LLM equivalent of my innovation token accounting — it forces you to evaluate each structural decision by its context-window cost, not its theoretical elegance.

The module header protocol is the highest-ROI, lowest-cost practice in the entire peer set. 200 tokens of comment at the top of each file = an agent knows Role, Uses, Used by, Emits, Does NOT do — in a single read. This eliminates the "read 3 files to understand what 1 file does" pattern that kills per-task efficiency.

The `GameEvents.ts` SSOT for all event names is exactly the boring-tech approach: one 50-line file, all communication visible. When Claude Code asks "what events does the system emit?", the answer is one file, not grep-the-codebase. This is the kind of convention that costs 15 minutes to establish and pays every session.

The context budget table is the clearest justification for file decomposition I've seen. "Fix merge animation: reads AnimationManager.ts + GameEvents.ts = ~200 LOC = 1.5K tokens." Compare to monolithic GameScene.ts: "Fix merge animation: reads 1200 LOC = 9K tokens just to orient." This is a 6x context efficiency gain. Not a theoretical concern — a daily tax on every Claude Code session.

The `TRANSITIONS` state machine table (which GamePhase can transition to which) is the equivalent of my innovation-token accounting applied to game state. When it's a TypeScript `Record<GamePhase, GamePhase[]>`, invalid transitions throw compile errors. When it's implicit boolean flags, they're silent bugs.

Where Erik goes too far: the HUDScene running as a parallel Phaser scene for score display separation. This is architecturally elegant but adds inter-scene communication complexity (events passing between scenes, lifecycle management of a parallel scene). For a DX standpoint, a DOM overlay or a simple Phaser Text object in GameScene is simpler and achieves the same result. Erik's version optimizes for separation-of-concerns at the cost of cognitive overhead.

**Missed gaps:**
- Erik's 24-file structure with dedicated `PhysicsManager.ts`, `AnimalSpawner.ts`, `InputHandler.ts`, `AnimationManager.ts`, `ScoreManager.ts`, `GameStateManager.ts`, and `AdManager.ts` inside `game/` goes significantly beyond my 18-file structure. The question from a DX standpoint: does `InputHandler.ts` (100 LOC) really need to be a separate file from the 5 lines in GameScene that call it? Decomposition has a floor below which it hurts more than it helps.
- No mention of the Kamil teaching workflow. The `GameConfig.ts` as the "numbers Kamil changes and sees" file should be called out explicitly as a DX goal — it's the only file a 10-year-old learning coder should need to touch.
- The `EventBus.ts` in `shared/` is a custom typed EventEmitter wrapper. Phaser's `scene.events` IS an EventEmitter. Using a shared singleton EventBus instead of Phaser's built-in event system adds a dependency and diverges from Phaser patterns that future Claude Code sessions will recognize.

**Ranking:** 5/5 — Best alignment with actual development constraints. Module headers + GameEvents SSOT + context budget analysis are immediately adoptable. HUDScene parallel scene is the one overreach.

**Integration with my position:** Adopt module headers as mandatory. Adopt GameEvents.ts SSOT. Adopt the context budget framing for evaluating decomposition decisions. Use Phaser's `scene.events` instead of a custom EventBus singleton. Drop HUDScene parallel scene — keep score display in GameScene via a Phaser Text object.

---

## Ranking

**Best Analysis:** H (LLM Architect / Erik)

Reason: Erik is the only peer who operationalizes "Claude Code is the primary developer" as an architectural constraint. The module header protocol, GameEvents.ts SSOT, and context budget table are directly actionable, zero-cost, zero-innovation-token decisions that pay every single session. His kill question ("Can Claude Code modify merge logic without reading the physics file?") is the right evaluative frame for this project. No other peer matched this level of practical, DX-first thinking.

**Worst Analysis:** C (Evolutionary Architect / Neal)

Reason: Neal's ThemeConfig abstraction and `ACTIVE_THEME` indirection invest innovation tokens in Game 2 during Game 1 development. This is exactly what Fred correctly identifies as the core anti-pattern (Founder Anti-Pattern #2: optimizes tooling instead of product). The fitness functions are valuable, but several (Playwright responsive tests) assume a CI infrastructure that doesn't exist. Neal's work would be the right architecture for Game 2's first sprint — it's premature for Game 1's Day 1.

---

## Revised Position

**Revised Verdict:** Partially changed from Phase 1.

**Change Reason:**

Three peers shifted my thinking:

1. **Erik (H)** convinced me to adopt the module header protocol as non-negotiable. I underspecified this in Phase 1. Every file over 100 LOC needs Role/Uses/Used by/Emits/Does NOT do. This is zero-cost, immediately adoptable.

2. **Charity (B)** convinced me that the `npm run ship` compound command (build + check + package) is worth the 30-minute investment in a `scripts/` folder. The no-rollback constraint on Yandex Games means pre-submit automation is the only quality gate that matters. I said "defer ESLint/Prettier" — I'd revise that to "defer linting, but DO build the pre-flight check script."

3. **Fred (F)** sharpened my position on AQ-7. I said "defer AQ-7" — Fred says "delete AQ-7." He's right. "Defer" implies it comes back. For this project, Game 2 reusability is addressed by: (a) the SDK wrapper interface (already part of Game 1), (b) keeping GameConfig.ts as pure data. The ThemeConfig abstraction and `ACTIVE_THEME` switcher are not needed.

**What did NOT change:**

- TypeScript is still worth it. The 0.5-token cost is justified by AI-generated code quality.
- Vite is still boring tech. Not a token.
- Manual QA over automated test framework. 7-day project.
- 18-file flat structure (between Fred's 4 files and Erik's 24 files).
- The SDK wrapper is an interface + if-statement. Nothing more.

---

## Final DX Recommendation

**Synthesized position after seeing all perspectives:**

### Token Accounting (Final)

| Technology | Token Cost | Justification |
|------------|-----------|---------------|
| Phaser 3.90 | 1 token | The product IS the engine |
| TypeScript | 0.5 token | AI writes correct typed code 3x faster |
| Vite 5 | 0 tokens | Boring by 2026 |
| Pre-flight check script | 0 tokens | Shell greps, not a framework |
| dependency-cruiser (dev dep) | 0.1 token | Enforces import rules automatically |

**Total: 1.6 tokens of 3. 1.4 tokens in reserve.**

No ThemeConfig abstraction. No EventBus singleton. No Playwright suite. No HUDScene parallel scene.

---

### Non-Negotiable DX Decisions (After Synthesis)

**1. Module headers on every file over 100 LOC** (adopted from Erik/H)

```typescript
/**
 * Module: MergeDetector
 * Role: Detects same-tier collisions and emits merge events
 * Uses: GameConfig (tier data), Animal (tier property)
 * Used by: GameScene (subscribes to animal:merged)
 * Emits: EVENTS.ANIMAL_MERGED with MergeEvent payload
 * Does NOT: create animals, update score, play animations
 */
```

**2. GameEvents.ts as single source of truth for all event names** (adopted from Erik/H)

One 50-line file. All communication visible. Typos become compile errors.

**3. GameConfig.ts as the Kamil-accessible tuning layer** (my position, validated by all peers)

Every magic number in one file. Comments in plain language. This is the teaching tool for the co-designer.

**4. Single localStorage as SoR for highscore** (adopted from Martin/G, validated by Fred/F)

Yandex SDK storage = async replica, fire-and-forget. Not SoR. Fred's contradiction #3 resolved.

**5. SDK mock delay = 1-2 seconds** (adopted from Charity/B)

Zero-delay mock doesn't test ad timing behaviors. Set `setTimeout(callback, 1500)` in mock. Catches real timing bugs.

**6. `npm run ship` pre-flight gates** (adopted from Charity/B)

`build && check && package`. The check script catches: absolute paths, missing SDK tag, sourcemaps in prod, bundle size. Pre-submit, not post-submit.

**7. Single bundle (no manualChunks)** (my position, contradicts Charity/B's config)

Yandex ZIP compatibility > browser caching optimization. `manualChunks: undefined`. One JS file.

**8. AQ-7 deleted** (adopted from Fred/F)

No ThemeConfig. No ACTIVE_THEME switcher. Game 2 reusability = the SDK interface (already built) + keeping GameConfig.ts data-only. That's it.

**9. 3 real architectural decisions, decided now** (adopted from Fred/F):
- AQ-2: 3 Phaser scenes (Preload + Menu + Game). Not a single scene. GameScene is the orchestrator.
- AQ-3: Interface + if-statement for SDK. Decided.
- AQ-5: Event-driven merge detection via Matter.js `collisionstart`. Not polling.

**10. File structure: 18 files, flat** (my position, balanced between Fred's 4 and Erik's 24)

No deep hierarchies. No `game/managers/` subdirectory. Everything visible in one level.

---

### DX Red Flags to Prevent

Ranked by blast radius:

| Risk | Source | Prevention |
|------|--------|-----------|
| ThemeConfig abstraction creeping into Game 1 | AQ-7 | Explicit deletion from scope |
| Mock with 0-delay masking timing bugs | Martin/G mock | Enforce 1-2s setTimeout in mock |
| manualChunks breaking Yandex ZIP | Charity/B config | Single bundle rule |
| Sentry making external call (CSP flag) | Charity/B | Bundle Sentry into ZIP or drop it |
| SDK mock shipping to production | Bruce/D | Gate on import.meta.env.DEV, verify with bundle analysis |
| GameScene growing to 400+ LOC | Every peer | Extract when file hits 300 LOC, not before |
| No module headers | Erik/H, implicit | Mandatory protocol in .claude/rules/architecture.md |

---

### What I Got Wrong in Phase 1

1. **Underspecified module header protocol.** Called it out briefly. Should have made it the #1 DX decision.

2. **Left AQ-7 as "defer" instead of "delete."** Fred is right. Defer implies it comes back. For this project, it doesn't.

3. **Didn't address mock delay.** The 1-second mock delay I mentioned in phase 1 under "Mock must simulate 1-second ad delay" was in the right direction but I didn't connect it to the testing behavior implications Charity documented.

4. **Didn't account for Kamil explicitly as a DX target.** GameConfig.ts as a teaching tool was mentioned but should have been front-and-center as a design constraint: "Kamil must be able to change a number in GameConfig.ts without understanding TypeScript."

---

## References

- My Phase 1 research: `ai/architect/research-dx.md`
- Peer A (Domain): `ai/architect/anonymous/peer-A.md`
- Peer B (Ops): `ai/architect/anonymous/peer-B.md`
- Peer C (Evolutionary): `ai/architect/anonymous/peer-C.md`
- Peer D (Security): `ai/architect/anonymous/peer-D.md`
- Peer F (Devil): `ai/architect/anonymous/peer-F.md`
- Peer G (Data): `ai/architect/anonymous/peer-G.md`
- Peer H (LLM): `ai/architect/anonymous/peer-H.md`
- [Dan McKinley — Choose Boring Technology](https://mcfunley.com/choose-boring-technology)
- Business Blueprint: `ai/blueprint/business-blueprint.md`
