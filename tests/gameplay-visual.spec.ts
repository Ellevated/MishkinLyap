import { test } from '@playwright/test';

const BASE = 'http://localhost:3002?debug=0';
const V = { width: 480, height: 854 };
const GAME_W = 560, GAME_H = 854;

/** Convert game coordinates to page/screen coordinates (Scale.FIT + CENTER_BOTH) */
function g2s(gx: number, gy: number): { x: number; y: number } {
  const scale = Math.min(V.width / GAME_W, V.height / GAME_H);
  const offsetX = (V.width - GAME_W * scale) / 2;
  const offsetY = (V.height - GAME_H * scale) / 2;
  return { x: Math.round(offsetX + gx * scale), y: Math.round(offsetY + gy * scale) };
}

async function startGame(page: any) {
  await page.setViewportSize(V);
  await page.goto(BASE);
  await page.waitForTimeout(2500);
  // Streak popup "Играть!" at game ~(280,384); regular btn at ~(280,410)
  // y=395 hits both if popup present or not
  const btn = g2s(280, 395);
  await page.mouse.click(btn.x, btn.y);
  await page.waitForTimeout(1500);
}

async function dropAnimal(page: any, gameX: number, waitMs = 700) {
  const pos = g2s(gameX, 120);
  await page.mouse.click(pos.x, pos.y);
  await page.waitForTimeout(waitMs);
}

test.describe('Gameplay Visual Tests', () => {

  test('T01: Drop near left wall', async ({ page }) => {
    await startGame(page);
    for (let i = 0; i < 6; i++) await dropAnimal(page, 50);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/t01-left-wall.png' });
  });

  test('T02: Drop near right wall', async ({ page }) => {
    await startGame(page);
    for (let i = 0; i < 6; i++) await dropAnimal(page, 430);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/t02-right-wall.png' });
  });

  test('T03: Alternating sides — spread drops', async ({ page }) => {
    await startGame(page);
    for (let i = 0; i < 12; i++) {
      const x = i % 2 === 0 ? 80 : 400;
      await dropAnimal(page, x);
    }
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/t03-alternating.png' });
  });

  test('T04: Dense center stack — merge chain', async ({ page }) => {
    test.setTimeout(90_000);
    await startGame(page);
    for (let i = 0; i < 30; i++) await dropAnimal(page, 240, 600);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/t04-center-stack.png' });
  });

  test('T05: Wide spread — all positions', async ({ page }) => {
    await startGame(page);
    const positions = [50, 120, 190, 260, 330, 400, 85, 155, 225, 295, 365];
    for (const x of positions) await dropAnimal(page, x);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/t05-wide-spread.png' });
  });

  test('T06: Fill container to near game-over', async ({ page }) => {
    test.setTimeout(120_000);
    await startGame(page);
    for (let i = 0; i < 45; i++) {
      const x = 60 + (i % 6) * 70;
      await dropAnimal(page, x, 600);
    }
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/t06-nearly-full.png' });
  });

  test('T07: Rapid drops — stress test cooldown', async ({ page }) => {
    test.setTimeout(60_000);
    await startGame(page);
    for (let i = 0; i < 20; i++) {
      const pos = g2s(100 + (i % 3) * 130, 120);
      await page.mouse.click(pos.x, pos.y);
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/t07-rapid-drops.png' });
  });

  test('T08: Game over → Restart → Play again', async ({ page }) => {
    test.setTimeout(120_000);
    await startGame(page);
    // Play normally to build score, then force game over via JS
    for (let i = 0; i < 20; i++) await dropAnimal(page, 60 + (i % 6) * 70);
    await page.waitForTimeout(2000);
    await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      g.scene.getScene('Game').triggerGameOver();
    });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/t08a-gameover.png' });

    // GameOver panel: isNewRecord=true, canContinue=true on first game
    // Button layout: Продолжить(~496) → Ещё разок(~556) → Меню(~616)
    const restartBtn = g2s(280, 556);
    await page.mouse.click(restartBtn.x, restartBtn.y);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/t08b-restarted.png' });

    for (let i = 0; i < 5; i++) await dropAnimal(page, 100 + i * 70);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/t08c-playing-again.png' });
  });

  test('T09: Game over → Menu → New game', async ({ page }) => {
    test.setTimeout(120_000);
    await startGame(page);
    // Play normally, then force game over
    for (let i = 0; i < 20; i++) await dropAnimal(page, 60 + (i % 6) * 70);
    await page.waitForTimeout(2000);
    await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      g.scene.getScene('Game').triggerGameOver();
    });
    await page.waitForTimeout(1500);

    // Click "Меню" button in game-over panel
    const menuBtn = g2s(280, 616);
    await page.mouse.click(menuBtn.x, menuBtn.y);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/t09a-back-to-menu.png' });

    // Start new game from menu
    const playBtn = g2s(280, 410);
    await page.mouse.click(playBtn.x, playBtn.y);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/t09b-new-game.png' });
  });

  test('T10: Two corners strategy — L and R stacks', async ({ page }) => {
    test.setTimeout(90_000);
    await startGame(page);
    for (let i = 0; i < 20; i++) {
      const x = i % 2 === 0 ? 60 : 420;
      await dropAnimal(page, x, 650);
    }
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/t10-two-corners.png' });
  });
});
