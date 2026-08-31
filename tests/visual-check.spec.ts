import { test } from '@playwright/test';

const BASE = 'http://localhost:3002?debug=0';
const VIEWPORT = { width: 480, height: 854 };

test.describe('Мишкин Ляп — Visual Check', () => {

  test('1. Menu screen', async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
    await page.goto(BASE);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/01-menu.png', fullPage: true });
  });

  test('2. Game start — empty field', async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
    await page.goto(BASE);
    await page.waitForTimeout(1500);
    await page.mouse.click(VIEWPORT.width / 2, VIEWPORT.height * 0.55);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/02-game-empty.png', fullPage: true });
  });

  test('3. Game with dropped animals', async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
    await page.goto(BASE);
    await page.waitForTimeout(1500);
    await page.mouse.click(VIEWPORT.width / 2, VIEWPORT.height * 0.55);
    await page.waitForTimeout(1000);

    const dropPositions = [100, 200, 300, 150, 250, 350, 120, 280];
    for (const x of dropPositions) {
      await page.mouse.click(x, VIEWPORT.height * 0.4);
      await page.waitForTimeout(700);
    }
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/03-game-animals.png', fullPage: true });
  });

  test('4. Game with merges', async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
    await page.goto(BASE);
    await page.waitForTimeout(1500);
    await page.mouse.click(VIEWPORT.width / 2, VIEWPORT.height * 0.55);
    await page.waitForTimeout(1000);

    for (let i = 0; i < 15; i++) {
      const x = 100 + (i % 4) * 80;
      await page.mouse.click(x, VIEWPORT.height * 0.4);
      await page.waitForTimeout(600);
    }
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/04-game-merges.png', fullPage: true });
  });

  test('5. Game over screen', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize(VIEWPORT);
    await page.goto(BASE);
    await page.waitForTimeout(1500);
    await page.mouse.click(VIEWPORT.width / 2, VIEWPORT.height * 0.55);
    await page.waitForTimeout(800);

    // Spam drops — all at same X to stack vertically and trigger game-over faster
    for (let i = 0; i < 50; i++) {
      await page.mouse.click(240, VIEWPORT.height * 0.3);
      await page.waitForTimeout(550);
    }
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'screenshots/05-game-over.png', fullPage: true });
  });

  test('6. After restart — fresh game', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize(VIEWPORT);
    await page.goto(BASE);
    await page.waitForTimeout(1500);
    await page.mouse.click(VIEWPORT.width / 2, VIEWPORT.height * 0.55);
    await page.waitForTimeout(800);

    for (let i = 0; i < 50; i++) {
      await page.mouse.click(240, VIEWPORT.height * 0.3);
      await page.waitForTimeout(550);
    }
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'screenshots/06a-game-over.png', fullPage: true });

    // Click "Ещё разок" — panel at ~height*0.35, button at +120 offset
    const playAgainY = VIEWPORT.height * 0.35 + 120;
    await page.mouse.click(VIEWPORT.width / 2, playAgainY);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/06b-after-restart.png', fullPage: true });
  });
});
