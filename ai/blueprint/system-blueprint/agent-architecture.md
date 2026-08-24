# Agent Architecture — Zverata

**Date:** 2026-03-04
**Architecture:** B — Modular Standard
**Source:** ai/architect/architectures.md

---

## LLM Development Context

This game is built and maintained BY Claude Code (LLM agent). The architecture is optimized for AI-assisted development.

---

## 1. Agent Task Isolation

### Why 16 Files (not 9)

| Metric | 9 files (Alt A) | 16 files (Alt B) |
|--------|----------------|-----------------|
| Max file LOC | 300 (GameScene) | 150 (GameScene/PhysicsManager) |
| Context per task | 2-3K tokens | 1-1.5K tokens |
| Risk of accidental change | High (300 LOC = many concerns) | Low (each file = one concern) |
| Task description clarity | "Edit GameScene merge logic" (where?) | "Edit MergeDetector" (entire file) |

**Rule:** Each `/spark` task should map to exactly 1-2 files. If a task touches 3+ files, it's too broad — decompose.

---

## 2. File → Task Mapping

| File | Typical Task Type | Context Budget |
|------|-------------------|----------------|
| `GameConfig.ts` | Tune physics, add animal, change score formula | ~1K tokens |
| `GameEvents.ts` | Add new event type | ~0.5K tokens |
| `PhysicsManager.ts` | Wall adjustments, gravity tuning, body management | ~1.5K tokens |
| `MergeDetector.ts` | Fix merge bugs, adjust guards, chain detection | ~1.5K tokens |
| `ScoreManager.ts` | Score formula changes, persistence bugs | ~1K tokens |
| `InputHandler.ts` | Touch handling, drop position calculation | ~1K tokens |
| `AnimalSpawner.ts` | Spawn logic, preview display, animations | ~1.5K tokens |
| `Animal.ts` | Physics body properties, visual components | ~1.5K tokens |
| `GameScene.ts` | Orchestration wiring, state machine | ~1.5K tokens |
| `MenuScene.ts` | UI layout, buttons, highscore display | ~1.5K tokens |
| `GameOverScene.ts` | End screen, rewarded ad flow | ~1.5K tokens |
| `PreloadScene.ts` | Asset loading, progress bar | ~1K tokens |
| `YandexPlatform.ts` | SDK integration fixes, new SDK features | ~1.5K tokens |
| `MockPlatform.ts` | Dev mock behavior adjustments | ~1K tokens |
| `IGamePlatform.ts` | Contract changes (rare, cascading) | ~0.5K tokens |
| `main.ts` | Boot sequence, Phaser config | ~0.5K tokens |

---

## 3. Module Headers for Agent Readability

Every file > 80 LOC has a module header that tells the agent:

```typescript
/**
 * Module: {FileName}
 * Role: {one sentence — what this file does}
 * Uses: {what it imports}
 * Used by: {what imports it}
 * Emits: {events, if any}
 * Does NOT: {explicit exclusions}
 */
```

The `Does NOT` section is critical for agents. It prevents scope creep during implementation.

---

## 4. Published Language for Agent Tasks

When writing `/spark` specs or `/autopilot` tasks, use these terms:

| Term | Meaning | File(s) |
|------|---------|---------|
| "drop" | User action: release animal at x position | InputHandler, AnimalSpawner |
| "merge" | Two same-tier animals touch → create next tier | MergeDetector |
| "chain merge" | Merge result immediately collides with another same-tier | MergeDetector (automatic via physics) |
| "overflow" / "game over" | Animal body crosses game-over line | GameScene (checks in update loop) |
| "settled" | Animal body has low velocity (ready to merge) | Animal.isSettled flag |
| "bridge" | IPlatformBridge instance passed through scenes | All scenes |
| "watchdog" | 10s timeout on SDK calls | showAdWithTimeout utility |
| "preflight" | Pre-submit fitness function checks | scripts/preflight.mjs |

---

## 5. Context Loading Strategy

### For `/spark` (feature spec)

Agent reads:
1. This file (`agent-architecture.md`) — for file mapping
2. `domain-map.md` — for module boundaries
3. Target file(s) — for current implementation
4. `api-contracts.md` — for interface contracts

### For `/autopilot` (implementation)

Agent reads:
1. The `/spark` spec — for requirements
2. Target file(s) — for modification
3. `GameConfig.ts` + `GameEvents.ts` — for constants
4. `cross-cutting.md` — for patterns to follow

### For `/review`

Agent reads:
1. Changed file(s)
2. `cross-cutting.md` — for rule compliance
3. `domain-map.md` — for import direction validation
4. This file — for agent-specific rules

---

## 6. Structured Output Patterns

### Animal Config (compile-time, agent-editable)

```typescript
// When agent adds a new animal tier, follow this exact structure:
export const ANIMALS: readonly AnimalConfig[] = [
  { tier: N, name: 'name', radius: R, score: S, key: 'asset_key' },
  // ...
] as const;

// Score formula: tier * (tier + 1)
// Radius: increases ~25% per tier
```

### Event Registration (agent-safe pattern)

```typescript
// When agent adds new event:
// 1. Add constant to GameEvents.ts
export const EVENTS = {
  // ... existing events
  NEW_EVENT: 'new-event',
} as const;

// 2. Emit in source module
this.events.emit(EVENTS.NEW_EVENT, payload);

// 3. Listen in GameScene (orchestrator)
this.events.on(EVENTS.NEW_EVENT, this.onNewEvent, this);
```

---

## 7. Testing Strategy

### What to Test (Priority Order)

1. **Merge 5-guard pattern** — unit test each guard independently
2. **Score calculation** — unit test `tier * (tier + 1)` for all 8 tiers
3. **localStorage persistence** — unit test load/save/migrate/corrupt scenarios
4. **State machine transitions** — unit test all valid/invalid transitions
5. **Ad watchdog timeout** — unit test 10s timeout triggers correctly

### What NOT to Test

- Phaser rendering (visual tests are brittle and slow)
- Matter.js physics simulation (trust the engine)
- Yandex SDK calls (mock covers contract compliance)

### Test File Mapping

| Source | Test File | Focus |
|--------|-----------|-------|
| `MergeDetector.ts` | `__tests__/MergeDetector.test.ts` | 5-guard pattern, edge cases |
| `ScoreManager.ts` | `__tests__/ScoreManager.test.ts` | Score math, persistence |
| `GameConfig.ts` | `__tests__/GameConfig.test.ts` | Score formula, radius ordering |
| `main.ts` (state machine) | `__tests__/StateMachine.test.ts` | Transitions |

---

## 8. Risks Specific to Agent Development

| Risk | Mitigation |
|------|-----------|
| Agent adds code to wrong file | Module headers with "Does NOT" section |
| Agent duplicates logic across files | `depcruise` + preflight checks |
| Agent uses string literals for events | `GameEvents.ts` + preflight grep |
| Agent puts animal names in game logic | Preflight grep for animal names outside config/ |
| Agent breaks import direction | `depcruise` validation in `npm run check` |
| Agent exceeds 400 LOC in a file | Preflight LOC check |

---

## 9. Development Workflow

```
1. npm run dev          → Vite dev server + MockPlatform
2. Edit code            → HMR hot reload
3. npm run build        → TypeScript check + Vite build
4. npm run check        → Preflight fitness functions
5. npm run package      → ZIP for Yandex submission
6. npm run ship         → All 3 above in sequence
```

**Agent command:** Always run `npm run ship` after completing a task to verify all checks pass.
