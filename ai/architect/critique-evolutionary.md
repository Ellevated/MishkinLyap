# Evolutionary Architecture Cross-Critique

**Persona:** Neal (Evolutionary Architect)
**Phase:** 2 — Peer Review
**Project:** Zverata — Yandex Games HTML5 drop-merge game
**Date:** 2026-03-04

---

## Peer Analysis Reviews

### Analysis A — Domain Modeler (Eric / DDD lens)

**Agreement:** Partially Agree

**Reasoning from evolutionary perspective:**

Peer A applies DDD rigorously — bounded contexts, aggregate roots, ubiquitous language, domain events. The intellectual framework is correct. `IGameCore`, `IPlatformBridge`, `IGameEventSource` as stable interfaces is exactly how you isolate high-change areas (Yandex SDK policy) from stable core (merge detection rules). The event-driven communication between GameCore and Presentation is the right isolation pattern — Presentation can be replaced wholesale without touching physics.

The merge guard pattern (`isMerging` flag, 5-layer guard chain) is solid game mechanics engineering. The state machine transition table is the kind of explicit contract that survives 5 years.

Where I diverge: the DDD layering is borrowed from enterprise contexts with teams, codebase partitions, and deployment units. For a solo LLM-maintained codebase with ~1,200 LOC, the overhead of four bounded context modules with their own `types.ts` files creates inter-file surface area that accumulates as drift vectors. Every interface boundary is also a potential inconsistency point. From an evolutionary standpoint, the question is: does this abstraction make it easier or harder to change the system? For a 7-day game, four formal bounded contexts may overcomplicate the change path for common operations (add a new tier, adjust scoring) that should be single-file edits.

The `isSettled` guard is genuinely valuable — I had the same finding. Mid-air merges are game-breaking. This peer identified the gap in the reference implementation correctly.

**Missed gaps:**
- No fitness functions specified. Rich interface definitions with no automated protection. Without dependency-cruiser rules enforcing "presentation never imports gamecore directly," these boundaries will drift under LLM maintenance.
- No reversibility analysis. The four-module boundary structure is a relatively irreversible commitment — retrofitting it if Game 2 has a different mechanic (not drop-merge) costs significant refactoring.
- Change frequency of the `IPlatformBridge` interface itself was not analyzed. Yandex SDK v2 → v3 migrations are uncontrolled change vectors. If the interface is too thin, it can't absorb SDK evolution without changing the contract.

**Rating:** 4/5 — Strong domain thinking, missing fitness functions and reversibility.

---

### Analysis B — Operations Engineer (Charity / Honeycomb lens)

**Agreement:** Agree (strong agreement on critical points)

**Reasoning from evolutionary perspective:**

Peer B identifies the single most important architectural constraint in this project that every other persona missed: **there is no rollback path on Yandex Games.** This is the most significant irreversibility in the entire system.

From an evolutionary architecture standpoint, "deploy = ZIP submission = moderation = 3-5 days" is a catastrophically slow feedback loop. Most fitness functions I defined (bundle size, import direction, LOC limits) exist precisely to prevent shipping defects that cannot be corrected post-submission. Peer B's pre-flight quality gate strategy is exactly the fitness function approach applied to the deployment pipeline — it's the automated check before the irreversible action.

The SDK mock pattern analysis is thorough and the `onError` + 10-second timeout pattern is the correct resilience design for an async ad SDK. The structured logger (`log.error('ad_interstitial_error', err)`) is a lightweight observability fitness function that survives the constraints of a client-side ZIP game.

The Novosti window as a production SLA framing is exactly right. Seven days where a defect cannot be hotfixed is an architectural constraint that should shape every decision made before submission.

**Missed gaps:**
- No fitness function for the SDK mock behavior parity. The mock should be tested against a checklist of "does mock behavior differ from real SDK in ways that will break?" This is a change vector: SDK updates may change behaviors the mock doesn't cover.
- The `archiver` npm package recommendation for Windows ZIP compatibility is a practical operational finding, but there's no fitness function to enforce this across developers. If a new contributor runs `zip` directly, the build breaks on Windows.
- No discussion of the Sentry budget exhaustion scenario. If a critical bug fires 5,000 errors in hour 1 of Novosti, the free tier is exhausted and alerting goes blind.

**Rating:** 5/5 — Best operational thinking in the set. The irreversibility of Yandex submission is the most important architectural insight in all peer analyses.

---

### Analysis D — Security Architect (Bruce / STRIDE lens)

**Agreement:** Agree

**Reasoning from evolutionary perspective:**

Peer D applied exactly the right filter: calibrate threat model to actual attack surface. "I will not waste your time modeling SQL injection on a game with no database" is sound engineering judgment, not laziness. The security work for this project is 95% platform compliance and 5% build hygiene — and that's the correct prioritization.

From an evolutionary perspective, the most interesting finding is the CSP recommendation: **do NOT add CSP meta tag in index.html because Yandex controls the iframe CSP**. Adding your own CSP is an irreversible action that could break ad delivery. This is a good example of identifying a decision that looks like "security hardening" but is actually an architectural mistake that would require another full submission cycle to reverse.

The defense-in-depth layers (build pipeline → SDK integration → data integrity → pre-submission checklist) map cleanly to fitness functions at different stages of the deployment pipeline. The pre-submission bash script is a concrete fitness function suite.

The score manipulation analysis (`localStorage.setItem('highscore', 9999999)`) with deliberate non-defense is correct. Risk = Likelihood × Impact = High × Low = Low. Accepting this is architecturally disciplined, not negligent.

**Missed gaps:**
- No mention of the physics configuration as a change attack surface. I identified this: if someone PRs `gravity: 999` in `PhysicsConfig.ts`, it breaks game feel silently. A fitness function asserting `gravity.y < 3` in the smoke test is a small, high-value check.
- The `DEBT` tagging system for security-adjacent technical debt is missing. "Accept score manipulation for now" should be tagged `DEBT: score validation / TRIGGER: if prizes attached to leaderboard`.

**Rating:** 4/5 — Appropriately calibrated threat model, missing physics config protection.

---

### Analysis E — DX Architect (Dan McKinley / Boring Technology lens)

**Agreement:** Partially Agree

**Reasoning from evolutionary perspective:**

The innovation token framework is a useful proxy for what I would call "complexity debt budget." Every non-boring technology choice creates a change vector you don't fully control — the library evolves, breaks, or becomes unmaintained. Peer E's conclusion (1.5 of 3 tokens spent) is correct: the stack is appropriately boring for a 7-day project.

The Phaser + Vite HMR full-reload recommendation is practical and correct. Partial HMR with Phaser is a known trap. Spending tokens on clever HMR is exactly the tooling-over-product anti-pattern.

The "stdlib-first" table (Phaser.Tweens over GSAP, Phaser.Sound over Howler, Phaser.Input over Hammer.js) is a fitness function argument in disguise: use what's already in scope, avoid new dependencies. Each new dependency is a new change vector with its own release cadence, security surface, and breaking change history.

The `GameConfig.ts` with Russian-language comments ("Камиль: сделай больше = быстрее падает") is a surprising insight I missed — accessibility of the config for a non-technical co-designer is a legitimate architectural concern.

Where I diverge: the recommendation to skip automated tests entirely ("manual QA with Kamil IS the test suite") conflicts with evolutionary architecture principles. The fitness functions I defined (merge detection unit test, LOC check, import direction) take 30 minutes to write and prevent 10x that time in debugging regressions. Even for a 7-day project, 3-4 targeted fitness functions are worth the investment.

**Missed gaps:**
- No fitness functions proposed. The entire analysis is about what NOT to build, but doesn't define what must be protected automatically.
- The `manualChunks: undefined` recommendation for single bundle conflicts with Peer B's analysis (which recommends `manualChunks: { phaser: ['phaser'] }` for cache separation). This is a genuine technical disagreement that should be resolved — single bundle vs split chunks has different implications for ZIP content.

**Rating:** 3/5 — Correct philosophy on technology selection, but fitness functions are the mechanism that makes "boring technology" stay boring long-term. Without them, the architecture drifts toward excitement.

---

### Analysis F — Devil's Advocate (Fred Brooks / Skeptic lens)

**Agreement:** Partially Agree (strong agreement on some points, significant disagreement on others)

**Reasoning from evolutionary perspective:**

Peer F raises the most important contradiction in the entire architecture phase: AQ-7 (reusability for Game 2) conflicts directly with the 7-day ship constraint. This is not a DX concern — it's a classic overengineering trap. Designing generic infrastructure speculatively is exactly what Brooks called "accidental complexity."

The 4-file architecture proposal (`main.ts`, `GameScene.ts`, `config.ts`, `sdk.ts`) is defensible for the 7-day constraint. The argument that more files = more context-switching for Claude Code is real and measured. My own LOC fitness function (max 400 per file) is compatible with a 4-file structure if the game stays under 1,600 LOC total.

The "3 inviolable rules" proposal (Ship beats architecture / Copy beats design / 4 files beats 9 files) is the kind of explicit hierarchy of values that every architecture session should start with. The absence of these rules causes exactly the committee-compromise problem Brooks identified.

Where I strongly disagree: the recommendation to delete AQ-7 entirely. From an evolutionary architecture standpoint, the ThemeConfig abstraction I proposed (and Peer A/H partially echoed) costs roughly 2 hours on Day 1 and prevents a full rewrite when Game 2 launches. The test: "can Game 2 be launched by changing ThemeConfig.ts only?" is a concrete fitness function. The cost is bounded and the payoff is measurable. This is not speculative infrastructure — it's an escape hatch that prevents an irreversible commitment.

The contradiction about "simple game needs 8 architecture questions" is valid critique of the process, not of the architecture. Yes, AQ-4, AQ-6, AQ-8 are 30-second decisions. But AQ-2, AQ-3, AQ-5 are real decisions with 5-year consequences if wrong. Peer F correctly identifies this, then somewhat contradicts itself by providing detailed answers to all 8 questions.

**Missed gaps:**
- No fitness functions proposed despite explicitly asking "who is responsible for system integrity." If no one automates the architectural checks, integrity defaults to whoever last touched the file.
- The SPOF analysis (SDK integration, physics stability, single-developer coherence) is exactly the right thing to analyze, but no mitigation fitness functions are proposed for any of them.

**Rating:** 4/5 — Best critical thinking in the set. The AQ-7 pushback is the most valuable challenge to my own analysis (I'm revising my position on this slightly — see below).

---

### Analysis G — Data Architect (Martin / DDIA lens)

**Agreement:** Agree

**Reasoning from evolutionary perspective:**

Peer G's "system of record" framing is the data equivalent of my change vector analysis. Identifying that BestScore has a dual-write ambiguity (localStorage primary, Yandex SDK replica) and explicitly stating the resolution rule ("Yandex storage wins when available; localStorage is a cache/fallback") is exactly the kind of explicit contract that prevents architectural drift.

The schema version migration pattern (`STORAGE_SCHEMA_VERSION`, `migratePlayerData()`) is an evolutionary architecture primitive. Without schema versioning, the first time the data model changes (e.g., adding `totalGamesPlayed`), stored data from old sessions will corrupt on read. The migrate-on-read pattern is the correct approach for a client-side game with no migration infrastructure.

The score formula analysis (quadratic: `tier * (tier + 1)`) with explicit alternatives considered (Fibonacci) is the kind of decision documentation that deserves an ADR. This formula is stable core — it should rarely change — but if it does change, the migration path for existing scores is complex. Peer G correctly identifies this as a concern.

The TypeScript SDK type definitions (`YSDK`, `YSDKPlayer`, `YSDKLeaderboards`) are fitness function infrastructure in disguise: if Yandex SDK changes its API surface, TypeScript compilation fails immediately rather than silently at runtime.

**Missed gaps:**
- The `MergeEvent` is correctly identified as transient, but there's no fitness function protecting the invariant that "merge events are never persisted." A future developer might reasonably try to log merge events to localStorage for debugging — this should be explicitly forbidden.
- The `REGISTRY_KEYS` pattern for Phaser registry is a good idea but the implementation detail (`registry.events.on('changedata-currentScore', ...)`) creates a coupling between Phaser's internal registry API and the game's event contract. This is an uncontrolled change vector if Phaser changes its registry implementation.

**Rating:** 4/5 — Strong data discipline, the schema migration pattern is the most operationally valuable finding.

---

### Analysis H — LLM Systems Architect (Erik lens)

**Agreement:** Agree (with important caveats)

**Reasoning from evolutionary perspective:**

Peer H makes the most important architectural reframe: the LLM is the primary developer, and the architecture should be optimized for agent readability, not human readability. This changes the fitness function calculus entirely. A 24-file structure with 100 LOC average per file is more LLM-maintainable than a 4-file structure with 400 LOC per file, even if it looks more complex to a human.

The module header protocol is a fitness function for agent onboarding — it specifies the dependency graph explicitly in machine-readable format. The rule "every file > 100 LOC gets a module header" is enforceable (grep for `Module:` header, count files > 100 LOC, assert equality) and prevents drift.

The `GameEvents.ts` as a single event catalog is the key insight I partially missed. I had event-driven architecture in my analysis (EventBus pattern), but Peer H makes the catalog itself a fitness function: "all events MUST be defined in GameEvents.ts before use." This is grep-enforceable.

The context budget analysis (table showing LOC and token cost per task type) is exactly the kind of measurable architectural property that fitness functions can protect. Max 2K tokens to orient on any task is a concrete, testable architectural characteristic.

The `HUDScene` parallel scene pattern (runs simultaneously with GameScene) is genuinely novel — it separates UI rendering from physics simulation at the Phaser scene level. This is a meaningful change vector isolation: UI changes never touch physics code. However, parallel scenes add Phaser lifecycle complexity that could become a maintenance burden. The fitness function question: "can HUDScene be modified without reading GameScene?" is the right test.

Where I differ: 24 files for a 1,200 LOC game is the edge of the viable range. At 24 files, the overhead of inter-file interface consistency becomes significant. Peer F's critique (more files = more context-switching) is valid at this scale. The optimal structure is probably between Peer F's 4-file minimum and Peer H's 24-file maximum — 10-14 files, with the key isolation boundaries (config, SDK, game logic, scenes) preserved.

**Missed gaps:**
- The `GameEvents.ts` catalog is excellent, but there's no fitness function checking that all `this.events.emit()` calls in the codebase use constants from `GameEvents.ts` (rather than raw strings). `grep -r "emit\(" src/ | grep -v "EVENTS\."` should return 0 results. This is a 2-minute script.
- The `HUDScene` parallel scene creates a cross-scene communication dependency. This is a new coupling type that wasn't present in the architecture. How does HUDScene receive score updates if GameScene doesn't directly call it? Via events — but those events must flow through Phaser's scene event system, which has its own lifecycle quirks. This coupling is not analyzed.

**Rating:** 5/5 — Best architectural thinking for LLM-maintained codebases. The agent readability framing is the correct lens for this specific project.

---

## Ranking

**Best Analysis:** B and H (tied)

**Peer B reason:** Identified the single most important architectural constraint (no rollback on Yandex submission) and built the entire operational strategy around it. This is the kind of irreversibility analysis that evolutionary architecture demands — and it was the most practically actionable finding in the entire council.

**Peer H reason:** The LLM-as-primary-developer reframe changes the fitness function calculus for the entire codebase. The module header protocol, event catalog, and context budget analysis give concrete, measurable, automatable architectural properties that match the actual development context.

**Worst Analysis:** E (DX Architect)

**Reason:** The "no automated tests" recommendation directly conflicts with the evolutionary architecture principle that fitness functions prevent drift. The innovation token framework correctly identifies what NOT to build, but provides no mechanism for protecting what IS built. A codebase with no automated checks will drift toward the exciting choices Peer E correctly warned against — because there's nothing stopping the drift. The boring technology choice is undermined by the boring verification gap.

---

## Revised Position

**Revised Verdict:** Changed (partially)

**Change Reason:**

Peer F's critique of AQ-7 is partially correct. The ThemeConfig abstraction I proposed (and stand behind) is valuable and bounded in cost. However, the `IGameCore` / `IGameEventSource` / `IPlatformBridge` formal bounded-context architecture from Peer A is overcomplicated for the actual scale. My revised position is: the ThemeConfig escape hatch is worth building on Day 1. The formal bounded-context DDD module structure is not.

Peer H's LLM-readability analysis revealed a gap in my original research: my fitness functions were designed for human developer maintenance, not agent maintenance. The module header protocol and event catalog pattern should be added to the fitness function suite. These are low-cost, high-value additions.

Peer B's irreversibility analysis (Yandex submission = no rollback) should be the **first architectural principle stated**, not buried in operational concerns. It changes the risk profile of every other decision: any defect that ships must be survivable without a hotfix.

**Final Evolutionary Recommendation:**

The evolutionary architecture for Zverata should be organized around four principles, in priority order:

**1. The Yandex Submission Gate (Peer B + my analysis combined)**

Every fitness function must run before the ZIP is built. This is the architectural gate that substitutes for the rollback path that doesn't exist. Minimum fitness function suite:

- Bundle size: `du -sh dist/ && assert < 100MB`
- TypeScript: `tsc --noEmit && assert exit code 0`
- Import direction: `npx depcruise --validate .depcruise.json src/`
- File LOC: `find src/ -name "*.ts" | xargs wc -l | assert all < 400`
- Theme isolation: `grep -rn "hamster|rabbit|..." src/ --exclude-path "src/config/*" | assert 0`
- No external requests: `grep -r "https://" dist/ | grep -v yandex | assert 0`
- SDK URL: `grep "yandex.ru/games/sdk/v2" index.html | assert 1 result`

All seven run as `npm run preflight` before `npm run package`.

**2. The ThemeConfig Escape Hatch (my analysis, validated against Peer F's critique)**

The `ThemeConfig` interface separating Game 1 from Game 2 is worth Day 1 investment. Peer F is right that AQ-7 generic boilerplate is premature optimization. But ThemeConfig is not boilerplate — it's a specific, bounded escape hatch with a fitness function:

```bash
# scripts/check-theme-isolation.sh
grep -rn "hamster|rabbit|kitten|panda|bear|fox|dog|cat" \
  src/ --include="*.ts" --exclude-path "src/config/*"
# Must return 0 results
```

The test for this decision: "can Game 2 be launched by changing ThemeConfig.ts only?" is measurable, automatable, and protects a specific business decision (portfolio of games sharing one SDK wrapper). Everything else in AQ-7 (generic EventBus, generic StateManager) is YAGNI.

**3. The Module Boundary Decision (revised from my original + Peer H)**

The optimal file count is 10-14 files (between Peer F's 4 and Peer H's 24). The mandatory boundaries:

| Module | Files | Why This Boundary |
|--------|-------|-------------------|
| `src/config/` | GameConfig.ts, GameEvents.ts, ThemeConfig.ts | Change frequently. Isolate. |
| `src/sdk/` | IGamePlatform.ts, YandexPlatform.ts, MockPlatform.ts, AdManager.ts | Uncontrolled external change vector. |
| `src/objects/` | Animal.ts | Stable core entity. |
| `src/scenes/` | PreloadScene.ts, MenuScene.ts, GameScene.ts, GameOverScene.ts | UI/UX changes frequently |
| `src/game/` | MergeDetector.ts, ScoreManager.ts | Logic isolation for agent tasks |
| `main.ts` | 1 file | Entry point only |

Fitness function: `npx depcruise --validate .depcruise.json src/` enforces that `sdk/` never imports from `scenes/`, `config/` never imports from `game/`, etc.

**4. The LLM Development Fitness Functions (from Peer H)**

Every file > 100 LOC gets a module header. Every `emit()` call uses a constant from `GameEvents.ts`. These are grep-enforceable and prevent the agent drift that ruins codebases between sessions:

```bash
# Enforce module headers
find src/ -name "*.ts" | while read f; do
  lines=$(wc -l < "$f")
  if [ "$lines" -gt 100 ] && ! grep -q "Module:" "$f"; then
    echo "FAIL: $f ($lines LOC) missing module header"
    exit 1
  fi
done

# Enforce event catalog usage
grep -rn "\.emit\(" src/ --include="*.ts" | grep -v "EVENTS\." | grep -v "GameEvents"
# Must return 0 results
```

**Architectural Characteristics Prioritization (final):**

| Priority | Characteristic | Why |
|----------|----------------|-----|
| Critical | Correctness (pre-submission) | No rollback — must ship right |
| Critical | Maintainability (LLM context) | Primary developer is an agent |
| Critical | Bundle < 100MB | Hard Yandex limit |
| Important | Performance (60fps mobile) | D1 retention proxy |
| Important | Reusability (ThemeConfig only) | Game 2 escape hatch |
| Defer | Full test coverage | Manual QA sufficient for v1 |
| Defer | Landscape support | Post-launch data needed |
| Defer | Offline mode | Yandex SDK requires online |

**The fitness function that was missing from every peer analysis:**

```bash
# Enforce "no animal names outside config" (protects ThemeConfig isolation)
# AND "no hardcoded physics constants outside GameConfig" (protects tuning isolation)
grep -rn "gravity\|restitution\|friction" src/ --include="*.ts" \
  --exclude-path "src/config/*"
# Must return 0 results
```

If physics constants are scattered across files, every tuning session requires multi-file edits, which means the agent touches more code than necessary, which means more opportunities to introduce bugs in the system that cannot be hotfixed after submission.

---

## Summary Table

| Peer | Agreement | Strongest Contribution | Key Gap |
|------|-----------|----------------------|---------|
| A (Domain) | Partially | Merge guard pattern, domain event catalog | No fitness functions |
| B (Ops) | Agree | Yandex no-rollback = architectural constraint | Mock parity fitness function |
| D (Security) | Agree | CSP non-addition, calibrated threat model | Physics config attack surface |
| E (DX) | Partially | Boring tech + Russian comments for Kamil | No fitness functions, no tests |
| F (Skeptic) | Partially | AQ-7 delete recommendation, 3 inviolable rules | No fitness functions despite SPOF analysis |
| G (Data) | Agree | Schema versioning, system of record clarity | MergeEvent persistence guard |
| H (LLM Arch) | Agree | Agent readability reframe, event catalog pattern | HUDScene coupling analysis |
