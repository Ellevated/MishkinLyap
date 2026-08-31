# Feature: [FTR-006] Assets & Visual Polish
**Status:** done | **Priority:** P1 | **Date:** 2026-03-04

## Why
Placeholder colored circles won't pass Yandex moderation. Cute animals are the differentiation from Suika clones (Business Blueprint Decision #2). Merge animation is the "wow moment" that drives retention. Large touch targets and readable UI are critical for 55+ audience.

## Context
Depends on FTR-005 (playable game). All gameplay works with placeholders — this task adds visual polish. Assets from Kenney.nl CC0 (free, commercial use).

---

## Scope
**In scope:** Animal sprite assets (8 tiers), background graphics, container visual, UI elements (buttons, score display), merge animation (0.2s scale + particles), game-over line visual, next-drop preview display
**Out of scope:** Sound effects (can add later), complex particle systems, landscape mode

---

## Blueprint Reference

**Domain:** scenes/ (visual updates), objects/ (Animal sprite swap), config/ (asset keys)
**Cross-cutting:** Touch targets ≥ 44px, readable for 55+ audience
**Data model:** ANIMALS[].key used for sprite asset keys

---

## Allowed Files
**Modify:**
1. `src/objects/Animal.ts` — add sprite display (replace colored circle)
2. `src/scenes/PreloadScene.ts` — load actual asset files
3. `src/scenes/MenuScene.ts` — styled UI (title, buttons, background)
4. `src/scenes/GameScene.ts` — merge animation, game-over line visual, next preview
5. `src/scenes/GameOverScene.ts` — styled overlay

**New files allowed:**
6. `public/assets/animals/*.png` — 8 animal sprites
7. `public/assets/ui/*.png` — buttons, background, container
8. `public/assets/particles/*.png` — merge effect particle

**FORBIDDEN:** Game logic files (game/*), SDK files, config constants.

---

## Environment

nodejs: false
docker: false
database: false

---

## Design

### Animal Sprites (8 tiers)

Source: Kenney.nl Animal Pack or similar CC0 pack.
Fallback: Generate simple colored circles with animal emoji/text if no suitable pack found.

| Tier | Animal | Approx Size | Color (fallback) |
|------|--------|-------------|------------------|
| 1 | Hamster | 56px | #FFD93D (yellow) |
| 2 | Rabbit | 76px | #FF8FA3 (pink) |
| 3 | Kitten | 100px | #B5838D (mauve) |
| 4 | Cat | 126px | #6D6875 (grey) |
| 5 | Dog | 156px | #A2D2FF (blue) |
| 6 | Fox | 190px | #FF6B35 (orange) |
| 7 | Panda | 228px | #2B2D42 (dark) |
| 8 | Bear | 270px | #8B4513 (brown) |

### Merge Animation

Phaser tween on merge:
1. Scale merged animals to 0 (0.15s, ease: 'Power2')
2. Particles burst at merge point (10-15 particles, 0.3s lifetime)
3. New animal scales from 0 to 1 (0.2s, ease: 'Back.easeOut')

### Background & Container

- Background: soft gradient or solid color (#1a1a2e → #16213e)
- Container walls: subtle border or rounded rectangle
- Game-over line: dashed line with slight transparency
- Score area above game-over line: current score + next animal preview

### UI Style

- Large text (28-36px) for score, readable on mobile
- Buttons: minimum 44px height, rounded corners, high contrast
- "Зверята" title: fun, rounded font or Phaser bitmap text
- Color scheme: warm, cozy, non-aggressive (for 55+ audience)

---

## Implementation Plan

### Task 1: Prepare asset files
**Type:** code
**Files:**
  - create: `public/assets/animals/` — 8 animal images (or generated circles)
  - create: `public/assets/ui/` — button sprites, background
  - create: `public/assets/particles/` — merge particle
**Acceptance:** All files present in public/assets/

### Task 2: Update PreloadScene to load assets
**Type:** code
**Files:**
  - modify: `src/scenes/PreloadScene.ts`
**Acceptance:** All assets loaded, progress bar visible

### Task 3: Update Animal.ts to display sprites
**Type:** code
**Files:**
  - modify: `src/objects/Animal.ts`
**Acceptance:** Animals display sprites instead of colored circles

### Task 4: Add merge animation to GameScene
**Type:** code
**Files:**
  - modify: `src/scenes/GameScene.ts`
**Acceptance:** Merge triggers scale tween + particle burst

### Task 5: Style MenuScene and GameOverScene
**Type:** code
**Files:**
  - modify: `src/scenes/MenuScene.ts`
  - modify: `src/scenes/GameOverScene.ts`
**Acceptance:** Title styled, buttons >= 44px, score readable

### Execution Order
1 → 2 → 3 → 4 → 5

---

## Tests

### What to test
- [ ] All 8 animal asset keys load without error in PreloadScene
- [ ] Animal displays sprite (not empty container) after creation
- [ ] Merge animation completes without freezing game
- [ ] All buttons are >= 44px height (touch target check)
- [ ] Score text is readable at 480px width

### How to test
- Manual: Visual inspection on desktop + mobile viewport
- No automated visual tests (brittle)

### TDD Order
N/A — visual tasks, manual verification

---

## Definition of Done

### Functional
- [ ] 8 animal tiers have distinct visual representation
- [ ] Merge animation plays (scale + particles)
- [ ] Background and container are visible
- [ ] Score display readable
- [ ] Next-drop preview shows upcoming animal

### E2E User Journey
- [ ] Game looks polished enough for Yandex submission
- [ ] All touch targets >= 44px
- [ ] Text readable on mobile (380px+ width)

### Technical
- [ ] `npm run build` succeeds
- [ ] Total dist/ size < 5MB (well within 100MB limit)
- [ ] No console errors from missing assets

---

## Autopilot Log
