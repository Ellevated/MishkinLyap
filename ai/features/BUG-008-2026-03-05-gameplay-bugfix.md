# BUG-008: Critical Gameplay Bugfix Batch

**Status:** done
**Priority:** P0 — game is unplayable after 1+ restart
**Created:** 2026-03-05
**Type:** BUG

---

## Summary

Code review + Playwright visual testing выявили 11 багов, из которых 5 критических — ломают базовый игровой цикл. Игра работает только до первого рестарта; isSettled никогда не сбрасывается; Animal.destroy() крашит Phaser; scene shutdown порядок вызывает каскадные ошибки.

**Раунд 1 (code review):** 7 багов (008.1–008.7)
**Раунд 2 (Playwright testing):** 4 бага (008.8–008.11) — обнаружены при автоматизированном тестировании через скриншоты

---

## Bug List

### BUG-008.1: `isSettled` никогда не сбрасывается [CRITICAL]

**File:** `src/objects/Animal.ts:69-76`
**Impact:** Ложные game-over + мёрдж движущихся животных
**Root cause:** `isSettled` устанавливается в `true` при speed < 0.3, но никогда не возвращается в `false`

**Fix:**
```typescript
// Animal.ts — syncPosition()
private syncPosition(): void {
  if (!this.body) return;
  this.setPosition(this.body.position.x, this.body.position.y);

  if (!this.isMerging) {
    const vx = this.body.velocity.x;
    const vy = this.body.velocity.y;
    const speed = Math.sqrt(vx * vx + vy * vy);
    this.isSettled = speed < SETTLED_VELOCITY_THRESHOLD;
  }
}
```

---

### BUG-008.2: `shutdown()` не привязан к Phaser lifecycle [CRITICAL]

**File:** `src/scenes/GameScene.ts:251-258`
**Impact:** Утечка event listeners при restart → двойной скоринг, двойные мёрджи, memory leak
**Root cause:** Метод `shutdown()` определён, но не зарегистрирован как handler на событие 'shutdown'

**Fix:**
```typescript
// GameScene.ts — в create(), после wire events
this.events.once('shutdown', this.shutdown, this);
```

---

### BUG-008.3: Двойное удаление body из Matter.js [HIGH]

**File:** `src/game/AnimalSpawner.ts:51-55` + `src/objects/Animal.ts:79-85`
**Impact:** Потенциальный crash при удалении несуществующего body
**Root cause:** `AnimalSpawner.destroy()` вызывает `physics.removeBody()` И `animal.destroyAnimal()`, оба удаляют body из мира

**Fix:** Убрать удаление body из `Animal.destroyAnimal()`, оставить только в `AnimalSpawner.destroy()`:
```typescript
// Animal.ts
destroyAnimal(): void {
  this.scene?.events.off('update', this.syncPosition, this);
  this.destroy();
}
```

---

### BUG-008.4: `PHYSICS.GRAVITY_Y` не используется [MEDIUM]

**File:** `src/main.ts:56` vs `src/config/GameConfig.ts:46`
**Impact:** Мёртвый код, вводит в заблуждение
**Root cause:** Гравитация задана inline как `GAME.HEIGHT * 0.002` вместо `PHYSICS.GRAVITY_Y`

**Fix:**
```typescript
// main.ts — в physics config
gravity: { x: 0, y: PHYSICS.GRAVITY_Y },
```

---

### BUG-008.5: Нет очистки tweens при restart [MEDIUM]

**File:** `src/scenes/GameScene.ts:126-162`
**Impact:** Callbacks tweens стреляют по уничтоженным объектам при restart во время анимации
**Root cause:** Tweens не отменяются в shutdown

**Fix:**
```typescript
// GameScene.ts — в shutdown()
this.tweens.killAll();
```

---

### BUG-008.6: GameOverScene хрупкая последовательность stop/start [MEDIUM]

**File:** `src/scenes/GameOverScene.ts:56-67`
**Impact:** Непредсказуемое поведение кнопок
**Root cause:** `this.scene.stop()` останавливает текущую сцену, после чего `this.scene.start('Menu')` может не отработать

**Fix:** Переупорядочить вызовы:
```typescript
// "Ещё разок" button
const gameScene = this.scene.get('Game');
this.scene.stop();
gameScene.scene.restart();

// "Меню" button
this.scene.stop('Game');
this.scene.start('Menu');
// GameOverScene остановится автоматически при start Menu, или stop себя последним
```

---

### BUG-008.7: `setPauseResumeCallbacks()` никогда не вызывается [LOW]

**File:** `src/sdk/YandexPlatform.ts:162-165`
**Impact:** Yandex SDK pause/resume события игнорируются (пока нет audio — не критично)
**Root cause:** Метод определён, но GameScene не вызывает его

**Fix:** Вызвать в `GameScene.create()`:
```typescript
if (this.bridge && 'setPauseResumeCallbacks' in this.bridge) {
  (this.bridge as any).setPauseResumeCallbacks(
    () => this.scene.pause(),
    () => { if (this.phase === 'playing') this.scene.resume(); }
  );
}
```

---

### BUG-008.8: `Animal.destroy()` crash при scene shutdown [CRITICAL]

**File:** `src/objects/Animal.ts`
**Impact:** Phaser crash при рестарте/переходе в меню — `this.body.destroy is not a function`
**Root cause:** Phaser вызывает `Container.destroy()` напрямую через `DisplayList.shutdown()`, минуя наш `destroyAnimal()`. Container.destroy() пытается вызвать `body.destroy()` на raw Matter.js body, у которого нет этого метода.
**Found by:** Playwright debug test — T08 restart не работал

**Fix:** Переопределить `destroy()` на Animal:
```typescript
destroy(fromScene?: boolean): void {
  this.scene?.events?.off('update', this.syncPosition, this);
  (this as any).body = null;
  super.destroy(fromScene);
}
```

---

### BUG-008.9: MatterPlugin shutdown раньше нашего handler [CRITICAL]

**File:** `src/game/MergeDetector.ts:119-121`, `src/game/PhysicsManager.ts:60-63`
**Impact:** `Cannot read properties of null (reading 'off')` — crash при scene stop
**Root cause:** Phaser shutdown event вызывает listeners в порядке регистрации. MatterPlugin зарегистрирован при boot (до create), наш handler — в create. Поэтому MatterPlugin.shutdown() (world = null) выполняется ДО нашего GameScene.shutdown().
**Found by:** Playwright debug test — crash в MergeDetector.destroy() после фикса 008.8

**Fix:** Null-safe optional chaining во всех destroy():
```typescript
// MergeDetector
this.scene?.matter?.world?.off('collisionstart', this.onCollision, this);
// PhysicsManager
this.scene?.matter?.world?.remove(body);
// InputHandler
this.scene?.input?.off('pointerdown', this.onPointerDown, this);
// AnimalSpawner
if (animal.body) this.physics.removeBody(animal.body);
```

---

### BUG-008.10: GameScene input не отключается при game-over [HIGH]

**File:** `src/scenes/GameScene.ts:220-232`
**Impact:** GameScene перехватывает клики поверх GameOverScene — кнопки game-over не работают
**Root cause:** `scene.pause()` не отключает input — только update loop. GameScene interactive objects продолжают получать pointer events.
**Found by:** Playwright test T08 — clicks on "Ещё разок" never reached GameOverScene

**Fix:**
```typescript
// GameScene.triggerGameOver()
this.input.enabled = false;  // добавить перед launch
this.scene.launch('GameOver', { ... });
this.scene.pause();
```

---

### BUG-008.11: GameOverScene restart через `scene.restart()` ненадёжен [HIGH]

**File:** `src/scenes/GameOverScene.ts:58-71`
**Impact:** `gameScene.scene.restart()` на paused scene не гарантирует чистый рестарт
**Root cause:** `restart()` = internal `stop()` + `start()`, но на paused scene порядок может быть нарушен. Также после `this.scene.stop()` (остановка GameOverScene) контекст вызова нестабилен.
**Found by:** Playwright debug test — scene status check

**Fix:** Явный stop/start:
```typescript
// "Ещё разок"
this.scene.stop();          // stop GameOverScene
this.scene.stop('Game');    // stop paused GameScene
this.scene.start('Game');   // start Game fresh

// "Меню"
this.scene.stop();          // stop GameOverScene
this.scene.stop('Game');    // stop GameScene
this.scene.start('Menu');   // start Menu
```

---

## Acceptance Criteria

- [x] Животные корректно переключаются settled/unsettled при изменении скорости
- [x] Restart игры не добавляет duplicate event listeners
- [x] Двойное удаление body не происходит
- [x] `PHYSICS.GRAVITY_Y` используется как единственный источник гравитации
- [x] Tweens очищаются при shutdown
- [x] Кнопки GameOverScene корректно переключают сцены
- [x] Игра корректно работает после 3+ рестартов подряд
- [x] `Animal.destroy()` не крашит при scene shutdown
- [x] Все destroy() методы null-safe (matter world может быть null)
- [x] GameScene input отключается при game-over
- [x] "Ещё разок" корректно рестартит игру (Playwright T08)
- [x] "Меню" возвращает на главный экран (Playwright T09)

---

## Test Plan

### Manual
1. Запустить игру, сыграть до game-over
2. Нажать "Ещё разок" 3 раза подряд
3. Убедиться что счёт сбрасывается, мёрджи работают корректно
4. Проверить что game-over не срабатывает ложно при столкновении животных
5. Проверить что кнопка "Меню" возвращает на главный экран
6. Открыть DevTools Console — убедиться нет ошибок Matter.js

### Automated (Playwright)
**Suite:** `tests/gameplay-visual.spec.ts` (10 тестов)
**4 прогона — 40/40 passed**

| Test | Что проверяет |
|------|---------------|
| T01 | Drop near left wall |
| T02 | Drop near right wall |
| T03 | Alternating sides — spread drops |
| T04 | Dense center stack — merge chain |
| T05 | Wide spread — all positions |
| T06 | Fill container to near game-over |
| T07 | Rapid drops — stress test cooldown |
| T08 | Game over → Restart → Play again |
| T09 | Game over → Menu → New game |
| T10 | Two corners strategy — L and R stacks |

**Debug suite:** `tests/debug-gameover-btn.spec.ts` — scene status + button click verification
