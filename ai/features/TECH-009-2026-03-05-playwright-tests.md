# TECH-009: Playwright Visual Test Suite

**Status:** done
**Priority:** P1
**Created:** 2026-03-05
**Type:** TECH

---

## Summary

Установлен Playwright для автоматизированного визуального тестирования canvas-игры. 10 тестов покрывают основные сценарии геймплея, включая дропы, мёрджи, game-over, рестарт и переход в меню.

---

## What Was Done

### Setup
- `@playwright/test` + Chromium browser installed
- `playwright.config.ts` configured (baseURL: localhost:3002, 1 worker, 120s timeout)
- `screenshots/` directory for test output
- `?debug=0` URL param support to disable Matter.js debug overlay
- `window.__PHASER_GAME__` exposed for Phaser state inspection in tests

### Test Files

| File | Tests | Purpose |
|------|-------|---------|
| `tests/gameplay-visual.spec.ts` | 10 | Main gameplay scenarios |
| `tests/debug-gameover-btn.spec.ts` | 1 | Scene state + button click debugging |
| `tests/visual-check.spec.ts` | 6 | Basic visual checks (menu, empty, drops, merges, game-over) |
| `tests/debug-merge.spec.ts` | 1 | Merge event verification via console logs |

### Test Coverage (gameplay-visual.spec.ts)

| ID | Test | What it validates |
|----|------|-------------------|
| T01 | Drop near left wall | Animals stack against left boundary |
| T02 | Drop near right wall | Animals stack against right boundary |
| T03 | Alternating sides | Spread distribution, physics interaction |
| T04 | Dense center stack | Merge chains, score accumulation |
| T05 | Wide spread | All drop positions work |
| T06 | Fill container | Near game-over state, physics stability |
| T07 | Rapid drops | Cooldown enforcement under stress |
| T08 | Game over → Restart | "Ещё разок" button works, score resets |
| T09 | Game over → Menu | "Меню" button returns to main screen |
| T10 | Two corners strategy | L/R stacking, cross-side physics |

### Test Results

4 runs × 10 tests = **40/40 passed** (4.0min per run)

---

## Run Commands

```bash
# Start dev server first
npm run dev -- --port 3002

# Run all gameplay tests
npx playwright test tests/gameplay-visual.spec.ts

# Run debug test for game-over buttons
npx playwright test tests/debug-gameover-btn.spec.ts

# View screenshots
ls screenshots/
```

---

## Key Patterns

### Helper functions
```typescript
async function startGame(page) {
  await page.setViewportSize({ width: 480, height: 854 });
  await page.goto('http://localhost:3002?debug=0');
  await page.waitForTimeout(2000);
  await page.mouse.click(240, 470);  // "Играть" button
  await page.waitForTimeout(1200);
}

async function dropAnimal(page, x, waitMs = 700) {
  await page.mouse.click(x, 214);  // Drop zone
  await page.waitForTimeout(waitMs);
}
```

### Canvas-relative clicks (for overlays)
```typescript
const canvas = page.locator('canvas');
await canvas.click({ position: { x: 240, y: 419 } });
```

### Scene state inspection
```typescript
const scenes = await page.evaluate(() => {
  const game = window.__PHASER_GAME__;
  return game.scene.scenes.map(s => ({
    key: s.sys.settings.key,
    active: s.sys.settings.active,
    status: s.sys.settings.status,
  }));
});
```
