# Integration Map — Zverata

**Date:** 2026-03-04
**Architecture:** B — Modular Standard
**Source:** ai/architect/architectures.md

---

## External Integrations

Only ONE external integration: Yandex Games SDK.

| Integration | Type | Direction | Protocol | Failure Mode |
|-------------|------|-----------|----------|--------------|
| Yandex Games SDK v2 | External script | Bidirectional | JS callbacks + Promises | Silent fallback |
| localStorage | Browser API | Read/Write | Sync | Reset to defaults |

---

## Data Flow: Full Game Session

```
[Browser loads index.html]
     ↓
[SDK script tag loads from yandex.ru/games/sdk/v2]
     ↓
[main.ts] → createBridge() → typeof YaGames?
     ↓                              ↓
[YandexPlatform]              [MockPlatform]
     ↓                              ↓
[bridge.init()] → YaGames.init() / console.warn
     ↓
[new Phaser.Game(config)] → PreloadScene
     ↓
[PreloadScene] → load assets → MenuScene
     ↓
[MenuScene] → bridge.loadHighScore() → display best score
     ↓ (play button)
[GameScene.create({ bridge })]
     ↓
[bridge.gameplayStart()] → Yandex GameplayAPI.start()
[bridge.showBanner()] → sticky banner in score area
     ↓
[Game Loop: input → spawn → physics → collision → merge → score]
     ↓ (game over)
[bridge.gameplayStop()] → Yandex GameplayAPI.stop()
[ScoreManager.checkAndSaveBest()] → localStorage write
     ↓ (if new best)
[bridge.saveHighScore(score)] → Yandex player.setData + leaderboard
     ↓
[GameOverScene overlay]
     ↓ (rewarded ad button)
[showAdWithTimeout(bridge, 'rewarded')] → 10s watchdog
     ↓ (success: continue game / fail: still show play-again)
[Play Again] → GameScene.restart()
     ↓ (or interstitial)
[showAdWithTimeout(bridge, 'interstitial')] → 10s watchdog
     ↓
[MenuScene]
```

---

## Module Integration Matrix

| From → To | Method | Data | Async? |
|-----------|--------|------|--------|
| main.ts → PreloadScene | Phaser scene start | `{ bridge }` | No |
| PreloadScene → MenuScene | `this.scene.start('Menu', { bridge })` | `{ bridge }` | No |
| MenuScene → GameScene | `this.scene.start('Game', { bridge })` | `{ bridge }` | No |
| GameScene → GameOverScene | `this.scene.launch('GameOver', data)` | `{ score, best, bridge }` | No |
| GameScene → PhysicsManager | Constructor injection | `scene` reference | No |
| GameScene → MergeDetector | Constructor injection | `scene` reference | No |
| GameScene → ScoreManager | Constructor injection | `scene` reference | No |
| GameScene → InputHandler | Constructor injection | `scene` reference | No |
| GameScene → AnimalSpawner | Constructor injection | `scene` reference | No |
| InputHandler → GameScene | Phaser event | `EVENTS.DROP_REQUESTED { x }` | No |
| MergeDetector → GameScene | Phaser event | `EVENTS.ANIMAL_MERGED { MergeResult }` | No |
| ScoreManager → GameScene | Phaser event | `EVENTS.SCORE_UPDATED { score, best }` | No |
| GameScene → IPlatformBridge | Method call | Various | Yes (Promises) |
| ScoreManager → localStorage | Direct API | JSON blob | No (sync) |
| YandexPlatform → Yandex SDK | Callback-based | Ad events, player data | Yes |

---

## Yandex SDK Integration Points

### Init Sequence (BLOCKING)

```
1. SDK script loads (index.html <script>)
2. main.ts: createBridge()
3. bridge.init()
   ├── YaGames.init() → ysdk
   ├── ysdk.getPlayer({ scopes: false }) → player
   └── ysdk.environment.i18n.lang → locale (optional)
4. new Phaser.Game(config)  ← ONLY AFTER init() resolves
```

### Runtime SDK Calls

| When | SDK Method | Guard |
|------|-----------|-------|
| GameScene.create | `gameplayStart()` | Once per game session |
| Game over | `gameplayStop()` | Once per game session |
| MenuScene enter | `showBanner()` | No guard needed |
| Interstitial trigger | `showFullscreenAdv()` | 60s session + 180s cooldown + watchdog |
| Rewarded button click | `showRewardedVideo()` | Player-initiated + watchdog |
| New highscore | `player.setData()` | try/catch, fire-and-forget |
| New highscore | `leaderboards.setScore()` | try/catch, non-lite player only |
| Menu load | `player.getData()` | try/catch, fallback to localStorage |

### SDK Event Subscriptions

```typescript
// YandexPlatform.init() — register these ONCE

ysdk.on('game_api_pause', () => {
  // Platform requests pause (e.g., game minimized, ad overlay)
  // Emit AD_STARTED to freeze game
});

ysdk.on('game_api_resume', () => {
  // Platform requests resume
  // Emit AD_ENDED to unfreeze game
});
```

---

## Audio Integration

```
[Before any ad]
     ↓
this.sound.pauseAll()    ← Yandex SDK Pitfall #3
     ↓
[Ad plays / fails / times out]
     ↓
this.sound.resumeAll()
```

**Rule:** Audio must be paused before `showInterstitial()` and `showRewarded()`. Resume on ad completion (regardless of outcome).

---

## Error Propagation

| Source | Error | Propagation | Recovery |
|--------|-------|-------------|----------|
| Yandex SDK init | Network failure | `bridge.init()` rejects | Game won't boot — show error screen |
| Ad call | Timeout (10s) | Watchdog resolves `{ shown: false }` | Game continues, ad skipped |
| Ad call | SDK error | `onError` callback resolves `{ shown: false }` | Game continues |
| localStorage read | Corrupted JSON | `try/catch` returns `DEFAULT_DATA` | Reset to defaults, game continues |
| localStorage write | Quota exceeded | `try/catch` silent | Score not persisted, game continues |
| Yandex saveHighScore | Network failure | `try/catch` silent | localStorage has the data, Yandex doesn't |
| Physics collision | Unexpected body | Guard checks return false | Merge skipped, game continues |

**Principle:** The game NEVER crashes. Every error path degrades gracefully.
