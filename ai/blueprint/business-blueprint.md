# Business Blueprint: Zverata (Зверята)

**Date:** 2026-03-04
**Board Round:** 1
**Founder Approved:** 2026-03-04
**Strategy:** #2 — Quality-First Launch with Platform Survival

---

## Executive Summary

Казуальная drop-merge игра с темой cute animals для Яндекс Игр. Цель: показать сыну Камилю (10 лет) что код = деньги. Целевая аудитория — женщины 35-65 (58% платформы, 45M MAU). Монетизация через рекламу (interstitial + rewarded video + sticky banner). Стек: Phaser 3 + Matter.js + TypeScript. Таймлайн: 3 недели (разработка → полировка → модерация → запуск).

Критерий успеха: баланс > 0₽ в кабинете разработчика. Бонусная цель: 3,000₽ для вывода (2-4 месяца). Ожидаемый доход за 3 месяца: ~4,100₽ (probability-weighted). Проект оптимизирован для рейтинга > 30 на платформе (порог выживания).

---

## Target Customer

**Primary persona: Марина, 52 года**
- Работает бухгалтером, играет в браузере в обеденный перерыв и вечером
- Любит головоломки, животных, спокойные игры без таймера
- Не знакома с Suika Game или drop-merge жанром
- Толерантна к rewarded video (сама выбирает смотреть), нетолерантна к aggressive ads
- Сессия: 5-7 минут, 2-3 раза в день

**Secondary persona: Камиль, 10 лет**
- Сын основателя, учится в Claude Code
- Играет во всё подряд, любит видеть "числа растут"
- Будет тестировать, выбирать животных, наблюдать за доходом

**Data sources:** CPO AARP 2023 research (55+ gaming patterns), Yandex Games demographic data (58% female, 38% 55+)

---

## Revenue Model

### Monetization: Ads Only (No IAP)

| Тип рекламы | Триггер | Ограничения |
|-------------|---------|-------------|
| Interstitial | После game over | Не раньше 60 сек от старта сессии, не чаще раз в 3 мин |
| Rewarded Video | Кнопка "Продолжить" на экране game over | Player-initiated, без лимита |
| Sticky Banner | Score area выше игрового поля | Только вне gameplay canvas |

### Unit Economics

| Метрика | Значение | Источник |
|---------|----------|---------|
| CAC | 0₽ | Organic platform traffic |
| CPMV | 80-120₽ / 1K impressions | CFO: developer reports 2024-2025 |
| Week 1 DAU (Novosti boost) | 300-600 | CFO Scenario A-B |
| Month 1 DAU (post-boost) | 80-200 | CFO decay model |
| Month 3 DAU (steady state) | 40-120 | CFO extrapolation |
| Revenue Month 1 | 300-800₽ | CFO Scenario A+ |
| Revenue 3-Month Total | 2,000-4,000₽ | CFO EV calculation |
| EV (probability-weighted) | ~4,100₽ | CFO critique: 65% base + 25% quality + 10% removal |
| Gross Margin | ~94% | 6% самозанятый tax |
| Withdrawal Threshold | 3,000₽ | Yandex RSY minimum |
| Time to Withdrawal | 2-4 months | CFO model |

### Why No IAP

- IAP adds <15% revenue at this DAU level
- 50% commission Яндекса на IAP vs ~94% margin на рекламе
- 2-3 дня дополнительной разработки в 7-дневном спринте
- Требует ручного одобрения через email Яндекса
- Конверсия IAP: 0.5-2% при малом DAU = единицы рублей

---

## Go-to-Market

### Primary Channel: Yandex "Novosti" Organic

- Все новые игры автоматически попадают в раздел "Новинки" на 7 дней
- Это единственное окно бесплатного трафика — всё должно быть готово ДО публикации
- После 7 дней — ML-алгоритм ранжирует по DAU, retention, рейтингу, времени сессии

### Card Completion = GREEN (100%)

Обязательно до публикации (фактор ML-ранжирования):

| Артефакт | Требования |
|----------|-----------|
| Иконка | 2 варианта для встроенного A/B теста |
| Обложка | 800x600 |
| Скриншоты | 5 шт (gameplay moments) |
| Видео | Gameplay clip |
| Описание RU | 500+ символов |
| Описание EN | 500+ символов (+40% международного трафика) |
| Категории | Casual, Puzzle |
| Возраст | 0+ |

### Naming

- Формула: [Тема] + [Действие]
- RU: "Зверята: Слияние" или "Пушистое Слияние"
- EN: "Animal Merge" или "Fluffy Merge"
- Запрещено: "Suika", "Clone", бренды

### Post-Launch Monitoring

| День | KPI | Действие если fail |
|------|-----|-------------------|
| D1 | D1 retention > 25% | Экстренный UX review |
| D3 | Рейтинг > 40 | Game-feel fix |
| D7 | Выход из Novosti, рейтинг > 30 | Оценка: патч или принять |
| D21 | Platform auto-check, рейтинг > 30 | Игра выживает или удаляется |

---

## Operating Model

### Timeline: 3 Weeks

**Week 1 — Build + Polish**

| День | Owner | Gate (бинарный pass/fail) |
|------|-------|--------------------------|
| Day 0 | Олег | Самозанятый зарегистрирован + RSY заявка + GitHub repo |
| Day 1 | Claude Code + Олег | Drop механика работает (физика, коллизии). SDK mock готов. |
| Day 2 | Claude Code + Олег + Камиль | Merge loop полный. Game over триггеры. "Play Again" мгновенный. Камиль улыбается при слиянии = pass. |
| Day 3 | Claude Code | SDK интеграция: все 7 pitfalls CTO проверены. Interstitial + rewarded + banner работают. |
| Day 4 | Олег + Claude Code | 8 animal спрайтов (Kenney CC0). Merge анимация (0.2s scale + particles). Background + UI. Large touch targets (44px+). |
| Day 5 | Олег + Камиль | Mobile QA на реальном устройстве. Portrait + landscape. No JS errors. 10+ мин gameplay. 15-point checklist зелёный. |

**Week 2 — Submit + Productive Wait**

| День | Owner | Activity |
|------|-------|---------|
| Day 6 | Олег | 2 иконки, обложка, 5 скриншотов, видео, описания RU+EN. Card Completion = green. |
| Day 7 | Олег | ZIP < 100MB, index.html в корне. Submit в Yandex console. |
| Days 8-12 | Олег + Камиль | Ожидание модерации. Продуктивно: boilerplate repo, playbook, scope Game 2 с Камилем. |
| If rejected | Олег | Читаем причину. Классифицируем. Чиним. Ресабмит (+5 рабочих дней). |

**Week 3 — Go-Live + Novosti Window**

| День | Activity |
|------|---------|
| Day 1 post-approval | Активируем A/B тест иконок. Проверяем рекламу на реальной платформе. |
| Days 1-7 | Мониторим retention, рейтинг, session length. |
| Day 7 | Выход из Novosti. Рейтинг > 30 = выжили. |

### Agent/Human Split

| Claude Code (Agent) | Олег (Human) | Камиль (Learner) |
|---------------------|--------------|------------------|
| Scaffold Phaser + Matter.js проект | "Satisfying ли merge?" — game feel | Играет, тестирует |
| Физика, merge, scoring из reference | Play-test 5+ сессий на мобиле | Выбирает цепочку животных |
| SDK интеграция (7 функций) | Самозанятый + RSY аккаунты | Наблюдает за балансом |
| 3 варианта merge анимации | Выбирает лучший вариант | Учится: аудитория ≠ я |
| RU + EN метаданные | Финальный submit | Scope Game 2 идеи |
| 15-point pre-submit checklist | Реагирует на rejection | Co-designer к Game 3 |

---

## Technical Constraints

### Stack (confirmed by 6/6 directors + 5 open-source references)

- **TypeScript** + **Phaser 3.90.0** + **Matter.js** (built-in) + **Vite 5.x**
- Reference: sgbj/suika-clone (structural pattern, не прямой форк)
- Assets: Kenney.nl CC0 (60,000+ ассетов, коммерческое использование)

### Yandex Games SDK — 7 Critical Pitfalls

1. Phaser init ВНУТРИ `YaGames.init().then()` — не до
2. Подписка на `game_api_pause` / `game_api_resume`
3. `pauseAll()` аудио перед любой рекламой
4. `onError` callback на каждый ad call (игра не зависает)
5. `GameplayAPI.start/stop` в правильные моменты
6. SDK mock для локальной разработки
7. Никаких `setInterval` для рекламы (только event-triggered)

### Project Structure

```
src/
  main.ts              -- SDK init wrapper, Phaser config
  scenes/
    PreloadScene.ts    -- Asset loading
    MenuScene.ts       -- Start screen, best score
    GameScene.ts       -- Core gameplay
  objects/
    Animal.ts          -- Matter.js circle + sprite + tier
    MergeChain.ts      -- 8-tier progression config
  sdk/
    YandexSDK.ts       -- SDK wrapper + mock
    AdManager.ts       -- Interstitial, rewarded, banner
  config/
    GameConfig.ts      -- Constants, sizing, tiers
```

### Animal Progression Chain

```
Tier 1: Hamster (smallest)
Tier 2: Rabbit
Tier 3: Kitten
Tier 4: Cat
Tier 5: Dog
Tier 6: Fox
Tier 7: Panda
Tier 8: Bear (largest, final)
```

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Rejection на модерации | 15-25% | -5 дней | Animal theme (не фрукты), 15-point checklist, 7 SDK pitfalls |
| Рейтинг < 30 → удаление | 20-30% | Game lost | Quality-first: wow moment, no forced ads, large UI for 55+ |
| 0 игроков | 5% | Нет дохода | Невозможно — Novosti даёт трафик всем новинкам |
| Revenue < 100₽/мес | 40% | Не достигнем 3000₽ | Успех = баланс > 0₽. Manage expectations. |
| Founder attention drift | 30% | Не закончим | Daily gates, бинарный pass/fail, 3-week bounded scope |
| Drop-merge перенасыщен | Medium | Низкий рейтинг | Animal theme дифференцирует. 55+ не видели Suika. |

---

## Unit Economics Summary

| Metric | Value | Source |
|--------|-------|--------|
| TAM | 45-50M MAU (Yandex Games total) | Scout research |
| SAM | ~26M (58% female audience) | Platform demographics |
| SOM | 300-600 DAU Week 1, 80-200 steady | CFO model |
| CAC | 0₽ | Organic platform |
| LTV per player | ~0.02-0.05₽ per session | CFO CPMV / sessions |
| Revenue Month 1 | 300-800₽ | CFO Scenario A+ |
| Revenue Month 3 | 2,000-4,000₽ | CFO EV model |
| Gross Margin | 94% | 6% самозанятый |
| Payback | Instant (CAC = 0) | N/A |

---

## Decisions Made

| # | Decision | Rationale | Director |
|---|----------|-----------|----------|
| 1 | Drop Merge жанр | Lowest implementation complexity (12-20h), proven mechanics, Matter.js built into Phaser | CTO (6/6 consensus) |
| 2 | Cute animals тема | Дифференциация от Suika-клонов, попадание в 55+ аудиторию, Cozy Merge 96% positive | CPO (5/6, Devil changed) |
| 3 | Ads only, no IAP | IAP <15% revenue at this DAU, 50% commission, +2-3 days dev time | CFO (6/6 consensus) |
| 4 | Самозанятый Day 0 | 6% tax, 1 day setup, Yandex reports to FNS, enables withdrawal | COO + CFO |
| 5 | 3 weeks timeline | Dev (7d) + submit+moderation (7d) + launch (7d). "1 week" = dev only. | COO + Devil (5/6) |
| 6 | Success = balance > 0₽ | Educational goal. 3000₽ withdrawal = bonus. Even 17₽ = experiment success. | CFO + Devil (6/6) |
| 7 | Target: women 35-65 | 58% of platform. Камиль plays anyway. Optimize for revenue, not personal taste. | CPO (6/6) |
| 8 | Card Completion = green | ML ranking factor. 2 icon variants for A/B. RU + EN descriptions. | CMO |
| 9 | Rewarded video = must-have | Player-initiated, 55+ tolerant (AARP data), +20-40% revenue | CPO + CFO |
| 10 | No ads before first game over | #1 cause of uninstall for 55+ audience. First 60 seconds = ad-free. | CPO |

---

## Open for Architect

Technical questions Board leaves for Architect:

1. **Phaser project structure** — exact file layout, module boundaries, build config
2. **Matter.js physics tuning** — gravity, restitution, collision groups for drop-merge
3. **SDK integration architecture** — wrapper pattern, mock system, event handling
4. **Build pipeline** — Vite config, ZIP packaging for Yandex, asset optimization
5. **State management** — score, highscore persistence, game state machine
6. **Responsive design** — portrait/landscape, mobile/desktop scaling strategy
7. **Animation system** — merge effects, particle system, sound triggers
8. **Testing strategy** — what and how to test in a game project
