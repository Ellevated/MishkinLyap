# BUG-033: UI Polish Batch — Game Over, Menu, Game Scene

**Status:** done
**Priority:** P0
**Created:** 2026-03-05
**Source:** Visual QA review (screenshots)

---

## Problem

Множество UI-багов и визуальных проблем обнаружены при ручном тестировании:

### Game Over Screen
1. **"Почти рекорд! Не хватило 0 очков"** — абсурдное сообщение когда score = best
2. **Английские имена зверей** — "Лучший: bear" вместо "медведь"
3. **Дублирование** — "Лучший: bear" И "Лучший момент: bear!" одновременно
4. **Неверное эмодзи** — "📺" (TV) на кнопке "Продолжить", должен быть ▶️ или 🎬

### Menu Screen
5. **Наложение текстов** — сезонный баннер, рекорд и бонус наезжают друг на друга
6. **Нет группировки кнопок** — 9 кнопок в одном потоке без визуального разделения
7. **Streak "1" без контекста** — число без иконки, непонятно что это
8. **Кнопки не влезают** — на малых экранах нижние кнопки обрезаются

### Game Scene
9. **Next preview сплюснута** — зверушка вверху справа мелкая и сплюснутая
10. **Контейнер не оформлен** — голые прямоугольники вместо стилизованных стенок

---

## Root Cause Analysis

### Баг #1 — "Не хватило 0 очков" (тройной баг)

**Цепочка:**

1. `GameScene.onScoreUpdated()` (строка 251):
   ```ts
   if (!this.sessionStats.isNewRecord && to > this.score.getBestScore() && this.score.getBestScore() > 0)
   ```
   Условие `getBestScore() > 0` — **первая игра (best=0) никогда не помечается как рекорд**.

2. `GameScene.triggerGameOver()` (строка 293-301):
   ```ts
   const isNewRecord = this.score.checkAndSaveBest(); // true! Но не передаётся
   this.scene.launch('GameOver', { ...this.sessionStats, ... }); // sessionStats.isNewRecord = false
   ```
   `checkAndSaveBest()` возвращает `true` корректно, но значение **не используется** — передаётся `sessionStats.isNewRecord` (false).

3. `GameOverScene` (строка 53-56):
   ```ts
   if (!data.isNewRecord && data.best > 0 && data.score > data.best * 0.8)
   ```
   После `checkAndSaveBest()`, `best` уже обновился = score. Поэтому `score > best * 0.8` = true, а `best - score = 0`.

**Fix:** Использовать `isNewRecord` из `checkAndSaveBest()` вместо `sessionStats.isNewRecord`.

### Баг #5 — Наложение текстов в Menu

Y-координаты захардкожены без учёта сезонного баннера:
- Сезон: `h * 0.30`, `h * 0.34`, `h * 0.37`
- Рекорд: `h * 0.35` (перекрывается с сезоном!)
- Challenge: `h * 0.35` (тот же Y!)

**Fix:** Динамический Y с аккумулятором, адаптивный layout.

---

## Scope

### Файлы для изменения

| File | Changes |
|------|---------|
| `src/config/GameConfig.ts` | Добавить `nameRu` в `AnimalConfig` и `ANIMALS` |
| `src/scenes/GameOverScene.ts` | Fix isNewRecord, русские имена, убрать дубль, fix emoji |
| `src/scenes/GameScene.ts` | Fix isNewRecord передачу, переместить next preview, стилизовать контейнер |
| `src/scenes/MenuScene.ts` | Динамический layout, группировка кнопок, fix overlay |

### Файлы READ-ONLY

- `src/game/ScoreManager.ts` — без изменений, логика корректна
- `src/game/PhysicsManager.ts` — без изменений, физика корректна

---

## Solution

### Task 1: Русские имена зверей в GameConfig

Добавить `nameRu` в `AnimalConfig`:

```ts
export interface AnimalConfig {
  readonly tier: number;
  readonly name: string;
  readonly nameRu: string;  // NEW
  readonly radius: number;
  readonly score: number;
  readonly key: string;
  readonly color: number;
}

export const ANIMALS: readonly AnimalConfig[] = [
  { tier: 1, name: 'hamster', nameRu: 'Хомячок', radius: 18, score: 2,  key: 'hamster', color: 0xf0b832 },
  { tier: 2, name: 'bunny',   nameRu: 'Зайчик',  radius: 24, score: 6,  key: 'bunny',   color: 0x8bafc7 },
  { tier: 3, name: 'kitten',  nameRu: 'Котёнок',  radius: 32, score: 12, key: 'kitten',  color: 0xe88c28 },
  { tier: 4, name: 'cat',     nameRu: 'Кошка',    radius: 40, score: 20, key: 'cat',     color: 0x9b6ba0 },
  { tier: 5, name: 'puppy',   nameRu: 'Собачка',  radius: 50, score: 30, key: 'puppy',   color: 0xc17a56 },
  { tier: 6, name: 'fox',     nameRu: 'Лисичка',  radius: 60, score: 42, key: 'fox',     color: 0xc03228 },
  { tier: 7, name: 'panda',   nameRu: 'Панда',    radius: 72, score: 56, key: 'panda',   color: 0x3d2b1f },
  { tier: 8, name: 'bear',    nameRu: 'Мишка',    radius: 85, score: 72, key: 'bear',    color: 0x5a8c3c },
];
```

### Task 2: Fix Game Over Screen

**2a. Fix isNewRecord:**
В `GameScene.triggerGameOver()`:
```ts
const isNewRecord = this.score.checkAndSaveBest();
// Передавать isNewRecord напрямую, не из sessionStats
this.scene.launch('GameOver', {
  score: this.score.getScore(),
  best: this.score.getBestScore(),
  mergeCount: this.sessionStats.mergeCount,
  highestTier: this.sessionStats.highestTier,
  isNewRecord,  // ← из checkAndSaveBest()
  canContinue: ...,
  mode,
});
```

**2b. Fix near-miss logic:**
```ts
// Защита: не показывать near-miss если score >= best (т.к. best уже обновлён)
if (!data.isNewRecord && data.best > data.score && data.score > data.best * 0.8) {
  txt(..., `Почти рекорд! Не хватило ${data.best - data.score} очков`, ...);
}
```

**2c. Русские имена + убрать дубль:**
- Заменить `ANIMALS[].name` → `ANIMALS[].nameRu` в отображении
- Убрать строку "Лучший момент: X!" — информация дублирует "Лучший: X"

**2d. Fix emoji:**
- "Продолжить 📺" → "Продолжить ▶️"

### Task 3: Fix Menu Screen Layout

Адаптивный layout с зонированием (best practice из research):

```
Zone 0-15%:  [skin] [sound] [streak🔥]     ← top bar утилиты
Zone 15-35%: Мишкин Ляп                     ← logo
Zone 35-42%: [сезонный баннер, если есть]   ← опциональный, резервирует зону
Zone 42-48%: Рекорд: 9364                   ← инфо
Zone 48-72%: [ИГРАТЬ] [Ежедневная] [Релакс] ← play modes, крупные
Zone 72-92%: [🏆][📋][🎯][🎡]             ← meta: зверята/рейтинг/задания/награды/колесо
```

**Ключевые изменения:**
- Аккумулятор Y вместо хардкод процентов
- Meta-кнопки: горизонтальный grid 2×2 или 3+2 (иконки 56px)
- Увеличенный gap (32px) между play и meta группами
- Streak показывать с иконкой 🔥
- Сезонный баннер в фиксированной зоне, не сдвигает рекорд

### Task 4: Game Scene Visual Polish

**4a. Next preview:**
- Переместить из top-right corner правее score, Y=30
- Размер 48×48 вместо 40×40
- Добавить круглый background (#EDE0C4) для обрамления

**4b. Container decoration:**
- **Дно:** Полоска "земля" (тёмно-коричневый) + трава (зубчатый зелёный паттерн) поверх физ. стенки
- **Боковые стенки:** Шире визуально (32px вместо 20px), текстура "деревянные планки" (вертикальные полоски)
- Визуальные стенки НЕ меняют физику — только overlay поверх

**Концепт стен:**
```
Физ. стенка = 20px (без изменений)
Визуальная стенка = 32px (шире, overlay)
- Базовый цвет: #8B6040 (дерево)
- Vertical grain lines: #7A5030, alpha 0.3
- Inner edge: 2px highlight #A07850

Дно:
- Нижние 32px: #5A3E20 (земля)
- Поверх: зубчатая полоска зелёного #4A7A30 (трава), 12px высотой
```

---

## Definition of Done

- [ ] Первая игра показывает "Новый рекорд!"
- [ ] "Не хватило 0 очков" больше не появляется
- [ ] Все имена зверей — на русском в GameOver
- [ ] Нет дубля "Лучший" / "Лучший момент"
- [ ] Кнопка "Продолжить" с иконкой ▶️
- [ ] Menu: тексты не наезжают друг на друга при активном сезоне
- [ ] Menu: кнопки разделены на 2 группы (play + meta)
- [ ] Menu: streak с иконкой 🔥
- [ ] Game: next preview не сплюснут, размер 48px
- [ ] Game: стенки контейнера стилизованы (дерево + трава)
- [ ] TypeScript компиляция без ошибок
- [ ] Нет регрессий в физике/геймплее
