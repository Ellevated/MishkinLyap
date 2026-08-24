# Feature: [FTR-001] Project Scaffold + Config
**Status:** done | **Priority:** P0 | **Date:** 2026-03-04

## Why
Foundation for the entire game. Nothing can be built without project structure, dependencies, TypeScript config, Vite bundler, and game constants. This is Day 1, Task 1.

## Context
Greenfield project. No existing code. Architecture B (Modular Standard) chosen by founder.
Reference: sgbj/suika-clone (Phaser + Matter.js + TypeScript + Vite).

---

## Scope
**In scope:** Project init (npm, Vite, TS), folder structure, GameConfig.ts, GameEvents.ts, index.html, vite.config.ts, tsconfig.json, global `__DEV__` declaration
**Out of scope:** SDK files (FTR-002), game objects (FTR-003), scenes (FTR-005), assets (FTR-006)

---

## Blueprint Reference

**Domain:** config/
**Cross-cutting:** Module headers (>80 LOC), no animal names outside config/
**Data model:** AnimalConfig, PHYSICS, GAME, ADS constants, EVENTS catalog, PersistedData types

---

## Allowed Files
**ONLY these files may be modified during implementation:**

**New files allowed:**
1. `package.json` — dependencies and scripts
2. `tsconfig.json` — TypeScript compiler config
3. `vite.config.ts` — Vite bundler config
4. `index.html` — Entry HTML with SDK script tag
5. `src/config/GameConfig.ts` — ALL game constants and types
6. `src/config/GameEvents.ts` — ALL event name constants
7. `src/global.d.ts` — `__DEV__` global type declaration

**FORBIDDEN:** All other files.

---

## Environment

nodejs: true
docker: false
database: false

---

## Design

### package.json dependencies

```json
{
  "dependencies": {
    "phaser": "3.90.0"
  },
  "devDependencies": {
    "typescript": "~5.7.0",
    "vite": "^5.4.0",
    "terser": "^5.0.0"
  }
}
```

### package.json scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "check": "echo 'preflight not yet implemented'",
    "package": "echo 'package not yet implemented'",
    "ship": "npm run build && npm run check && npm run package"
  }
}
```

### Folder structure to create

```
src/
  config/
  scenes/
  game/
  objects/
  sdk/
```

### GameConfig.ts — complete implementation

```typescript
export interface AnimalConfig {
  readonly tier: number;
  readonly name: string;
  readonly radius: number;
  readonly score: number;
  readonly key: string;
}

export const ANIMALS: readonly AnimalConfig[] = [
  { tier: 1, name: 'hamster', radius: 28, score: 2,  key: 'hamster'  },
  { tier: 2, name: 'rabbit',  radius: 38, score: 6,  key: 'rabbit'   },
  { tier: 3, name: 'kitten',  radius: 50, score: 12, key: 'kitten'   },
  { tier: 4, name: 'cat',     radius: 63, score: 20, key: 'cat'      },
  { tier: 5, name: 'dog',     radius: 78, score: 30, key: 'dog'      },
  { tier: 6, name: 'fox',     radius: 95, score: 42, key: 'fox'      },
  { tier: 7, name: 'panda',   radius: 114,score: 56, key: 'panda'    },
  { tier: 8, name: 'bear',    radius: 135,score: 72, key: 'bear'     },
] as const;

export const PHYSICS = {
  GRAVITY_Y: 1.5,
  RESTITUTION: 0.3,
  FRICTION: 0.5,
  FRICTION_AIR: 0.01,
} as const;

export const GAME = {
  WIDTH: 480,
  HEIGHT: 854,
  SPAWN_MAX_TIER: 5,
  DROP_COOLDOWN_MS: 500,
  GAME_OVER_LINE_Y: 120,
  CONTAINER_WALL_THICKNESS: 20,
  CONTAINER_TOP_Y: 100,
} as const;

export const ADS = {
  MIN_SESSION_BEFORE_INTERSTITIAL_MS: 60_000,
  INTERSTITIAL_COOLDOWN_MS: 180_000,
  AD_TIMEOUT_MS: 10_000,
} as const;

export const STORAGE_KEY = 'zverata_v1';
export const STORAGE_VERSION = 1;

export interface PersistedData {
  v: number;
  best: number;
  sound: boolean;
}

export const DEFAULT_DATA: PersistedData = { v: 1, best: 0, sound: true };
```

### GameEvents.ts — complete implementation

```typescript
export const EVENTS = {
  ANIMAL_MERGED: 'animal-merged',
  ANIMAL_DROPPED: 'animal-dropped',
  DROP_REQUESTED: 'drop-requested',
  SCORE_UPDATED: 'score-updated',
  GAME_OVER: 'game-over',
  SCENE_GAME_OVER: 'scene-game-over',
  SCENE_RESTART: 'scene-restart',
  SCENE_MENU: 'scene-menu',
  AD_STARTED: 'ad-started',
  AD_ENDED: 'ad-ended',
} as const;
```

### vite.config.ts — from blueprint

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    target: 'es2020',
    minify: 'terser',
    terserOptions: { compress: { drop_console: false, drop_debugger: true } },
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]',
      },
    },
  },
  server: { port: 3000, host: true },
  define: { __DEV__: 'import.meta.env.DEV' },
});
```

### index.html — with SDK script tag

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Зверята: Слияние</title>
  <style>
    * { margin: 0; padding: 0; }
    body { background: #1a1a2e; overflow: hidden; }
    #game { width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <div id="game"></div>
  <script src="https://yandex.ru/games/sdk/v2"></script>
  <script type="module" src="./src/main.ts"></script>
</body>
</html>
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "outDir": "./dist",
    "baseUrl": ".",
    "paths": {
      "@config/*": ["src/config/*"],
      "@game/*": ["src/game/*"],
      "@scenes/*": ["src/scenes/*"],
      "@objects/*": ["src/objects/*"],
      "@sdk/*": ["src/sdk/*"]
    }
  },
  "include": ["src/**/*.ts", "src/global.d.ts"]
}
```

### src/global.d.ts

```typescript
declare const __DEV__: boolean;
```

---

## Implementation Plan

### Task 1: Initialize npm project
**Type:** code
**Files:**
  - create: `package.json`
**Acceptance:** `npm install` succeeds, phaser 3.90.0 installed

### Task 2: Create TypeScript + Vite config
**Type:** code
**Files:**
  - create: `tsconfig.json`
  - create: `vite.config.ts`
  - create: `src/global.d.ts`
**Acceptance:** `npx tsc --noEmit` passes (with empty src)

### Task 3: Create index.html
**Type:** code
**Files:**
  - create: `index.html`
**Acceptance:** SDK script tag present, relative module src path

### Task 4: Create folder structure
**Type:** code
**Files:**
  - create: `src/config/`, `src/scenes/`, `src/game/`, `src/objects/`, `src/sdk/`
**Acceptance:** All directories exist

### Task 5: Create GameConfig.ts + GameEvents.ts
**Type:** code
**Files:**
  - create: `src/config/GameConfig.ts`
  - create: `src/config/GameEvents.ts`
**Acceptance:** `npx tsc --noEmit` passes, all types exported

### Execution Order
1 → 2 → 3 → 4 → 5

---

## Tests

### What to test
- [ ] ANIMALS array has exactly 8 tiers, ordered 1-8
- [ ] Score formula matches `tier * (tier + 1)` for all tiers
- [ ] ANIMALS radii are monotonically increasing
- [ ] EVENTS object has no duplicate values
- [ ] SPAWN_MAX_TIER <= ANIMALS.length

### How to test
- Unit: Vitest tests for GameConfig constants validation
- No integration/E2E needed for config

### TDD Order
1. Write GameConfig.test.ts → FAIL → Implement GameConfig.ts → PASS

---

## Definition of Done

### Functional
- [ ] `npm install` succeeds
- [ ] `npm run dev` starts Vite dev server on port 3000
- [ ] `npm run build` produces dist/ with single JS bundle
- [ ] All folder structure exists
- [ ] GameConfig.ts and GameEvents.ts compile without errors

### Tests
- [ ] Config validation tests pass

### Technical
- [ ] `npx tsc --noEmit` passes
- [ ] No absolute paths in index.html

---

## Autopilot Log
