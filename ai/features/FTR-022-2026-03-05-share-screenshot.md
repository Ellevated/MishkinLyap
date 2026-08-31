# Feature: [FTR-022] Share Screenshot
**Status:** queued | **Priority:** P1 | **Date:** 2026-03-05

## Why
Share Screenshot (Score 2.35): кнопка "Поделиться" — красивая картинка + ссылка. Web-игра = instant play по ссылке = нет барьера скачивания. Виральный канал без затрат. Yellow Panda Games: share screenshot = 15-20% органического трафика для casual web-игр.

## Context
Depends on FTR-005 (GameOverScene). Currently: game over screen shows score and buttons, no share option.

**Verified API research:**
- Yandex Games SDK: **НЕТ** нативного Share API
- Phaser 3: `this.renderer.snapshot(callback)` — captures canvas as HTMLImageElement (data URL). Works with WebGL.
- Web Share API: `navigator.share({ files: [file] })` — works on mobile browsers. NOT available on desktop browsers (Firefox desktop, some Chrome desktop). NOT available inside Yandex Games iframe.
- Fallback: download image via `<a download>` link — works everywhere

**Key limitation:** Inside Yandex Games iframe, `navigator.share()` may be blocked by CSP/iframe restrictions. Must test in real environment. Download fallback always works.

## Research Reference
- M5: Share Screenshot (Score 2.35)

---

## Scope
**In scope:** Screenshot capture on game over, share via Web Share API (with download fallback), branded result card (score, animal count, game name), share button on GameOverScene
**Out of scope:** Social platform-specific sharing (VK, Telegram), custom share text templates, share during gameplay, share from menu

---

## Allowed Files
**New files allowed:**
1. `src/game/ShareManager.ts` — screenshot capture + share/download logic (~60 LOC)

**Modify:**
2. `src/scenes/GameOverScene.ts` — add "Поделиться" button, trigger share flow (+15 lines)

**FORBIDDEN:** GameScene.ts, Animal.ts, MergeDetector.ts, SDK files, config files.

---

## Design

### ShareManager (~60 LOC)

```typescript
/**
 * Module: ShareManager
 * Role: Captures game screenshot, shares via Web Share API or downloads as fallback
 * Uses: Phaser.Renderer.snapshot, navigator.share (Web API)
 * Used by: GameOverScene (share button)
 * Does NOT: Modify game state, manage score, call Yandex SDK
 */
```

**Public API:**
- `captureAndShare(scene: Phaser.Scene, data: ShareData): Promise<void>`

**ShareData:**
```typescript
interface ShareData {
  score: number;
  best: number;
  highestTier: number;  // from session stats
}
```

**Implementation:**

```typescript
async captureAndShare(scene: Phaser.Scene, data: ShareData): Promise<void> {
  // 1. Capture screenshot
  const image = await this.captureScreenshot(scene);

  // 2. Draw branded result card
  const cardDataUrl = this.drawResultCard(image, data);

  // 3. Try Web Share API, fall back to download
  const blob = await (await fetch(cardDataUrl)).blob();
  const file = new File([blob], 'mishkin-lyap-result.png', { type: 'image/png' });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title: 'Мишкин Ляп — мой результат!',
        text: `Мой счёт: ${data.score}! Сможешь лучше?`,
        files: [file],
      });
      return;
    } catch {
      // User cancelled or error — fall through to download
    }
  }

  // Fallback: download
  this.downloadImage(cardDataUrl, 'mishkin-lyap-result.png');
}
```

**Screenshot capture:**
```typescript
private captureScreenshot(scene: Phaser.Scene): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    scene.renderer.snapshot((image: HTMLImageElement) => {
      resolve(image);
    });
  });
}
```

**Result card composition (using offscreen Canvas):**
```typescript
private drawResultCard(screenshot: HTMLImageElement, data: ShareData): string {
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 640;
  const ctx = canvas.getContext('2d')!;

  // Background: cream
  ctx.fillStyle = '#F5EDD8';
  ctx.fillRect(0, 0, 480, 640);

  // Game screenshot (scaled to fit, centered)
  const scale = Math.min(440 / screenshot.width, 400 / screenshot.height);
  const sw = screenshot.width * scale;
  const sh = screenshot.height * scale;
  ctx.drawImage(screenshot, (480 - sw) / 2, 20, sw, sh);

  // Score overlay at bottom
  ctx.fillStyle = 'rgba(61, 43, 31, 0.85)';
  ctx.fillRect(0, 440, 480, 200);

  // Title
  ctx.fillStyle = '#F5EDD8';
  ctx.font = 'bold 28px Marmelad, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Мишкин Ляп', 240, 480);

  // Score
  ctx.font = 'bold 36px Nunito, sans-serif';
  ctx.fillStyle = '#D4A24C';
  ctx.fillText(`Счёт: ${data.score}`, 240, 530);

  // Best
  ctx.font = '20px Nunito, sans-serif';
  ctx.fillStyle = '#EDE0C4';
  ctx.fillText(`Рекорд: ${data.best}`, 240, 565);

  // CTA
  ctx.font = '16px Nunito, sans-serif';
  ctx.fillText('Сможешь лучше? Играй на Яндекс Играх!', 240, 610);

  return canvas.toDataURL('image/png');
}
```

**Download fallback:**
```typescript
private downloadImage(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

### GameOverScene Integration

Add "Поделиться" button to GameOverScene. Current layout:

```
Panel: Y = panelY (height * 0.35)
  "Ой, ляп!": panelY - 20
  Score: panelY + 30
  Best: panelY + 65
  "Ещё разок": panelY + 120
  "Меню": panelY + 185
```

Add share button below menu:
```
  "Поделиться": panelY + 240 (small, secondary style)
```

Panel height needs to increase: 340 → 400 to accommodate.

```typescript
// Share button
const shareBtnY = panelY + 240;
this.createButton(width / 2, shareBtnY, 'Поделиться 📸', 0xede0c4, async () => {
  const shareManager = new ShareManager();
  await shareManager.captureAndShare(this, {
    score: data.score,
    best: data.best,
    highestTier: data.highestTier || 1,
  });
});
```

**Note:** The screenshot captures the GameOverScene overlay on top of the paused GameScene — this is actually the IDEAL screenshot (shows final game state + score).

### Error Handling

- `navigator.share` not available → download fallback (no error shown)
- `navigator.canShare` not available → try share anyway, catch → download
- Canvas `toDataURL` fails → log error, show "Не удалось создать картинку" toast
- User cancels share dialog → no error (AbortError is expected)

---

## Implementation Plan

### Task 1: Create ShareManager with screenshot + branded card
**Type:** code
**Files:**
  - create: `src/game/ShareManager.ts` — capture, compose branded card, share/download
**Acceptance:** ShareManager captures screenshot, draws branded result card with score, shares via Web Share or downloads

### Task 2: Wire share button to GameOverScene
**Type:** code
**Files:**
  - modify: `src/scenes/GameOverScene.ts` — add "Поделиться" button, enlarge panel, wire to ShareManager (+15 lines)
**Acceptance:** "Поделиться" button on game over triggers share flow, branded card includes correct score

### Execution Order
1 → 2

---

## Tests

### What to test
- [ ] "Поделиться" button visible on game over screen
- [ ] Clicking triggers screenshot capture (no visible flash/delay)
- [ ] Result card includes: game screenshot, title "Мишкин Ляп", score, best, CTA text
- [ ] On mobile: Web Share dialog opens with image
- [ ] On desktop / fallback: image downloads as PNG
- [ ] Score on card matches actual game score
- [ ] Card looks good at 480×640 resolution
- [ ] No errors if share is cancelled by user

### How to test
- Manual: Play until game over, tap "Поделиться" → check downloaded/shared image
- Manual: Test on mobile browser → Web Share dialog should open
- Manual: Test in Yandex Games iframe → fallback to download expected
- Manual: Verify branded card visuals (screenshot + overlay + text)

---

## Definition of Done

### Functional
- [ ] Screenshot captured at game over
- [ ] Branded result card generated (480×640, cream bg, score overlay)
- [ ] Web Share API used when available
- [ ] Download fallback works on all platforms
- [ ] Score and best displayed correctly on card

### Technical
- [ ] `npm run build` succeeds
- [ ] ShareManager.ts ≤ 80 LOC
- [ ] GameOverScene.ts ≤ 150 LOC after changes
- [ ] No console errors
- [ ] No memory leaks from canvas/image creation
