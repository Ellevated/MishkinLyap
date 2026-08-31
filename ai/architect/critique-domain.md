# Domain Architecture Cross-Critique

**Persona:** Eric (Domain Modeler)
**Phase:** 2 — Peer Review
**Date:** 2026-03-04

---

## My Position (Recap from Phase 1)

I proposed four module boundaries for Zverata, defined by where the business language changes meaning:

- **GameCore** — the rules of the game (what can happen, when, with what consequence)
- **Presentation** — what the player sees and hears
- **PlatformBridge** — the handshake with Yandex (ads, storage, pause signals)
- **GameConfig** — the tuning knobs (pure read-only data)

The key linguistic test I applied: "Animal" in GameCore means a physics body with tier and merge-eligibility state. "Animal" in Presentation means a sprite with animation and sound. Same word, two different things. That boundary is real and must be enforced by contract.

I also insisted on the Anti-Corruption Layer: game code must never speak Yandex's language (`YaGames`, `showFullscreenAdv`, `game_api_pause`). It speaks the game's language (`showInterstitial`, `onPause`). The `YandexBridge` adapter translates.

---

## Peer Analysis Reviews

---

### Analysis B — Operations Engineer (Charity)

**Agreement:** Partially Agree

**Reasoning from domain perspective:**

Charity correctly identifies the most dangerous domain boundary violation in this project: the SDK must initialize before Phaser starts. This is precisely the ACL principle stated operationally — the platform world must be ready before the game world can exist. She validates my recommendation that `main.ts` orchestrate SDK init first, then Phaser boot.

Her observability model is well-scoped to the actual domain. She avoids inventing complexity ("no server = no cascading failures"). The failure mode taxonomy she builds is implicitly domain-correct: ad failures affect PlatformBridge, audio issues affect Presentation, physics instability affects GameCore. She does not mix these.

However, there are two domain-language gaps I must flag:

First, she treats "ad policy" as an ops concern (15-point checklist item #11: "first ad fires AFTER first game over"). In my model, ad policy is a business rule that belongs at the PlatformBridge boundary, not scattered across a QA checklist. The 60-second minimum before first interstitial and the 3-minute cooldown between ads are invariants — they should be enforced in `AdPolicyConfig` inside `PlatformBridge`, not verified manually on Day 5.

Second, her runbook for "Post-Ad Game Crash" describes symptoms across three modules without naming which module owns each part. "Audio not resumed after ad" is a Presentation concern. "`game_api_resume` not handled" is a PlatformBridge concern. Mixing them in a single runbook obscures which module to open and fix. Domain clarity would help here.

**Missed gaps:**
- Ad policy as a business invariant vs. an ops checklist item — should be enforced in code, not in a pre-submit checklist
- Module ownership missing from runbooks — "fix in AdManager.ts" is less useful than "fix in PlatformBridge's resume handler"

**Rating: 4/5** — Concrete, useful, domain-aware. The ops lens adds real value. Minor language ownership gaps.

---

### Analysis C — Evolutionary Architect (Neal)

**Agreement:** Agree

**Reasoning from domain perspective:**

Neal's fitness functions are the strongest operationalization of the bounded-context contract I have seen from any peer. His `check-theme-isolation.sh` script — "zero animal names in non-config TypeScript files" — is an automated linguistic boundary enforcement. This is exactly what I mean by "context boundaries follow language." The fitness function tests: has the vocabulary of one context leaked into another?

His `ThemeConfig` interface is the cleanest statement of the GameConfig context boundary. `ACTIVE_THEME = ANIMALS_THEME` is the single switch that changes the game's tuning vocabulary. This directly supports my claim that GameConfig is a distinct context with its own responsibility: pure data, no behavior, stable interface.

The `depcruise` import direction check (`config ← shared ← core ← scenes ← main`) operationalizes my context map's dependency arrows. This is rare — most architects state dependency rules and never enforce them.

One domain concern: Neal's "Stable Core" protection of drop mechanics, merge detection, and the scene state machine is correct in direction but draws the boundary at implementation units (files) rather than linguistic units (contexts). Drop mechanics is GameCore. Scene state machine crosses GameCore (session status) and Presentation (which scene is shown). These are not the same concern. The state machine should sit at the boundary between GameCore's `GameSession.status` and Presentation's scene transitions — not be protected as a single unit.

**Missed gaps:**
- The scene state machine straddles two contexts; its fitness function should test the handoff between `GameSession.status` (GameCore) and `SceneName` (Presentation), not treat both as one stable unit
- No explicit protection for the ACL boundary itself (YandexBridge should never be imported outside sdk/)

**Rating: 5/5** — Best peer for domain boundary enforcement. Fitness functions translate my context contracts into automated tests.

---

### Analysis D — Security Architect (Bruce)

**Agreement:** Agree

**Reasoning from domain perspective:**

Bruce correctly names the trust boundary at the Yandex iframe and concludes that game code must not attempt to cross it. This is the ACL at the runtime boundary — game code speaks its own language, Yandex controls the outer frame, postMessage is the translation layer. His decision to NOT add a CSP meta tag is correct: the game must not impose its own vocabulary on Yandex's container.

His score submission recommendation — "submit score at game-over event, not via user-triggerable button" — is a domain rule stated as a security guideline. In my model, this belongs in GameCore as a session invariant: score submission is triggered by the `GameOver` domain event, not by user input. He reaches the right conclusion from a different direction.

The `loadHighscore()` defensive read with integer validation and clamping is a data integrity invariant at the PlatformBridge/GameCore boundary. He identifies the right boundary without naming it explicitly.

One domain observation: Bruce is correct that most traditional security threats do not apply here. The relevant "threats" in this project are all domain integrity threats: ad policy violations (PlatformBridge invariant), merge detection bugs (GameCore invariant), score corruption (data boundary invariant). The security lens and the domain lens converge on the same places in this codebase.

**Missed gaps:**
- Score submission as a domain event vs. a security design is the same decision — worth making the connection explicit so the team doesn't implement it twice with different rationales
- No analysis of which context "owns" the Yandex App ID — it is a PlatformBridge configuration datum, not a GameCore or Presentation concern

**Rating: 4/5** — Pragmatic and correct. Honest about what is and isn't a threat. Domain convergence visible even through a different lens.

---

### Analysis E — DX Architect (Dan)

**Agreement:** Partially Agree

**Reasoning from domain perspective:**

Dan's "Innovation token accounting" framework is a business-language test for architectural decisions. He applies it correctly: Phaser is justified by product need (physics + renderer + scene management = the game), TypeScript is justified by developer productivity (AI generates correct typed code), Vite is justified by build workflow. This is the kill question applied to tech choices — can you explain each technology in business terms?

His SDK wrapper pattern — interface plus two implementations, factory function, one if-statement — is the right Anti-Corruption Layer design stated in minimal code. `IYandexSDK` is the Published Language. `YandexSDKReal` is the ACL adapter. `YandexSDKMock` is the test double. The pattern is named correctly even if he does not use the DDD vocabulary.

His "stdlib-first" list is excellent boundary enforcement in practice: "if Phaser has it built in, use it, no extra deps." This is exactly the principle that prevents Presentation from growing its own physics understanding or GameCore from growing its own animation system.

The domain tension I see: Dan's proposed 4-file flat structure (`main.ts`, `GameScene.ts`, `config.ts`, `sdk.ts`) is convenient for a human reading the code but eliminates the module contracts that enforce context boundaries. With everything in GameScene.ts, the linguistic boundaries I identified (GameCore vs. Presentation vs. PlatformBridge) are not enforced by any structural mechanism. They exist only in the developer's head.

His argument — "GameScene.ts hits 300 LOC, THEN extract" — assumes the extraction will happen at the right boundary. In practice, it happens at whatever seems convenient when the file gets too large. That boundary may not follow the language. The cost of enforcing the boundary from Day 1 is low; the cost of re-establishing it after the code conflates concerns is high.

**Missed gaps:**
- Flat 4-file structure eliminates structural enforcement of linguistic context boundaries — the merge detection algorithm will likely live in GameScene.ts alongside scoring and animation, making it impossible to change one without reading all three
- "No new file is created unless an existing file exceeds 300 LOC" is a size rule, not a language rule — it will produce the wrong splits

**Rating: 3/5** — Correct on technology choices, wrong on the structural mechanism for enforcing boundaries. The pragmatism is real but the "extract when big" principle does not preserve linguistic boundaries.

---

### Analysis F — Fred Brooks / Devil's Advocate

**Agreement:** Partially Agree

**Reasoning from domain perspective:**

Fred's Contradiction #1 is the strongest challenge to my position. "Reusability for Game 2 from Day 1 vs. ship Game 1 in 7 days" is a real tension, and he correctly identifies it as Founder Anti-Pattern #2. I need to take this seriously.

After reflection: the interfaces I proposed (IGameCore, IPlatformBridge, IGameEventSource) are not reusability infrastructure. They are boundary contracts that enforce the linguistic separation that makes each context coherent. `IPlatformBridge` does not exist to make Game 2 easier — it exists because "game world" and "platform world" speak different languages and the boundary between them must be explicit. This distinction matters: boundary contracts are essential to Game 1 correctness; reusability is a side effect, not the motivation.

Fred's minimum architecture (4 files: main.ts, GameScene.ts, config.ts, sdk.ts) is correct as a starting point for a solo human developer. It is incorrect as an LLM-maintained codebase. When Claude Code works on "fix merge animation," it should not have to read 300 LOC of GameScene.ts that also contains physics setup, score management, and ad calls. The module boundaries exist to make each context's concerns legible in isolation.

His Contradiction #3 (three storage systems) is sharp and correct. I will revise my position: localStorage is the System of Record for highscore. Yandex SDK storage is a replica written fire-and-forget on game over. There is no sync strategy, no conflict resolution, no sync layer. Martin (Analysis H) reaches the same conclusion more formally.

Fred's "who is the chief programmer" challenge is the real question behind all the contradictions. His answer (stated rules before architecture begins) is right. My revised position includes three inviolable rules drawn from his challenge.

**Missed gaps:**
- He correctly challenges AQ-7 (reusability) but does not distinguish between reusability infrastructure (YAGNI) and boundary contracts (necessary for correctness) — conflating these leads to under-engineering the context boundaries
- His 4-file minimum architecture works for code colocation but creates a context boundary maintenance problem for an LLM-built codebase

**Rating: 4/5** — Best challenge to my position. Forced me to distinguish "boundary for correctness" from "boundary for reusability." Strong on contradictions, weaker on the LLM-specific context.

---

### Analysis G — Data Architect (Martin)

**Agreement:** Agree

**Reasoning from domain perspective:**

Martin's "System of Record" table is the data-lens version of my context map. His conclusion that `GameConfig.ts` is the System of Record for AnimalConfig, Phaser Scene / Matter.js world is the SoR for ActiveAnimals, and localStorage is the SoR for BestScore maps precisely to my context responsibilities.

His dual-write pattern for BestScore (localStorage as SoR, Yandex Player.setData as replica) resolves Fred's Contradiction #3 cleanly. It answers the question "which wins when they conflict?" with a clear rule: localStorage wins; Yandex is a replica. This is exactly the disambiguation I needed.

His `PersistedPlayerData` schema with `schemaVersion` and the `migratePlayerData()` function is the correct boundary contract for the PlatformBridge/storage handoff. The data that crosses from PlatformBridge into the rest of the game must be validated and typed. His defensive migration pattern (`if unknown, return DEFAULT_PLAYER_DATA`) is the ACL at the data boundary.

His invariants section is the best statement of GameCore's consistency rules from any peer:
- No double-merge (isMerging flag checked first)
- Score is monotonically increasing within a session
- Drop pool = tiers 1-5 only (enforced in GameScene.getNextDropTier)
- Bear merge awards score, no tier-9 animal created

These are the business rules that GameCore must enforce. They are stated in the language of the business: "Bear merge awards score" not "if tier === 8, skip spawn."

**Missed gaps:**
- The Phaser Registry as cross-scene data sharing mechanism is technically correct but bypasses the context boundary — GameScene and HUDScene accessing the same registry key is effectively shared state across Presentation sub-contexts; typed constants help but don't enforce the boundary
- `GamePhase` type is defined in the Data model but it belongs in GameCore's domain language — the session phase is a GameCore concept, not a data schema concept

**Rating: 5/5** — Most rigorous treatment of data ownership and system of record. Directly answers the storage ambiguity Fred raised.

---

### Analysis H — LLM Architect (Erik)

**Agreement:** Agree

**Reasoning from domain perspective:**

Erik's kill question — "Can Claude Code modify the merge logic without reading the physics file?" — is the LLM-specific formulation of my linguistic boundary test. If the answer is "no, they're tangled," the context boundary has failed. This is the right criterion.

His proposed file structure (24 files, ~100 LOC average, each file = one concern) is a direct translation of my four contexts into an LLM-readable structure. `MergeDetector.ts` = one concern within GameCore. `AnimationManager.ts` = one concern within Presentation. `YandexPlatform.ts` = the ACL implementation within PlatformBridge.

His `GameEvents.ts` catalog is the Published Language made explicit. Every cross-context communication goes through a named event in this file. An LLM reading `GameEvents.ts` understands the entire inter-context communication map in 50 lines. This is exactly the right artifact for the boundary between GameCore (emits events) and Presentation (consumes events).

His module header protocol — "Module: X / Role: Y / Uses: Z / Used by: W / Does NOT: Q" — is the contract statement for each module. The "Does NOT" line is the boundary enforcement mechanism in natural language. "MergeDetector does NOT: Create animals, update score, play animations (delegates to caller)" is a linguistic statement of the GameCore boundary.

One domain refinement: Erik's `IGamePlatform` interface conflates lifecycle signals (`notifyGameStart`, `notifyGameStop`) with ad calls (`showInterstitial`) and storage (`saveData`). In my PlatformBridge model, these are distinct sub-concerns within the context. The interface is correct as a Published Language, but the implementation should separate these internally: `GameplaySignalService`, `AdService`, `StorageService` within `YandexPlatform.ts`. This does not change the boundary, only the internal organization of the adapter.

**Missed gaps:**
- HUDScene as a parallel Phaser scene running alongside GameScene is an architectural decision with event coordination implications — if both scenes listen to the same events, the Presentation context has no clear internal boundary; worth specifying that GameScene is the orchestrator and HUDScene is purely reactive
- The `EventBus.ts` singleton vs. Phaser's `scene.events` is unresolved — a singleton EventBus makes the Published Language accessible from any file, which could lead to cross-context coupling without the linguistic discipline that prevents it

**Rating: 5/5** — Best peer for the LLM-specific context. His file structure is the implementation of my context map.

---

## Ranking

**Best Analysis:** Analysis C (Neal) and Analysis H (Erik) — tied

Neal's fitness functions are automated context boundary enforcement. Erik's file structure is the LLM-optimized implementation of my context map. Together they operationalize the domain model more completely than any individual analysis.

**Worst Analysis:** Analysis E (Dan)

Not because Dan is wrong about technology choices — he is correct. But his proposed 4-file flat structure actively dismantles the structural mechanism for enforcing linguistic context boundaries. In a project maintained by an LLM across sessions with no persistent memory, the boundary enforcement must live in the code structure, not in the developer's mental model. Dan's "extract when big" rule produces size-based splits, not language-based splits. This is the single decision most likely to cause context bleed.

---

## Revised Position

**Revised Verdict:** Same direction, refined on two points.

### Change Reason 1: Fred forced a distinction I needed

Fred's challenge made me articulate why the interfaces (`IGameCore`, `IPlatformBridge`) are essential even for a 7-day project. The answer: they are boundary contracts that enforce linguistic separation, not reusability infrastructure. A 7-day project without boundary contracts will have the merge detection algorithm inside GameScene.ts by Day 3, calling Phaser animation methods directly, making it impossible to change the merge rules without also understanding the presentation layer.

The boundary contracts cost 50-100 LOC each. The cost of not having them — conflated concerns, cross-context coupling, undebuggable merge bugs — is measured in hours, not lines.

### Change Reason 2: Martin resolved the storage ambiguity

Fred's Contradiction #3 (three storage systems) was a real problem in my Phase 1 model. Martin's resolution is correct and I adopt it:

- **localStorage** = System of Record for BestScore. Synchronous write on game over. Always available.
- **Yandex SDK Player.setData** = replica. Fire-and-forget async write on game over. Used for cross-device sync.
- **In-memory GameSession** = runtime state. Never persisted. Resets on game over.

There is no sync strategy, no conflict resolution algorithm, no sync layer. If the two diverge, localStorage wins. The player may see a slightly stale score on a new device — acceptable for a free casual game.

---

## Final Domain Recommendation

### Three Inviolable Rules (answer to Fred's challenge)

1. **Language beats size** — module boundaries follow where the business vocabulary changes, not where files hit 300 LOC. "Animal" in physics is not the same as "Animal" in graphics. That boundary is real regardless of file size.

2. **The platform speaks last** — all Yandex SDK vocabulary is confined to `src/sdk/`. No file outside `src/sdk/` may import `YaGames`, call `showFullscreenAdv`, or respond to `game_api_pause` directly. The ACL is not optional.

3. **Contracts before code** — `IGameCore`, `IPlatformBridge`, and `GameEvents.ts` are written before any business logic. They define what each context promises to the others. Code is written to implement those promises, not to discover them.

### Final Four Contexts (unchanged, implementation refined)

**GameCore** (`src/game/`)
- Owns: merge detection, physics management, animal lifecycle, score accumulation, session state machine
- Published language: `GameEvents.ts` event catalog
- Invariants: no double-merge, monotonically increasing score, tiers 1-5 only spawnable, Bear merge awards score but spawns nothing
- SoR for: AnimalState (runtime), CurrentScore (runtime), SessionStatus (runtime)

**Presentation** (`src/scenes/`, `src/objects/`)
- Owns: all scenes, animations, sound effects, HUD rendering, merge effect particles
- Consumes: GameCore events via event bus
- Must NOT: touch physics bodies directly, call SDK methods, contain game logic
- Boundary signal: if a file in Presentation imports from `src/game/`, the boundary has been violated

**PlatformBridge** (`src/sdk/`)
- Owns: Yandex SDK adapter, ad timing enforcement, storage, pause/resume signals
- Published language: `IPlatformBridge` interface
- ACL: `YandexBridge` translates between Yandex vocabulary and game vocabulary
- SoR for: AdCooldownState (runtime, resets per session), BestScore persistence (replica write to Yandex)

**GameConfig** (`src/config/`)
- Owns: all tunable constants, animal chain definition, physics parameters, ad policy settings
- Read-only at runtime. Never mutated.
- SoR for: AnimalConfig (compile-time), all numeric constants
- Theme isolation fitness function: zero animal names in non-config TypeScript files

### Context Map (final)

```
[GameConfig] ──(read-only import)──> [GameCore]
[GameConfig] ──(read-only import)──> [Presentation]
[GameConfig] ──(read-only import)──> [PlatformBridge]

[GameCore] ──(domain events via GameEvents.ts)──> [Presentation]
[GameCore] ──(domain events via GameEvents.ts)──> [PlatformBridge]

[Presentation] ──(calls IPlatformBridge methods)──> [PlatformBridge]

[PlatformBridge] ──(AdCompleted event)──> [GameCore]
[PlatformBridge] ──(PlatformPaused event)──> [GameCore]
[PlatformBridge] ──(PlatformPaused event)──> [Presentation]

[PlatformBridge] <──(ACL)──> [YandexBridge (production)]
[PlatformBridge] <──(ACL)──> [MockBridge (development)]
```

**Enforced by:**
- `depcruise` import direction rules (Neal's contribution)
- `check-theme-isolation.sh` fitness function (Neal's contribution)
- Module headers stating "Does NOT" scope (Erik's contribution)
- `GameEvents.ts` as Published Language (Erik's contribution)
- localStorage SoR rule for BestScore (Martin's contribution)

### Merge Detection Algorithm (settled)

Collision event-driven. Not polled. `MergeSystem` subscribes to Matter.js `collisionstart`. Guards applied in sequence:

1. Both bodies must have label `'animal'`
2. Both must have the same tier
3. Neither may have `isMerging: true`
4. Tier must be < 8 (Bear does not upgrade)
5. Both must have `isSettled: true` (prevents mid-air phantom merges)

The `isMerging` flag is set as the first operation — before any async work or body destruction. This is the single most important invariant in GameCore.

### State Machine (settled)

Three Phaser scenes plus one overlay: PreloadScene, MenuScene, GameScene, GameOverScene (overlay on GameScene, preserving physics state for the "continue" path). GameScene is the orchestrator — it creates managers, wires events, handles scene transitions. It contains zero business logic.

`GameSession.status` (GameCore) drives scene transitions via domain events. The scenes respond to events; they do not query GameCore state directly.

### On AQ-7 (Reusability)

Fred is right that designing reusability infrastructure speculatively is Founder Anti-Pattern #2. The resolution:

- `IPlatformBridge` interface: written for Game 1 correctness, reusable as a side effect. NOT premature optimization.
- `GameConfig` theme shape: written for Game 1 tuning, `ThemeConfig` extracted if and only if Game 2 is confirmed to use the same merge-chain mechanic. NOT extracted speculatively.
- `ThemeConfig` fitness function (Neal's `check-theme-isolation.sh`): activated from Day 1 because it prevents language leakage, not because it enables Game 2.

The line: "does this abstraction make Game 1 more correct, or does it only make Game 2 easier?" If the former, keep it. If the latter, delete it and revisit when Game 2 starts.

---

## References

- Phase 1 research: `D:/dev/game/ai/architect/research-domain.md`
- Peer analyses: `D:/dev/game/ai/architect/anonymous/peer-B.md` through `peer-H.md`
- [Eric Evans — Domain-Driven Design](https://www.domainlanguage.com/ddd/)
- [Fred Brooks — The Mythical Man-Month](https://en.wikipedia.org/wiki/The_Mythical_Man-Month) — conceptual integrity, chief programmer model
- [Martin Kleppmann — DDIA](https://dataintensive.net/) — system of record, consistency models
- [Neal Ford — Building Evolutionary Architectures](https://evolutionaryarchitecture.com/) — fitness functions
