# LLM Systems Architecture Cross-Critique

**Persona:** Erik (LLM Architect)
**Phase:** 2 — Peer Review
**Date:** 2026-03-04

**Note on Research:** Exa MCP was rate-limited (same condition as peers B, C, D, E, F, G). Analysis draws from direct knowledge of LLM agent architecture patterns, Anthropic agent design principles, Phaser/TypeScript ecosystem, and full reading of all 7 peer analyses plus own research.

---

## Peer Analysis Reviews

### Analysis A — Domain Architect (Eric / DDD Lens)

**Agreement:** Partially Agree

**Reasoning from LLM agent perspective:**

Eric's 4-module boundary (GameCore / Presentation / PlatformBridge / GameConfig) is directionally correct for agent readability. Separating concerns at the boundary level is exactly what enables an LLM to work on "merge detection" without reading "ad timing" code.

The `IGameCore` interface and `IPlatformBridge` interface are excellent agent-UX design: a Claude Code session can read 60 lines of interface and understand the entire contract without reading any implementation. This is the "self-describing API" pattern.

However, Eric's analysis conflates two different things: domain boundary design (which is valuable) and DDD formalism (which is overhead). Terms like "Aggregate Root," "Value Object," "Anti-Corruption Layer," and "conformist" relationship add linguistic complexity that doesn't improve the agent's ability to work with the code. An LLM agent working on `MergeSystem.ts` doesn't benefit from knowing it's an "Aggregate." It benefits from knowing: "This file handles collision detection, uses GameConfig for tier data, emits merge events."

The `IGameEventSource` interface defined in `Presentation` that mirrors `IGameCore` methods is an unnecessary duplication from an agent context budget perspective. Two interfaces with nearly identical method signatures will confuse an agent about which one to import.

The merge guard algorithm (Guard 1-5 pattern) is well-documented and directly implementable — this is the kind of concrete, actionable detail that helps agents produce correct code.

**Missed gaps:**

- No module header protocol specified. Eric defines interfaces but doesn't mandate the per-file orientation header that lets an agent know what a file does in 200 tokens without reading the full file.
- The 5-guard merge pattern includes "isSettled" but doesn't define what constitutes "settled" in a way an agent can implement deterministically. Velocity threshold vs frame count is an implementation decision left open.
- Eric's `IGameEventSource` in Presentation creates a second abstraction on top of `IGameCore.onMerge`. This is the kind of double-indirection that makes an agent uncertain which layer to modify.

**Ranking:** 4/5

---

### Analysis B — Operations Architect (Charity / Honeycomb Lens)

**Agreement:** Agree

**Reasoning from LLM agent perspective:**

Charity's analysis is the most agent-hostile of the set from a read-burden perspective — but that's the nature of ops content, not a flaw in the analysis. The SDK mock implementation is the most agent-relevant contribution: a well-structured `MockPlatform` that mirrors the real SDK contract is exactly what allows Claude Code to write ad-related features in local dev without SDK knowledge.

The structured logger pattern (`log.info`, `log.warn`, `log.error` with JSON payload) is highly LLM-friendly. When an agent needs to add logging to a new feature, there's one clear pattern to follow. Inconsistent logging conventions (sometimes `console.log`, sometimes structured) would force the agent to scan the codebase to find "the right way."

The 15-point pre-submit checklist and the runbook for "post-ad game crash" are valuable agent tools — these are the kind of written-down procedures that an agent can execute without needing to infer them from first principles.

The `preflight-check.mjs` script is a concrete fitness function implementation — much better than vague "quality gates."

**Missed gaps:**

- Charity's `vite.config.ts` uses `manualChunks: { phaser: ['phaser'] }` which creates a split bundle. Dan (DX) correctly identifies this may break Yandex ZIP validation. This cross-persona inconsistency should be resolved — and it's exactly the kind of inconsistency an agent would implement incorrectly if both docs are in context.
- No guidance on which files Claude Code should touch vs. not touch during operations-related changes. "SDK mock and real implementation" are both agent-editable but ops runbooks are not.
- The ZIP packaging script has a bug: the `getDirSize` function has `await import` inside a non-async function. An agent implementing this verbatim would get a runtime error.

**Ranking:** 3/5

---

### Analysis C — Evolutionary Architect (Neal / Fitness Functions Lens)

**Agreement:** Agree

**Reasoning from LLM agent perspective:**

Neal's fitness function suite is the single most valuable agent-enforcement mechanism in all 7 analyses. The automated checks (LOC limit, theme isolation grep, import direction via depcruise, bundle size) are exactly the kind of guardrails that prevent an LLM from drifting into anti-patterns across sessions.

The critical insight: **an LLM agent that violates the 400 LOC limit will be caught by `check-loc.sh` before the code ships.** This is better than any prompt instruction, because agents forget instructions between sessions but CI scripts don't.

The `check-theme-isolation.sh` script is elegant: `grep -rn "hamster|rabbit|..." src/ --exclude-path "src/config/*"` catches the moment an agent hard-codes an animal name outside the config. This is a perfect example of fitness functions serving as agent guardrails.

The `ThemeConfig` interface as the Game 2 reusability boundary is clean and doesn't add implementation complexity for Game 1.

The `ACTIVE_THEME` singleton pattern is trivially understandable: one line to change, one import to trace.

**Missed gaps:**

- Neal's fitness functions run manually (`npm run check`, bash scripts). For LLM-maintained code, these should be integrated into the `npm run build` step so they run automatically — otherwise an agent implementing a feature won't know it violated a fitness function until it's explicitly told to check.
- The physics body count assertion (`checkPhysicsHealth` in GameScene) runs in-game, not at build time. This is the right place for a runtime check but it should also have a dev-mode throw (Neal has this) — the important thing is documenting that agents should NOT remove this check.
- The `ThemeConfig` validation call in `main.ts` is mentioned but not specified as a `validateTheme()` function contract. An agent implementing `main.ts` might skip it without a clear spec.

**Ranking:** 4/5

---

### Analysis D — Security Architect (Bruce / STRIDE Lens)

**Agreement:** Agree

**Reasoning from LLM agent perspective:**

Bruce's analysis is well-calibrated to the actual threat surface and does not waste agent context budget on irrelevant concerns. This is the correct approach: an agent reading security guidelines for this project should spend 200 tokens on it, not 2000.

The most agent-relevant security contribution is the "deliberate non-defense" pattern for score manipulation — explicitly documenting what NOT to implement prevents an agent from over-engineering. This is valuable because agents default to implementing things they see in training data (anti-cheat systems, score validation servers) even when the business context doesn't justify it.

The `loadHighscore()` defensive read pattern (parseInt, clamp, NaN check) is 4 lines that any agent can implement consistently if it's specified as the canonical pattern.

The build pre-submit grep commands (`grep -ri "password|secret..."`) are agent-executable checklist items.

**Missed gaps:**

- Bruce correctly identifies "no CSP meta tag" as the right call, but doesn't note that Vite can sometimes inject security headers via plugins. An agent adding a Vite plugin without knowing this constraint might inadvertently break SDK loading. The rule should be stated as "no CSP anywhere in the build output, not just in index.html."
- The score submission "at game over event not button" pattern is documented as a recommendation but not enforced architecturally. An agent that moves the score submission to a button click (for UX reasons) won't be stopped by any fitness function.

**Ranking:** 4/5

---

### Analysis E — DX Architect (Dan / Boring Tech Lens)

**Agreement:** Partially Agree

**Reasoning from LLM agent perspective:**

Dan's "choose boring technology" framework aligns with LLM-friendly architecture: boring = well-documented in training data = agents produce correct code faster. This is a real phenomenon. An agent implementing a GreenSock animation will produce worse code than one implementing a Phaser.Tweens animation, because training data for Phaser.Tweens is more abundant and consistent.

Dan's proposed 18-file structure at ~1,200 total LOC is where I begin to disagree on specifics, and his 4-file alternative argument is where the real debate lives (addressed in Revised Position below).

The GameConfig.ts bilingual comment (`// <-- Камиль: сделай больше = быстрее падает`) is brilliant from a multi-user UX standpoint. When both a 10-year-old and an LLM agent read the same config file, the comment serves both audiences.

The Vite HMR full-reload pattern (`window.location.reload()` on hot accept) is the correct pragmatic call — don't fight Phaser's canvas lifecycle.

The `manualChunks: undefined` recommendation (single bundle for Yandex compatibility) contradicts Charity's `manualChunks: { phaser: ['phaser'] }`. This is the kind of cross-persona inconsistency that blocks agents in Phase 7.

**Missed gaps:**

- Dan proposes `GameScene.ts` at ~250 LOC as the "LARGEST file, still under limit" — but GameScene as the orchestrator for physics, merge detection, score, state, and input is already doing too much. At 250 LOC it fits context, but it becomes the place where agent sessions must start even for unrelated changes. The separation into specialized managers (my research) keeps each task isolated to one file.
- No module header protocol. Dan's flat structure relies on self-explaining filenames — this is good but insufficient. `Animal.ts` doesn't tell an agent what events it emits or what it reads from.
- The `zip` command in `package.json` scripts won't work on Windows without Git Bash (the project runs on Windows 10 per env context). Dan notes this risk for Charity's packaging script but his own `zip` command has the same issue.

**Ranking:** 3/5

---

### Analysis F — Devil's Advocate (Fred / Brooks Lens)

**Agreement:** Partially Agree

**Reasoning from LLM agent perspective:**

Fred raises the most important challenge in the entire review set, and I must engage with it seriously from the LLM lens rather than dismissing it.

**Fred's 4-file argument:**
```
main.ts      (~50 LOC)
GameScene.ts (~300 LOC)
config.ts    (~50 LOC)
sdk.ts       (~80 LOC)
```
Total: ~480 LOC, 4 files.

**Fred's claim:** "Claude Code reads ONE file to understand game state (no context-switching). Merge detection, score, and game over are co-located — no inter-class events."

This is the strongest challenge to my 24-file proposal. Let me steelman it fully before responding.

Fred is correct that context-switching between files has a real cost. Every `import { MergeDetector } from './game/MergeDetector'` that an agent must trace adds ~150 tokens of navigation overhead. For a 480 LOC codebase, the navigation overhead of a modular architecture may exceed the isolation benefits.

Fred is also correct that "conceptual integrity" — one mental model for the core logic — is a real value. A GameScene.ts with 300 LOC of co-located merge detection, physics, scoring, and state IS comprehensible to an agent in a single context read.

**However, Fred's argument breaks down at scale and at maintenance time:**

1. **The 300 LOC assumption is optimistic.** GameScene with merge detection, physics setup, collision handling, score calculation, game over detection, input handling, state machine transitions, and SDK calls will reach 400-600 LOC during development — especially with ad timing logic (60-second rules, 3-minute cooldown). Fred's 300 LOC estimate is pre-feature-creep.

2. **The task-to-file ratio matters more than total LOC.** In my proposed structure, "fix merge animation" = read AnimationManager.ts (150 LOC). In Fred's structure, "fix merge animation" = read GameScene.ts (300-400 LOC). The agent reads 2x-2.5x more code for the same task.

3. **"No inter-class events" is a maintenance trap.** When GameScene.ts becomes the place where everything happens, every feature request sends an agent into the same file. Two agents working on "fix ad timing" and "fix merge detection" simultaneously would both be modifying GameScene.ts — causing conflicts. Modular files prevent this.

4. **Brooks' conceptual integrity argument applies to HUMANS, not LLMs.** Brooks wrote about human programmers who hold system state in working memory between sessions. LLM agents start fresh every session. They don't benefit from "one mental model" in the same way — they benefit from self-describing, isolated contexts.

5. **The AQ-7 critique is valid** — reusability design for Game 2 should not drive Game 1 architecture. But my structure's value isn't primarily reusability — it's **task isolation**. The separation would be the same even if Game 2 never existed.

Fred's strongest valid point: **AQ-7 contamination risk is real.** Architects should not add abstraction layers for speculative reuse. My proposed structure avoids this: no base classes, no generic event bus framework, no plugin system. Just small files with clear responsibilities.

Fred's weakest point: The 4-file structure assumes Game 1 stays at ~480 LOC forever. It won't. The first feature addition (leaderboard display, sound effects, particle effects, additional animal behaviors) will push GameScene.ts past 400 LOC. At that point you're doing emergency extraction under pressure — the worst time to refactor.

**Ranking:** 4/5 (best challenge to received wisdom in the set)

---

### Analysis G — Data Architect (Martin / DDIA Lens)

**Agreement:** Agree

**Reasoning from LLM agent perspective:**

Martin's schema definitions are the highest-quality agent documentation in the entire review set. The `PersistedPlayerData` interface with `schemaVersion` field, `DEFAULT_PLAYER_DATA`, `LOCAL_STORAGE_KEY`, and `migratePlayerData()` function are all agent-executable artifacts — not just descriptions.

The system-of-record table (which entity lives where) is exactly what an agent needs at session start to avoid writing to the wrong data store. Without this table, an agent implementing "save high score" might write to Yandex SDK directly (losing the localStorage-first guarantee) or to both synchronously (blocking the main thread).

The `REGISTRY_KEYS` constant object for Phaser registry is a detail that prevents an entire class of bugs: agents using string literals for registry keys will create typo bugs (`'currentScore'` vs `'current_score'`). Typed constants eliminate this.

The score formula documentation (tier N produces N*(N+1) points) with the explicit rationale (quadratic growth rewards patience) is exactly the kind of "why, not what" comment that helps an agent maintain the scoring logic correctly during modifications.

**Missed gaps:**

- Martin defines `GameState` with `phase: GamePhase` but doesn't specify where this lives at runtime. Is it in `GameScene` as a class property? In Phaser registry? In `GameStateManager`? An agent implementing a feature that reads game phase would need to decide this arbitrarily.
- The `MergeEvent` type has `resultTier: TierNumber | null` for Bear merges, but the comment says "just score" — this leaves open what actually happens when two Bears merge. Is it a win condition? Does the game end? An agent implementing Bear merge logic needs this specified.
- The mock's `showFullscreenAdv: ({ onClose }) => { onClose?.(false); }` calls `onClose` synchronously with `wasShown: false`. This will cause game state to advance before the mock "ad" visually appears. The 1-second delay that Dan recommends is missing.

**Ranking:** 4/5

---

## Ranking

**Best Analysis:** Analysis F (Devil's Advocate)
**Reason:** Fred's challenge to the 4-file vs. 24-file debate is the most important architectural question in the entire session. Every other persona proposes additions; Fred asks what can be cut. The question "how many of the 8 architecture questions actually require debate?" is exactly the right question. Even though I disagree with the 4-file conclusion, the reasoning forced a more rigorous defense of the modular position.

**Second Best:** Analysis G (Data Architect)
**Reason:** Martin produces the most directly implementable artifact: typed TypeScript interfaces that an agent can copy-paste and immediately use correctly. This is the highest-value output per token.

**Worst Analysis:** Analysis E (DX Architect)
**Reason:** Dan's "boring technology" framing is correct in principle but the analysis undersells the value of file granularity. Proposing `GameScene.ts` at 250 LOC as the orchestrator for all game logic contradicts the LLM-friendly pattern of isolated, single-responsibility files. The 18-file structure at 1,200 LOC is actually the right target — but Dan arrives at it through DX arguments (Kamil can find things) rather than the agent-context argument (Claude Code doesn't need to read 250 LOC to fix 20 LOC).

---

## Revised Position

### The Core Question: 4 Files vs. 24 Files

Fred's argument is the best challenge. Here is my revised position after engaging with it:

**The answer is neither 4 nor 24. The answer is 14-18 files at ~1,200-1,500 total LOC.**

Here is the updated reasoning:

**Where Fred is correct:**
- AQ-7 (Game 2 reusability) should NOT drive Day 1 architecture. Cut it.
- `AdManager.ts` as a separate class wrapping 3 SDK functions is borderline — it's justified only if ad timing logic (60s/3min rules) is genuinely complex. If it's 2 `if` statements, it belongs inline.
- `EventBus.ts` as a generic wrapper around Phaser.EventEmitter is YAGNI. Phaser's built-in event system is sufficient. Delete this file.
- `StorageService.ts` as a separate class is borderline — if it's just `localStorage.getItem/setItem` + Yandex SDK call, it can live in a simpler `persistence.ts`.

**Where Fred is wrong:**
- A 300 LOC `GameScene.ts` with merge detection + physics + score + state IS a context budget bomb for the second most common task type (feature additions, not full-system reads). The agent working on "fix merge animation" should read ONE file, not the entire game scene.
- The conceptual integrity argument for co-location applies to humans who maintain working memory between sessions. LLMs restart every session and rely on file-level isolation.
- 4 files is underkill for this scope. The game will organically hit 600+ LOC in a single scene before Day 7.

**The Revised Proposed Structure (14 files, ~1,200 LOC):**

```
src/
├── main.ts                 (~50 LOC)   SDK init → Phaser boot
│
├── config/
│   ├── GameConfig.ts       (~80 LOC)   ALL constants, physics values, ANIMALS chain
│   └── GameEvents.ts       (~40 LOC)   ALL event name constants (prevents string typos)
│
├── scenes/
│   ├── PreloadScene.ts     (~80 LOC)   Asset loading only
│   ├── MenuScene.ts        (~100 LOC)  Title + play button + highscore display
│   ├── GameScene.ts        (~150 LOC)  Pure orchestrator: creates managers, wires events
│   └── GameOverScene.ts    (~120 LOC)  End screen + rewarded ad button
│
├── game/
│   ├── PhysicsManager.ts   (~150 LOC)  Matter.js setup + walls + bodies
│   ├── MergeDetector.ts    (~120 LOC)  Collision → merge event (the guard pattern)
│   ├── AnimalSpawner.ts    (~100 LOC)  Create + destroy Animal objects
│   ├── ScoreManager.ts     (~80 LOC)   Score + persistence (localStorage + SDK)
│   └── InputHandler.ts     (~80 LOC)   Mouse/touch → drop position
│
├── objects/
│   └── Animal.ts           (~100 LOC)  Phaser Container + Matter body
│
└── sdk/
    ├── IGamePlatform.ts    (~50 LOC)   Interface + result types
    ├── YandexPlatform.ts   (~150 LOC)  Real SDK wrapper
    └── MockPlatform.ts     (~70 LOC)   Dev mock (with 1-second delays)
```

**What was cut from my original 24-file proposal:**
- `HUDScene.ts` → merged into `GameScene.ts` (score display is simple enough)
- `AnimationManager.ts` → animation code lives in `AnimalSpawner.ts` (merged animals spawn with animation)
- `GameStateManager.ts` → state machine lives in `GameScene.ts` (it's ~10 lines of transition table)
- `EventBus.ts` → deleted, use Phaser's built-in events
- `StorageService.ts` → merged into `ScoreManager.ts`
- `types.ts` as separate file → types live inline in each file that owns them, or in `GameConfig.ts`
- `phaser.d.ts` → use `@types/phaser` package

**What was kept that Fred wanted to cut:**
- Separate scene files (PreloadScene, MenuScene, GameScene, GameOverScene) — these map cleanly to player states and are natural navigation landmarks
- `MergeDetector.ts` — merge detection is genuinely complex (5 guards, lock pattern, chain detection) and warrants isolation
- `IGamePlatform.ts` — the interface contract enables testing and future platform changes
- `MockPlatform.ts` — 1-second delays for realistic async testing

**Context budget for the revised structure:**

| Task | Files Read | Approx LOC | Approx Tokens |
|------|-----------|-----------|--------------|
| "Fix merge animation" | AnimalSpawner.ts + GameEvents.ts | ~140 | ~1K |
| "Tune physics" | GameConfig.ts | ~80 | ~600 |
| "Fix ad timing" | YandexPlatform.ts + GameConfig.ts | ~230 | ~1.7K |
| "Add score multiplier" | ScoreManager.ts + GameConfig.ts | ~160 | ~1.2K |
| "Understand full system" | GameScene.ts + GameEvents.ts | ~190 | ~1.4K |

**Compare to Fred's 4-file structure:**

| Task | Files Read | Approx LOC | Approx Tokens |
|------|-----------|-----------|--------------|
| "Fix merge animation" | GameScene.ts | ~300-400 | ~2.5-3K |
| "Tune physics" | config.ts | ~50 | ~400 |
| "Fix ad timing" | GameScene.ts + sdk.ts | ~380-480 | ~3-3.6K |
| "Add score multiplier" | GameScene.ts | ~300-400 | ~2.5-3K |
| "Understand full system" | GameScene.ts | ~300-400 | ~2.5-3K |

**The 14-file structure uses 1.5K-1.8K tokens per task vs. Fred's 2.5K-3.6K tokens. Over the development lifetime of the game (100+ agent tasks), this is a 40-60% context budget reduction.** That 40% reduction is not free reasoning — it becomes available for the agent to reason about the specific change, not orient to the entire codebase.

### Module Header Protocol: Non-Negotiable

Fred's argument implicitly relies on co-location as the only way to give an agent context. But module headers provide orientation WITHOUT co-location:

```typescript
/**
 * Module: MergeDetector
 * Role: Detects same-tier collisions and emits 'animal:merged' events
 * Uses: PhysicsManager (Matter.js collision events), GameConfig (ANIMALS array)
 * Used by: GameScene (subscribes to 'animal:merged')
 * Does NOT: Spawn animals, update score, play animations
 */
```

200 tokens. An agent reading this header knows the full dependency graph for this module without reading any implementation. This is what makes the 14-file structure viable where Fred's concern about navigation overhead is addressed.

**Every file > 80 LOC gets a module header. Non-negotiable. This is what bridges Fred's concern with my proposal.**

### Resolution of Cross-Persona Inconsistencies

The two inconsistencies that will block Phase 7 if unresolved:

1. **Bundle splitting:** Dan says `manualChunks: undefined` (single bundle). Charity says `manualChunks: { phaser: ['phaser'] }`. **Resolution:** Dan is right for Yandex ZIP compatibility. Single bundle. Phaser chunking adds complexity without benefit at our scale.

2. **EventBus vs scene events:** My original research proposed `EventBus.ts` as a typed wrapper. Eric (Domain) proposed `scene.events.emit`. Dan proposed no abstraction. **Resolution:** Use Phaser's built-in `scene.events` for same-scene communication, `game.events` for cross-scene. No custom EventBus. Fred and Dan are right on this one.

### Final LLM Recommendation

**Architecture for LLM maintenance:** 14-file structure, ~1,200 LOC total, with mandatory module headers on every file > 80 LOC.

**The three inviolable rules (answering Fred's challenge):**
1. **Ship beats architecture** — any file that doesn't exist on Day 3 is probably YAGNI
2. **Module headers beat co-location** — isolation + documentation beats co-location alone
3. **GameConfig.ts is the only place with numbers** — no magic constants anywhere else

**Kill question answer (revised):**
"Can Claude Code modify merge logic without reading physics code?"
With the 14-file structure: YES — read MergeDetector.ts (120 LOC) only.
With Fred's 4-file structure: NO — read GameScene.ts (300-400 LOC) including physics setup.
The 14-file structure passes the kill question. The 4-file structure does not.

---

## References

- Anthropic — Building Effective Agents: https://www.anthropic.com/research/building-effective-agents
- Fred Brooks — The Mythical Man-Month (conceptual integrity principle)
- Project rules: `.claude/rules/architecture.md` — file limits, import direction
- Project rules: `.claude/rules/model-capabilities.md` — effort routing, context window
- ADR-009 (this project): Background ALL pipeline steps — context budget principle applied to file design
- ADR-010 (this project): Orchestrator zero-read — directly analogous to GameScene as pure orchestrator
