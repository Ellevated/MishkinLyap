# Visual System: Мишкин Ляп (Mishkin Lyap)

**Generated:** 2026-03-04
**Palette:** C: Бленд (Чарушин-фоны + Сутеев-акценты)
**Typography:** B: Marmelad (display) + Nunito (body)

---

## Color Palette

### Primary

| Role | HEX | OKLCH | Usage |
|------|-----|-------|-------|
| Brand (Ochre) | #D4A24C | oklch(74% 0.12 75) | CTA кнопки, прогресс-бары, акценты |
| Brand Light | #E8C47A | oklch(83% 0.10 80) | Hover, highlights, панели |
| Brand Dark | #8A6420 | oklch(52% 0.11 70) | Active/pressed, подчёркивания |
| Accent (Soviet Red) | #C44832 | oklch(52% 0.17 28) | Danger, жизни, акцентные элементы |

### Neutrals (Cream-Warm)

| Step | HEX | OKLCH | Usage |
|------|-----|-------|-------|
| 50 (Cream Paper) | #F5EDD8 | oklch(95% 0.03 85) | Основной фон игрового поля |
| 100 (Warm Linen) | #F0E5CA | oklch(93% 0.04 82) | Карточки, оверлеи |
| 200 (Birch Bark) | #EDE0C4 | oklch(91% 0.04 80) | Разделители, бордеры |
| 300 (Sand) | #D6C6A9 | oklch(83% 0.04 78) | Границы, неактивные элементы |
| 500 (Warm Brown) | #8B6040 | oklch(52% 0.08 60) | Вторичный текст на cream |
| 500-alt (Deep Brown) | #7A5030 | oklch(46% 0.08 55) | Вторичный текст на birch (WCAG fix) |
| 700 (Charcoal) | #4A3728 | oklch(32% 0.05 50) | Третичный текст |
| 900 (Ink Brown) | #3D2B1F | oklch(27% 0.05 45) | Основной текст, заголовки |

### Semantic

| Role | HEX | OKLCH | FG Color | Usage |
|------|-----|-------|----------|-------|
| Success | #4A7A30 | oklch(52% 0.12 135) | White | Подтверждения, merge-эффекты |
| Error | #C44832 | oklch(52% 0.17 28) | White | Ошибки, Game Over |
| Warning | #F0B832 | oklch(80% 0.14 85) | Ink Brown | Предупреждения |
| Info | #4A7A9C | oklch(54% 0.08 230) | White | Подсказки, туториал |

### Animal Tier Colors (Сутеев-палитра)

| Tier | Animal | HEX | OKLCH | Silhouette |
|------|--------|-----|-------|------------|
| 1 | Хомячок | #F0B832 | oklch(80% 0.14 85) | Круглый, маленький |
| 2 | Зайчик | #8BAFC7 | oklch(73% 0.06 230) | Уши вверх |
| 3 | Котёнок | #E88C28 | oklch(68% 0.14 65) | Треугольные уши |
| 4 | Кошка | #9B6BA0 | oklch(54% 0.10 310) | Грациозный |
| 5 | Собачка | #C17A56 | oklch(60% 0.10 50) | Висячие уши |
| 6 | Лисичка | #C03228 | oklch(48% 0.17 25) | Острая морда |
| 7 | Панда | #3D2B1F | oklch(27% 0.05 45) | Круглые уши, пятна |
| 8 | Мишка | #5A8C3C | oklch(57% 0.12 140) | Большой, округлый |

**Правило:** Каждый зверь отличается и цветом, и силуэтом (для дальтоников).

### Dark Mode Mapping

| Element | Light | Dark |
|---------|-------|------|
| Background | #F5EDD8 | #2A1E14 |
| Surface | #EDE0C4 | #3D2B1F |
| Border | #D6C6A9 | #5A4030 |
| Text Primary | #3D2B1F | #F5EDD8 |
| Text Secondary | #8B6040 | #C8A878 |
| Brand (Ochre) | #D4A24C | #E8B860 (lightness +10%) |

---

## Typography

### Font Pair

| Role | Font | Weight | Google Fonts |
|------|------|--------|--------------|
| Display | Marmelad | 400 (single weight) | [Marmelad](https://fonts.google.com/specimen/Marmelad) |
| Body / UI | Nunito | 400, 600, 700, 800 | [Nunito](https://fonts.google.com/specimen/Nunito) |

**Fallback stack:**
- Display: `'Marmelad', 'Comfortaa', 'Nunito', sans-serif`
- Body: `'Nunito', 'PT Sans', system-ui, sans-serif`

**Почему Marmelad:** Мягкий, рукодельный кириллический шрифт. Ощущение детской книжки без потери разборчивости. Один вес (400) — но для display этого достаточно.

**Почему Nunito:** Округлые формы, высокая x-высота, множество начертаний. Идеальная читаемость для ЦА 55+.

### Scale (увеличенный для 55+ аудитории)

| Level | Size | Line Height | Font | Weight | Usage |
|-------|------|-------------|------|--------|-------|
| Score | 48px | 1.1 | Marmelad | 400 | Текущий счёт |
| H1 | 36px | 1.2 | Marmelad | 400 | Экран Game Over, заголовок |
| H2 | 28px | 1.3 | Marmelad | 400 | Подзаголовки |
| H3 | 22px | 1.3 | Nunito | 700 | UI элементы |
| Body | 18px | 1.5 | Nunito | 400 | Основной текст |
| Button | 18px | 1.2 | Nunito | 700 | Кнопки CTA |
| Caption | 16px | 1.4 | Nunito | 400 | Вторичный текст |
| Small | 14px | 1.4 | Nunito | 600 | Лейблы, бейджи |

**Правило:** Минимальный размер читаемого текста = 14px. Body = 18px (не 16px — запас для ЦА).

---

## Accessibility Validation (WCAG 2.2 AA)

### Validated Combinations

| Combo | Foreground | Background | Ratio | Required | Pass |
|-------|-----------|------------|-------|----------|------|
| Body on cream | #3D2B1F | #F5EDD8 | 11.5:1 | >=4.5:1 | AAA |
| Body on birch | #3D2B1F | #EDE0C4 | 10.3:1 | >=4.5:1 | AAA |
| Sec text on cream | #8B6040 | #F5EDD8 | 4.7:1 | >=4.5:1 | AA |
| Sec text on birch | #7A5030 | #EDE0C4 | 5.3:1 | >=4.5:1 | AA |
| CTA: Ink on Ochre | #3D2B1F | #D4A24C | 5.8:1 | >=4.5:1 | AA |
| CTA hover: Ink on Ochre Light | #3D2B1F | #E8C47A | 8.1:1 | >=4.5:1 | AAA |
| CTA active: White on Ochre Deep | #FFFFFF | #8A6420 | 5.4:1 | >=4.5:1 | AA |
| Danger: White on Soviet Red | #FFFFFF | #C44832 | 4.9:1 | >=4.5:1 | AA |
| Success: White on Forest Dark | #FFFFFF | #4A7A30 | 5.1:1 | >=4.5:1 | AA |
| Warning: Ink on Sunflower | #3D2B1F | #F0B832 | 7.4:1 | >=4.5:1 | AAA |
| Info: White on Sky Deep | #FFFFFF | #4A7A9C | 4.6:1 | >=4.5:1 | AA |
| Body on white | #3D2B1F | #FFFFFF | 13.4:1 | >=4.5:1 | AAA |

### Remediation Log

| Original | Issue | Fix |
|----------|-------|-----|
| White on Ochre CTA (#D4A24C) | 2.3:1 FAIL | Use Ink Brown text instead of white |
| Sec text (#8B6040) on birch | 4.2:1 FAIL | Darken to #7A5030 on birch surfaces |
| White on Forest Moss (#5A8C3C) | 4.0:1 FAIL | Darken to #4A7A30 |
| Ochre as text color | 2.0:1 FAIL | Never use Ochre for text — decorative only |

### Color Blindness

| Type | Status | Notes |
|------|--------|-------|
| Protanopia (red-blind) | OK | Animals differentiated by silhouette, not color alone |
| Deuteranopia (green-blind) | OK | Red/green animals have distinct sizes and shapes |
| Tritanopia (blue-blind) | OK | Blue is accent only, never sole differentiator |

**Rule:** Color is NEVER the only way to convey information. Always paired with shape, size, or text.

### 55+ Accessibility

| Aspect | Value | Standard |
|--------|-------|----------|
| Touch targets | 48x48px minimum | Google Material (exceeds WCAG 44px) |
| Spacing between targets | 8px minimum | WCAG 2.5.5 |
| Body text | 18px | Above standard 16px |
| Min readable text | 14px | Never below |
| Contrast (body) | 11.5:1 | AAA (exceeds AA 4.5:1) |
| Line height | 1.5x | WCAG recommendation |

---

## Sources

- Pantone 2025 COTY: Mocha Mousse (#A08060) — confirms warm earth tone direction
- Soviet illustration: Suteev bright primaries + Charushin muted naturals
- WCAG 2.2 AA / AAA standards for all contrast ratios
- Game Accessibility Guidelines: font sizes, touch targets
- MIT Touch Lab: finger pad dimensions for elderly users
