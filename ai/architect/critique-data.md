# Data Architecture Cross-Critique

**Persona:** Martin (Data Architect)
**Phase:** 2 — Peer Review
**Date:** 2026-03-04

---

## Peer Analysis Reviews

### Analysis A (Domain Modeler — DDD lens)

**Agreement:** Partially Agree

**Reasoning from data perspective:**

Peer A does solid work establishing module boundaries and a ubiquitous language. The `IGameCore` interface and the domain event table are exactly the kind of data flow contracts I care about. The aggregate design for `GameSession` correctly identifies the invariant: score and animal state must update atomically — this is a real ACID boundary in a single-threaded JavaScript context.

However, there are two data gaps:

First, the persistence schema is deliberately minimal — "just `{ highScore: number }`" — and this is presented as a virtue. For Game 1 it probably is. But the `PlatformBridge.loadHighScore()` returning a bare number throws away the schema version guard entirely. My `PersistedPlayerData` structure has `schemaVersion`, `totalGamesPlayed`, `lastPlayedAt` — these fields cost nothing but enable future migrations without data loss. Peer A's approach would require a breaking change to add `totalGamesPlayed` later.

Second, the `GameSessionState` interface includes `highScore` as a field on the live session state. This is a system-of-record conflict: `highScore` belongs to the persistence layer, not to the active game session. The session should know `currentScore`. At game-over, the persistence layer compares and updates `bestScore`. Mixing them in `GameSessionState` creates a dual-write risk: session updates score, persistence updates highscore — two writers for what should be one SoR.

**Missed gaps:**
- No schema versioning in the persistence contract — `loadHighScore(): Promise<number>` has no migration path
- `highScore` field on `GameSessionState` creates SoR ambiguity between session and persistence
- No explicit definition of what happens when `IPlatformBridge.loadHighScore()` returns a value inconsistent with localStorage (the cross-device sync conflict I identified)

**Rating:** 4/5 — strong domain modeling, weak on persistence SoR clarity

---

### Analysis B (Operations Engineer — Honeycomb lens)

**Agreement:** Agree

**Reasoning from data perspective:**

Peer B is focused on ops but has several data-relevant observations I consider accurate. The critical insight — "no hotfix path on Yandex Games, prevent bugs before launch" — directly implies that localStorage schema migrations must be correct on first deploy. You cannot hotfix a corrupted schema in production.

The localStorage schema versioning point is brief in Peer B's analysis: "store `localStorage.setItem('schema_version', '1')` — if version mismatch, migrate or reset." This is correct but insufficiently specified. "Reset" means data loss. My `migratePlayerData()` function preserves `bestScore` across version bumps rather than resetting everything. For a casual game with no monetary stakes this distinction may seem minor — but to a player who reached a high score, losing it feels like a broken product.

The `try/catch` recommendation around localStorage writes is correct from a data integrity perspective. Mobile Safari can throw `QuotaExceededError` silently. The game should degrade gracefully: display score in UI without persisting, not crash.

The observability section indirectly validates my persistence strategy: Sentry would catch a corrupted `JSON.parse()` on a localStorage read, surfacing schema drift bugs post-launch. This is a valid secondary check on data integrity that I had not explicitly called out.

**Missed gaps:**
- "Migrate or reset" on version mismatch is too coarse — specify which fields can be salvaged vs which require reset
- No mention of the Yandex `player.getData()` call potentially returning stale data on first session (player played on another device, then goes offline — localStorage is ahead of cloud, not behind)

**Rating:** 3/5 — ops-focused correctly, data precision lacking

---

### Analysis C (Evolutionary Architect)

**Agreement:** Partially Agree

**Reasoning from data perspective:**

Peer C's "Theme = Config Only" fitness function is a direct data architecture concern: it enforces that `AnimalConfig` (the `ThemeConfig`) is the single source of truth for tier definitions, and that game logic is theme-agnostic. This is correct data ownership — the configuration layer owns the entity definitions, the game core consumes them read-only.

However, Peer C's `ThemeConfig` interface includes `score` as a field on `TierConfig`, which conflicts slightly with my `MERGE_CHAIN` approach. My `scoreOnMerge = tier * (tier + 1)` is a computed formula, not a stored constant. Peer C stores scores as magic numbers per tier: `score: 36` for Bear. The problem: if the formula changes (e.g., we want a different curve), Peer C must update 8 numbers; my formula updates in one place. For a data architect, a formula is always preferable to denormalized constants when the relationship is regular.

The multi-game localStorage key insight is valuable: `${ACTIVE_THEME.name}_highscore` instead of a hardcoded key. This prevents Game 1 and Game 2 from sharing a namespace when they run on the same origin. However, if a player clears their Game 1 highscore by accidentally playing Game 2 first (both on same device, same origin), they lose Game 1 data. The SoR for "which game owns this key" is the theme name string — fragile if theme names ever change.

The fitness function for "Theme = Config Only" is the best automated data integrity check in any of the analyses: it enforces the SoR boundary at build time.

**Missed gaps:**
- Score as stored constant vs computed formula — normalization question not addressed
- Theme name as localStorage key prefix creates implicit coupling between config and storage that could break if theme name changes (rename "zverata" to "animals" → lose all saved data)

**Rating:** 4/5 — best automated enforcement of SoR boundaries, normalization gap

---

### Analysis D (Security Architect)

**Agreement:** Agree

**Reasoning from data perspective:**

Peer D correctly identifies that score manipulation via localStorage is an acceptable risk given no monetary stakes. The deliberate non-defense stance is analytically sound — OWASP risk rating: High likelihood, Low impact = Low overall.

The defensive localStorage read pattern is a data integrity measure I agree with:

```typescript
const parsed = parseInt(raw, 10);
if (isNaN(parsed) || parsed < 0 || parsed > 10_000_000) return 0;
```

This is the same principle as my `migratePlayerData()` function: validate on read, not on write. Corrupt storage should degrade to safe defaults, not crash.

The "submit score at game over event, not via user-triggerable button" recommendation is a data flow integrity measure: it ensures the score write path is controlled by game logic, not by arbitrary user action. This is correct SoR thinking — the game session is the authoritative event source for score submission.

One data concern Peer D missed: the "no secrets in bundle" check focuses on API keys and passwords. But the `PersistedPlayerData` schema itself could be considered sensitive if it ever included behavioral analytics (totalGamesPlayed, lastPlayedAt). For a casual game this is non-critical, but it is worth noting that any schema that captures behavioral data — even aggregate — becomes a privacy consideration under GDPR if the game ever expands to EU players via Yandex global.

**Missed gaps:**
- No analysis of the data exposure in Yandex SDK `player.getData()` — what does Yandex itself see when we call `setData()`? Implicit data sharing with platform not addressed.
- GDPR relevance of `totalGamesPlayed` + `lastPlayedAt` fields if game expands internationally

**Rating:** 3/5 — correct calibration for this threat model, data-specific gaps minor

---

### Analysis E (Developer Experience Architect)

**Agreement:** Partially Agree

**Reasoning from data perspective:**

Peer E's core argument — use boring tech, minimize deps — is correct and I have no quarrel with it from a data perspective. The single `GameConfig.ts` as source of truth for all tunable constants is exactly the right data locality decision.

However, Peer E simplifies the persistence layer in a way that creates a SoR gap. The proposed `IYandexSDK` interface has `getStorage/setStorage` methods, and the mock implementation points these at localStorage. This means: in development, `getStorage()` reads localStorage; in production, `getStorage()` reads Yandex cloud storage. This is a behavioral difference between dev and prod that could mask bugs. If the mock storage behaves identically to localStorage (same sync semantics, same key structure), edge cases in the async Yandex storage path will never surface during development.

Peer E also proposes a single `sdk.ts` combining real and mock: "Single `sdk.ts` file with real + mock combined via env check." This is simpler than two files, but it means the mock code ships to production (tree-shaking should remove it, but depends on bundler correctness). My separate `createSDKMock()` function is explicit and auditable.

The comment about `manualChunks: undefined` for single bundle conflicts with my concern about the Yandex SDK leaderboard rate limit (1 call/second). If the game code and SDK wrapper are in the same chunk, a future optimization to lazy-load the leaderboard module becomes harder. This is minor but worth noting.

**Missed gaps:**
- Mock `getStorage/setStorage` targeting localStorage creates dev/prod behavioral divergence that can mask async bugs
- No schema versioning in the proposed simple `GameState` interface — `{ score, highScore, isGameOver, isPaused }` has no migration guard

**Rating:** 3/5 — pragmatically correct for velocity, data integrity shortcuts acknowledged

---

### Analysis F (Devil's Advocate)

**Agreement:** Partially Agree

**Reasoning from data perspective:**

Peer F raises the most important data architecture challenge in any of the analyses: "Pick ONE storage system." The contradiction between "no database" and three actual storage layers (in-memory, localStorage, Yandex SDK) is real. Peer F correctly identifies that this ambiguity becomes a latent bug.

However, Peer F's proposed resolution — "localStorage ONLY and ignoring Yandex SDK storage entirely" — throws away real value. The correct resolution is what I specified: localStorage as the system of record, Yandex SDK storage as a replication target. These are not two competing SoRs — they are one SoR with one read replica. The confusion Peer F identifies comes from architectures that treat both as equals. My SoR table makes the hierarchy explicit.

Peer F's skepticism about the 3-storage-system complexity is warranted for a naively designed system. But it is not warranted for a correctly designed system where the SoR is unambiguous. The question is not "how many stores" but "who owns the truth." One owner, multiple copies — this is the DDIA replication model and it is simple.

The 4-file minimal architecture proposal (`main.ts`, `GameScene.ts`, `config.ts`, `sdk.ts`) is interesting from a data locality perspective. Colocating all game state in `GameScene.ts` means the SoR for every entity is implicitly "wherever GameScene's local variables are." This is fine for a 300 LOC game. But it makes the SoR table impossible to reason about at the file level — everything is GameScene.

**Missed gaps:**
- The "pick one storage" prescription is too blunt — the correct answer is SoR hierarchy, not storage elimination
- No acknowledgment that localStorage-only means data loss if browser is cleared (Yandex SDK storage exists precisely to solve this)

**Rating:** 3/5 — correctly identifies the ambiguity, prescribes too-simple a cure

---

### Analysis H (LLM Architect)

**Agreement:** Partially Agree

**Reasoning from data perspective:**

Peer H is focused on agent readability, not data architecture, and this is acknowledged in their framing. The module decomposition they propose — `ScoreManager`, `PhysicsManager`, `MergeDetector` as separate files — is consistent with good SoR thinking: each module owns one concern. `ScoreManager` is the SoR for score state during a session. `StorageService` is the SoR for persistence. This is implicit in Peer H's design but never stated explicitly.

The `EVENTS` catalog in `GameEvents.ts` is a published data contract — exactly the kind of explicit data flow documentation I find valuable. An event is a fact: `ANIMAL_MERGED` with payload `MergeEvent` is a statement that a merge occurred. Publishing these as typed constants with payload shapes is good data lineage documentation.

However, Peer H's `StorageService` interface is underspecified from a data perspective. The `saveData(data: Record<string, unknown>)` signature is untyped — the storage layer accepts arbitrary objects, which is the antithesis of schema governance. Compare to my strongly typed `PersistedPlayerData` with `schemaVersion` guard. Peer H's generic storage service would allow any caller to store anything, making schema evolution impossible to reason about.

The `HUDScene` parallel pattern is interesting but creates a data flow question: if `HUDScene` subscribes to `SCORE_UPDATED` events, and `ScoreManager` emits them, what happens to event ordering during scene initialization? If `HUDScene` subscribes after `ScoreManager` emits the first score event (both create() during the same Phaser tick), the HUD initializes with stale data. This is a subtle eventual consistency bug within the game itself.

**Missed gaps:**
- `StorageService` accepting `Record<string, unknown>` — no schema governance, no versioning, no type safety on persistence
- HUDScene subscription timing relative to first `SCORE_UPDATED` event could create initialization inconsistency
- `GameState` type in Peer H's research uses `phase` as a string union but `TRANSITIONS` table is `Record<GamePhase, GamePhase[]>` — the two typing patterns are inconsistent (union type vs record key)

**Rating:** 4/5 — best agent-readability thinking, persistence schema too loose

---

## Ranking

**Best Analysis:** A (Domain Modeler)

**Reason:** Peer A produced the most structurally rigorous domain model, with explicit aggregate boundaries, invariants stated as data rules, and an event table that doubles as a data flow diagram. The `GameSession` aggregate boundary is correct: score and animal state must be consistent together. The domain event catalog (AnimalDropped, MergeDetected, ScoreChanged, GameOver) maps cleanly to my data flow architecture. Despite the SoR ambiguity on `highScore` in `GameSessionState`, the overall data thinking is the most developed of the peer analyses.

**Worst Analysis:** B (Operations)

**Reason:** Peer B's analysis, while practically useful for ops, treats data as an afterthought. The localStorage schema advice is too brief ("migrate or reset"), the persistence SoR is never explicitly named, and the cross-device sync conflict (localStorage vs Yandex cloud storage disagreeing) is not addressed. For an ops persona this is acceptable — but it means the data architecture questions raised in my research are simply not answered by Peer B's contribution.

---

## Revised Position

**Revised Verdict:** Mostly unchanged, with two refinements from peer input

**Change Reason:**

1. Peer C's fitness function for "Theme = Config Only" convinced me to add an explicit build-time check that enforces the SoR boundary for `AnimalConfig`. This is more robust than a convention — it is an automated invariant. I am adopting this as a recommendation.

2. Peer H's event catalog pattern (`GameEvents.ts` as a single published contract for all data flows) complements my data flow diagram. I had the flows described in prose; publishing them as typed constants is a better artifact. Adopting this.

3. Peer F's challenge on the "three storage systems" forced me to articulate the SoR hierarchy more precisely. My position is unchanged in substance but I am adding explicit language: localStorage is the primary SoR, Yandex SDK storage is a replication target (write replica, not a competing SoR), and in-memory state is ephemeral with no persistence role. Three layers, one owner.

**Final Data Recommendation:**

The data architecture is sound with the following clarifications synthesized from peer input:

**System of Record Table (Final):**

| Entity | System of Record | Replication Targets | Ephemeral |
|--------|-----------------|--------------------|-----------|
| AnimalConfig (tier definitions) | `GameConfig.ts` (compile-time constant) | None | No |
| ActiveAnimals | Matter.js world in-memory | None | Yes |
| CurrentScore | ScoreManager in-memory | None | Yes |
| BestScore | `localStorage` | Yandex Player.setData (async, best-effort) | No |
| LeaderboardRank | Yandex Leaderboard service | None (read-only from our side) | No |
| GameSettings | `localStorage` | None | No |
| AdCooldownState | In-memory (AdManager) | None | Yes |
| MergeEvent | Transient (collision tick) | None | Yes |

**Three Non-Negotiable Data Rules:**

1. **Score flows upward, never sideways.** `MergeEvent` → `ScoreManager` (in-memory) → `PersistedPlayerData` (localStorage) → Yandex SDK (replica). No reverse path. No cross-writes.

2. **Schema version is checked before every localStorage read.** `migratePlayerData()` is not optional. Any schema evolution requires a version bump and a migration branch, never a silent reset.

3. **BestScore SoR is localStorage.** Yandex SDK storage wins in a conflict ONLY at session start (compare on load, take the max). After that, localStorage is authoritative for the session. This is the only merge point and it is clearly defined.

**Adopted from peers:**
- Peer C: Add `check-theme-isolation.sh` as a build-time fitness function enforcing AnimalConfig SoR boundary
- Peer H: Publish data flows as typed event constants (`GameEvents.ts`) — this is the data lineage document in code form
- Peer A: Formalize the `GameSession` aggregate boundary with explicit invariants (score increases monotonically, no drop after game-over)

**Not adopted:**
- Peer F's "localStorage only, drop Yandex SDK storage" — this is correct for simplicity but wrong for data durability. The async replica costs 3 lines of code and preserves cross-device data. The SoR hierarchy is simple enough to be maintainable.
- Peer E's `getStorage/setStorage` pointed at localStorage in mock — mock should return empty data, not localStorage, to keep dev and prod behaviors distinct. Otherwise bugs in the "what happens when cloud data is empty" path never surface in development.

---

## References

- [Martin Kleppmann — Designing Data-Intensive Applications](https://dataintensive.net/)
- [Yandex Games SDK — Player Data API](https://yandex.com/dev/games/doc/en/sdk/sdk-player)
- [Yandex Games SDK — Leaderboards](https://yandex.com/dev/games/doc/en/sdk/sdk-leaderboard)
- Peer analyses A through H (this session)
- My Phase 1 research: `ai/architect/research-data.md`
