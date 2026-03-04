# Motion System: Zverata (Зверята)

**Generated:** 2026-03-04
**Archetype:** Innocent — gentle, soft, comforting

---

## Motion Principles

| Principle | Value | Why |
|-----------|-------|-----|
| Style | Gentle, soft, organic | Innocent archetype = нежность, не агрессия |
| Duration range | 150-500ms (UI), 200ms (merge) | Не слишком быстро для 55+, не слишком медленно |
| Easing | ease-in-out | Мягкие начало и конец — как в детской анимации |
| Particle style | Листочки, цветочки, сердечки | Органические формы, не generic звёзды |
| Rule | Анимация ТОЛЬКО на ключевых событиях | Избыток motion путает ЦА 55+ |

---

## Animation Specs

### Game Events

| Event | Animation | Duration | Details |
|-------|-----------|----------|---------|
| Drop (зверёк падает) | Gravity + slight wobble | Physics-driven | Matter.js handles this naturally |
| Merge (2 одинаковых) | Squash→stretch→burst→new | 200ms total | See "Merge Sequence" below |
| New animal appears | Bounce-in scale | 200ms | scale 0→1.2→1.0 with ease-out |
| Game Over | Gentle fade + slide up | 500ms | Panel slides from bottom |
| Score update | Counter roll-up | 300ms | Numbers animate, not snap |
| Combo text | Wobble-in "УРА!" | 400ms | Marmelad font, Suteev colors |

### Merge Sequence (the "Wow!" moment)

```
Frame 0ms:    Two animals touch → both scale to 0.9 (squash)
Frame 50ms:   Both scale to 1.1 (stretch), opacity fade starts
Frame 100ms:  Burst! 6-8 particles (leaves/flowers/hearts)
              Old animals fade to 0
Frame 120ms:  Hold frame — empty space for anticipation
Frame 200ms:  New animal bounce-in (scale 0→1.2→1.0)
              Soft sound effect ("pop" or animal sound)
```

**Particles:** Органические формы в цветах палитры:
- Листочки (#5A8C3C Forest)
- Цветочки (#D4A24C Ochre)
- Сердечки (#C44832 Soviet Red)
- 6-8 штук, разлетаются радиально, fade за 400ms

### UI Animations

| Element | Animation | Duration | Details |
|---------|-----------|----------|---------|
| Button press | Scale 0.95 + darken bg | 60ms | Тактильная обратная связь |
| Button release | Scale 1.0 | 100ms | Bounce back |
| Menu open | Slide from bottom | 300ms | ease-out |
| Menu close | Slide down + fade | 250ms | ease-in |
| Score increment | Number roll up | 300ms | Цифры крутятся, не меняются мгновенно |
| High score! | Golden glow pulse | 600ms | Ochre glow, 2 pulses |
| Loading | Spinning animal (hamster) | Loop | Simple rotation |

---

## AI Prompts for Animation Assets

### Logo Animation (MCP fal-ai)

```
generate_video_from_image:
  image: [upload bear cub logo]
  prompt: Gentle warm animation of this cute bear cub logo,
  soft bounce and subtle ear wiggle, cream paper background,
  cozy children's book illustration feel, 3 seconds, smooth loop
```

### Merge Effect Reference Video

```
generate_video:
  prompt: Two identical cute cartoon animals merge together
  with a soft pop and colorful leaf particles burst,
  warm cream background, Soviet children's book illustration style,
  3 seconds, smooth animation
```

### External Prompts

**Runway:**
```
Animate this bear cub logo: gentle bounce and ear wiggle.
Motion style: soft, cozy, children's book feel.
Duration: 3 seconds. Background: cream #F5EDD8.
Professional, gentle, brand-appropriate. Loop.
```

**LottieFiles:** Search for "merge particle burst", "bounce in", "confetti organic" — adapt colors to brand palette.

---

## Motion Don'ts

- No flash/strobe effects (seizure risk for 55+)
- No auto-play sound — always user-initiated
- No animations longer than 600ms (except logo intro 2-3s)
- No bouncing/flying elements in UI (only in gameplay)
- No motion for motion's sake — every animation must have PURPOSE
- Respect `prefers-reduced-motion` — disable all non-essential animations

---

## Motion Tokens (CSS Custom Properties)

```css
/* Motion Tokens — Innocent archetype, gentle and soft */
--motion-duration-instant: 60ms;
--motion-duration-fast: 150ms;
--motion-duration-normal: 300ms;
--motion-duration-slow: 500ms;
--motion-duration-intro: 2000ms;

--motion-easing-default: cubic-bezier(0.4, 0, 0.2, 1);
--motion-easing-enter: cubic-bezier(0, 0, 0.2, 1);
--motion-easing-exit: cubic-bezier(0.4, 0, 1, 1);
--motion-easing-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);

--motion-stagger-delay: 50ms;
--motion-stagger-max: 5;
```

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-duration-instant: 0ms;
    --motion-duration-fast: 0ms;
    --motion-duration-normal: 0ms;
    --motion-duration-slow: 0ms;
    --motion-duration-intro: 0ms;
  }
}
```

---

## Phaser.js Implementation Notes

| Concern | Solution |
|---------|----------|
| Merge particles | Phaser ParticleEmitter, 6-8 particles, gravity: 200, lifespan: 400ms |
| Squash/stretch | Tween on scaleX/scaleY with yoyo |
| Score counter | Phaser Tween on score text value |
| Bounce-in | Tween: scale 0→1.2 (100ms) → 1.0 (100ms) |
| Button feedback | setInteractive(), on pointerdown scale 0.95, on pointerup scale 1.0 |
| Game Over panel | Tween: y from bottom, alpha 0→1, duration 500ms |
