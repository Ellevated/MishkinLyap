# Domain Map — Zverata

**Date:** 2026-03-04
**Architecture:** B — Modular Standard
**Source:** ai/architect/architectures.md

---

## Modules (not DDD bounded contexts — this is a client-side game)

| Module | Path | Responsibility | Key Types | LOC Budget |
|--------|------|---------------|-----------|------------|
| config | `src/config/` | All tunable constants, event names | `AnimalConfig`, `PHYSICS`, `GAME`, `ADS`, `EVENTS` | ~120 |
| game | `src/game/` | Game rules: merge, score, physics, input | `MergeResult`, `GamePhase`, `PhysicsManager`, `MergeDetector`, `ScoreManager`, `InputHandler`, `AnimalSpawner` | ~530 |
| scenes | `src/scenes/` | What player sees: screens, UI, effects | `PreloadScene`, `MenuScene`, `GameScene`, `GameOverScene` | ~430 |
| objects | `src/objects/` | Game entities with physics bodies | `Animal` | ~100 |
| sdk | `src/sdk/` | Platform handshake: ads, storage, signals | `IPlatformBridge`, `YandexPlatform`, `MockPlatform` | ~270 |

---

## File Structure

```
src/
  main.ts                    (~50 LOC)   SDK init -> Phaser boot
  config/
    GameConfig.ts            (~80 LOC)   ALL constants (physics, animals, layout, ads)
    GameEvents.ts            (~40 LOC)   ALL event name constants
  scenes/
    PreloadScene.ts          (~80 LOC)   Asset loading
    MenuScene.ts             (~100 LOC)  Title + highscore + play button
    GameScene.ts             (~150 LOC)  Pure orchestrator: create managers, wire events
    GameOverScene.ts         (~100 LOC)  Score + rewarded ad + play again (overlay)
  game/
    PhysicsManager.ts        (~150 LOC)  Matter.js setup, walls, body management
    MergeDetector.ts         (~120 LOC)  Collision -> merge event (5-guard pattern)
    ScoreManager.ts          (~80 LOC)   Score + highscore + localStorage persistence
    InputHandler.ts          (~80 LOC)   Mouse/touch -> drop position calculation
    AnimalSpawner.ts         (~100 LOC)  Create/destroy Animal, next-drop preview
  objects/
    Animal.ts                (~100 LOC)  Phaser Container + Matter body + tier data
  sdk/
    IGamePlatform.ts         (~50 LOC)   Interface + result types
    YandexPlatform.ts        (~150 LOC)  Real SDK wrapper (7 pitfalls handled)
    MockPlatform.ts          (~70 LOC)   Dev mock (1.5s delays)
```

**Total: 16 source files, ~1,400 LOC.**

---

## Module Boundaries (Ubiquitous Language)

| Module | Language | "Does NOT" |
|--------|----------|-----------|
| `config/` | "config is read-only data, never logic" | Does NOT import from any other module |
| `game/` | "drop, merge, chain, overflow, settled" | Does NOT import from `scenes/`, does NOT call SDK directly |
| `scenes/` | "scene, overlay, transition" | Does NOT contain game logic, does NOT call SDK directly (only via bridge) |
| `objects/` | "tier, radius, body" | Does NOT import from `scenes/`, does NOT manage own lifecycle |
| `sdk/` | "interstitial, rewarded, mock, bridge" | Does NOT import from `game/` or `scenes/` |

---

## Import Direction

```
config/ ← game/ ← scenes/
config/ ← objects/ ← game/
config/ ← sdk/
         objects/ ← scenes/ (via GameScene orchestrator)
         sdk/ ← scenes/ (via IPlatformBridge in GameScene)
```

**Enforced by** `dependency-cruiser` (.depcruise.json):

```json
{
  "forbidden": [
    { "name": "config-no-import-scenes", "from": {"path":"src/config"}, "to": {"path":"src/scenes"} },
    { "name": "game-no-import-scenes",   "from": {"path":"src/game"},   "to": {"path":"src/scenes"} },
    { "name": "sdk-no-import-game",      "from": {"path":"src/sdk"},    "to": {"path":"src/game"} },
    { "name": "objects-no-import-scenes", "from": {"path":"src/objects"},"to": {"path":"src/scenes"} }
  ]
}
```

---

## Context Relationships

```
[config/GameConfig.ts] --(read-only import)--> ALL modules
[config/GameEvents.ts] --(read-only import)--> ALL modules

[game/*] --(emits via scene.events)--> [scenes/GameScene.ts]
[scenes/GameScene.ts] --(creates)--> [game/* managers]
[scenes/GameScene.ts] --(calls)--> [sdk/IPlatformBridge]

[game/AnimalSpawner.ts] --(creates)--> [objects/Animal.ts instances]
[game/MergeDetector.ts] --(reads collision data from)--> [objects/Animal.ts]
[game/ScoreManager.ts] --(reads tier data from)--> [config/GameConfig.ts]

[sdk/*] --(ad outcomes via Promise)--> [scenes/GameScene.ts]
```

---

## GameScene as Pure Orchestrator

```typescript
/**
 * Module: GameScene
 * Role: Creates game managers, wires events, handles scene transitions
 * Uses: PhysicsManager, MergeDetector, AnimalSpawner, ScoreManager, InputHandler, GameConfig
 * Used by: MenuScene (scene.start), main.ts (scene list)
 * Emits: EVENTS.GAME_OVER (via game.events for cross-scene)
 * Does NOT: Detect merges, calculate score, call SDK directly, contain physics constants
 */
export class GameScene extends Phaser.Scene {
  private physics!: PhysicsManager;
  private merge!: MergeDetector;
  private spawner!: AnimalSpawner;
  private score!: ScoreManager;
  private input!: InputHandler;
  private bridge!: IPlatformBridge;

  create(data: { bridge: IPlatformBridge }): void {
    this.bridge = data.bridge;
    this.physics = new PhysicsManager(this);
    this.merge = new MergeDetector(this);
    this.spawner = new AnimalSpawner(this);
    this.score = new ScoreManager(this);
    this.input = new InputHandler(this);

    this.bridge.gameplayStart();

    // Wire events
    this.events.on(EVENTS.ANIMAL_MERGED, this.onMerge, this);
    this.events.on(EVENTS.GAME_OVER, this.onGameOver, this);
  }
}
```

---

## Module Responsibility Matrix

| Concern | Owner File | NOT in |
|---------|-----------|--------|
| Physics constants (gravity, friction) | GameConfig.ts | PhysicsManager.ts |
| Animal tier data (radius, score) | GameConfig.ts | Animal.ts |
| Wall creation & body management | PhysicsManager.ts | GameScene.ts |
| Collision → merge event | MergeDetector.ts | GameScene.ts |
| Score calculation & persistence | ScoreManager.ts | GameScene.ts |
| Mouse/touch → drop position | InputHandler.ts | GameScene.ts |
| Animal creation & destruction | AnimalSpawner.ts | GameScene.ts |
| Next-drop preview | AnimalSpawner.ts | InputHandler.ts |
| Ad timing & cooldown | GameScene.ts (state machine) | sdk/* |
| SDK init, ad calls, storage | YandexPlatform.ts / MockPlatform.ts | GameScene.ts |
| Event name constants | GameEvents.ts | Scattered strings |
