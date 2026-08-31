# Исследование: Факторы залипательности для "Мишкин Ляп"

**Дата:** 2026-03-05
**Методология:** 5 параллельных скаутов (Exa + WebSearch), 30+ источников, 70+ фишек
**Контекст:** Drop-merge HTML5 игра, Yandex Games, ЦА 55+ женщины

---

## Факторы ранжирования

Каждая фишка оценена по 3 факторам:

| Фактор | Вес | Шкала |
|--------|-----|-------|
| **Retention Impact** | 40% | high (3) / medium (2) / low (1) |
| **Простота реализации** | 35% | simple (3) / medium (2) / hard (1) |
| **Fit для ЦА 55+** | 25% | high (3) / medium (2) / low (1) |

**Формула:** Score = Impact×0.4 + Simplicity×0.35 + Fit×0.25

---

## 1. ГЕЙМПЛЕЙ (15 фишек)

| # | Фишка | Описание | Пример | Impact | Простота | ЦА Fit | Score | Приоритет |
|---|-------|----------|--------|--------|----------|--------|-------|-----------|
| G1 | **Physics Unpredictability** | Объекты отскакивают и оседают по-разному каждый дроп. Variable rewards — одинаковый ввод, разный результат — #1 психологический драйвер "ещё разок". | Suika Game | high | simple | high | **3.00** | P0 |
| G2 | **Chain Reaction Cascades** | Один мердж вызывает другой, и ещё один. Каскады дают мощный дофаминовый всплеск. Игрок продолжает в надежде на "большой каскад". | Suika, 2048 | high | simple | high | **3.00** | P0 |
| G3 | **Gentle Failure Loop** | Нет жёсткого "GAME OVER". Мягкий звук, моментальная кнопка "Ещё разок". Никаких жизней и таймеров ожидания. Чем быстрее рестарт, тем длиннее сессия. | Suika, Flappy Bird | high | simple | high | **3.00** | P0 |
| G4 | **Escalating Spatial Tension** | Контейнер постепенно заполняется. Начало расслабленное, финал напряжённый. Естественная кривая сложности без искусственных уровней. Идеально для flow state. | Suika, Tetris | high | simple | high | **3.00** | P0 |
| G5 | **Near-Miss Effect** | Контейнер почти полон и игрок едва выживает, или два объекта почти сливаются. Springer: near-miss увеличивает фрустрацию И желание продолжить одновременно. | Candy Crush (изучено), Suika | high | medium | high | **2.65** | P0 |
| G6 | **Super Evolution Time (Combo Fever)** | При множественных мерджах подряд — спецрежим с изменённой музыкой, визуальными эффектами, бонусным множителем. Зрелищный момент, пиковый опыт. | Suika Game Planet | high | medium | medium | **2.40** | P1 |
| G7 | **Visible Evolution Hierarchy** | Чёткая визуальная лестница от мелкого до крупного. Каждый новый созданный зверь — milestone. Экран "коллекция" показывает всех открытых. | Suika (11 фруктов) | high | simple | high | **3.00** | P0 |
| G8 | **Next-Piece Preview** | Показ 1-2 следующих объектов. Даёт иллюзию стратегического контроля над хаотичной системой. Игрок чувствует себя умным — или винит невезение. Оба исхода → replay. | Suika, Tetris | medium | simple | high | **2.60** | P0 |
| G9 | **Daily Challenge / Seed-of-the-Day** | Одинаковый random seed для всех игроков каждый день. Честная конкуренция + причина вернуться завтра. Критично для D7/D30 retention. | Wordle | high | medium | medium | **2.40** | P1 |
| G10 | **Relaxation Mode (бесконечный режим)** | Отдельный режим без game over. Контейнер не переполняется. Для ЦА 55+ — zen-опыт без стресса. Увеличивает session length в 2-3x у старшей аудитории. | Suika "Endless" | medium | simple | high | **2.60** | P1 |
| G11 | **Undo / Save-Me** | Одна бесплатная отмена дропа за игру. Снижает фрустрацию для старших игроков. Rewarded ads за undo — высочайшая конверсия (эмоциональный момент). | Candy Crush | medium | simple | high | **2.60** | P1 |
| G12 | **Themed Cosmetic Skins** | Замена животных на матрёшек, цветы, сезонные. Разблокировка через игру. Косметика не влияет на геймплей, но даёт мотивацию коллекции. | Emoji Dropper | medium | medium | high | **2.35** | P1 |
| G13 | **Difficulty Adaptation** | Скорость падения и набор тиров мягко адаптируется к уровню игрока. Для ЦА 55+ — начальный темп на 20-30% медленнее. | JMIR study | medium | medium | high | **2.35** | P1 |
| G14 | **Tutorial Hints** | Если игрок долго не мержит — мягкая подсказка. Снижает порог входа для ЦА 55+. Исследование PMC: "frustration from confusion" — #1 причина оттока у старших. | PMC/NIH study | medium | simple | high | **2.60** | P1 |
| G15 | **Motivational Messages** | "Отлично!", "Какой мердж!" — комплименты при хороших действиях. PMC: повышают retention у 55+. Подача как "тренировка мозга" = ×2 мотивация у 50+. | PMC/NIH study | medium | simple | high | **2.60** | P1 |

---

## 2. ВИЗУАЛ И ОФОРМЛЕНИЕ (15 фишек)

| # | Фишка | Описание | Пример | Impact | Простота | ЦА Fit | Score | Приоритет |
|---|-------|----------|--------|--------|----------|--------|-------|-----------|
| V1 | **Squash & Stretch при падении** | Мишка сжимается при падении, расплющивается при приземлении, пружинит обратно. Принцип #1 классической анимации — ощущение веса и живости. | Suika Game | high | simple | high | **3.00** | P0 |
| V2 | **Particle burst при мерже** | Взрыв мягких частиц (звёздочки, сердечки) в момент слияния. Разлетаются радиально с ease-out. Самый эффективный juice по соотношению усилие/эффект. | Fruit Merge 2048 | high | simple | high | **3.00** | P0 |
| V3 | **Spawn bounce-in анимация** | Новый зверь после мержа "вырастает" из точки слияния (scale 0→1.1→1.0, ease-out-elastic). Подтверждает результат действия. | Suika clones | high | simple | high | **3.00** | P0 |
| V4 | **Анимированный счётчик очков** | Очки "набегают" анимацией (count-up). При крупном мерже — цифры увеличиваются и трясутся. Floating "+100" всплывает над точкой мержа. | PopCap Games | high | simple | medium | **2.75** | P0 |
| V5 | **Easing-анимации везде** | Все движения через easing, не линейные. Back.easeOut при появлении, ease-out для UI. Ощущение живого мира. | Boomie Studio | high | medium | high | **2.65** | P0 |
| V6 | **Color Progression (цветовая эволюция)** | Каждый уровень — свой цвет с нарастающей яркостью. Маленький = пастельный, большой = яркий. Визуальная иерархия и желание "дойти до следующего цвета". | Drop the Number | high | simple | high | **3.00** | P0 |
| V7 | **Combo escalation визуал** | При каскаде: каждый следующий мердж = больше частиц, ярче вспышка, нарастающий текст x2, x3. Самый залипательный визуальный момент. | Suika, Candy Crush | high | medium | medium | **2.40** | P1 |
| V8 | **Hit-stop (freeze frame)** | Пауза 2-4 кадра (50-80ms) при мерже. Ощущение "весомости" события. При цепных реакциях — каждый мердж слегка замедляет время. | Brawl Stars | medium | simple | medium | **2.35** | P1 |
| V9 | **Крупный высококонтрастный UI** | Кнопки 60px+, шрифты 18-22pt, контраст 7:1. Никаких мелких иконок без подписей. | PMC/NIH study | high | simple | high | **3.00** | P0 |
| V10 | **Живые idle-анимации мишек** | Мишки в контейнере моргают, покачиваются, улыбаются. Создаёт эмоциональную привязку — "они живые". | Merge Mansion | high | medium | high | **2.65** | P1 |
| V11 | **Мягкий screen shake** | Покачивание 1-3px при крупном мерже. Perlin noise, не Random. Для ЦА 55+ — минимальная амплитуда, с возможностью отключить. | Juice guides | medium | simple | medium | **2.35** | P1 |
| V12 | **Glow вокруг крупных зверей** | Высокоуровневые мишки получают мягкое свечение. Визуальная иерархия + ощущение "ценности". Тёплые тона (золотой). | Blood Moon | medium | medium | high | **2.35** | P1 |
| V13 | **White flash при мерже** | Короткая вспышка (50-100ms) белого/яркого цвета в точке слияния. Привлекает внимание на периферии. | flowlab.io | medium | simple | medium | **2.35** | P1 |
| V14 | **Trail/шлейф при падении** | Лёгкий визуальный шлейф при падении. Подчёркивает движение. Помогает ЦА 55+ отслеживать действие. | GitHub Juice Checklist | medium | simple | high | **2.60** | P1 |
| V15 | **Подсказки при застревании** | Если игрок долго не действует — мягкая визуальная подсказка (подсветка пары для мержа). | PMC/NIH | medium | medium | high | **2.35** | P1 |

---

## 3. СКОРИНГ И ПРОГРЕССИЯ (13 фишек)

| # | Фишка | Описание | Пример | Impact | Простота | ЦА Fit | Score | Приоритет |
|---|-------|----------|--------|--------|----------|--------|-------|-----------|
| S1 | **Combo Score Multiplier** | Последовательные мерджи без паузы: x2, x3, x4... Визуальный feedback. Увеличивает session length — игрок хочет побить свой combo-рекорд. | Suika, Tetris, 2048 | high | simple | medium | **2.75** | P0 |
| S2 | **Personal Best + "Beat Your Record"** | Персональный рекорд + явный UI "Ваш рекорд: 12,450 — побейте!" Простая мотивация без соцдавления. | Suika, Temple Run | medium | simple | high | **2.60** | P0 |
| S3 | **Escalating Daily Rewards** | Ежедневная награда растёт с каждым днём подряд. Календарный UI показывает прогресс. Формирует привычку возвращаться. | Candy Crush, Monopoly Go | high | simple | high | **3.00** | P0 |
| S4 | **Streak Shield (мягкий streak)** | При пропуске дня streak не сбрасывается полностью — "заморозка" 1 день (бесплатно раз в неделю). Критично для ЦА 55+: жёсткий reset вызывает отток. | Duolingo | high | simple | high | **3.00** | P0 |
| S5 | **Коллекционный альбом мишек** | Игрок собирает стикеры/карточки в тематический альбом. Новые выпадают за достижения. Завершение страницы = бонус. Особенно сильно у женской ЦА. | Monopoly Go, Wordscapes | high | medium | high | **2.65** | P0 |
| S6 | **Ежедневные миссии (3 штуки)** | "Сделай 5 мерджей медведей", "Набери 5000", "Сыграй 3 раунда". Все 3 = бонусный сундук. Даёт структуру сессии. | Royal Match | high | medium | high | **2.65** | P0 |
| S7 | **Variable Ratio Mystery Rewards** | Случайные бонусы после мержа (иногда x2, иногда ничего, иногда редкий стикер). Непредсказуемость = "just one more try". Самый устойчивый паттерн по Скиннеру. | Candy Crush | high | simple | medium | **2.75** | P0 |
| S8 | **Milestone Achievements** | "Первый мердж", "100 мерджей", "Создай Медведя", "50,000 за карьеру". Каждое = стикер + бонус. Прогрессия даже в бесконечной игре. | Xbox Achievements | medium | simple | high | **2.60** | P0 |
| S9 | **Bracket Leaderboard (мини-таблица)** | Соревнование в группе 50-100 случайных игроков, не глобально. Реалистичная конкуренция, можно быть в топ-10. Еженедельный сброс. | Candy Crush, Royal Match | high | medium | medium | **2.40** | P1 |
| S10 | **Тематические сезонные события** | "Новогодний мишка", "Весенний мишка" — ограниченные коллекционные звери/темы. FOMO + свежесть контента. | Candy Crush, Monopoly Go | high | hard | high | **2.30** | P1 |
| S11 | **Prestige / "Новый Домик"** | После порога (50K очков за карьеру) — "новый домик для мишек" с визуальными улучшениями. Мягкий prestige без потери прогресса. | Cookie Clicker, Wordscapes | medium | medium | medium | **2.10** | P2 |
| S12 | **Lucky Spin / Колесо удачи** | Раз в день бесплатный спин. Доп. спин за рекламу. Appointment mechanic — причина зайти сегодня. | Coin Master | medium | simple | high | **2.60** | P1 |
| S13 | **Social Gifting** | Отправить другу стикер/жизнь. Async. Создаёт взаимные обязательства. Особенно эффективно в ЦА 55+ (подруги, семья). | Candy Crush, Monopoly Go | high | hard | high | **2.30** | P2 |

---

## 4. ЗВУК И АУДИО (13 фишек)

| # | Фишка | Описание | Пример | Impact | Простота | ЦА Fit | Score | Приоритет |
|---|-------|----------|--------|--------|----------|--------|-------|-----------|
| A1 | **Escalating Pitch при комбо** | При каждом последовательном мерже тон повышается на полтона. Мозг воспринимает восходящий pitch как нарастание награды — стремится продолжить цепочку. | Candy Crush, Suika | high | simple | high | **3.00** | P0 |
| A2 | **Randomized Micro-Variation** | 3-5 вариантов каждого звука с pitch ±2-5%. Предотвращает auditory habituation (привыкание). "Мозг любит вариации, даже когда не замечает". | CreatorSoundsPro | high | simple | high | **3.00** | P0 |
| A3 | **Immediate Audio Response** | Звук на input, НЕ на завершение анимации. Мозг обрабатывает аудио быстрее визуала — звук <200ms создаёт "мгновенность". Фундамент "отзывчивости". | SpeeQual Games | high | simple | high | **3.00** | P0 |
| A4 | **ASMR-текстуры (тактильные звуки)** | Шорох плюша, мягкое "пуф" при мерже, шуршание — close-mic для ASMR-эффекта. Water Match в топе US Free Charts благодаря ASMR. Для ЦА 55+ женщин — идеальное попадание. | Water Match | high | medium | high | **2.65** | P0 |
| A5 | **Emotional Tagging** | Стабильный звук при успехе → мозг ассоциирует этот звук с удовлетворением. Мелодия победы "звучит в голове" после сессии, вызывая желание вернуться. Earworm. | GameGrin analysis | high | simple | medium | **2.75** | P0 |
| A6 | **Operant Conditioning Chimes** | Приятный звук сразу после правильного действия = оперантное обусловливание. Подсознательное стремление повторить, чтобы снова услышать награду. | SpeeQual Games | high | simple | medium | **2.75** | P0 |
| A7 | **Flow-Sustaining Ambient Loops** | Стабильный ритм, предсказуемые эмбиент-петли = "безопасная" ментальная среда. Влияет на восприятие времени — игрок не замечает, как прошёл час. | Indiana Univ. study | high | simple | high | **3.00** | P0 |
| A8 | **Anticipation Loops** | Восходящие мотивы создают ожидание разрешения. Мозг ищет "закрытие" — игрок доигрывает раунд, чтобы услышать завершающий аккорд. | Tetris, match-3 | high | medium | medium | **2.40** | P1 |
| A9 | **Multi-Layer Sound Stacking** | Одно действие = 3-5 слоёв: "шлёп" + "пузырь" + "подтверждение". Каждый слой усиливает значимость без увеличения громкости. | BOOM Library | medium | medium | medium | **2.10** | P1 |
| A10 | **Pitch-Coded Status Signals** | Высокий тон = успех, низкий = неудача. Игроки бессознательно учат паттерны. Снижает когнитивную нагрузку от UI. | UX Collective | medium | simple | high | **2.60** | P1 |
| A11 | **Audio Priority Hierarchy** | Приоритеты: действия игрока > угрозы > UI > эмбиент. Низкие приоритеты авто-ducking. Нет звукового хаоса — критично для ЦА 55+. | BOOM Library | medium | medium | high | **2.35** | P1 |
| A12 | **Adaptive Music (реагирует на геймплей)** | Музыка меняет темп/слои по состоянию (спокойно = мягко, комбо = энергично). Generative music увеличивает Flow State (Indiana Univ.). Для мишек: тихий вальс → весёлая полька. | Sites & Potter 2018 | high | hard | high | **2.30** | P2 |
| A13 | **Seasonal Audio Events** | Сезонные мелодии (Новый Год, весна). Metacore: рождественская мелодия — самое успешное органическое видео за год. Эмоциональные привязки к праздникам. | Merge Mansion | medium | hard | high | **1.85** | P2 |

---

## 5. СОЦИАЛ И МОНЕТИЗАЦИЯ (13 фишек)

| # | Фишка | Описание | Пример | Impact | Простота | ЦА Fit | Score | Приоритет |
|---|-------|----------|--------|--------|----------|--------|-------|-----------|
| M1 | **Rewarded Video Ads** | 15-30с видео добровольно = бонус. Retention +20% vs forced interstitials. Yandex SDK нативно. "Посмотри видео — получи подсказку для мишки." | Yandex SDK | high | simple | high | **3.00** | P0 |
| M2 | **Loss Aversion Retry** | При проигрыше: "Продолжить за рекламу/монеты?" Чем ближе был к рекорду, тем сильнее loss aversion. Высочайшая конверсия rewarded ads. | Candy Crush | high | simple | medium | **2.75** | P0 |
| M3 | **Fake/Post-Level Leaderboards** | После раунда — таблица с ботами/реальными игроками. Imagined competition. Сравнение с "Мария П." мотивирует ЦА 55+. Yandex Leaderboard API. | Yandex Games SDK | high | simple | high | **3.00** | P0 |
| M4 | **Daily Streaks** | Каждый день входа = награда. 7-й день = big reward. Duolingo: streaks — самый мощный daily retention. "Мишка скучает — зайди 7 дней подряд!" | Duolingo | high | simple | high | **3.00** | P0 |
| M5 | **Share Screenshot/Result** | Кнопка "Поделиться" — красивая картинка + ссылка. Web-игра = instant play по ссылке = нет барьера скачивания. | Yellow Panda | medium | simple | medium | **2.35** | P1 |
| M6 | **Progress Bars и Levels** | Визуальный прогресс к следующей награде. Прогресс intrinsically satisfying. "Коллекция мишек" заполняется по мере игры. | Candy Crush | medium | simple | high | **2.60** | P0 |
| M7 | **Badges & Achievements** | Цифровые трофеи за вехи. Yandex Games SDK поддерживает achievements нативно. Tiered badges для долгосрочного усилия. | GamePush docs | medium | simple | high | **2.60** | P1 |
| M8 | **FOMO: Limited-Time Events** | Сезонные мишки, weekend-челленджи. "Рождественский мишка доступен ещё 3 дня!" Для ЦА 55+ — мягкий FOMO без агрессии. | Candy Crush | high | medium | medium | **2.40** | P1 |
| M9 | **1v1 Async Competitions** | Счёт сравнивается с другим игроком (не realtime). 75% casual puzzles в US top-200 используют, но только 15% внедрили 1v1 — огромный незанятый потенциал. | GameRefinery 2024 | high | medium | medium | **2.40** | P1 |
| M10 | **Soft Currency + Cosmetic IAP** | Монетки за прохождение + магазин костюмов/фонов. Цены $0.99-$4.99. Scarcity через time-limited skins. | Yandex IAP API | medium | medium | medium | **2.10** | P2 |
| M11 | **Gifting / Помощь друзьям** | Отправить подарок другу async. Reciprocity — получив подарок, человек чувствует обязательство вернуться. Соцсвязи = главный мотиватор для ЦА 55+. | Candy Crush | high | hard | high | **2.30** | P2 |
| M12 | **Teams / Clubs** | Persistent группы с общими целями. "Клуб рукодельниц". Peer pressure + unspoken performance standards. | Gamigion Tier 3 | high | hard | high | **2.30** | P2 |
| M13 | **Ad Caching + Multiple Networks** | Кешировать рекламу заранее. Задержка загрузки = закрытие приложения. Техническая, но критичная для ARPDAU. | Yandex recommendations | medium | simple | medium | **2.35** | P1 |

---

## 6. ПСИХОЛОГИЯ И ПОВЕДЕНИЕ (14 фишек)

| # | Фишка | Описание | Научная основа | Применение | Impact | Score | Приоритет |
|---|-------|----------|----------------|------------|--------|-------|-----------|
| P1 | **Flow State** | Баланс сложности/навыка удерживает в "тоннеле". Контейнер заполняется → давление растёт органически. | Csikszentmihalyi 1990, GameFlow 2005 | Адаптивная скорость для ЦА 55+ (−20-30% начальный темп) | high | **3.00** | P0 |
| P2 | **Variable Ratio Reinforcement** | Непредсказуемость награды = максимальная вовлечённость. Дофамин от ОЖИДАНИЯ, не от самой награды. | Skinner 1957, Schultz 1997 | Рандом следующего мишки + цепные реакции + "золотой мишка" (5%) | high | **3.00** | P0 |
| P3 | **Near-Miss Effect** | "Почти победил" вызывает фрустрацию + непреодолимое желание повторить. Сильнее полного проигрыша. | Larche 2016 (Springer), Clark 2009 | При game over: "До следующего мерж-уровня не хватило ОДНОГО!" | high | **2.65** | P0 |
| P4 | **Loss Aversion** | Потеря ощущается в 2x сильнее эквивалентного выигрыша. Игроки продолжают, чтобы не потерять прогресс. | Kahneman & Tversky 1979 | Серия дней "Мишкина неделька" — пропуск = потеря серии (мягко) | high | **2.65** | P0 |
| P5 | **Zeigarnik Effect** | Незавершённые задачи занимают мысли и создают напряжение. Игрок помнит о незакрытой коллекции и возвращается. | Zeigarnik 1927, Masicampo 2011 | Push: "Мишка-панда ждёт пару!" + Пустые силуэты в коллекции | high | **2.65** | P0 |
| P6 | **Hook Model (Цикл крючка)** | Trigger → Action → Variable Reward → Investment. С каждым циклом привычка усиливается. | Nir Eyal, "Hooked" 2014 | Push "Подарочный мишка ждёт!" → 1 нажатие → случайный бонус → коллекция | high | **2.40** | P1 |
| P7 | **Completionism / Set Completion** | Врождённое желание завершить набор. 9 из 10 = физический дискомфорт. Особенно выражено у женщин 55+. | Possler 2017 (HCI), Bartle types | Тематические коллекции: "Лесные" (5), "Морские" (7). Силуэты несобранных. | high | **2.65** | P0 |
| P8 | **Endowed Progress Effect** | Люди мотивированнее, если часть задачи уже сделана. Карточка 10 штампов с 2 готовыми > чистая на 8. | Nunes & Dreze 2006 | Коллекция мишек — 2 уже "подарены" при первом запуске | medium | **2.60** | P1 |
| P9 | **Goal-Gradient Effect** | Чем ближе к цели — тем энергичнее действие. Прогресс-бар на 80% мотивирует сильнее, чем на 20%. | Hull 1932, Kivetz 2006 | Анимация "Почти собрали!" при 1-2 мишках до завершения коллекции | medium | **2.35** | P1 |
| P10 | **Sunk Cost Fallacy** | Чем больше вложено — тем сложнее бросить. | Arkes & Blumer 1985, Thaler 2015 | Статистика: "С вами 47 дней, собрано 23 мишки, рекорд 12,450" | high | **2.40** | P1 |
| P11 | **IKEA Effect** | Люди ценят то, что создали сами, непропорционально выше. | Norton 2012 | "Мишкарий" — витрина с расставленными мишками, кастомизация фона | medium | **2.10** | P2 |
| P12 | **Peak-End Rule** | Опыт оценивается по пику + финалу, не по среднему. Красивый конец = позитивное воспоминание = возврат. | Kahneman 1993 | Замедленная анимация последнего мержа. "Лучший момент сессии". Тёплое "Отличная игра!" | medium | **2.35** | P1 |
| P13 | **Social Proof / Soft Competition** | Мягкое сравнение мотивирует без агрессии. Для ЦА 55+ — "совместность", не конкуренция. | Cialdini 1984, AARP 2023 | Лидерборд "подруг". "Я собрала 5 мишек за одну игру!" | medium | **2.35** | P1 |
| P14 | **Cute Aggression** | Нейрологическая реакция на милые объекты → желание взаимодействовать. Мишки ДОЛЖНЫ быть очень милыми. | Aragón 2015 (Psych Science), Norman 2004 | Большие глаза, мягкие формы, ASMR-звуки при мерже. | high | **3.00** | P0 |

---

## СВОДНАЯ ТАБЛИЦА: TOP-20 ПО SCORE

| Rank | ID | Фишка | Блок | Score | Sprint |
|------|----|-------|------|-------|--------|
| 1 | G1 | Physics Unpredictability | Геймплей | 3.00 | **Есть** |
| 2 | G2 | Chain Reaction Cascades | Геймплей | 3.00 | **Есть** |
| 3 | G3 | Gentle Failure Loop | Геймплей | 3.00 | **Sprint 1** |
| 4 | G4 | Escalating Spatial Tension | Геймплей | 3.00 | **Есть** |
| 5 | G7 | Visible Evolution Hierarchy | Геймплей | 3.00 | **Sprint 1** |
| 6 | V1 | Squash & Stretch | Визуал | 3.00 | **Sprint 1** |
| 7 | V2 | Particle burst при мерже | Визуал | 3.00 | **Частично** |
| 8 | V3 | Spawn bounce-in | Визуал | 3.00 | **Есть** |
| 9 | V6 | Color Progression | Визуал | 3.00 | **Есть** |
| 10 | V9 | Крупный UI | Визуал | 3.00 | **Есть** |
| 11 | S3 | Daily Rewards | Скоринг | 3.00 | **Sprint 2** |
| 12 | S4 | Streak Shield | Скоринг | 3.00 | **Sprint 2** |
| 13 | A1 | Escalating Pitch | Звук | 3.00 | **Sprint 1** |
| 14 | A2 | Randomized Variation | Звук | 3.00 | **Sprint 1** |
| 15 | A3 | Immediate Audio Response | Звук | 3.00 | **Sprint 1** |
| 16 | A7 | Ambient Loops | Звук | 3.00 | **Sprint 1** |
| 17 | M1 | Rewarded Video Ads | Монетизация | 3.00 | **Sprint 2** |
| 18 | M3 | Leaderboards | Монетизация | 3.00 | **Sprint 2** |
| 19 | M4 | Daily Streaks | Монетизация | 3.00 | **Sprint 2** |
| 20 | P14 | Cute Aggression (милота) | Психология | 3.00 | **Есть** |

---

## ROADMAP: Sprints

### Sprint 1: Game Juice + Sound Foundation
**Цель:** Сделать ядро залипательным

| ID | Фишка | Тип |
|----|-------|-----|
| V1 | Squash & Stretch при падении/приземлении | Visual |
| V4 | Анимированный счётчик + floating numbers | Visual |
| V7 | Combo escalation визуал (x2, x3...) | Visual |
| A1 | Escalating pitch при комбо | Audio |
| A2 | Randomized sound variations | Audio |
| A3 | Immediate audio response | Audio |
| A7 | Ambient music loop | Audio |
| A4 | ASMR-текстуры (пуф, шорох) | Audio |
| S1 | Combo Score Multiplier | Scoring |
| G7 | Экран "коллекция" открытых зверей | Gameplay |
| G5 | Near-miss visual cues при game over | Gameplay |
| G3 | Gentle failure: мотивационные сообщения | Gameplay |
| G15 | "Отлично!", "Какой мердж!" | Gameplay |

### Sprint 2: Retention Loop
**Цель:** Привычка возвращаться каждый день

| ID | Фишка | Тип |
|----|-------|-----|
| S3 | Daily Rewards (эскалация) | Progression |
| S4 | Streak Shield (мягкий streak) | Progression |
| S6 | Ежедневные миссии (3 шт) | Progression |
| S8 | Milestone Achievements | Progression |
| M1 | Rewarded Video Ads (Yandex SDK) | Monetization |
| M2 | Loss Aversion Retry (продолжить за рекламу) | Monetization |
| M3 | Leaderboard (Yandex API) | Social |
| M4 | Daily Streaks UI | Engagement |
| M6 | Progress Bars | UI |

### Sprint 3: Collection Meta + Social
**Цель:** Долгосрочная мотивация

| ID | Фишка | Тип |
|----|-------|-----|
| S5 | Коллекционный альбом мишек | Meta |
| S7 | Variable Ratio Mystery Rewards | Engagement |
| G9 | Daily Challenge / Seed-of-the-Day | Gameplay |
| G10 | Relaxation Mode (бесконечный) | Gameplay |
| G11 | Undo/Save-Me (1 раз за игру) | Gameplay |
| V10 | Idle-анимации мишек (моргание) | Visual |
| M5 | Share Screenshot | Social |
| M7 | Badges & Achievements | Social |
| P6 | Hook Model: push-уведомления | Engagement |

### Sprint 4: LiveOps + Advanced
**Цель:** Масштабирование и свежесть

| ID | Фишка | Тип |
|----|-------|-----|
| S10 | Сезонные события | LiveOps |
| G12 | Themed Cosmetic Skins | Cosmetics |
| A12 | Adaptive Music | Audio |
| M8 | FOMO: Limited-Time Events | LiveOps |
| M9 | 1v1 Async Competitions | Social |
| S12 | Lucky Spin / Колесо удачи | Engagement |
| M11 | Gifting / Помощь друзьям | Social |
| M12 | Teams / Clubs | Social |

---

## Ключевые источники

### Академические
- Csikszentmihalyi M. "Flow" (1990)
- Kahneman & Tversky "Prospect Theory" (1979)
- Larche et al. "Near-misses in Candy Crush" (2016, Springer)
- Nunes & Dreze "Endowed Progress Effect" (2006)
- Aragón et al. "Cute Aggression" (2015, Psychological Science)
- Sites & Potter "Everything Merges with the Game" (2018, Game Studies)
- PMC/NIH "Mobile Game Design for Middle-Aged and Older Adults" (2020)
- Possler et al. "Silver Gamers' Motivation" (2017, HCI International)
- Nir Eyal "Hooked" (2014)

### Индустрия
- GameRefinery "1v1 Events in Casual Puzzle Genre" (2024)
- Gamigion (множество статей: collectible albums, daily missions, social gameplay)
- Adrian Crook "How Leaderboards Impact Retention"
- CreatorSoundsPro "Game Juice Sound Design" (2026)
- SpeeQual Games "Psychology Behind Audio Feedback" (2025)
- Metacore "Merging Sound and Narrative" (2025)
- Yandex Games SDK docs (monetization, leaderboards)
- Blood Moon Interactive "Juice in Game Design"

### Конкурентный анализ
- Suika Game / Suika Game Planet (Nintendo Switch)
- Candy Crush (King)
- Merge Mansion (Metacore)
- Monopoly Go (Scopely)
- Water Match - ASMR Water Sort
- Wordle (NYT)
- Duolingo (streak system)
