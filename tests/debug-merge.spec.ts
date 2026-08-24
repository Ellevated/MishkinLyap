import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3002?debug=0';
const VIEWPORT = { width: 480, height: 854 };

test('Debug: verify merges and score', async ({ page }) => {
  test.setTimeout(60_000);
  const logs: string[] = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[MERGE]') || text.includes('[SCORE]') || text.includes('[SDK Mock]')) {
      logs.push(text);
    }
  });

  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.setViewportSize(VIEWPORT);
  await page.goto(BASE);
  await page.waitForTimeout(2000);

  // Click "Играть"
  await page.mouse.click(VIEWPORT.width / 2, VIEWPORT.height * 0.55);
  await page.waitForTimeout(1500);

  // Drop 20 animals at same X=240, with 800ms between (well above 500ms cooldown)
  for (let i = 0; i < 20; i++) {
    await page.mouse.click(240, VIEWPORT.height * 0.3);
    await page.waitForTimeout(800);
  }

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/debug-merge.png', fullPage: true });

  console.log('=== BROWSER CONSOLE LOGS ===');
  for (const log of logs) {
    console.log(log);
  }
  console.log(`=== ERRORS (${errors.length}) ===`);
  for (const err of errors) {
    console.log(err);
  }
  console.log(`Total merge logs: ${logs.filter(l => l.includes('[MERGE]')).length}`);
  console.log(`Total score logs: ${logs.filter(l => l.includes('[SCORE]')).length}`);
});
