# Suteev Art Prompts — Мишкин Ляп

Промпты для генерации ассетов в стиле Владимира Сутеева.
Целевая модель: ChatGPT (DALL-E 3).

---

## Подход

**Формула каждого промпта:** `[Style Lock] + [Content]`

Style Lock — неизменяемый блок, копируется дословно. Content — описание конкретного ассета.

### Workflow
1. Скопировать Style Lock + Content нужного ассета в ChatGPT
2. Сгенерировать 2-3 варианта
3. Если стиль дрейфует — попросить ChatGPT "use gen_id XXXX as reference"
4. Когда результат устроит — сохранить gen_id как якорь
5. Все последующие генерации в этой сессии — ссылаться на якорный gen_id

### Советы по стабильности
- **Не менять ни слова** в Style Lock между запросами
- Если ChatGPT добавляет градиенты/тени — повторить: "strictly flat colors, no gradients, no shadows"
- Для листа персонажей — генерировать всех 8 одним запросом (лучше согласованность)
- Прозрачный фон: добавлять "transparent background, PNG" (или white bg и потом remove-bg)

---

## 1. STYLE LOCK (копировать дословно)

### Вариант A — Акварельный Сутеев (ОСНОВНОЙ)

```
Art style: Soviet children's book illustration inspired by Vladimir Suteev, with soft watercolor coloring. Hand-drawn warmth of 1960s USSR children's books meets gentle watercolor texture.

Technique: Confident dark brown outlines (not pure black — warm dark brown #3D2B1F), slightly varying in thickness like a real ink pen. Color fills are soft watercolor washes — gentle, slightly uneven, with subtle paper texture showing through. Colors blend softly at edges, with occasional lighter spots where watercolor naturally pools. NOT flat digital colors — real watercolor feel with warmth and imperfection.

Palette: Warm, muted, sun-faded watercolor tones. Each character has its own distinct color identity — sunflower yellow, warm brown, powder blue, orange tabby, caramel, red-orange, dark grey, rich brown. Overall palette feels like it's been painted on textured cream paper. Colors are soft and natural, never neon or oversaturated.

Character proportions: Large round head (1/3 of body height), huge expressive round eyes with visible black pupils, tiny simple nose, small curved mouth. Short rounded body, simplified stubby limbs. All animals are anthropomorphic — standing upright on two legs, with expressive hand gestures.

Mood: Cheerful, warm, cozy, nostalgic. Like opening a beloved old children's book with slightly yellowed pages. Characters look soft, huggable, and friendly.

Composition: Characters centered, simple poses, minimal or no background. Clean white/cream space around characters.

STRICTLY AVOID: photorealism, 3D rendering, sharp digital gradients, neon/saturated colors, detailed realistic fur, dark/moody lighting, complex backgrounds, anime style, modern vector art, plastic/glossy look.
```

### Вариант B — Строгий плоский Сутеев (запасной)

```
Art style: Soviet children's book illustration by Vladimir Suteev, 1960s USSR, Soyuzmultfilm animation aesthetic.

Technique: Thick bold black outlines (clean, confident, no variation in line weight). Flat solid color fills — absolutely NO gradients, NO shadows, NO textures, NO hatching. Colors are opaque and uniform within each shape, like silk screen printing or animation cel coloring.

Palette: Warm muted tones only — ochre (#D4A24C), terracotta/rust (#C44832), warm forest green (#4A7A30), sky blue (#8BAFC7), cream white (#F5EDD8), warm brown (#8A6420), sunflower yellow (#F0B832). Maximum 5-6 colors per illustration.

Character proportions: Large round head (1/3 of body height), huge expressive round eyes with visible black pupils, tiny simple nose, small curved mouth. Short rounded body, simplified stubby limbs. All animals are anthropomorphic — standing upright on two legs, with expressive hand gestures.

Mood: Cheerful, warm, innocent, safe. Characters look friendly and approachable. Expressions are simple and instantly readable — designed for 3-year-old children.

Composition: Characters centered, simple poses, minimal or no background. If background present — only a few simple lines suggesting ground. No complex perspective, no atmospheric effects.

STRICTLY AVOID: photorealism, 3D rendering, gradients, drop shadows, detailed fur textures, cross-hatching, dark/moody lighting, complex backgrounds, thin delicate lines, digital art glow effects.
```

---

## 2. ПЕРСОНАЖИ — Лист всех 8 (один запрос)

### Промпт: Character Sheet (все 8 в ряд)

```
[Вставить STYLE LOCK сверху]

Subject: A horizontal lineup of 8 cute anthropomorphic animal characters standing in a row, arranged from smallest (left) to largest (right). Each character faces forward with a friendly smile.

CRITICAL SPACING: Each character must be completely isolated with WIDE empty space between them. Minimum gap between any two characters = the width of the smallest character. No overlapping, no touching, no tails or ears crossing into neighbor's space. Think of it as 8 separate portraits placed side by side with generous margins — this image will be cut into individual sprites, so clean separation is essential.

White/transparent background.

Characters from left to right:

1. CHICK (Цыплёнок) — the tiniest, round yellow ball (#F0B832) with tiny wings, small orange beak, two dot eyes, tiny orange feet. Simple and round like a puffball.

2. HEDGEHOG (Ёжик) — small, round body with brown spiky back (#8A6420), cream belly, small black bead eyes, tiny triangular nose. Holding a small red apple.

3. BUNNY (Зайчик) — medium-small, light blue-grey (#8BAFC7) fur, long upright ears with pink insides, big round eyes, fluffy white belly, cheerful expression.

4. KITTEN (Котёнок) — medium, orange/rust (#E88C28) tabby with simple stripe marks, pointy ears, whiskers (3 lines each side), playful pose with one paw raised.

5. PUPPY (Собачка) — medium-large, warm brown (#C17A56) with floppy ears, big round shiny eyes full of curiosity, tongue slightly out, tail up.

6. FOX (Лисичка) — large, bright red-orange (#C03228) with white chest and tail tip, sharp triangular ears, sly half-smile, fluffy large tail.

7. WOLF (Волк) — large, dark grey (#4A4A50) with lighter belly, pointed ears, big yellow-amber eyes, slightly menacing but still cute, bushy tail.

8. BEAR (Мишка) — the largest, warm classic brown fur, round ears, big kind gentle eyes, cream muzzle, gentle smile, arms slightly open in welcoming gesture.

All 8 must share the exact same art style — thick black outlines, flat colors, same eye style, same level of detail. They should look like they belong in the same children's book.
```

---

## 3. ПЕРСОНАЖИ — Индивидуальные (для отдельных спрайтов)

### 3.1 Цыплёнок (Tier 1)

```
[STYLE LOCK]

Single character on white background. The tiniest character — a cute baby chick (цыплёнок) standing upright, facing the viewer. Almost perfectly round body shape, like a yellow puffball. Bright sunflower yellow (#F0B832) flat color. Tiny stubby wings at the sides. Small orange triangular beak. Two small round black dot eyes. Two tiny orange stick legs. A few small feather tufts on top of head. The simplest, most minimal character — maximum 3 colors (yellow, orange, black). Innocent and cheerful. Character should fit in a circle shape (important for game sprite).
```

### 3.2 Ёжик (Tier 2)

```
[STYLE LOCK]

Single character on white background. A small cute anthropomorphic hedgehog (ёжик) standing upright, facing the viewer. Round compact body. Brown spiky back (short triangular spikes in warm brown #8A6420, flat-colored, not detailed). Cream/beige round belly. Small black dot eyes, tiny triangular nose. Stubby short arms and legs. Holding a small red apple in both hands. Cheerful innocent expression. Character should fit in a circle shape (important for game sprite).
```

### 3.3 Зайчик (Tier 3)

```
[STYLE LOCK]

Single character on white background. A medium-small cute anthropomorphic bunny rabbit standing upright, facing the viewer. Soft blue-grey body (#8BAFC7). Long upright oval ears with pink insides. Big round eyes with large black pupils. Small pink triangular nose. White round belly patch. Short stubby arms held together at chest. Small cotton-ball tail visible slightly to one side. Happy gentle expression. Character should fit in a circle shape.
```

### 3.4 Котёнок (Tier 4)

```
[STYLE LOCK]

Single character on white background. A medium-sized cute anthropomorphic kitten standing upright, facing the viewer. Orange/rust colored (#E88C28) with 2-3 simple darker stripe marks on body. Pointy triangular ears with pink insides. Big round curious eyes. Small pink nose. Three simple whisker lines on each side. Short stubby arms, one paw raised playfully. Upright tail with slight curve. Playful happy expression. Character should fit in a circle shape.
```

### 3.5 Собачка (Tier 5)

```
[STYLE LOCK]

Single character on white background. A medium-large anthropomorphic puppy dog standing upright, facing the viewer. Warm brown fur (#C17A56) with lighter belly. Big floppy rounded ears hanging down. Huge round shiny eyes full of wonder and curiosity — the most expressive eyes of all characters. Small black round nose. Tongue slightly sticking out to one side. Tail pointing up happily. Joyful excited expression — this is the friendliest character. Character should fit in a circle shape.
```

### 3.6 Лисичка (Tier 6)

```
[STYLE LOCK]

Single character on white background. A large anthropomorphic fox standing upright, facing the viewer. Bright red-orange fur (#C03228) with white chest/belly area and white tail tip. Sharp pointed triangular ears. Almond-shaped clever eyes with a sly half-smile. Pointed snout. Large magnificent bushy tail taking up space behind the body. One paw raised as if scheming. Cunning but charming expression — classic fairytale trickster. Character should fit in a circle shape.
```

### 3.7 Волк (Tier 7)

```
[STYLE LOCK]

Single character on white background. A large anthropomorphic wolf standing upright, facing the viewer. Dark grey fur with lighter grey belly area. Pointed upright ears. Big round yellow-amber eyes. Long pointed snout with black nose. Visible but not scary teeth in a slight grin. Bushy grey tail. Strong but not threatening posture. Expression is tough but still endearing — a fairytale wolf who is more silly than scary, like in Soviet cartoons. Character should fit in a circle shape.
```

### 3.8 Мишка (Tier 8)

```
[STYLE LOCK]

Single character on white background. The largest character — a big friendly anthropomorphic bear standing upright, facing the viewer. Warm brown fur (classic bear brown, NOT green). Round small ears on top of large round head. Big kind gentle eyes. Large cream/beige round muzzle area with small nose. Big round belly. Short strong arms slightly open in a welcoming gesture. Short legs. The kindest, most gentle expression of all characters — this is "Uncle Bear", the protector. Character should fit in a circle shape.
```

---

## 4. UI АССЕТЫ

### 4.1 Название игры (Menu Title)

```
[STYLE LOCK]

Text logo for a children's mobile game called "Мишкин Ляп" (in Russian Cyrillic). The letters should be hand-drawn, chunky, rounded, slightly wobbly — as if drawn by a child with a thick marker. Each letter filled with flat warm ochre/golden color (#D4A24C) with thick black outline. Letters are slightly different sizes and tilted at playful angles. A small cute brown bear face peeking from behind or above the letter "М". Below in smaller text: "Mishkin Lyap" in Latin letters. Cream/white background. No 3D effects, no metallic, no glow — purely flat children's book style.
```

### 4.2 Кнопки меню

```
[STYLE LOCK]

A set of game UI buttons for a children's mobile game menu, Soviet children's book style. Each button is a rounded rectangle with warm brown outline and soft watercolor fill. No 3D bevel, no drop shadows.

Layout (top to bottom):
Row 1: "ИГРАТЬ" (Play) — large wide button, ochre/golden fill (#D4A24C), dark brown text. The main CTA, biggest button.
Row 2: "ЕЖЕДНЕВНАЯ" (Daily) — wide button, cream fill (#F5EDD8), dark text.
Row 3: "БЕЗ СТРЕССА" (No Stress) — wide button, cream fill, dark text.
Row 4: Two buttons side by side — "ЗВЕРЯТА" (Animals) and "РЕЙТИНГ" (Leaderboard), cream fill, dark text.
Row 5: Two buttons side by side — "ЗАДАНИЯ" (Missions) and "НАГРАДЫ" (Achievements), cream fill, dark text.
Row 6: "КОЛЕСО" (Wheel) — wide button, cream fill, dark text.

Text on buttons: hand-drawn chunky Cyrillic letters, slightly uneven, like from a children's book. Each button may have a tiny decorative element — a paw print, a star, a small animal silhouette.

Cream background (#F5EDD8). Warm watercolor feel matching the character style.
```

### 4.3 Контейнеры — три варианта (по режимам игры)

Каждый контейнер = 3 слоя: **фон** (за зверятами), **стенки** (левая + правая рамка), **дно**.

---

#### 4.3.1 ПОЛЯНКА — режим "Без стресса" (V-shape, легко)

**Фон полянки:**
```
[STYLE LOCK]

A simple background for a children's mobile game — a sunny meadow scene, vertical orientation (9:16), flat 2D side view.

- Upper 1/3: soft powder-blue sky with 2-3 simple white clouds (just rounded shapes, no detail)
- A few tree branches with green leaves hanging from the top corners, framing the scene naturally from above
- A tiny bird sitting on one branch, a small butterfly near another
- The CENTER and LOWER area must be completely EMPTY — this is the gameplay zone
- Overall feeling: warm sunny day on a meadow, safe, peaceful, open air

Soft watercolor feel. Cream-tinted paper texture. No complex detail. Think of the simplest Suteev outdoor scene — mostly open space with a few charming details at the edges.
```

**Левая стенка полянки (холмик):**
```
[STYLE LOCK]

A single grassy hill/mound, viewed from the side — flat 2D profile. This is the LEFT boundary of a game container.

Shape: A gentle slope rising from left to right, like the side of a small round hill. The hill rises steeply at the far left edge and then curves down gently toward the right, creating a natural valley entrance. Think of a cross-section of a gentle grassy mound.

Surface: Covered in warm green grass (#4A7A30) — simple short blades and curves. A few tiny wildflowers (red, yellow) growing on the slope. One small mushroom with a red cap near the base. Maybe a tiny snail or ladybug.

At the top of the hill: a small bush or a single simple tree (round green crown on a brown trunk).

The RIGHT side of the image should be EMPTY/TRANSPARENT — this is where the gameplay area begins.

Soft watercolor coloring, warm brown outlines. Transparent background. Generate in portrait orientation (1024x1792). The hill occupies the left ~30% of the image.
```

**Правая стенка полянки:**
```
[Same as left hill but MIRRORED — slope rises from right to left. A different small detail on top: maybe a flower bush instead of a tree, to avoid symmetry. A tiny hedgehog peeking from behind the bush. The LEFT side of the image should be EMPTY/TRANSPARENT.]
```

**Дно полянки:**
```
[STYLE LOCK]

A horizontal strip of lush meadow ground, flat 2D side view. This is the floor of a game play area.

Wide horizontal format (1792x1024), the ground strip occupying the bottom 1/4.

Layers from bottom to top:
- Rich brown earth band at the very bottom (#8A6420) with a few tiny pebbles
- Thick lush green grass growing upward — varied heights, simple triangular and curved blades in warm green (#4A7A30), some darker, some lighter
- Scattered tiny wildflowers: red poppies (#C44832), yellow buttercups (#F0B832), white daisies — each flower is just 4-5 simple circles
- Two small mushrooms with red caps and white dots (classic Suteev amanita)
- A tiny caterpillar on a grass blade, a ladybug on a leaf
- The grass is DENSE and cheerful — this is the richest, most alive part of the meadow

Soft watercolor coloring. Transparent background above the grass tops.
```

---

#### 4.3.2 СТВОЛ ДЕРЕВА — режим "Классика" (прямые стенки, нормально)

**Фон ствола:**
```
[STYLE LOCK]

The inside of a hollow tree trunk, viewed from the front — flat 2D, looking straight at the inner wall. This is a game background, vertical orientation (9:16).

- Light warm wood color (#E8D5A3) filling the entire image
- Subtle wood grain: gentle curved lines suggesting the inside of a large tree — annual growth rings visible as faint arcs
- A few darker knot marks scattered naturally
- Overall VERY subtle and calm — this is behind gameplay, must not distract
- At the very top: a glimpse of sky/daylight through the opening of the trunk, like looking up from inside a hollow tree

Soft watercolor texture on paper. Warm and cozy — like being inside a safe den. No complex detail, no dark shadows.
```

**Левая стенка (кора):**
```
[STYLE LOCK]

A vertical strip of tree bark, viewed from the front — flat 2D. This is the left wall of a hollow tree trunk game container.

Shape: Tall narrow strip (roughly 1:20 ratio), slightly irregular edges on the RIGHT side (the inside of the bark is never perfectly straight — gentle bumps and curves). The LEFT edge is straight (this is the screen edge).

Texture: Rich dark brown bark (#5A3A1A) with characteristic cracks and patterns — simple vertical lines and irregular rectangular bark plates. Drawn with thick warm brown outlines. A patch of green moss near the base. Maybe a tiny beetle on the bark. A small shelf mushroom (bracket fungus) growing from the bark near the middle.

At the top: the bark edge is slightly rounded and worn, with a tiny tuft of grass or a leaf growing from the top.

Soft watercolor coloring. Transparent background on the right side. Generate in portrait orientation (1024x1792).
```

**Правая стенка:**
```
[Same as left bark but MIRRORED — irregular edge is now on the LEFT side. Different small details: instead of moss, a tiny woodpecker hole. Instead of bracket fungus, a small ivy vine climbing up.]
```

**Дно ствола:**
```
[STYLE LOCK]

The bottom of a hollow tree trunk — flat 2D horizontal strip, viewed from the side. This is the floor of a game container.

Wide horizontal format (1792x1024), the floor occupying the bottom 1/4.

- Dark rich wood base at the very bottom — the tree's heartwood
- Covered with a layer of soft material: fallen leaves (orange, yellow, brown — simple oval shapes), pine needles, a few acorns
- Small patches of moss (muted green) growing between the leaves
- A tiny mushroom or two poking through the leaf litter
- Maybe a sleeping caterpillar curled in a leaf

Feeling: warm, soft, sheltered — like the cozy floor of a woodland den. Soft watercolor coloring. Transparent background above.
```

---

#### 4.3.3 БОЧОНОК МЁДА — режим "Ежедневная" (barrel/выпуклые стенки, средне+)

**Фон бочонка:**
```
[STYLE LOCK]

The inside of a wooden honey barrel, viewed from the front — flat 2D. This is a game background, vertical orientation (9:16).

- Warm golden-brown wooden planks (#C49A3C) running vertically — the inside of barrel staves
- Simple darker lines between each plank (gaps between staves)
- At the bottom area: a warm amber honey glow — a thin golden wash (#D4A24C) suggesting honey residue coating the lower part of the barrel
- Very subtle, very warm — should feel like being inside a cozy honey pot
- Overall CALM — must not distract from gameplay

Soft watercolor texture. Warm, golden, appetizing.
```

**Левая стенка (клёпка бочки):**
```
[STYLE LOCK]

A single barrel stave (wooden plank from a barrel), viewed from the front — flat 2D. This is the left wall of a honey barrel game container.

Shape: Tall narrow plank that CURVES OUTWARD — wider in the middle, narrower at top and bottom. This is the characteristic barrel shape. The curve is gentle (maybe 15-20% wider at the bulge than at the ends).

Material: Rich warm brown wood (#8A6420) with simple vertical grain lines. Thick dark brown outline.

Details:
- TWO horizontal metal hoops/bands crossing the stave — one near the top 1/4, one near the bottom 1/4. Each hoop is a simple flat grey-brown strip (#6A5A4A) with small rivet dots at the edges.
- Between the hoops, in the widest part: a drip of golden honey (#D4A24C) slowly running down the wood
- A tiny bee sitting on the honey drip or flying near the top

The RIGHT edge of the stave has the barrel curve. The LEFT edge is straight (screen edge).

Soft watercolor coloring. Transparent background on the right. Generate in portrait orientation (1024x1792).
```

**Правая стенка:**
```
[Same barrel stave but MIRRORED — curve on the LEFT side. Different detail: instead of one bee, maybe a small paw print in the honey (bear was here!). The honey drip runs from a different spot.]
```

**Дно бочонка:**
```
[STYLE LOCK]

The bottom of a honey barrel — flat 2D horizontal strip, viewed from the front. This is the floor of a game container.

Wide horizontal format (1792x1024), the floor occupying the bottom 1/4.

- Circular wooden barrel bottom — planks running horizontally with a darker center cross-piece
- Covered with a thin layer of golden honey (#D4A24C) — slightly uneven, thicker in the middle, with soft warm glow
- A few honey drips at the edges where the bottom meets the walls
- Small bubbles in the honey surface
- Maybe a tiny happy bee walking across the honey

Warm, golden, sticky, delicious feeling. Soft watercolor coloring. Transparent background above.
```

### 4.4 Травка / Земля (Ground Decoration)

```
[STYLE LOCK]

A horizontal strip of ground/grass decoration for the bottom of a game screen. Soviet children's book style.

- Simple green grass blades — just upward-pointing triangles/curves in warm green (#4A7A30)
- A few simple flowers: red (#C44832), yellow (#F0B832) — each flower is just 5 flat circles around a center
- One or two simple mushrooms with red caps and white dots
- Brown earth line at the base
- The whole strip is a flat decorative border, like from the bottom of a Suteev book page

Horizontal seamless pattern. White/transparent background above the grass. Flat colors, thick outlines, no gradients.
```

### 4.5 Фон игры (Game Background)

```
[STYLE LOCK]

A simple game background, vertical orientation (9:16 aspect ratio). Soviet children's book style.

- Solid cream/warm white base (#F5EDD8)
- Very minimal decoration at the edges only:
  - A few simple cloud shapes at the top (white with thin outline)
  - Two or three simple tree silhouettes at the far sides (warm green, flat)
  - A bird or butterfly in the corner (tiny, simple, 3-4 shapes total)
- The CENTER of the image must be completely empty/clean — this is where gameplay happens
- Mood: sunny, warm, peaceful meadow feeling

No complex scenes. No perspective. Just a gentle, minimal background that doesn't distract from gameplay. Think of the simplest Suteev page — mostly white space with a few elements at the margins.
```

---

## 5. ОПЦИОНАЛЬНЫЕ АССЕТЫ

### 5.1 Иконка приложения (App Icon)

```
[STYLE LOCK]

Square app icon (1:1 ratio) for a children's mobile game. A cute brown bear face (the main mascot) looking directly at viewer with a big warm smile. Cream/golden (#D4A24C) circular background behind the bear's head. Thick black outline around everything. The bear has: round head, small round ears, big kind eyes, cream muzzle, small black nose, gentle smile. Minimal — just the face, no body. Style exactly like a Vladimir Suteev character close-up. Flat colors, no gradients, no 3D effects.
```

### 5.2 Game Over экран (декорация)

```
[STYLE LOCK]

A decorative frame/border for a "Game Over" screen. Soviet children's book style. The frame is made of:
- Simple vine/branch pattern with leaves around the edges
- A few small animal silhouettes sitting on the branches (hedgehog, bunny, bird)
- The CENTER is empty (for score text overlay)
- Warm colors: brown branches, green leaves, ochre/golden accents
- A small sad-but-cute bear face at the top center, with slightly droopy expression (still adorable, not depressing)

Flat colors, thick outlines, no gradients. White/transparent background inside the frame.
```

---

## 6. КАРТА ЦВЕТОВ ДЛЯ СТИЛЯ

| Элемент | HEX | Описание |
|---------|-----|----------|
| Контуры | #1A1A1A | Толстый чёрный (не чисто #000000 — чуть мягче) |
| Охра/CTA | #D4A24C | Кнопки, акценты, золотые элементы |
| Красный | #C44832 | Лиса, ягоды, опасность |
| Зелёный | #4A7A30 | Трава, деревья |
| Голубой | #8BAFC7 | Зайчик, небо, вода |
| Крем/фон | #F5EDD8 | Основной фон |
| Коричневый тёплый | #8A6420 | Дерево, ёжик, стены |
| Жёлтый | #F0B832 | Цветы, звёзды, солнце |
| Серый тёмный | #4A4A50 | Волк |
| Коричневый тёплый (медведь) | #8B5E3C | Мишка — классический медвежий |

---

## 7. ЧЕКЛИСТ ГЕНЕРАЦИИ

### Итерация 1 — Стабилизация стиля
- [ ] Сгенерировать Character Sheet (все 8 в ряд) — 3 варианта
- [ ] Выбрать лучший, сохранить gen_id как "стилистический якорь"
- [ ] Сгенерировать Menu Title — 2-3 варианта, ссылаясь на якорный gen_id

### Итерация 2 — Индивидуальные спрайты
- [ ] Цыплёнок (tier 1) — 2-3 варианта
- [ ] Ёжик (tier 2)
- [ ] Зайчик (tier 3)
- [ ] Котёнок (tier 4)
- [ ] Собачка (tier 5)
- [ ] Лисичка (tier 6)
- [ ] Волк (tier 7)
- [ ] Мишка (tier 8)

### Итерация 3 — UI и окружение
- [ ] Кнопки меню
- [ ] Стакан/контейнер
- [ ] Травка/земля
- [ ] Фон игры
- [ ] Иконка приложения

### Итерация 4 — Полировка
- [ ] Game Over декорация
- [ ] Remove background (где нужно)
- [ ] Нарезка спрайтов по отдельным файлам
- [ ] Интеграция в игру

---

## 8. ЗАМЕТКИ

### Текущий стиль vs. Сутеев
Текущие спрайты — мягкий "plush toy" стиль с текстурами и пастельными цветами. Сутеев — жёстче, графичнее: толстый чёрный контур + плоская заливка, без текстур. Это существенная смена стилистики.

### Изменения в коде при смене персонажей
- Tier 1: hamster → chick (цыплёнок)
- Tier 2: bunny → hedgehog (ёжик)
- Tier 3: kitten → bunny (зайчик) — сдвиг
- Tier 4: cat → kitten (котёнок) — сдвиг
- Tier 7: panda → wolf (волк)
- Tier 8: bear остаётся, но цвет с зелёного на коричневый
- Затронутые файлы: `GameConfig.ts`, `PreloadScene.ts`, бестиарий, ачивменты, миссии, текст UI

### Размеры спрайтов
Текущие спрайты ~200-400px. Для Phaser оптимально генерировать 512x512 и скейлить вниз — так качественнее.

### Альтернатива ChatGPT
Если DALL-E не даёт стабильности — попробовать Midjourney с `--sref` (style reference). Midjourney v6 лучше держит стилистику через `--cref` и `--sref` флаги.
