# CTO Cross-Critique — Round 1

**Director:** Piyush Gupta (CTO lens)
**Date:** 2026-03-04
**My research file:** `ai/board/research-cto.md`

---

## Peer B — CMO (Tim Miller: Growth, Traffic, Launch Strategy)

### Agree

- **ML-алгоритм = не SEO.** Peer B правильно переосмыслил платформу: это не app store с ключевыми словами, это ML, который смотрит на поведенческие метрики. Это меняет технические приоритеты — аналитика и SDK integration становятся критичнее красивого кода.
- **Card Completion Progress как технический requirement.** Peer B выявил, что незаполненная карточка = алгоритмический штраф. Для CTO это action item: генерация metadata (описание, скриншоты, инструкции) должна быть вставлена в publishing checklist как обязательный шаг, не опциональный.
- **A/B тест иконок — встроен в платформу.** Это хорошее "buy" решение: не изобретаем A/B инфраструктуру сами, используем Yandex native tool. Правильная философия.
- **Рейтинг < 30 за 3 недели = автоудаление.** Критически важная деталь, которую я упомянул вскользь. Peer B дал ей правильный приоритет — это технический SLA платформы, влияющий на архитектуру решения.

### Disagree

- **"Только органика, никакого маркетинга."** Тезис верен для бюджета = 0, но CMO не рассмотрел community sharing. Для Yandex Games нет social sharing SDK, но есть прямые URL для игры. Автоматическое "поделиться результатом" (копировать ссылку + счёт) в игре — это zero-cost виральность. 2 строки кода. Упущено.
- **Формула названия хорошая, но реализация слабая.** "Котослияние" — это русскоязычная игра слов, которая работает только на русском. Peer B не проработал, как title будет отображаться в EN-локали. Если RU title = "Котослияние", EN title = "Cat Merge"? Это нужно в техническом spec, а не в CMO рекомендации.

### Gap

- **Нет технической стороны метаданных.** Peer B описывает что заполнить, но не как. Для AI-assisted разработки важно: кто генерирует описание, скриншоты, инструкции? Нужен prompt + workflow. Это 2-3 часа работы, которые должны быть в day plan.
- **Нет упоминания SDK mock для local dev.** CMO говорит "проверить что SDK показывает рекламу корректно" после публикации. Это неправильный порядок. Mock должен быть написан в Day 1, тестирование ad flow — в Day 3. Иначе получим сюрпризы при первом показе пользователям.
- **CTR benchmark "не публикуется Яндексом."** Это не повод не иметь гипотезу. Peer B написал "не знаем" и остановился. Лучше: из DAU benchmark + CPMV данных можно получить обратное вычисление impression rate. Это аналитика, не маркетинг.

### Rating: 4/5

Сильный практический research с реальными данными о платформе. Критически важное знание о механике "Новинок" и autodelete правиле. Минус балл за отсутствие технической стороны publishing pipeline и SDK dev workflow.

### Integration

Peer B меняет мои рекомендации: **publishing checklist = технический артефакт, не маркетинговый**. Я добавляю его в свой stack breakdown:
- Day 6 задача: metadata generation (Claude Code writes description → Oleg approves) — это Code task, не marketing task
- Card Completion Progress checklist должен быть частью pre-submit verification, встроенной в процесс

---

## Peer C — Devil's Advocate (Peter Thiel: Kill Scenarios, Contrarian)

### Agree

- **Модерация — реальный timeline риск.** Peer C прав: "1 неделя" это только разработка. Модерация 3-5 дней per round, возможен rejection. Я в своём исследовании упомянул SDK pitfalls, но не дал конкретный timeline breakdown. Peer C дал его: 2-3 недели реалистично. Это правильная техническая оценка.
- **"Взять open-source клон, не писать с нуля."** Это прямо совпадает с моей рекомендацией (sgbj/suika-clone как structural reference) и моей философией (don't invent, combine). Peer C идёт дальше: купить Feronato source за $5 — это ещё радикальнее. Логично.
- **Drop Merge 2048 с рейтингом 78 — это конкурентная реальность.** Peer C единственный, кто привёл конкретного конкурента с конкретным рейтингом. Важный data point. Алгоритм ставит нашу игру (рейтинг 0) против него. Честная оценка.
- **KvaytG (8 игр за 2 недели = 429₽).** Доказательство что "быстрые клоны не работают" подкреплено реальными данными. Это меняет рекомендацию: нам нужно качество, не скорость клонирования.

### Disagree

- **"Drop Merge жанр устарел (2.5 года после хайпа)."** Не согласен с этим тезисом полностью. Тетрис создан в 1984 и до сих пор жив. Solitaire никогда не был "в хайпе". Casual puzzle жанры не умирают — они нормализуются. Drop Merge превращается из "вирусного хайпа" в "стабильный жанр". Для Yandex Games это лучше, а не хуже — платформа поддерживает evergreen жанры с постоянным спросом. Peer C спутал "хайп мёртв" с "жанр мёртв".
- **"Физика слияния — больше не wow для аудитории."** Но целевая аудитория (55+ женщины) не играла в Suika Game. Они не видели 50+ клонов — они играли в Match-3 и Solitaire. Для них drop-merge с физикой — новинка. Peer C проецирует опыт "геймера, который видел все" на аудиторию, которая видела мало.
- **"Нужна реальная механическая докрутка (мультиплеер, уникальная физика)."** Это scope creep. За 1 неделю реализовать мультиплеер для браузерной игры с Yandex SDK — нереалистично. Peer C критикует план, но альтернатива ("мультиплеер") хуже, не лучше.

### Gap

- **Нет технической альтернативы.** Peer C говорит что делать (другая механика) но не говорит ЧТО конкретно за 1 неделю. "Bubble Shooter актуальнее" — но сам признаёт что сложнее. Это не actionable critique, это critique без resolution.
- **Feronato $5 source — не упомянул лицензионные риски.** Если купить коммерческий source code, Yandex может отклонить как дубликат. Или могут быть licensing restrictions на коммерческое использование. Нужна проверка лицензии.
- **Риск Phaser/Matter.js bugs в production не рассмотрен детально.** Peer C упомянул "physics bugs в edge cases" как black swan, но не дал mitigation. Я в своём исследовании дал конкретные pitfalls (game_api_pause, onError callback). Это gap у Peer C.

### Rating: 4/5

Сильный devil's advocate. Реальные данные (KvaytG, Drop Merge 2048 рейтинг 78, timeline с модерацией). Минус балл за "жанр устарел" — это неточный анализ аудитории, плюс за то что альтернативы не проработаны.

### Integration

**Критически важное изменение от Peer C:** Timeline должен быть 3 недели (разработка + итерация + модерация), не 1. Это меняет planning. Также: pre-submit checklist нужен как обязательный артефакт, чтобы пройти модерацию с первой попытки — иначе теряем +5 рабочих дней.

---

## Peer D — CFO (Unit Economist)

### Agree

- **CAC = 0, unit economics работают потому что costs = 0.** Правильная переформулировка вопроса. Классический CAC payback неприменим — нужно смотреть на opportunity cost founder's time.
- **Ads only, no IAP.** Я пришёл к тому же выводу. Peer D дал математику: IAP at 100 DAU добавляет <15% revenue при 25-40% development overhead. Это сильнее чем моя качественная рекомендация — у них конкретные цифры.
- **Три формата рекламы: interstitial + rewarded + banner.** Peer D правильно указал все три потока. Я описал только interstitial и rewarded в деталях. Sticky banner — третий revenue stream который я недооценил (low CPM, но zero user friction).
- **CPMV данные из реальных кейсов (36₽ runner, 90₽ clicker).** Это ценные benchmark данные. Drop-merge имеет более длинные сессии чем runner → должен давать CPMV ближе к 100₽. Это техническая архитектурная deduction: для максимального CPMV нужны длинные сессии, значит game over не должен происходить слишком быстро (сложность должна быть правильно откалибрована).
- **Самозанятый — правильная legal структура, 1 день регистрации.** Практическая деталь, которую я пропустил. Это должно быть в Day 0 checklist.

### Disagree

- **Revenue forecast Scenario B (13,680₽ за 3 месяца) — слишком оптимистичен.** 600 DAU в Week 1 для новой игры с нулевой историей — это верхний край. Реалистичнее медиана между A и B. Но для educational purposes это не проблема — Peer D честно маркировал его как "optimistic".
- **"Probability of Stage 2 in 3 months: 40% (Scenario A)."** Это число взято ниоткуда. Нет методологии расчёта вероятности. Это слабость финансового отчёта.

### Gap

- **Нет анализа sticky banner UX trade-off.** Banner во время gameplay может снижать session length для аудитории 55+ (навязчивость). Peer D говорит "add banner", но не анализирует retention impact. Это tech-product trade-off, который нужно рассмотреть.
- **RSY account verification time не упомянут.** Peer D говорит "зарегистрировать как самозанятый" — но RSY account verification может занять 1-3 дня. Если начать в Day 0, RSY будет готов к Day 2-3. Peer D не даёт этот timeline.
- **Нет данных по Yandex revenue share %.** "CPMV paid to developer is the net number" — это предположение, не подтверждённый факт. Peer D упомянул что Yandex не раскрывает share, но не отметил это как риск для financial model.

### Rating: 4/5

Лучший финансовый анализ, который я читал. Реальные CPMV данные из developer reports + конкретная математика IAP vs Ads. Минус балл за несколько непроверенных assumptions и отсутствие RSY timeline.

### Integration

Peer D меняет мой stack recommendation: **sticky banner нужно добавить в SDK integration plan**. Это третий revenue stream. Также: **самозанятый регистрация = Day 0 task**, до первой строки кода. Это не технический вопрос, но блокирует revenue capability.

---

## Peer E — COO (Keith Rabois: Operations, Process, Scaling)

### Agree

- **Boilerplate repo как первый infrastructure investment.** Peer E правильно определил что с первой игры нужно строить переиспользуемую base. Phaser + Matter.js + Yandex SDK pre-integrated repo — это не overkill, это обязательный technical foundation если планируется >1 игры.
- **SDK wrapper module — copy-paste per game.** Точно совпадает с моей рекомендацией `sdk/YandexSDK.ts` + `sdk/AdManager.ts`. Peer E формализовал это как operational playbook. Хорошо.
- **"Quality at launch > quality after iteration."** Ключевой insight для понимания Yandex Games: это не mobile app store где можно iterate. Алгоритм оценивает первую неделю, и если retention плохой — уже поздно. Это меняет technical priorities: polish перед launch, не после.
- **60fps с 500 physics bodies на desktop, 200 на mobile** (Phaser + Matter.js данные). Это конкретный performance benchmark. Для drop-merge с 8-10 объектами максимум — мы никогда не приблизимся к лимиту. Подтверждает что performance risk = низкий.
- **Day-by-day план с gates.** Peer E единственный кто дал конкретный 7-дневный операционный план с pass/fail gates на каждый день. Это production-grade planning.

### Disagree

- **"Day 4: Claude can generate SVG."** Это технически правда, но SVG-спрайты в Phaser имеют свои gotchas (SVG рендеринг через Phaser texture manager может давать артефакты на мобильных браузерах). Лучше использовать PNG из Kenney.nl, чем генерировать SVG. Peer E принял это как данность без проверки.
- **"Days from start to submission: ≤7."** Это цель, но Peer C показал что реалистичнее 10-13 дней с учётом модерации. Peer E сам в другом месте пишет "total cycle time per game: ~10 working days" — противоречие внутри одного документа.

### Gap

- **Нет плана для rejection scenario.** Peer E описывает ideal path (7 дней → submission → approval). Но что если отклонение? Нет конкретного decision tree: "если SDK error → fix X → resubmit Y". Это операционный gap.
- **RSY account setup — нет деталей о timing.** Peer E упоминает RSY в Day 0 checklist, но не говорит что verification 1-3 дня. Если начать в Day 0 и RSY не верифицирован к Day 7, на публикацию пойдём без рекламного аккаунта.
- **Нет мониторинга технических метрик.** Peer E говорит "мониторить rating, session length" — но как? Нет упоминания Yandex Developer Console analytics, RSY cabinet для CPMV, game-analytics.ru для ranking tracking. Это не soft recommendation — это конкретные tools.

### Rating: 5/5

Лучший операционный документ. Конкретный day-by-day план, RACI matrix, boilerplate strategy, Phaser performance benchmarks. Это единственный peer, кто дал actionable implementation timeline. Peer E и мой research дополняют друг друга наиболее полно.

### Integration

Peer E's day plan напрямую интегрируется в мой технический stack. Я добавляю:
- **SVG → PNG correction:** использовать Kenney PNG, не генерировать SVG
- **Boilerplate repo**: создать в Day 0, не после game 1
- **Performance gate**: verify 60fps на мобильном Chrome в Day 5 playtest

---

## Peer F — CPO (Jeanne Bliss: Player Retention, UX, Audience)

### Agree

- **"Wow moment" в первые 5 секунд.** Это подтверждает мой тезис об "Aha moment" и добавляет детали: первые ДВА одинаковых объекта должны слиться С ХОРОШИМ ЗВУКОМ И АНИМАЦИЕЙ, до первой рекламы. Это конкретный UX requirement с техническими последствиями.
- **Cute animals > фрукты для дифференциации.** Peer F дала данные: Cozy Merge (96% positive on Steam), Capy Merge как proof-of-concept. Это убедительнее моей рекомендации "used geometric shapes styled consistently." Я был прагматичен (быстро), Peer F права (лучший retention outcome).
- **Реклама только после game over, не во время.** Подтверждает мою архитектурную рекомендацию. AARP данные (69% аудитории 55+ называют агрессивную рекламу #1 причиной удаления) — это конкретный data point, который делает рекомендацию не вкусовой, а data-driven.
- **Крупные элементы UI (44px+ touch targets, 18px+ text).** Это конкретный technical spec. Для Phaser это означает: font size config в GameConfig.ts, touch target sizing в UI layout. Peer F дала spec, я должен был дать его в своём research.
- **Хомяк → Кролик → Котёнок → ... → Медведь.** Конкретная progression chain для животных. Это прямой аналог моему "Merge progression chain — Core IP" но с конкретными данными вместо шаблона.

### Disagree

- **"Switching cost = НИЗКИЙ."** Peer F права для рационального игрока, но недооценивает эмоциональный lock-in через тематику. Если игрок эмоционально привязан к "своим" хомякам и медведям — переключиться сложнее, чем кажется. Это не rational switching cost, это эмоциональный. Peer F признаёт это в конце ("эмоциональный fingerprint"), но затем говорит "switching cost = низкий". Противоречие.
- **D1 retention 25-35% как ориентир.** Это мобильные бенчмарки, скорректированные на browser. Но для Yandex Games retention считается иначе — по DAU/рейтинговому алгоритму Yandex, не по мобильным стандартам. Нужно быть осторожным с прямым переносом мобильных benchmarks.
- **Фруктовая тематика как "потеря дифференциации."** Peer F говорит что фрукты = насыщен клонами. Но оригинальная Suika = фрукты, и она до сих пор популярна. Вопрос не в "фрукты vs животные" а в КАЧЕСТВЕ реализации. Хорошая фруктовая игра выиграет у плохой животной. Peer F делает вид что тема важнее качества.

### Gap

- **Нет конкретного source для animal sprites.** Peer F рекомендует cute animals, но где взять 8 готовых animal sprites бесплатно за неделю? "OpenGameArt, Kenney, AI generation" — слишком абстрактно. Я дал конкретные Kenney packs. Peer F не дала.
- **Audio design упомянута, но не разработана.** "Хороший звук при слиянии" — ключевой UX requirement, но нет конкретики: какой звук? откуда взять? Freesound.org с CC0 фильтром — это 30 минут поиска, но Peer F не дала этого.
- **Нет технических требований для "wow moment."** Peer F говорит "хорошая анимация слияния" — но не даёт spec: какая продолжительность (0.2s? 0.5s?)? Scale factor? Particle count? Для меня как CTO это gap — нет способа передать это Claude Code без spec.

### Rating: 4/5

Сильный product research с реальными данными (AARP, Gold & Goblins, Cozy Merge). Конкретная progression chain животных — ценный вклад. Минус балл за отсутствие технической спецификации для анимации/звука и нет конкретных asset sources.

### Integration

**Самое важное изменение от Peer F:** Меняю свою art strategy с "geometric shapes" на "cute animals". Данные поддерживают это для целевой аудитории. Также добавляю в Day 1 technical spec:
- Touch targets: min 44px в CSS
- Font size: min 18px в GameConfig.ts
- Animation spec: merge = 0.2s scale-up (1.0 → 1.4 → 0.9 → 1.1) + particle burst 10-15 particles

---

## Ranking by Technical Rigor

1. **Peer E (COO)** — Единственный peer с конкретным day-by-day implementation plan + pass/fail gates + RACI + Phaser performance benchmarks. Это production-grade planning. Мой research дополняет его SDK specifics, его — дополняет мой physics deep dive.

2. **Peer D (CFO)** — Лучшие конкретные financial данные (CPMV benchmarks из реальных developer reports). Mathematical IAP vs Ads comparison. Sticky banner как third revenue stream. Actionable legal setup. Слабость — несколько unverified assumptions в probability estimates.

3. **Peer C (Devil's Advocate)** — Реальные данные (KvaytG 429₽, Drop Merge 2048 рейтинг 78, moderation timeline breakdown). Правильный critique о timeline реализма. Слабость — "жанр устарел" argument слабый для этой конкретной аудитории, и нет actionable альтернативы в рамках реальных constraints.

4. **Peer F (CPO)** — Сильные retention данные (AARP, Gold & Goblins, Cozy Merge). Конкретная animal progression chain. Слабость — нет технических spec для анимации/звука, нет конкретных asset sources. Product thinking без tech bridge.

5. **Peer B (CMO)** — Хороший research о механике платформы ("Новинки", ML-алгоритм, Card Completion Progress). Практические data points от реальных разработчиков. Слабость — нет технической стороны publishing pipeline, нет SDK dev workflow. Marketing без tech implementation.

---

## Biggest Gaps Across All Directors

### Gap 1: Нет сквозного technical spec для "wow moment"

Peer F (CPO) говорит "важна хорошая анимация", Peer B (CMO) говорит "важен CTR иконки", Peer E (COO) говорит "Kamil test: если он улыбается — работает". Но никто не дал передаваемый технический spec:
- Animation duration: 0.2s
- Easing: back.out (spring effect)
- Particle count: 12-15
- Sound: pop/bubble CC0 from Freesound
- Scale keyframes: [1.0, 1.4, 0.9, 1.1, 1.0]

Без этого spec Claude Code будет генерировать "что-то", а не "правильное". Этот spec — моя ответственность как CTO, и я не дал его в Round 1.

### Gap 2: Moderation first-pass strategy не разработана

Peer C (Devil's Advocate) дал timeline риск. Peer E (COO) дал checklist. Но никто не дал стратегию "как пройти модерацию с первой попытки с 90%+ вероятностью":
- Какие rejection причины самые частые?
- В каком порядке проверять требования?
- Есть ли Yandex developer support / chat для pre-submission review?

Это критический operational gap. Каждый rejection = +5 рабочих дней. Для 1-недельного проекта это провал timeline.

### Gap 3: Нет анализа mobile-first vs desktop-first

Peer E упомянул "portrait 480x640 для Yandex", Peer B говорит "Android = основной трафик". Но никто не дал конкретный Phaser canvas configuration:
- Что такое optimal canvas size для Yandex Games mobile?
- Как обрабатывать orientation change?
- Какие touch targets нужны (Peer F дала 44px — но это только часть ответа)?

Это технический gap, который влияет на Day 1 scaffold. Без правильного canvas setup придётся переделывать в Day 5.

---

## Revised Position (What I Now Believe Differently)

### 1. Art Strategy: Geometric Shapes → Cute Animals

**Изменение:** Моя оригинальная рекомендация "geometric shapes styled consistently" заменяется на "cute animals progression chain". Peer F предоставила данные (Cozy Merge 96% positive, AARP 55+ preference for familiar friendly characters), которые делают это не вкусовым выбором, а data-driven решением. С точки зрения build vs buy: Kenney.nl имеет animal sprite packs CC0 — это "buy" решение, не "build".

**Action:** Добавить в Day 4 asset plan: Kenney "Shape Animals" pack или Kenney "Animal Pack Redux" как primary source.

### 2. Timeline: 1 неделя → 3 недели total cycle

**Изменение:** Мой research фокусировался на 1-недельной разработке. Peer C и Peer E независимо показали: total cycle (dev + SDK + moderation) = 10-15 рабочих дней. Это не противоречие, это уточнение scope: разработка = 5-7 дней, но publication = +5-7 дней модерации. Планировать нужно 3 недели, не 1.

**Action:** В technical recommendations добавить timeline: Week 1 = dev, Week 2 = pre-submit QA + submission, Week 2-3 = moderation wait.

### 3. Sticky Banner как третий revenue stream

**Изменение:** Я рекомендовал interstitial + rewarded video. Peer D добавил sticky banner. При ~100 DAU разница невелика, но при 500+ DAU banner accumulates значительно. Это 2-3 часа дополнительной SDK работы с ненулевым ROI.

**Action:** Добавить `ysdk.adv.showBannerAdv()` в AdManager.ts на Day 3 SDK integration.

### 4. Pre-submit Checklist как Code Artifact

**Изменение:** Мой research дал pitfalls list. Peer E и Peer B показали что card completion + moderation requirements = specific technical checklist, который должен быть автоматически проверяемым. Это не "помнить о X" — это checklist в коде или в markdown, который проходится перед каждой submission.

**Action:** Создать `SUBMIT_CHECKLIST.md` в корне проекта как часть boilerplate.

### 5. Самозанятый регистрация = Day 0 prerequisite

**Изменение:** Я не включил это в технический план. Peer D и Peer E оба идентифицировали RSY account setup как блокирующий prerequisite. Без него revenue capability = 0 независимо от качества игры.

**Action:** Day 0 = legal/financial setup, не "начать писать код". Код начинается только когда RSY application submitted (не обязательно approved — это параллельно).

---

## Updated Technical Recommendations

### Revised Stack

```
Language:    TypeScript
Framework:   Phaser 3.90.0
Physics:     Matter.js (Phaser built-in)
Build:       Vite 5.x
Assets:      Kenney Animal Pack Redux (CC0) — not geometric shapes
Sound:       Freesound.org CC0 filter (pop/bubble sounds for merge)
SDK:         Yandex Games SDK (mandatory)
Deploy:      ZIP bundle
```

### Revised Build vs Buy

**Build:**
- Animal progression chain config (which animal merges into which)
- Scoring system with combo mechanics
- Game over detection with danger line
- Ad trigger placement logic (game over only, not forced)
- Merge animation spec (scale keyframes + particle params)

**Buy / Reuse:**
- Phaser 3 (framework)
- Matter.js (physics via Phaser)
- Kenney Animal Pack Redux (sprites — CC0, zero attribution)
- Freesound CC0 sounds (audio)
- Yandex Games SDK (mandatory platform SDK)
- sgbj/suika-clone structural reference (architecture pattern)

### Revised Timeline

| Phase | Duration | Owner | Gate |
|-------|----------|-------|------|
| Day 0 | Legal setup (самозанятый + RSY application) | Oleg | RSY application submitted |
| Day 1 | Scaffold + drop mechanic | Claude Code + Oleg | Objects fall with physics |
| Day 2 | Merge mechanic + animal progression | Claude Code + Kamil test | Merge loop works |
| Day 3 | SDK integration (interstitial + rewarded + banner) | Claude Code | Ads fire correctly with mock |
| Day 4 | Assets (Kenney animals) + sound + polish | Claude Code + Oleg | Game "looks good enough" |
| Day 5 | Mobile QA + pre-submit checklist | Oleg | All 15 checklist items green |
| Day 6 | Metadata generation + submission | Claude Code writes, Oleg approves | Submission confirmation email |
| Day 7-12 | Moderation wait + RSY verification | Async | Approval or rejection reason |
| Day 13+ | If rejected: targeted fix + resubmit | Oleg | Pass |

### First-Principles Check (Revised)

If building from scratch today:
1. TypeScript? YES — AI generates better typed code, no debate
2. Phaser? YES — confirmed by all 5 peers + my research, 5 open-source clones exist
3. Matter.js? YES — circles, gravity, zero config
4. Cute animals theme? YES — data from Peer F changes my previous "geometric shapes" answer
5. Open-source reference? YES — sgbj/suika-clone or buy Feronato source (Peer C's suggestion)
6. Ads only, no IAP? YES — Peer D's math confirms this for sub-500 DAU scale
7. Sticky banner? NOW YES — previously no, Peer D changed this

**All 7 answers: YES. Stack confirmed, one addition (sticky banner), one change (animals > geometry).**
