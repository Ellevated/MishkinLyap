# Brand Launch Checklist: Мишкин Ляп (Mishkin Lyap)

**Generated:** 2026-03-04

---

## Day 1: Foundation (2-3 hours)

- [ ] Review `brand-dna.md` — всё актуально?
- [ ] Скачать шрифты: [Marmelad](https://fonts.google.com/specimen/Marmelad) + [Nunito](https://fonts.google.com/specimen/Nunito)
- [ ] Проверить контраст: [webaim.org/resources/contrastchecker](https://webaim.org/resources/contrastchecker)
  - Ink #3D2B1F на Cream #F5EDD8 → 11.5:1 (AAA)
  - Ink #3D2B1F на Ochre #D4A24C → 5.8:1 (AA)
- [ ] Импортировать `brand-tokens.css` в проект
- [ ] Setup Canva Brand Kit:
  - Upload logo SVG
  - Add HEX: #D4A24C, #3D2B1F, #F5EDD8, #C44832, #5A8C3C
  - Upload Marmelad + Nunito

## Day 2: Visual Assets (3-4 hours)

- [ ] Сгенерировать логотип (prompts.md → Recraft V3)
- [ ] Выбрать лучший вариант, vectorize если нужно (Vectorizer.ai)
- [ ] Экспорт иконки:
  - [ ] Yandex Games: 2 варианта для A/B
  - [ ] Favicon: 32x32 + 16x16
- [ ] Сгенерировать 8 спрайтов зверят (prompts.md)
- [ ] Создать OG Image: 1200x630
- [ ] Создать обложку Yandex: 800x600

## Day 3: Store & Launch (2-3 hours)

- [ ] Скриншоты (5 штук, gameplay moments)
- [ ] Видео клип (~14 секунд)
- [ ] Описание RU (500+ символов) — из `store-assets.md`
- [ ] Описание EN (500+ символов) — из `store-assets.md`
- [ ] Проверить Card Completion = GREEN
  - [ ] 2 иконки (A/B тест)
  - [ ] Обложка 800x600
  - [ ] 5 скриншотов
  - [ ] Видео
  - [ ] Описание RU
  - [ ] Описание EN
  - [ ] Категории: Casual, Puzzle
  - [ ] Возраст: 0+

---

## File Naming Convention

```
mishkin-lyap_{asset}_{variant}_{size}.{fmt}

mishkin-lyap_logo_full-color_1024x1024.png
mishkin-lyap_icon_variant-a_512x512.png
mishkin-lyap_icon_variant-b_512x512.png
mishkin-lyap_favicon_32x32.ico
mishkin-lyap_og-image_1200x630.png
mishkin-lyap_cover_yandex_800x600.png
mishkin-lyap_screenshot_01-hook_1280x720.png
mishkin-lyap_screenshot_02-merge_1280x720.png
mishkin-lyap_screenshot_03-chain_1280x720.png
mishkin-lyap_screenshot_04-score_1280x720.png
mishkin-lyap_screenshot_05-cta_1280x720.png
mishkin-lyap_sprite_tier1-hamster_256x256.png
mishkin-lyap_sprite_tier8-bear_256x256.png
```

---

## 6-Month Brand Health Check

- [ ] Все материалы используют утверждённые цвета? (проверить HEX)
- [ ] Типографика консистентна (Marmelad display + Nunito body)?
- [ ] Новые скриншоты в том же стиле?
- [ ] Голос бренда не дрифтанул? (сравнить копирайт с brand-dna.md)
- [ ] Accessibility стандарты соблюдены после обновлений UI?
- [ ] Логотип работает на всех необходимых размерах?

> Если 2+ пунктов fail → перезапустить /brandbook для обновления.
