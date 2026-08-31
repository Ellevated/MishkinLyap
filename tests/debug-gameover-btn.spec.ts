import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3002?debug=0';
const V = { width: 480, height: 854 };

test('Debug: GameOver button click', async ({ page }) => {
  test.setTimeout(180_000);

  // Collect console logs
  const logs: string[] = [];
  page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));

  await page.setViewportSize(V);
  await page.goto(BASE);
  await page.waitForTimeout(2000);

  // Start game
  await page.mouse.click(V.width / 2, V.height * 0.55);
  await page.waitForTimeout(1200);

  // Check canvas bounds
  const canvasBounds = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
  console.log('Canvas bounds:', JSON.stringify(canvasBounds));

  // Fill quickly to trigger game over
  for (let i = 0; i < 55; i++) {
    await page.mouse.click(240, V.height * 0.25);
    await page.waitForTimeout(550);
  }
  await page.waitForTimeout(6000);
  await page.screenshot({ path: 'screenshots/debug-gameover-1.png' });

  // Check game state via Phaser
  const sceneStatus = await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    if (!game) return 'no __PHASER_GAME__';
    const scenes = game.scene.scenes.map((s: any) => ({
      key: s.sys.settings.key,
      active: s.sys.settings.active,
      visible: s.sys.settings.visible,
      status: s.sys.settings.status,
    }));
    return scenes;
  });
  console.log('Scene status before click:', JSON.stringify(sceneStatus));

  // Try clicking "Ещё разок" button — center of button
  const btnX = V.width / 2;  // 240
  const btnY = V.height * 0.35 + 120; // ~419
  console.log(`Clicking button at (${btnX}, ${btnY})`);

  // Click directly on canvas element to account for any offset
  const canvas = page.locator('canvas');
  await canvas.click({ position: { x: btnX, y: btnY } });
  await page.waitForTimeout(2000);

  // Check scene status after click
  const sceneStatusAfter = await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    if (!game) return 'no __PHASER_GAME__';
    const scenes = game.scene.scenes.map((s: any) => ({
      key: s.sys.settings.key,
      active: s.sys.settings.active,
      visible: s.sys.settings.visible,
      status: s.sys.settings.status,
    }));
    return scenes;
  });
  console.log('Scene status after click:', JSON.stringify(sceneStatusAfter));

  await page.screenshot({ path: 'screenshots/debug-gameover-2.png' });

  // Try also via page.evaluate to force restart
  const forceRestart = await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    if (!game) return 'no game';
    try {
      const gameOverScene = game.scene.getScene('GameOver');
      if (gameOverScene && gameOverScene.sys.settings.active) {
        game.scene.stop('GameOver');
        game.scene.stop('Game');
        game.scene.start('Game');
        return 'force restarted';
      }
      return 'GameOver not active';
    } catch (e: any) {
      return `error: ${e.message}`;
    }
  });
  console.log('Force restart result:', forceRestart);

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/debug-gameover-3.png' });

  // Print relevant logs
  const relevantLogs = logs.filter(l =>
    l.includes('Game') || l.includes('shutdown') || l.includes('error') || l.includes('Error')
  );
  console.log('Relevant logs:', relevantLogs.join('\n'));
});
