# Board Agenda — Casual Game for Yandex Games

**Date:** 2026-03-04
**Round:** 1
**Source:** ai/idea/* (Bootstrap)

---

## Context

Олег (предприниматель) хочет за 1 неделю создать казуальную HTML5-игру на Phaser.js, опубликовать на Яндекс Играх, и показать сыну Камилю (10 лет) что код = деньги. Бюджет нулевой. Идея: клонировать проверенную механику (Drop Merge / Suika Game — лидер по рекомендации скаутов).

**Platform:** Яндекс Игры — 45-50M MAU, 58% женщины, 38% 55+, модерация 3-5 дней, минимум выплат 3000₽.

---

## Open Questions from Bootstrap

### OQ-1: Definition of Success
Цель 1000₽ vs порог выплат 3000₽. Что считаем успехом?

### OQ-2: Target Audience Conflict
Платформа: 55+ женщины. Эксперимент: для 10-летнего мальчика. Для кого делаем игру?

### OQ-3: Genre Selection
Drop Merge (скаут рекомендует) vs Bubble Shooter (#1 трафик) vs другие. Что оптимально для 1 недели + максимум дохода?

### OQ-4: Monetization Model
Только реклама (проще) vs реклама + IAP (больше дохода, сложнее)? IAP = 90% дохода у топов, но добавляет сложности.

### OQ-5: Visual Style
Фрукты (Suika-клон), геометрия (минимальный), свой сеттинг? Как влияет на модерацию и retention?

### OQ-6: Scaling After Experiment
Это one-shot или потенциально портфель игр? Влияет на инвестиции в инфраструктуру.

---

## Director Assignments

### CPO (Customer Experience)
- Research: Что удерживает игроков в drop-merge играх? UX-паттерны лучших казуалок на Яндексе.
- Research: Как совместить "нравится Камилю" и "залетает у аудитории 55+"?
- Decide: OQ-2 (target audience), OQ-5 (visual style)

### CFO (Unit Economics)
- Research: CPM/RPM на Яндекс Играх для казуалок. Реалистичная модель дохода.
- Research: Стоит ли IAP при нулевом бюджете и 1-недельном сроке?
- Decide: OQ-1 (success definition), OQ-4 (monetization model)

### CMO (Growth & Revenue Ops)
- Research: Как новые игры получают трафик на Яндекс Играх? ASO, алгоритм, новинки.
- Research: Оптимальные метаданные (название, описание, иконка) для CTR.
- Decide: Launch strategy, naming

### COO (Operations & Scale)
- Research: Процесс публикации step-by-step. Юридические требования (физлицо/самозанятый).
- Research: Оптимальный pipeline разработки за 1 неделю.
- Decide: OQ-6 (scale after experiment), operational plan

### CTO (Technical Strategy)
- Research: Phaser.js + Matter.js для drop-merge — есть ли готовые шаблоны/туториалы?
- Research: Yandex Games SDK integration — подводные камни для Phaser.
- Decide: OQ-3 (genre — с точки зрения сложности реализации)

### Devil's Advocate
- Challenge: "За неделю" — реалистично ли с учётом модерации?
- Challenge: "29K удалённых игр" — чем наша будет отличаться?
- Challenge: Стоит ли вообще? ROI времени основателя.
- Kill scenarios: что если 0 игроков через месяц?
