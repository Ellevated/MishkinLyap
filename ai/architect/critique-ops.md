# Operations Architecture Cross-Critique

**Persona:** Charity (Operations Engineer — Honeycomb lens)
**Phase:** 2 — Peer Review
**Date:** 2026-03-04

---

## My Phase 1 Position (Summary)

My core thesis was: **this is not a deployable service, it is a ZIP submission to a closed platform.** The entire ops model inverts. You cannot push hotfixes. You cannot rollback in 5 minutes. Yandex moderation is the production gating mechanism and it takes 3-5 business days. Therefore:

- Pre-flight quality gates replace post-deploy monitoring
- Sentry (micro-sentry 2.27 kB) + Yandex Metrica replace a metrics pipeline
- The 15-point pre-submit checklist is the deployment pipeline
- The 7-day Novosti window is the SLA that cannot be missed
- Production observability is limited to Sentry error tracking (client-side exceptions with stack traces)

---

## Peer Analysis Reviews

---

### Analysis A — Domain Modeler (Eric, DDD lens)

**Agreement:** Partially Agree

**Reasoning from ops perspective:**

Analysis A proposes a clean 4-module boundary: GameCore, Presentation, PlatformBridge, GameConfig. From an ops perspective, this is excellent. The `IPlatformBridge` interface as an Anti-Corruption Layer is exactly right — when the SDK breaks in production (and it will), the blast radius is contained to the `YandexBridge` adapter. Everything else keeps running.

The most ops-relevant insight is this: *"SDK init must block Phaser init"*. This is labeled a "Critical Issue" in their analysis, and they're right. This is the #1 race condition that causes silent production failures. The fact that they surfaced it from a domain modeling lens — not from an ops lens — suggests the problem is real and cross-cutting. My analysis independently flagged the same issue.

The `GameSession` aggregate invariant design is production-relevant: *"status === 'ended' is terminal — no further drops allowed"* prevents the game from entering an unrecoverable state where physics keeps running on a dead session. These are exactly the kinds of guards that prevent "game seems broken" reports from 55+ users who can't describe what went wrong.

**Missed gaps:**

- No discussion of what happens when `YandexBridge` itself throws during the ad cycle. The `IPlatformBridge` interface has `showInterstitial(onComplete)` — but if the implementation crashes before calling `onComplete`, the game freezes. The domain boundary is clean, but it doesn't enforce that all code paths through the bridge eventually call the callback.
- The state machine (PLAYING → GAME_OVER → AD_PLAYING → RESULTS) lacks timeout handling. If `AD_PLAYING` never receives `ad_complete`, the state machine is stuck. This is ops-critical — ad networks fail silently on older devices, which is exactly the 55+ demographic on older Android. Analysis A treats state transitions as pure domain logic without considering the failure paths that production will exercise.

---

### Analysis C — Evolutionary Architect (Neal, fitness functions lens)

**Agreement:** Agree

**Reasoning from ops perspective:**

This is the analysis closest to mine in spirit. The fitness function framing is the evolutionary architecture equivalent of SLIs: automated, measurable, verifiable properties that the system must maintain. Neal's list is production-ready thinking.

The bundle size check (`du -sh dist/ | awk '$1 > 100M {exit 1}'`) is exactly right — it's a pre-deploy gate that catches a problem before Yandex rejects the submission. The physics body count assertion in `GameScene.ts` is the closest thing to a runtime SLI this game can have without a server. And the theme isolation check (`grep -rn "hamster|rabbit..." src/ --include="*.ts"`) is a regression guard that prevents Game 2 contaminating Game 1.

The performance budget table is grounded in real numbers: 30 active Matter.js bodies, <80MB JS heap, <3s time to interactive on 4G. These are the metrics I would instrument if I had server-side telemetry. Instead they're pre-flight checks, which is the correct approach for this deployment model.

The Phaser Scale.FIT vs Scale.EXPAND decision is ops-relevant in a way that isn't obvious: EXPAND mode distorts physics, which means physics-based gameplay (drop and merge) becomes unpredictable. Unpredictable physics = user reports of "the game doesn't work" = rating drops = algorithmic punishment from Yandex. Neal correctly identifies this.

**Missed gaps:**

- The `check-orientation.sh` fitness function is fragile. `grep -q "orientation=portrait" index.html` breaks if Vite transforms the HTML during build. Should check the built output in `dist/index.html`, not the source `index.html`.
- Memory leak detection for Matter.js body accumulation is identified as a concern (`scene.restart()` doesn't reset collision IDs) but the fitness function for it is listed under "Missing fitness functions (add after MVP)." This should not be deferred — a memory leak that compounds across play sessions will kill performance on mobile within a single Novosti window session (multiple games played). The body cleanup check should be in MVP.
- The Playwright responsive test fixture (`yandex-embed` viewport 600x500) is the most valuable one in the list and it's buried. This is the actual production environment — the Yandex Games iframe. Make this the primary test, not an afterthought.

---

### Analysis D — Security Architect (Bruce, STRIDE lens)

**Agreement:** Agree

**Reasoning from ops perspective:**

Bruce does exactly what I'd do: skip the irrelevant OWASP Top 10 for a game with no server, and focus on the actual threat model. The "Platform Compliance Risk" table is more useful than the STRIDE table — moderation rejection is the real operational risk, not SQL injection.

The most ops-relevant recommendation is the pre-submission audit script that checks for secrets in the bundle, CDN links in index.html, and the SDK URL. This is a quality gate, not a security gate, and it belongs in the deployment pipeline. Bruce is right to call it out as P0.

The deliberate non-defense of score manipulation is correct ops thinking: risk = likelihood (High) × impact (Low) = Low. Do not build a backend to defend against something that has zero revenue impact. This is exactly the kind of prioritization that separates operational thinking from academic security thinking.

The `loadHighscore()` validation function (parseInt + clamp to reasonable max) is 4 lines of code that prevents display bugs from localStorage tampering. Zero cost, real defensive value. This is the right level of investment for this threat.

**Missed gaps:**

- No analysis of what happens when Yandex moderation changes requirements mid-window. The SDK version pinning discussion focuses on build-time, but Yandex has updated SDK requirements for already-published games (requiring resubmission). There's no ops plan for "Yandex changes a requirement after we ship."
- The "SDK mock must not ship" recommendation uses `import.meta.env.DEV` as the gate, which is correct. But there's no verification step in the pre-flight checklist to confirm the mock is actually tree-shaken in the production build. `npm run build && grep -r "SDK MOCK" dist/` should be in the checklist.

---

### Analysis E — Developer Experience (Dan McKinley, boring tech lens)

**Agreement:** Partially Agree

**Reasoning from ops perspective:**

Dan's core insight — "the SDK wrapper is just an interface and an if-statement" — is the right level of complexity for a 7-day project. The innovation token framework correctly identifies that Phaser is the product, everything else is infrastructure that should be invisible.

The hot reload strategy (force full page reload instead of partial HMR) is ops-relevant: it avoids the "game works on reload but HMR produces ghost state" failure mode that would make QA unreliable. If QA is unreliable, the 15-point pre-submit checklist is unreliable. Dan is solving a pre-production quality gate problem correctly.

The GameConfig.ts principle — ALL tunable numbers in ONE file — maps directly to my "feature flags via RemoteConfig" recommendation. In the absence of dynamic configuration, a single config file is the next best thing. The difference between "we hardcoded GRAVITY: 2 in GameScene.ts" and "we have GRAVITY: 2 in GameConfig.ts" is the difference between a 30-minute fix and a 2-minute fix when physics tuning is needed post-launch.

**Missed gaps:**

- The DX research recommends `manualChunks: undefined` (single bundle) for Yandex compatibility. My research specifically recommends `manualChunks: { phaser: ['phaser'] }` to separate Phaser (~900KB) from game code (<100KB). Dan's recommendation is wrong here from a load-time ops perspective — if the game code changes, users have to re-download the entire ~1MB bundle including Phaser. With chunk splitting, only the ~100KB game chunk invalidates. This matters for subsequent uploads where users have Phaser cached.
- The "no CI pipeline needed for v1" recommendation is correct for deployment but misses the ops value of even a local `npm run check` that runs all fitness functions before packaging. The DX analysis has this implicitly (`npm run build` = done) but doesn't wire a pre-flight check into the `zip` script. That's a gap.
- The mock's `setTimeout(() => onClose(true), 1000)` behavior is identified as important but there's no call to add a failing case — mock that calls `onError` instead of `onClose`. If all dev testing uses the happy path mock, the error path goes untested until production.

---

### Analysis F — Devil's Advocate (Fred Brooks, skeptic lens)

**Agreement:** Partially Agree

**Reasoning from ops perspective:**

Brooks raises the most important systemic challenge: *"which wins — 'ship Game 1 in 7 days' or 'design boilerplate for Game 2'?"* From ops perspective, the answer is clear: ship Game 1. A system you can't observe in production is one you can't operate. A system that isn't in production yet is worse.

The minimum architecture proposal (4 files, ~480 LOC) is defensible from an ops perspective for a different reason than Brooks states. Four files means four failure surfaces. When Sentry fires a stack trace pointing to `GameScene.ts:247`, I know exactly which file to look in. When a system has 24 files and the stack trace points to an anonymous event callback, diagnosis takes longer. Simplicity and debuggability are correlated.

The ad timeout challenge is the most ops-relevant point in the entire document: *"add a 5-second setTimeout fallback that calls onComplete(false) if no callback arrives."* This is exactly the pattern I described in my Phase 1 research (10-second timeout). Brooks identifies this as an architectural gap that must be specified before code is written. Agreed completely.

The SPOF analysis (#1 SDK integration, #2 Matter.js physics stability, #3 single developer coherence) is useful framing. These are exactly the 3 AM scenarios I plan for. Brooks is right that SPOF #2 (physics at 25+ bodies) is inadequately mitigated by AQ-1 remaining open.

**Missed gaps:**

- Brooks proposes "TypeScript strict: false during development, switch to strict: true for final submission." This is operationally risky. A codebase where strict mode is toggled has a runtime behavior surface that was never type-checked during development. If strict mode surfaces errors at the last step before submission, the fixes are rushed and untested. Strict mode should be on from Day 1 or not at all — no toggling.
- The "4 files beats 9 files" rule is stated as inviolable but the rationale is about cognitive load (conceptual integrity), not about production debuggability. For ops purposes, what actually matters is: does Sentry give you a meaningful stack trace? The answer is the same whether you have 4 files or 24 files, as long as sourcemaps aren't stripped (they should be in production for a casual game, per my Phase 1 analysis, but `sentry-vite-plugin` can upload them to Sentry without including them in the ZIP). This is a missed optimization.

---

### Analysis G — Data Architect (Martin, DDIA lens)

**Agreement:** Agree

**Reasoning from ops perspective:**

The system of record table is exactly the kind of documentation that prevents 3 AM confusion. When DAU drops 40% and you're looking at whether the leaderboard is showing stale scores, knowing immediately that *"Yandex Leaderboard service: platform owns this, we only write"* saves 20 minutes of debugging. Martin's explicit SoR mapping is ops documentation by another name.

The dual-write pattern for bestScore — localStorage synchronous first, Yandex async fire-and-forget — is correct. The ops priority is: never block game progression on a network call. If the Yandex cloud write fails, the player's session continues. They see their score. localStorage has the data. Eventually consistent is fine when the SoR is local.

The schema migration pattern (`STORAGE_SCHEMA_VERSION` + `migratePlayerData()`) is the most underrated ops decision in any of the seven analyses. V1 ships. V1.1 adds a field. Without this pattern, V1.1 reads V1 data, gets `undefined` for the new field, and either crashes or shows garbage. With this pattern, migration is a single function and a version bump. Martin handles this correctly.

The leaderboard rate limit note (1 call/second SDK limit) is ops-relevant: if multiple game over events fire rapidly (edge case: two animals settle simultaneously), the leaderboard submit could be throttled. Martin's fire-and-forget approach handles this correctly — if the SDK throttles the call, we don't care. The localStorage write already happened.

**Missed gaps:**

- The `AdCooldownState` is listed as "In-memory, resets per session." But the ad policy has a 3-minute cooldown between interstitials. If a player completes a game, watches an interstitial, then closes and reopens the game immediately (page refresh), the cooldown resets. This means a player determined to generate ad impressions can farm them by refreshing. Not an ops emergency, but the 60-second minimum session requirement is also reset. Martin's data model doesn't account for cross-session cooldown persistence.
- The Yandex `player.getData()` / `player.setData()` calls are labeled async fire-and-forget, but the read path on game start is sequential: *"Read localStorage immediately... then async await player.getData()"*. If the Yandex data fetch hangs (slow network), the player sees the menu but the score display may update seconds later with a higher value, causing a visible flicker. This is a UX ops issue — the async read should have a timeout (500ms) after which the UI commits to the localStorage value.

---

### Analysis H — LLM Architect (Erik, agent-optimized lens)

**Agreement:** Partially Agree

**Reasoning from ops perspective:**

The core framing — "Claude Code IS the runtime" — is the most important insight in the entire analysis set. It inverts the usual tradeoffs. For ops, this means: the system's maintainability directly impacts how fast production issues get fixed. A system that takes 9K tokens to orient (monolithic GameScene) versus 2K tokens (modular structure) means the fix cycle is 4.5x slower. That's the real ops cost of poor code organization.

The Event Catalog (`GameEvents.ts`) is the most ops-relevant structural decision in Analysis H. When Sentry fires and I need to understand what sequence of events led to a crash, an explicit event catalog lets me reconstruct the event flow in minutes rather than grepping through 24 files. It's a production debugging aid disguised as an architecture document.

The context budget analysis table is impressive: "Fix merge animation — reads AnimationManager.ts + GameEvents.ts, 200 LOC, ~1.5K tokens." This kind of analysis treats agent efficiency as a first-class operational metric, and it's correct to do so.

The HUDScene parallel scene recommendation (score display runs as a separate Phaser scene parallel to GameScene) is interesting from an ops perspective. It isolates the UI rendering from physics simulation, which means a crash in score display doesn't crash the physics world. But it adds inter-scene communication complexity that introduces its own failure modes. The ops verdict: the isolation benefit is marginal for this game's error modes, and the complexity cost is real.

**Missed gaps:**

- The `GameStateManager.ts` with explicit `TRANSITIONS` record is the best analysis of state machine design in the entire peer set. But it doesn't address what happens when an invalid state transition is attempted at runtime. TypeScript can reject it at compile time, but if the state machine receives an event from the SDK that isn't mapped (e.g., an undocumented ad callback from a new Yandex SDK version), the machine must have a fallback. No fallback = silent state corruption = game freeze. The ops requirement is: invalid transitions must emit a Sentry error and return to the nearest safe state, not silently fail.
- The testing strategy correctly identifies what's testable (merge rules, score calc, state transitions, ad timing) but misses the most ops-critical test: the SDK mock path. A unit test that simulates `showInterstitial` calling `onError` instead of `onClose` would catch the game-freeze scenario I identified as the #1 production failure mode. Analysis H proposes testing the happy path but not the failure path.

---

## Ranking

**Best Analysis: C (Neal — Evolutionary Architect)**

Reason: The fitness function framework is the most directly actionable ops contribution in the peer set. Every fitness function maps to a pre-flight check. The bundle size script, body count assertion, theme isolation check, and Playwright viewport tests form a complete pre-submit test suite that substitutes for what in a server environment would be CI/CD gates. Neal understood the deployment model (ZIP submission = irreversible) and responded with the correct tooling: automated properties that catch problems before submission. The performance budgets (30 bodies, 80MB heap, 3s TTI) are grounded in real mobile constraints, not theoretical ideals.

**Worst Analysis: E (Dan McKinley — DX Architect)**

Reason: The DX focus is legitimate and the boring tech framework is correct, but Analysis E has the highest density of ops-relevant mistakes. The `manualChunks: undefined` recommendation degrades load time for returning users by preventing Phaser caching. The "no CI pipeline for v1" recommendation is correct in isolation but fails to mandate even a local pre-flight gate in the build script. Most critically, the mock implementation only covers the happy path — ad succeeds, callback fires — and explicitly never tests the failure path. For a game where ad callback failure is the #1 production freeze scenario, a mock that only returns success is worse than no mock because it gives false confidence. The DX analysis optimizes for development velocity at the cost of production resilience.

---

## Revised Position

**Revised Verdict:** Same as Phase 1, with one important refinement.

**What the peer analyses reinforced:**

Every peer independently surfaced the same critical issue: SDK initialization order and ad callback completeness. My Phase 1 analysis identified this. Analysis A (domain), Analysis D (security), Analysis E (DX), and Analysis F (devil's advocate) all flagged it independently. When 5 of 7 analysts independently converge on the same risk, it is not a theoretical concern — it is the primary production failure mode. This is the 3 AM scenario for this project.

**What the peer analyses changed:**

Analysis C's fitness function suite is better than my pre-submit checklist as a framework. I proposed a 15-point checklist (automated + manual). Neal proposed 8 automated fitness functions with specific scripts. The fitness function approach is more rigorous because it has binary pass/fail semantics and can be wired into the build pipeline without human judgment. I am adopting the fitness function framing for the pre-submit gate.

Analysis G's schema versioning pattern (`STORAGE_SCHEMA_VERSION` + `migratePlayerData()`) should be specified as a requirement before code is written, not discovered when V1.1 is released. I did not emphasize this in my Phase 1 research. Adding it to the ops requirements.

**One refinement from Analysis F (Brooks):**

Brooks is correct that the ad timeout (5-10 second fallback calling `onComplete(false)` if no SDK callback arrives) must be specified in architecture before code is written. This is not an implementation detail — it is a game-state invariant. Every ad call must eventually resolve. My Phase 1 research included this pattern but did not elevate it to an architectural requirement. It should be stated as: *"No ad call may leave the state machine in AD_PLAYING for more than 10 seconds. A watchdog timer must call onComplete(false) after timeout."*

**Final Ops Recommendation:**

The ops model for this project is: **pre-production quality gates are the entire deployment strategy.** There is no post-deploy remediation. The pre-submit gate must include:

1. Automated fitness functions (Analysis C's suite, extended with Analysis B's pre-flight checks)
2. The 10-second ad timeout watchdog as an architectural invariant (not an implementation detail)
3. Schema version + migration function before any persistence code is written
4. SDK mock failure path tests — `onError` callbacks exercised, not just `onClose`
5. Sentry + Yandex Metrica initialized before Phaser boot (ensures errors during SDK init are captured)

The 3 AM scenario for this game is: *silent game freeze on game over, caused by ad callback never firing, on an older Android device running a slow Yandex ad network.* The fix is the watchdog timer. If it isn't in the code before submission, it won't be there when it matters.

---

## Peer Rankings Summary

| Peer | Agreement | Ops Quality (1-5) | Key Contribution |
|------|-----------|-------------------|-----------------|
| A (Domain) | Partially | 4 | IPlatformBridge ACL — correct blast radius containment |
| C (Evolutionary) | Agree | 5 | Fitness function suite — best pre-submit gate design |
| D (Security) | Agree | 4 | Platform compliance framing — moderation = ops risk |
| E (DX) | Partially | 2 | Happy-path mock only — misses production failure modes |
| F (Devil) | Partially | 3 | Ad timeout as invariant — most actionable ops insight |
| G (Data) | Agree | 4 | SoR table + schema migration — production debuggability |
| H (LLM) | Partially | 3 | Event catalog — production debugging aid |
