# Feature: [FTR-014] Rewarded Ads & Continue
**Status:** queued | **Priority:** P0 | **Date:** 2026-03-05

## Why
Rewarded Video Ads (Score 3.00): добровольная 15-30с реклама за бонус даёт retention +20% vs forced interstitials. Yandex SDK поддерживает нативно. Loss Aversion Retry (Score 2.75): "Продолжить за рекламу?" при game over — высочайшая конверсия rewarded ads, потому что момент максимальной loss aversion (Kahneman & Tversky). Чем ближе был к рекорду, тем сильнее мотивация.

## Context
Depends on FTR-005 (GameOverScene), FTR-002 (SDK bridge). `showRewarded()` already implemented in IPlatformBridge/YandexPlatform. Currently: GameOverScene has "Ещё разок" (restart) and "Меню" buttons. No way to continue the current game after game over. Need to add continue mechanic + interstitial ads at natural breakpoints.

## Research Reference
- M1: Rewarded Video Ads (Score 3.00)
- M2: Loss Aversion Retry (Score 2.75)

---

## Scope
**In scope:** "Continue for ad" button on game over (1 per game), interstitial ad on game restart (with cooldown), ad state tracking
**Out of scope:** Ad caching, multiple ad networks, rewarded ads for streak shield, ad-free purchase

---

## Allowed Files
**Modify:**
1. `src/scenes/GameOverScene.ts` — add "Продолжить" button with rewarded ad, show interstitial on restart
2. `src/scenes/GameScene.ts` — add continue support (resume from game-over state), track continuesUsed
3. `src/config/GameConfig.ts` — add ADS.MAX_CONTINUES constant

**FORBIDDEN:** MergeDetector.ts, Animal.ts, PhysicsManager.ts, ScoreManager.ts internals.

---

## Design

### Config Addition
```typescript
export const ADS = {
  MIN_SESSION_BEFORE_INTERSTITIAL_MS: 60_000,
  INTERSTITIAL_COOLDOWN_MS: 180_000,
  AD_TIMEOUT_MS: 10_000,
  MAX_CONTINUES_PER_GAME: 1,   // limit continues per game
} as const;
```

### Continue Flow

```
Game Over triggered:
  GameScene.triggerGameOver() → launches GameOverScene with data

GameOverScene shows:
  ┌─────────────────────────┐
  │     Ой, ляп!            │
  │   Счёт: 1,234           │
  │   Рекорд: 5,678         │
  │                         │
  │ [ ▶ Продолжить (📺) ]   │  ← rewarded ad, shown only if continuesUsed < MAX
  │                         │
  │    [ Ещё разок ]        │  ← restart (show interstitial if cooldown passed)
  │    [ Меню ]             │
  └─────────────────────────┘

On "Продолжить" click:
  1. Call bridge.showRewarded()
  2. If rewarded === true:
     a. Stop GameOverScene
     b. Resume GameScene (unpause)
     c. GameScene.continueAfterAd():
        - Remove all animals above game-over line
        - Reset gameOverTimer
        - Set phase = 'playing'
        - Re-enable input + merge detection
        - Increment continuesUsed
  3. If rewarded === false:
     a. Show small "Реклама недоступна" text, fade out after 2s
     b. Keep buttons active

On "Ещё разок" click:
  1. Check if interstitial cooldown passed (ADS.INTERSTITIAL_COOLDOWN_MS)
  2. If yes: show interstitial, then restart
  3. If no: restart immediately
```

### GameScene Continue Support

Add to GameScene:
```typescript
private continuesUsed = 0;  // reset on create()

/** Resume game after rewarded ad continue */
continueAfterAd(): void {
  // Remove animals above danger line
  const animals = this.spawner.getAnimals();
  const toRemove = animals.filter(a =>
    a.body.position.y < GAME.GAME_OVER_LINE_Y + 50
  );
  toRemove.forEach(a => this.spawner.destroy(a));

  // Reset state
  this.phase = 'playing';
  this.gameOverTimer = 0;
  this.continuesUsed++;
  this.input.enabled = true;
  this.merge.enable();
  this.inputHandler.enable();
}
```

### Interstitial on Restart

Track last interstitial time:
```typescript
// In GameOverScene
private async tryShowInterstitial(): Promise<void> {
  const lastAd = this.registry.get('lastInterstitialTime') as number || 0;
  const now = Date.now();
  if (now - lastAd > ADS.INTERSTITIAL_COOLDOWN_MS) {
    const bridge = this.registry.get('bridge') as IPlatformBridge;
    await bridge.showInterstitial();
    this.registry.set('lastInterstitialTime', now);
  }
}
```

### GameOverScene Data Extension

```typescript
// Pass continue state to GameOverScene
this.scene.launch('GameOver', {
  score: this.score.getScore(),
  best: this.score.getBestScore(),
  canContinue: this.continuesUsed < ADS.MAX_CONTINUES_PER_GAME,
});
```

---

## Implementation Plan

### Task 1: Add continue support to GameScene
**Type:** code
**Files:**
  - modify: `src/scenes/GameScene.ts` — add continuesUsed counter, continueAfterAd() method, pass canContinue to GameOverScene
  - modify: `src/config/GameConfig.ts` — add MAX_CONTINUES_PER_GAME to ADS
**Acceptance:** GameScene can resume after game-over, removing top animals, re-enabling input

### Task 2: Wire rewarded ad + interstitial to GameOverScene
**Type:** code
**Files:**
  - modify: `src/scenes/GameOverScene.ts` — add "Продолжить" button with rewarded ad flow, interstitial on restart, error handling
**Acceptance:** "Продолжить" button shows rewarded ad and resumes game, interstitial shows on restart with cooldown

### Execution Order
1 → 2

---

## Tests

### What to test
- [ ] "Продолжить" button visible only when canContinue = true
- [ ] After rewarded ad: game resumes, animals above line removed
- [ ] "Продолжить" button hidden after 1 continue (MAX_CONTINUES_PER_GAME=1)
- [ ] If rewarded ad fails: "Реклама недоступна" message, buttons stay active
- [ ] Interstitial shows on restart after cooldown period
- [ ] Interstitial skipped if cooldown hasn't passed
- [ ] MockPlatform: both buttons work in dev mode (mock resolves true)

### How to test
- Manual: Play until game over, click continue, verify game resumes
- Manual: Use MockPlatform (dev mode) to test full flow with simulated delays

---

## Definition of Done

### Functional
- [ ] "Продолжить" button shows rewarded ad on game over
- [ ] After ad: game resumes with top animals cleared
- [ ] Continue limited to 1 per game
- [ ] Interstitial ad on restart with cooldown
- [ ] Graceful handling of ad failure

### Technical
- [ ] `npm run build` succeeds
- [ ] GameOverScene.ts ≤ 150 LOC
- [ ] No console errors
