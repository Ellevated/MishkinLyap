# Security Architecture Cross-Critique

**Persona:** Bruce (Security Architect)
**Phase:** 2 — Peer Review
**Date:** 2026-03-04

---

## Context: My Phase 1 Position (Summary)

My Phase 1 research concluded that this is a client-side HTML5 casual game with a radically reduced attack surface. The traditional OWASP Top 10 is almost entirely irrelevant. The actual security work is:

1. **Platform compliance** (Yandex moderation) — not traditional security, but same blast radius
2. **Build artifact hygiene** — no secrets in the bundle, no external CDN links
3. **Supply chain** — `npm audit` before submission, no critical CVEs
4. **localStorage input validation** — defensive read, not security-critical
5. **SDK loaded from correct URL** — supply chain integrity

The kill question answer: the attack surface is minimal (no server, no PII, no auth, no payments). The highest-severity "security" risks are platform compliance failures and supply chain issues in the build toolchain.

---

## Peer Analysis Reviews

### Analysis A (Domain Architect — Eric)

**Agreement:** Partially Agree

**Reasoning from security perspective:**

Eric's domain analysis is thorough and architecturally sound. From a security lens, the `IPlatformBridge` interface and Anti-Corruption Layer pattern he proposes has real security value that Eric does not explicitly call out: it enforces that game code never calls Yandex SDK directly. This is supply chain isolation at the application layer. If the Yandex SDK were ever compromised or its API changed in a malicious way, the blast radius is contained to one adapter class rather than scattered across the entire codebase.

Eric's merge guard pattern (the `mergingIds: Set<string>`) is a data integrity control. Without it, double-merge events could inflate scores arbitrarily. While there are no monetary prizes, this is still a STRIDE Tampering concern — a player triggering a merge exploit to post an impossibly high score on the leaderboard is reputation damage for the platform listing. Eric handles this correctly without framing it as security, which is the right approach for this context.

The `isSettled` guard is also security-adjacent: without it, rapid-fire same-tier drops could trigger merges that bypass the intended game loop. This closes an unintended gameplay exploit path.

**Missed gaps from security perspective:**

- **No mention of the score submission timing attack.** Eric's `IGameCore` interface exposes `submitScore` as a callable method. If score submission is triggered by a user-callable event (button click) rather than automatically at game-over, a player can call it with any value. My Phase 1 research flagged this. Eric's design calls `this.sdk.submitScore(this.score)` at game-over event — this is correct but not explicitly stated as a security design decision. Worth making explicit in the architecture.
- **`window.parent` / `window.top` access risk** not mentioned. Some Phaser templates access parent frames for canvas sizing. Eric notes "use `window.self`" only in passing in my own research, not in his. This deserves a dedicated ADR.
- **Mock must not ship to production** — Eric mentions this conceptually but does not specify the mechanism. The `import.meta.env.DEV` gate needs to be explicit.

**Rating: 4/5** — Strongest domain analysis in the set. Security implications of ACL and merge guard are real, just not labeled as such.

---

### Analysis B (Operations — Charity)

**Agreement:** Agree

**Reasoning from security perspective:**

Charity's operations research is the most security-aligned of all the peer analyses, even though it doesn't use security vocabulary. The core insight — "there is NO hotfix path on Yandex Games, moderation takes 3-5 days" — is exactly the threat model I want every developer to internalize. This is the Denial of Service / Availability risk specific to this platform. A zero-day in your live game cannot be patched in minutes; it's a multi-day remediation cycle. This fundamentally changes the risk calculus: **prevention is the only mitigation**.

The 15-point pre-submit checklist (automated + manual) is a security control. The automated checks catch:
- Absolute paths (would break the game, not ship secrets, but same category of "artifact integrity")
- No sourcemaps in production (source code exposure)
- SDK URL present (supply chain integrity)
- No localhost references (information disclosure in production artifact)

The Sentry integration is a legitimate post-launch monitoring control. The ad callback timeout pattern (10-second `setTimeout` fallback calling `onComplete()`) is a Denial of Service mitigation — without it, a hung ad callback causes the game to freeze, effectively DoS-ing the user's session.

Charity's structured logger that ships errors to Sentry is security-relevant: it prevents SDK tokens or session state from being inadvertently logged to console in production. The `log.error` wrapper sends to Sentry without exposing raw SDK objects.

**Missed gaps from security perspective:**

- **`drop_console: false` in the Vite terserOptions** is a mistake from a security hygiene standpoint. The config explicitly keeps all `console.log` in production. This means debug logs, game state logs, and any SDK object logs that developers added during development will be in the production bundle. It should be `drop_console: true` with explicit exceptions for `console.error` only (via Sentry wrapper). Charity's intent is to keep `console.error` for SDK debugging, but the implementation keeps ALL console output. This is a moderate information disclosure risk.
- **`host: true` in Vite dev server config** exposes the dev server on the LAN (not just localhost). Charity explicitly intends this for mobile testing, which is fine. But it should be documented that this is intentional and that no secrets exist on the dev server. If anyone ever adds a `.env` file with credentials while this config is active, the dev server would expose those credentials to the LAN.
- **Sentry DSN is itself a secret** — if Sentry is added, the DSN key will need to go into the production bundle (Sentry requires it to route errors). Charity does not address where the Sentry DSN is stored and whether it ends up in the built artifact. For a public game, a leaked Sentry DSN allows anyone to flood your error quota, but it does not expose user data. Low severity, but should be noted.
- **`archiver` npm package recommendation** for cross-platform ZIP adds a dependency. Supply chain note: verify this package is actively maintained and not compromised before adding it.

**Rating: 5/5** — Best security thinking in the peer set, packaged as operational engineering. The "no hotfix path" insight is the most important security-operational finding.

---

### Analysis C (Evolutionary Architect — Neal)

**Agreement:** Partially Agree

**Reasoning from security perspective:**

Neal's fitness function suite is excellent software engineering and has incidental security value. The "no external requests" fitness function directly enforces a compliance control:

```bash
grep -r "https://" dist/ --include="*.js" | grep -v sdk.yandex
```

This is automated supply chain verification. If a dependency update ever sneaks in an external CDN call, this catches it before submission.

The "theme = config only" fitness function prevents a class of information disclosure: if animal names (or any game-specific constants) leak outside config files, they become harder to audit. Keeping all tunable data in one place makes it trivial to grep for secrets in the config layer specifically.

The `check-bundle-size.sh` script running before every build is a build integrity gate. Neal's approach of automating these checks is the correct security mindset: continuous verification beats manual review.

However, Neal's security consideration is superficial:

> "PhysicsConfig.ts is a change attack surface — if someone PRs 'increase gravity to 999' it breaks game feel. Fitness function: Matter.js gravity assertion in smoke test."

This is framed as a game-feel protection, not a security concern. For a solo developer, this is probably fine — there's no external contributor threat model. But it touches on the right idea: **configuration files are an attack surface**.

**Missed gaps from security perspective:**

- **`eslint-disable` and `@ts-ignore` patterns** are not addressed. If the fitness functions enforce import direction via `dependency-cruiser`, but developers bypass TypeScript checks with `@ts-ignore`, the import direction rules become meaningless. A fitness function checking for `@ts-ignore` count would close this gap.
- **The `ThemeConfig.ACTIVE_THEME` singleton** — Neal designs a single global `export const ACTIVE_THEME = ANIMALS_THEME`. This is a mutable singleton in JavaScript (even with `as const`, the object is not frozen). An attacker with code execution (e.g., via a compromised dependency) could overwrite `ACTIVE_THEME` at runtime. In practice, the threat model doesn't support this — but it's worth noting. Use `Object.freeze(ANIMALS_THEME)` for defense-in-depth.
- **`orientationchange` listener** that calls `game.scale.setGameSize()` — Neal mentions this in Strategy B. If this fires with attacker-controlled dimensions, it could cause layout issues. Not a real threat for this game, but worth noting that any resize handlers accepting external dimensions should clamp values.
- **The `depcruise` tool itself** is a dev dependency. Neal recommends it but doesn't mention that dev dependencies are not shipped in the production bundle — correct by default with Vite, but worth verifying that `devDependencies` never end up in the production artifact.

**Rating: 3/5** — Good engineering discipline but security is an afterthought. The fitness functions are valuable security controls even if they're framed as architecture controls.

---

### Analysis E (DX Architect — Dan McKinley)

**Agreement:** Partially Agree

**Reasoning from security perspective:**

Dan's "Choose Boring Technology" framework is implicitly a security principle. Every additional dependency is an attack surface. By explicitly capping the innovation token budget and cutting everything Phaser provides out of the box, Dan reduces the supply chain attack surface to its minimum:

- No Howler.js (saves 1 dependency)
- No GreenSock/GSAP (saves 1 dependency)
- No Hammer.js (saves 1 dependency)
- No React/Vue (saves 50+ transitive dependencies)

This is supply chain hygiene through pragmatism. The security value is real, even if Dan frames it as DX/velocity.

Dan's SDK mock pattern (`if (typeof window.YaGames !== 'undefined')`) is simple and correct. The detection is passive — no network call, no environment variable, no manual flag that could be accidentally left in the wrong state. This is defense against the "shipped the wrong build" failure mode.

The `manualChunks: undefined` recommendation (single bundle for Yandex compatibility) has a security implication: a single bundle is easier to audit for secrets than multiple chunks. With code splitting, a secret might end up in a non-obvious chunk file that the `grep dist/` check misses. Dan's recommendation inadvertently simplifies the pre-submission security audit.

**Missed gaps from security perspective:**

- **`npm run zip` script** uses the shell `zip` command: `cd dist && zip -r ../zverata.zip .`. On Windows (which this project runs on — `Platform: win32` in the environment), this command will fail unless Git Bash or WSL is available. Charity noted this too. The security gap is that a failing ZIP script might produce a partially-built archive that passes the size check but is missing files — a silent packaging error. Use `archiver` or a Node.js zip library for cross-platform reliability.
- **`__VERSION__` injected into bundle** — Dan's Vite config uses `__VERSION__: JSON.stringify(process.env.npm_package_version)`. This injects the package version into the production bundle. Version information aids attackers in targeting known vulnerabilities. For a game with no known CVEs, this is low risk, but it's worth questioning whether version number disclosure is intentional. Remove or gate behind `import.meta.env.DEV`.
- **No mention of `npm ci` vs `npm install`** for the build process. `npm install` will update `package-lock.json` if the lock file is inconsistent with `package.json`. `npm ci` is deterministic and fails if the lock file doesn't match. For build pipeline security, `npm ci` is mandatory. Dan's scripts use `npm install` implicitly.
- **`hot: true` and `host: true` in dev server** — same concern as Charity's analysis. Dan specifies these but does not note the LAN exposure.

**Rating: 3/5** — Strong pragmatic security through simplicity (fewer deps = smaller attack surface), but misses platform-specific risks (Windows ZIP, version disclosure).

---

### Analysis F (Devil's Advocate — Fred Brooks / Skeptic)

**Agreement:** Partially Agree

**Reasoning from security perspective:**

The Skeptic raises the most important cross-cutting concern from a security perspective: **the absence of a single authority means no one owns security**. This is correct. In the traditional security model, the Security Architect (me) owns the threat model. But in a 7-day solo project, if the "chief programmer" has no security mindset, the 5-minute pre-submission checks I specified may be skipped under deadline pressure.

The Skeptic's "3 inviolable rules" should include one security-adjacent rule. His proposed rules are:

1. Ship beats architecture
2. Copy beats design
3. 4 files beats 9 files

None of these mention security. I propose a fourth: **"No submission without running the pre-flight check script."** This encodes the P0 security requirements (no secrets, no external CDN links, npm audit clean) into the inviolable build process.

The three storage system contradiction (Contradiction #3) is a real security issue that the Skeptic surfaces correctly. Three data stores for a "no database" game creates reconciliation complexity. The security risk: if a player manipulates `localStorage` to show a fake highscore while the Yandex cloud has the real value, the game must decide which to trust. Any reconciliation logic that reads from localStorage first and "upgrades" to cloud data creates a window where the displayed score is unverified. The Skeptic's recommendation — pick one storage system — is correct from both a simplicity and a security standpoint.

**Missed gaps from security perspective:**

- **The Skeptic challenges complexity but does not identify the security-critical simplifications.** He argues for 4 files vs 9 files. From a security standpoint, the critical simplification is: the SDK mock should not ship to production. A monolithic 4-file structure makes it harder to ensure the mock is correctly gated, because the mock and real implementation are in the same file (`sdk.ts`). Eric's and Erik's approach — separate files with a factory function — makes it trivially easy to verify that the mock file is never imported in production via bundle analysis. The Skeptic's "simplicity" argument actually creates a security verification gap.
- **The Skeptic dismisses AQ-7 (reusability) as YAGNI**. From a security standpoint, reusable security primitives (the pre-flight check script, the SDK mock gate, the localStorage validation function) should be designed for reuse from Day 1. These are not premature optimization — they're the cost of security hygiene that compounds. Dismissing AQ-7 entirely could eliminate the motivation to write the pre-flight check script as a reusable tool.

**Rating: 2/5** — Valuable challenge of unnecessary complexity, but the security implications of the design decisions are not surfaced. The "pick one storage system" recommendation is the most security-relevant insight.

---

### Analysis G (Data Architect — Martin)

**Agreement:** Agree

**Reasoning from security perspective:**

Martin's data architecture is the most security-disciplined analysis in the peer set, even without explicit security framing. Key security-correct decisions:

**System of Record clarity:** Martin explicitly names the SoR for each entity. This is critical for data integrity. When the SoR is ambiguous, attackers (or bugs) can exploit the reconciliation path. Martin's decision — localStorage as SoR, Yandex as replica — eliminates the ambiguity the Skeptic correctly flagged.

**Schema versioning:** `STORAGE_SCHEMA_VERSION` and `migratePlayerData()` function prevent corrupted storage data from causing unexpected behavior. The defensive default (`return { ...DEFAULT_PLAYER_DATA }` on any parse failure) implements fail-closed behavior — my preferred security posture.

**`isMerging` flag atomicity:** Martin explicitly states "set to `true` as the very first line of merge handler, before any async work or body destruction." This is race condition prevention in a security context. Without this, a malicious (or buggy) double-event could cause double scoring. Martin treats this as an invariant, which is the correct classification.

**Auth-gated leaderboard writes:** "Only call `leaderboards.setScore()` after checking `player.isAuthorized()`" — this prevents SDK errors from failing on unauthenticated calls and, more importantly, prevents unauthenticated users from submitting arbitrary scores to the leaderboard.

**Fire-and-forget async writes:** "localStorage first (sync, guaranteed), then async replicas (no await, no blocking)" — this ensures that even if Yandex SDK calls fail or time out, the local highscore is persisted. From a DoS perspective, a slow or failing Yandex SDK cannot prevent the game from completing its game-over flow.

**Missed gaps from security perspective:**

- **Leaderboard deprecation note:** "The deprecated `getLeaderboards()` pattern" — Martin correctly uses the current API. But he doesn't note that the deprecated API, if called, may fail silently. Silent failures in security-relevant code (like leaderboard writes) are always concerning.
- **`player.getData()` return type `Record<string, unknown>`** — Martin wraps this with `migratePlayerData()` for type safety, which is correct. But the function returns `data as PersistedPlayerData` at the end without full validation — a type assertion without runtime validation. An attacker who can inject into Yandex's player storage (highly unlikely — this is Yandex's server) could return a `bestScore: Infinity` that would display incorrectly. Better to validate: `bestScore: typeof data.bestScore === 'number' && isFinite(data.bestScore) && data.bestScore >= 0 ? data.bestScore : 0`.
- **`flush: true` in `player.setData(data, true)`** — Martin recommends this for game over saves. The `flush: true` parameter forces immediate server write. This could have rate limiting implications if the Yandex SDK imposes limits on flush operations. Not documented, but worth testing.
- **`LEADERBOARD_NAME = 'main_score'`** — this name must match exactly what's configured in the Yandex Console. A mismatch causes silent leaderboard write failures. This is a configuration integrity issue, not a security issue, but it has the same operational impact.

**Rating: 4/5** — Best data security posture in the peer set. The System of Record clarity, schema migration, and atomicity of the isMerging flag are exactly the right security-adjacent decisions.

---

### Analysis H (LLM Architect — Erik)

**Agreement:** Partially Agree

**Reasoning from security perspective:**

Erik's LLM-optimized architecture has significant security implications that Erik acknowledges but frames as developer experience concerns.

**Module header protocol as security control:** Erik's mandatory module headers include "Does NOT" sections:

```typescript
/**
 * Does NOT: Create animals, update score, play animations (delegates to caller)
 */
```

This is a security boundary declaration. If a module explicitly states what it does NOT do, it becomes a code review signal when that boundary is violated. If `MergeDetector.ts` starts making direct score updates, the module header declares this a violation. Erik frames this as "prevents scope creep" but it's also an access control boundary — just enforced by convention rather than runtime.

**Event catalog (`GameEvents.ts`)** is a security asset: a complete enumeration of all communication channels in the system. An attacker looking for injection points or a developer auditing for unintended data flows can read one 50-line file to see every event in the system. This is attack surface documentation.

**`IGamePlatform` interface boundary:** Erik's strict boundary — "No Yandex code outside sdk/" — is a supply chain isolation control. If the Yandex SDK were to become compromised or contain malicious code, the blast radius is contained to the `sdk/` directory. This is defense-in-depth that Erik frames as "testability."

**The `HUDScene` parallel scene approach** has a subtle security benefit: the HUD runs in a separate scene context. UI state is isolated from game physics state. An exploit that corrupts game state (e.g., forcing an artificial score through the physics engine) would not directly corrupt the displayed score — the HUD reads from events, not from internal game state directly.

**Missed gaps from security perspective:**

- **EventBus singleton concern:** Erik proposes a singleton `EventBus.ts`. Singletons are implicit global state. In a browser context, any code on the page with access to the module system could subscribe to the EventBus and intercept game events. For a game running in a Yandex iframe (where the game IS the only code on the page), this is not a real threat. But it's worth documenting this as an architectural decision with the reasoning.
- **`StorageService.ts` "localStorage + SDK fallback"** — Erik leaves the priority undefined in his architecture. Martin resolved this (localStorage first, SDK as replica). Erik should reference this decision or risk inconsistent implementations.
- **The `24 files` structure Erik proposes** has a security review implication: more files means more surface area for Claude Code to accidentally violate module boundaries. The LLM-ready architecture is designed for a developer (Claude Code) that pattern-matches on conventions. If conventions are inconsistent across 24 files, the pattern-matching breaks. Erik addresses naming conventions, but consistency enforcement (linting rules, depcruise config) is essential security infrastructure for LLM-generated code.
- **`types/phaser.d.ts` for type augmentations** — modifying global type declarations can create unexpected type coercions. If a future developer augments `Phaser.GameObjects.GameObject` with a property that shadows an existing property, TypeScript will accept invalid code silently. This is low risk but worth noting.
- **`MAX_TIER_TO_SPAWN: 3`** in Erik's GameConfig — this is a game design rule that belongs in config, but it's also a security invariant. If this value is ever changed to allow tier 8 animals to spawn, the game balance is destroyed instantly. Neal's fitness function for config values could verify: `GAME.MAX_TIER_TO_SPAWN <= 5` (standard for the genre).

**Rating: 3/5** — Strong LLM-architecture thinking with implicit security benefits. The module boundaries, event catalog, and interface isolation are all correct. Missing explicit security reasoning leaves the team without a model for why these boundaries matter when they're under pressure to "just make it work."

---

## Ranking

**Best Analysis (Security-Relevant Quality):** Analysis B (Charity — Operations)
**Reason:** Charity surfaces the most critical security insight for this specific project: there is no hotfix path on Yandex Games. This fundamentally changes the threat model — prevention is the only mitigation. The 15-point pre-submit checklist, ad callback timeout pattern, structured error logging, and Sentry integration together form a coherent security-in-depth strategy appropriate to the platform. The analysis also correctly identifies the 3 AM incident as a launch window risk, which is how security practitioners should frame availability threats.

**Second Best:** Analysis G (Martin — Data Architect)
**Reason:** The System of Record clarity, schema versioning with migration, `isMerging` atomicity as an invariant, and auth-gated leaderboard writes are all correct security decisions. Martin produces the most precise data integrity model.

**Third Best:** Analysis A (Eric — Domain Architect)
**Reason:** The ACL pattern, merge guard, and IPlatformBridge isolation all have real security value.

**Worst Analysis (Security Relevance):** Analysis F (Skeptic — Fred Brooks)
**Reason:** The Skeptic correctly identifies the "no ownership" problem but misses the security implications of his own recommendations. The "4 files beats 9 files" argument, if applied to the SDK module, actively weakens the security boundary between mock and production code. Recommending to delete AQ-7 removes the incentive to build reusable security tooling (the pre-flight check script). The Skeptic's analysis is valuable for velocity but, applied carelessly, creates security regressions.

---

## Revised Position

**Revised Verdict:** Refined (not a fundamental change, but peer analyses surfaced additional nuances)

**Refinements from peer critiques:**

**From Charity (B):** The `drop_console: false` gap I identified is important. Adding it to my critical issues list. Also: Charity's pre-submission checklist items 6 (no localhost references) is a gap in my Phase 1 checklist. Adding it.

**From Martin (G):** Martin's `bestScore` validation at read from Yandex SDK is more rigorous than my localStorage validation pattern. Both sources need validation, not just localStorage. Updating recommendation to apply `isFinite()` and range check to ALL score reads, regardless of source.

**From Fred Brooks (F):** The Skeptic is right that "joint ownership = no ownership." My Phase 1 recommendation for a pre-submission security checklist is correct, but it needs to be an automated gate, not a manual checklist. `npm run ship` = `npm run build && npm run check && npm run package`. The check script must be non-bypassable. Operator cannot skip it under deadline pressure.

**From Erik (H):** The event catalog (`GameEvents.ts`) is a security asset I did not explicitly call out in Phase 1. Recommend adding to the architecture documentation that this file serves as the complete communication surface map — useful for future security reviews.

**From Neal (C):** The `Object.freeze()` recommendation for config objects is worth adding. Cost: zero. Benefit: prevents runtime mutation of config constants by compromised code in the same module scope.

---

## Final Security Recommendation (Synthesized)

The Phase 1 analysis holds. This is a client-side game with minimal traditional attack surface. The peer analyses confirm there is no server, no auth, no PII, no payments. The security work remains:

**P0 — Non-Negotiable (block submission):**
1. `npm run check` script is automated and must be part of `npm run ship`. Non-bypassable.
2. Check includes: no secrets in bundle, no external CDN links, SDK URL correct, no localhost refs, no sourcemaps, npm audit clean.
3. Mock must be gated on `import.meta.env.DEV` — verified by bundle analysis before submission.
4. Score submitted at game-over event (automatic), never from a user-triggerable button.

**P1 — Should Fix Before Submission:**
5. `drop_console: true` in production Vite config. Keep `console.error` via Sentry wrapper only.
6. Remove `__VERSION__` from bundle or gate it to dev builds only.
7. Use `npm ci` in build pipeline, not `npm install`.
8. `Object.freeze()` on all `const` config objects for runtime mutation defense.
9. Apply `isFinite()` + range clamping to ALL score reads (localStorage AND Yandex SDK).
10. Ad callback timeout: 10-second `setTimeout` fallback calling `onComplete()` on every ad call.

**P2 — Best Practice:**
11. Sentry DSN treated as a semi-public key (note in codebase that DSN exposure allows error quota flooding but not user data access).
12. GameEvents.ts documented as the complete communication surface map.
13. `MAX_TIER_TO_SPAWN` validated in tests (must be <= 5 for game integrity).
14. `window.parent` / `window.top` usage explicitly prohibited via grep check in pre-flight.

**Accept (deliberate non-mitigations):**
- Score manipulation via localStorage — no prizes, no monetary value, cost of mitigation > benefit
- CSP meta tag — actively harmful, Yandex controls the iframe CSP
- Traditional OWASP Top 10 — not applicable to a client-side game
- Leaderboard gaming by sophisticated users — no server-side game logic validation needed at this scale

**The synthesis from all seven peers confirms:** the most critical security events for this project are platform compliance failures (moderation rejection) and production bugs discovered after submission (no hotfix path). The correct security investment is front-loaded quality assurance — automated pre-flight checks — not reactive security controls.

---

## Security Handoff Notes for Synthesis

The following security decisions are agreed upon across all analyses (implicit or explicit):

| Decision | Evidence of Agreement |
|----------|----------------------|
| No CSP meta tag in index.html | Security (explicit), Ops (implicit via Yandex platform docs) |
| Yandex SDK from correct URL only | Security (explicit), Ops (checklist item) |
| No secrets in bundle | Security (explicit), Ops (checklist item), DX (SDK wrapper design) |
| SDK mock gated on env flag, not manual boolean | Security (explicit), Domain (ACL pattern), DX (if-statement detection) |
| localStorage reads validated with parseInt + clamp | Security (explicit), Data (migratePlayerData), Domain (implicit) |
| Score submitted at event, not button | Security (explicit), Domain (GameCore event design) |
| No external runtime network requests | Security (explicit), Ops (checklist), Evolutionary (fitness function) |
| localStorage as SoR, Yandex as replica | Security (implicit — simpler reconciliation), Data (explicit) |
| `npm audit` before submission | Security (explicit), Ops (pipeline gate) |
| Sourcemaps disabled in production | Security (explicit), Ops (checklist item) |

**One genuine disagreement with peers:**

The Skeptic (F) argues for 4 files, including combining SDK mock and real implementation in one `sdk.ts` file. I disagree from a security standpoint. Separate files for mock and real implementation are required to enable bundle analysis verification that the mock is not included in production. With a single combined file, the mock code is always present in the bundle (even if it's never called) — it is dead code, but it increases bundle size and makes the "no mock in production" audit harder. **Eric, Erik, and Martin's separate-file approach is correct.**
