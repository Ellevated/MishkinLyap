# Feature: [FTR-034] Menu Title + In-Game UX
**Status:** queued | **Priority:** P1 | **Date:** 2026-03-05

## Why
Menu screen shows plain text "Мишкин Ляп" without visual identity — no mascot, no brand presence. During gameplay there is no way to exit to menu (only available after game over). The game-over line is at y=120 but checks animal center position, so large animals visually overflow far above the line before triggering — feels unfair.

## Context
- Target audience: women 55+ (Yandex Games)
- Mascot asset already generated: `brandbook/assets/ml_mascot_nobg.png` (512x512 PNG, transparent bg)
- MenuScene: 203 LOC, GameScene: 398 LOC (near 400 limit — extract exit dialog to PauseScene)
- Current values: `GAME_OVER_LINE_Y: 120`, `CONTAINER_TOP_Y: 100`, spawn at `GAME_OVER_LINE_Y + 30`

---

## Scope
**In scope:**
- Add mascot image above title text in MenuScene
- Add exit/back button in GameScene (top-left)
- Create PauseScene overlay with confirm dialog
- Lower game-over line and container top by 40px

**Out of scope:**
- Side decorations / frame (deferred to container geometry idea)
- Menu redesign / layout changes beyond mascot
- Game-over check logic change (keep center-based, just move line down)

---

## Allowed Files
**ONLY these files may be modified during implementation:**
1. `src/scenes/PreloadScene.ts` — load mascot asset
2. `src/scenes/MenuScene.ts` — display mascot image above title
3. `src/scenes/GameScene.ts` — add exit button (top-left), launch PauseScene
4. `src/config/GameConfig.ts` — adjust GAME_OVER_LINE_Y and CONTAINER_TOP_Y
5. `src/main.ts` — register PauseScene in scene list

**New files allowed:**
- `public/assets/ui/mascot.png` — copy from brandbook
- `src/scenes/PauseScene.ts` — confirm exit overlay (~60 LOC)

**FORBIDDEN:** All other files. Autopilot must refuse changes outside this list.

---

## Environment
nodejs: true
docker: false
database: false

---

## Design

### User Flow
1. **Menu:** Player sees mascot image (bear waving) above "Мишкин Ляп" title text
2. **Start game:** Player taps "Играть" — enters GameScene
3. **During game:** Player sees "←" button at top-left corner
4. **Tap exit:** PauseScene overlay appears with dark semi-transparent background
5. **Confirm dialog:** "Выйти в меню?" with two buttons: "Да" (exits) / "Нет" (resumes)
6. **Exit:** Game stops, returns to Menu
7. **Resume:** PauseScene closes, GameScene continues
8. **Game-over:** Red line is now at y=160 (40px lower), giving more breathing room

### Architecture
```
PreloadScene → loads 'mascot' texture
MenuScene → shows Image('mascot') at (w/2, h*0.13), displaySize ~120x120
            title text moves down to h*0.28

GameScene → exit button Text('←') at (30, 30), depth 10
          → on tap: pause game, launch PauseScene overlay
          → on resume: unpause

PauseScene → overlay scene (like GameOverScene)
           → dark bg + panel + "Выйти в меню?" + Да/Нет buttons
           → Да: stop Game + stop PauseScene, start Menu
           → Нет: stop PauseScene, resume Game

GameConfig → GAME_OVER_LINE_Y: 120 → 160
           → CONTAINER_TOP_Y: 100 → 140
```

---

## UI Event Completeness

| Producer | callback_data | Consumer | Handler File |
|----------|---------------|----------|--------------|
| Exit button (GameScene) | pointerup | `launchPause()` | GameScene.ts ✓ |
| "Да" button (PauseScene) | pointerup | `exitToMenu()` | PauseScene.ts ✓ |
| "Нет" button (PauseScene) | pointerup | `resumeGame()` | PauseScene.ts ✓ |
| Dark overlay (PauseScene) | pointerup | blocks input | PauseScene.ts ✓ |

---

## Implementation Plan

### Task 1: Add mascot asset + preload
**Type:** code
**Files:**
  - create: `public/assets/ui/mascot.png` (copy from brandbook)
  - modify: `src/scenes/PreloadScene.ts` (add `this.load.image('mascot', 'assets/ui/mascot.png')`)
**Acceptance:** mascot texture available in Phaser cache after preload

### Task 2: Display mascot in MenuScene
**Type:** code
**Files:**
  - modify: `src/scenes/MenuScene.ts`
**Details:**
  - Add `this.add.image(w / 2, h * 0.13, 'mascot').setDisplaySize(120, 120)` before title
  - Move title text from `h * 0.18` to `h * 0.28` to make room
  - Adjust subsequent y positions if needed (season banner, best score, buttons)
**Acceptance:** Mascot bear visible above title text in menu

### Task 3: Create PauseScene + exit button in GameScene
**Type:** code
**Files:**
  - create: `src/scenes/PauseScene.ts`
  - modify: `src/scenes/GameScene.ts` (add exit button + handler, ~8 lines)
  - modify: `src/main.ts` (register PauseScene)
**Details:**
  PauseScene overlay pattern (same as GameOverScene):
  - `this.scene.bringToTop()`
  - Dark overlay rectangle (0x3d2b1f, 0.5)
  - Panel: "Выйти в меню?" + "Да" / "Нет" buttons
  - "Да" → `this.scene.stop(); this.scene.stop('Game'); this.scene.start('Menu')`
  - "Нет" → `this.scene.stop(); this.scene.resume('Game')`

  GameScene additions:
  - Exit button: `this.add.text(30, 30, '←', { fontSize: '32px', ... }).setInteractive()`
  - Handler: `this.scene.pause(); this.scene.launch('Pause')`
  - On shutdown: stop PauseScene if running
**Acceptance:** Tapping ← pauses game, shows confirm, "Да" exits to menu, "Нет" resumes

### Task 4: Lower game-over line
**Type:** code
**Files:**
  - modify: `src/config/GameConfig.ts`
**Details:**
  - `GAME_OVER_LINE_Y: 120` → `160`
  - `CONTAINER_TOP_Y: 100` → `140`
**Acceptance:** Red line visible at y=160, more headroom for animals, spawn point at y=190

### Execution Order
1 → 2 → 3 → 4

---

## Flow Coverage Matrix

| # | User Flow Step | Covered by Task | Status |
|---|----------------|-----------------|--------|
| 1 | Mascot visible in menu | Task 1, 2 | ✓ |
| 2 | Title text below mascot | Task 2 | ✓ |
| 3 | Start game | - | existing |
| 4 | Exit button visible in game | Task 3 | ✓ |
| 5 | Tap exit → confirm dialog | Task 3 | ✓ |
| 6 | Confirm "Да" → menu | Task 3 | ✓ |
| 7 | Confirm "Нет" → resume | Task 3 | ✓ |
| 8 | Game-over line lowered | Task 4 | ✓ |
| 9 | Animals spawn below new line | Task 4 | ✓ (auto: spawn = line + 30) |

---

## Tests

### What to test
- [ ] Mascot image renders in menu without errors
- [ ] Exit button visible during gameplay
- [ ] Tap exit → PauseScene overlay appears, game pauses
- [ ] "Нет" resumes gameplay
- [ ] "Да" returns to menu
- [ ] Game-over line visually at new position (y=160)
- [ ] Animals still spawn correctly below the new line

### How to test
- E2E: Playwright visual test — menu shows mascot, game has exit button
- Manual: Play through full flow — menu → game → exit → confirm → menu

### TDD Order
1. Adjust config constants (Task 4) → verify game still runs
2. Add asset + preload (Task 1) → verify no load errors
3. Add mascot to menu (Task 2) → verify visually
4. Add PauseScene (Task 3) → verify exit flow

---

## Definition of Done

### Functional
- [ ] Mascot bear image visible in menu above title
- [ ] Exit button (←) in top-left of GameScene
- [ ] PauseScene confirm dialog works (Да → menu, Нет → resume)
- [ ] Game-over line at y=160, container top at y=140
- [ ] All tasks from Implementation Plan completed

### Tests
- [ ] `./test fast` passes (tsc + existing tests)
- [ ] No regressions in existing Playwright tests

### E2E User Journey
- [ ] Menu → see mascot → start game → tap ← → confirm → menu
- [ ] Menu → start game → tap ← → cancel → resume play
- [ ] Game fills up → game over triggers at new lower line

### Technical
- [ ] All files under 400 LOC
- [ ] PauseScene follows GameOverScene pattern
- [ ] No TODO/FIXME in changed files

---

## Autopilot Log
[Auto-populated by autopilot during execution]
