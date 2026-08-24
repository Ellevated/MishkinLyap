# COO Research Report — Round 1

**Director:** Keith Rabois (COO lens)
**Project:** Casual HTML5 game on Yandex Games
**Date:** 2026-03-04

---

## Kill Question Answer

**"What breaks at x10? What's agent, what's human?"**

At x10 (5-10 games portfolio):
- **Fatal bottleneck 1:** Moderation queue. Each game = 3-5 working days, serial submission = 25-50 days of idle time. No way around it — this is Yandex SLA, not our process.
- **Fatal bottleneck 2:** SDK integration per game. Currently manual every time. Needs templatization into a reusable boilerplate — otherwise each game wastes 4-8 hours on the same setup.
- **Fatal bottleneck 3:** Legal/financial structure. Self-employed (samozanyatiy) has a 2.4M RUB/year income ceiling. If portfolio scales, need to plan transition to IP (individual entrepreneur) in advance.
- **Superficial:** Asset sourcing, game naming, descriptions — all agentable.

**Agent vs Human:**
- Agent: code generation (Claude Code + Phaser templates), asset search (free sources), description/metadata writing, SDK boilerplate, checklist verification before submit
- Human: game feel judgment (is the merge satisfying?), moderation resubmission decisions, financial setup, final QA before packaging

**If process depends on heroics (Oleg coding 12h/day) — it's broken.** The pipeline must work in 4-hour daily sessions.

---

## Focus Area 1: Operating Model Patterns

### Comparable Models

| Company/Model | Structure | Key Pattern |
|---|---|---|
| Miniclip (early) | 2-3 person studio, portfolio approach | Templatized engine, swapped content per game |
| Hypercasual studios (Voodoo, Kwalee) | Factory model: 1 mechanic prototype/week | Test-first, kill fast, scale winners |
| Solo dev on Yandex Games (DTF case study, 2025) | 1 person, clickerы, 100K+/month | Reusable SDK wrapper, same codebase base |
| Davilkus Games (DTF guide, 2025) | 1 teen developer, portfolio of clickers | Templatized approach, same ad integration |

### Best Fit

**Solo operator with templatized factory model.** Not a studio. Oleg is the single barrel. Everything else is ammunition (Claude Code agents, free assets, templates).

The Hypercasual model (prototype fast, kill if <threshold, scale if >threshold) is the right mental model — but adapted: Yandex's 3-5 day moderation forces sequential, not parallel, prototyping.

### Decision Rights (RACI)

| Decision | Responsible | Accountable | Consulted | Informed |
|---|---|---|---|---|
| Game mechanic choice | Oleg | Oleg | Kamil | — |
| Code implementation | Claude Code | Oleg | — | Kamil |
| Asset selection | Claude Code | Oleg | — | — |
| SDK integration | Claude Code (template) | Oleg | — | — |
| Submission to Yandex | Oleg | Oleg | — | Kamil |
| Revenue tracking | Oleg | Oleg | Kamil | — |

---

## Focus Area 2: Agent/Human/Hybrid Mix

### Agent (Autonomous)

| Task | Why agent owns it |
|---|---|
| Phaser.js boilerplate generation | Repetitive, templatable, Claude Code proven on this |
| Matter.js physics setup for drop-merge | Documented pattern, no judgment needed |
| SDK integration (ad calls, init) | Copy-paste from Yandex docs, mechanical |
| Sprite/asset sourcing from free sites | Search + filter, rule-based |
| Game description + metadata writing | Language task, low stakes |
| Pre-submit checklist verification | Checklist comparison against requirements doc |

### Human (Judgment Required)

| Task | Why human must own it |
|---|---|
| "Does the merge feel satisfying?" | Haptic/visual game feel — needs play experience |
| Moderation rejection response | Requires reading between the lines of vague rejections |
| Revenue structure setup (RSY account) | Legal/financial, one-time irreversible |
| Final QA on mobile viewport | Must test on real device, edge cases |
| "Is this good enough to submit?" | Quality bar judgment — fatal if wrong |

### Hybrid (Agent Proposes, Human Approves)

| Task | Workflow |
|---|---|
| Drop-merge physics tuning | Agent generates 3 variants (gravity, bounciness, merge threshold) → Oleg plays each → picks one |
| Visual style selection | Agent generates 5 theme options with asset lists → Oleg + Kamil pick one in 10 min |
| Game name + icon concept | Agent generates 5 options → Oleg selects in 5 min |

### Case Studies

**Davilkus Games (DTF, 2025):** 16-year-old developer, 1+ year on Yandex Games, portfolio of clickers, earning enough to make it worthwhile. Key insight: reused same ad integration code across all games, only swapped game logic. Same SDK boilerplate every time = zero rework per game.

**AI game in 30 hours (dev.to, January 2026):** Developer built a complete game in 30 hours with AI assistance. Key finding: AI handles boilerplate excellently, struggles with game feel — human iteration loops remain essential.

**Phaser + AI at SEELE (February 2026):** Documented that Phaser.js maintains 60fps with up to 500 active physics bodies on desktop, 200 on mobile. For drop-merge with 8-10 objects max on screen — well within limits.

---

## Focus Area 3: Process Design & Automation ROI

### Core Processes (This Game)

**Process 1: Development Pipeline (Days 1-5)**
1. Scaffold Phaser project with Matter.js physics
2. Implement drop-merge core mechanic
3. Integrate Yandex SDK (ads + leaderboard)
4. Add assets (sprites, sounds, UI)
5. Polish + game feel tuning
6. Package as ZIP (max 100MB)

**Process 2: Publishing Pipeline (Days 6-7 + async)**
1. Register Yandex developer console account
2. Register RSY (Reklamna Set Yandex) account for ad revenue
3. Create game draft in console
4. Fill metadata: title, description, screenshots, icon
5. Set age rating, categories
6. Upload ZIP
7. Submit for moderation (3-5 working days)
8. Post-approval: set up payment details

**Process 3: Legal/Financial Setup (One-time, Day 1)**
1. Self-employed (samozanyatiy) status: register via Moy Nalog app
2. Link Yandex ID to developer console
3. Accept RSY offer (оферта) as self-employed or physical person
4. Provide bank account / SBP details for payments

### Automation Candidates

| Process | Automation | ROI |
|---|---|---|
| Phaser boilerplate generation | Claude Code generates full scaffold in ~20 min | Saves 4-6h manual setup per game |
| SDK integration | Reusable SDK wrapper module | Saves 2-3h per game |
| Metadata/description writing | Claude Code writes from brief | Saves 1-2h per game |
| Pre-submit QA checklist | Agent checks against Yandex requirements list | Saves 1h + prevents rejection |
| Asset sourcing from OpenGameArt/Kenney | Scripted search + download | Saves 2-3h per game |

**Total automation ROI per game after first game:** ~10-15 hours saved per subsequent game.

### Playbooks (What Can Be Templatized)

1. **Game boilerplate repo:** Phaser + Matter.js + Yandex SDK pre-integrated, ready to fork
2. **Asset checklist:** icon (512x512), cover (800x600), 5 screenshots, categories, age rating
3. **SDK wrapper:** init, showInterstitial(), showRewardedVideo(), leaderboard calls — copy-paste module
4. **Submission checklist:** 15-point pre-submit verification (see Yandex requirements)
5. **Metadata template:** title formula, description structure, keyword placement

---

## Focus Area 4: Scaling Bottlenecks

### At 10x Scale (5-10 Games Portfolio)

**Talent:**
- Currently: 1 barrel (Oleg) + 1 tool (Claude Code)
- At 5 games: still 1 barrel, but needs Kamil as junior barrel on game #3-4
- At 10 games: needs 1 additional human barrel (QA/submission person) OR aggressive templatization reduces human time to <4h/game

**Infrastructure:**
- Shared boilerplate repo (GitHub) — needed by game #2
- Shared asset library (Kenney/OpenGameArt curated folder) — needed by game #2
- Analytics dashboard (game-analytics.ru tracks Yandex rankings) — needed immediately
- Self-employed income ceiling: 2.4M RUB/year (~200K/month). At 5-10 games earning 50K-300K each = could hit ceiling. Transition to IP required pre-emptively.

**Process:**
- Moderation is the permanent bottleneck: 3-5 days per game, serial not parallel
- At 5 games, can submit game N+1 while game N is in moderation — parallel tracks
- Manual submission process needs a checklist to prevent rookie mistakes (top rejection causes: SDK misconfiguration, missing translations, incorrect ad setup)

### Triage (Fatal vs Superficial)

**Fatal (must solve before scaling):**
1. No boilerplate = every game starts from scratch. Fatal at x3.
2. No SDK wrapper template = ad integration errors → rejection. Fatal at x2.
3. Self-employed income ceiling not monitored = tax problems. Fatal at x5.

**Superficial (annoying but not blocking):**
1. Manual asset sourcing — time-consuming but solvable per game
2. Description writing — low stakes, easy to redo
3. Yandex developer console UX — clunky but one-time per game

---

## Focus Area 5: Quality Control

### Metrics

| Metric | Target | Why |
|---|---|---|
| Rating | >30 (Yandex auto-deletes <30 after 3 weeks) | Survival |
| Player rating | >4.0 | Ranking signal |
| Session length | >3 min avg | Retention signal |
| Moderation pass rate | 1st attempt | Time efficiency |
| Days from start to submission | ≤7 | Timeline adherence |

### Yandex Auto-Delete Mechanism

**Critical finding:** Yandex removes games with rating <30 after 3 weeks. The "Novinka" (new game) traffic boost lasts ~1 week. If game fails to gain players in week 1, it likely never recovers. This means:
- Week 1 traffic is everything
- Quality at launch > quality after iteration
- "Ship fast then polish" does NOT work on Yandex Games

### Feedback Loops

| Signal | Frequency | Action |
|---|---|---|
| Player rating in console | Daily | If <4.0 in week 1 → emergency fix or accept failure |
| Session analytics | Daily | If <2 min → game feel problem, patch immediately |
| Revenue in RSY cabinet | Weekly | Track CPM, optimize ad frequency |
| Moderation status | Check every morning | 3-5 days avg, can be faster |

### Escalation Paths

1. **Moderation rejected:** Read rejection reason → fix specific item → resubmit (counter restarts at 3-5 days)
2. **Rating <30 at day 14:** Decision: emergency content patch OR accept as learning, move to game #2
3. **Technical bug in production:** Hotfix ZIP upload — Yandex allows updates post-moderation (minor updates may skip full moderation)

### SLA Design

At scale (5-10 games):
- Game development: 5 working days (non-negotiable with 1 barrel)
- SDK integration: ≤4h (with template)
- Submission prep: ≤2h (with template)
- Moderation wait: 3-5 working days (Yandex SLA, not controllable)
- **Total cycle time per game: ~10 working days end-to-end**

---

## Publishing Process: Step-by-Step

### Phase 0: Pre-Registration (One-Time, Do This DAY 1)

**Step 1: Self-employed / Legal Setup**
- Option A (Recommended): Register as **самозанятый** (self-employed)
  - Tax rate: 6% on income from legal entities (Yandex = legal entity)
  - Register via **Мой Налог** app (iOS/Android) — 10 min, fully digital
  - No minimum income, no fixed payments
  - Annual ceiling: **2.4M RUB** — fine for experiment, plan transition at ~1.5M/year
  - Yandex RSY handles all reporting to FNS, issues receipts automatically
- Option B: Physical person (физлицо)
  - Tax: 13% НДФЛ — Yandex acts as tax agent
  - Simpler but more expensive. Not recommended if income is real.
- Option C: IP (individual entrepreneur)
  - Overkill for experiment. Use if portfolio generates >2.4M/year.

**Step 2: Create Yandex Developer Account**
- Go to `games.yandex.ru/developer`
- Log in with Yandex ID (create one if needed)
- Choose developer name (public, cannot easily change)
- Accept developer terms of use (Условия использования платформы Яндекс Игры)

**Step 3: Register in RSY (Рекламная Сеть Яндекса)**
- Go to `partner.yandex.ru`
- Register as самозанятый in RSY (separate from developer console)
- Provide: Yandex ID, bank account / SBP phone, ИНН
- Upload: Мой Налог confirmation screenshot
- Accept RSY оферта
- **This is where ad revenue goes. Cannot receive money without this.**
- Payment schedule: RSY pays on ~25th of month, minimum threshold: **3,000 RUB**

### Phase 1: Development (Days 1-5)

Day-by-day plan in Focus Area 3 + OQ-6 section below.

### Phase 2: Pre-Submission (Day 6)

| Checklist Item | Requirement | Common Rejection Cause |
|---|---|---|
| SDK integrated | `<script src="/sdk.js">` in index.html | #1 rejection reason |
| SDK initialized before game starts | `YaGames.init()` called | Technical rejection |
| Ad setup correct | Interstitial on game-over, not on launch | Requirement 4.4 |
| Game playable for 10+ minutes (free content) | Bесконечный геймплей counts | Critical for drop-merge |
| No external auth required | Only Yandex ID allowed | Auto-reject |
| No browser scrollbar | CSS: `overflow: hidden` | Requirement 1.10 |
| Mobile responsive | Works in portrait + landscape | Requirement 1.10 |
| All UI fits in screen | No cut-off elements | Requirement 1.10.1 |
| Russian interface (minimum) | Labels, buttons in Russian | Requirement 8.2.3 |
| Title matches in-game title | Exact match | Requirement 5.1.3 |
| Age rating correct | 0+ for casual, no violence | Requirement 2.7 |
| No technical errors in console | No JS errors during play | Requirement 1.14 |
| Icons and screenshots | 512x512 icon, 800x600 cover, 5 screenshots | Metadata requirements |

### Phase 3: Submission (Day 6-7)

1. Console → "Добавить игру" → fill draft
2. Upload ZIP (max 100MB)
3. Fill metadata: title, description (500+ chars), instructions
4. Set categories: Казуальные, Головоломки
5. Upload icon (512x512 PNG), cover (800x600 PNG), 5 screenshots
6. Set age: 0+
7. Click "Отправить на проверку"
8. Wait 3-5 working days

### Phase 4: Post-Approval

1. Game goes live automatically after approval
2. Connect RSY ad units in game code (use SDK ad IDs from RSY cabinet)
3. Monitor: player count, rating, session length, revenue in RSY cabinet
4. After reaching 3,000 RUB balance — request payout (25th of month)

---

## OQ-6 Decision: Scale After Experiment

**Question:** One-shot or portfolio? Does it change infrastructure investment?

**Recommendation: Plan for portfolio from Day 1, but invest infrastructure incrementally.**

### Triage Decision

**Do on Day 1 (even for one game):**
- Self-employed registration (takes 10 min, required for any payment)
- RSY account setup (required for any revenue)
- GitHub repo with SDK integration baked in (boilerplate = free, saves 4h on game #2)

**Do after Game 1 ships (if experiment succeeds):**
- Formalize asset library (Kenney folder, curated sprites)
- Document the 7-day development playbook
- Kamil takes game #2 as primary with Oleg mentoring

**Do at Game 3+ (if portfolio thesis confirmed):**
- Shared analytics dashboard (game-analytics.ru + RSY cabinet)
- Consider IP registration if monthly income > 50K/month consistently
- Kamil becomes co-barrel on alternating games

**Do NOT invest in advance:**
- CI/CD pipeline (overkill for ZIP-based publishing)
- Custom ad network (Yandex SDK is mandatory anyway)
- Paid asset packs (free sources sufficient for experiment)

### Scale Infrastructure Requirements

| Games | Infrastructure Needed | One-time Cost | Status |
|---|---|---|---|
| 1 game | Developer account + RSY + Git repo | 0 RUB, ~2h | Do Day 1 |
| 2-3 games | Boilerplate repo + asset library | 0 RUB, ~4h | After game 1 ships |
| 4-5 games | Analytics tracking + Kamil as junior dev | 0 RUB + Kamil's time | After game 2 |
| 5-10 games | IP registration + shared design system | ~5K RUB (IP setup) | When income >1.5M/year |

---

## Day-by-Day Operational Plan (7 Days)

### Day 0 (Today/Before Start): Bureaucracy Sprint

**Owner: Oleg | Duration: 2-3 hours | Non-negotiable**

- [ ] Register самозанятый via Мой Налог app (10 min)
- [ ] Create/confirm Yandex developer account at `games.yandex.ru/developer`
- [ ] Register in RSY at `partner.yandex.ru` as самозанятый
- [ ] Provide bank/SBP details, upload ИНН confirmation
- [ ] Create GitHub repo with project name
- [ ] Initialize Phaser project (Claude Code: scaffold with Matter.js + Yandex SDK)

**Gate:** RSY account created + developer console access confirmed. Do NOT start development until RSY is in progress — it can take 1-3 days to verify.

### Day 1 (Monday): Core Mechanic

**Owner: Claude Code (primary) + Oleg (QA) | Duration: 4-6h development**

Morning (Claude Code):
- [ ] Phaser 3 + Matter.js project scaffold
- [ ] Canvas setup: 480x640 portrait (optimal for mobile Yandex)
- [ ] Drop mechanic: click/tap → object falls from top
- [ ] Physics: gravity, bounce, friction (Matter.js defaults)

Afternoon (Oleg plays):
- [ ] Does the drop feel responsive? (lag < 50ms)
- [ ] Does the physics look natural?
- [ ] Merge trigger: collision between same-type objects

**Gate:** Can drop objects, they fall with physics. Objects collide.

### Day 2 (Tuesday): Merge Mechanic + Progression

**Owner: Claude Code + Oleg judgment | Duration: 4-6h**

- [ ] Merge logic: same type → destroy both → spawn next tier
- [ ] 8-tier progression (8 sprites: circle → triangle → square → ... → star)
- [ ] Score system: merge = points based on tier
- [ ] Game over: objects pile to top → "stacking" detection
- [ ] Visual merge feedback: scale animation + particle burst

**Kamil test:** Kamil plays for 15 min. If he smiles when merging → mechanic works.

**Gate:** Full merge loop works, game over triggers.

### Day 3 (Wednesday): SDK Integration + UI

**Owner: Claude Code (SDK code) + Oleg (UI judgment)**

Morning:
- [ ] Yandex SDK init in index.html
- [ ] `showInterstitialAd()` on game over
- [ ] `showRewardedVideoAd()` → extra life / score bonus
- [ ] Leaderboard: submit score on game over
- [ ] Yandex ID auth button (optional, for leaderboard)

Afternoon:
- [ ] Main menu screen (play button, best score)
- [ ] HUD: current score, best score, next object preview
- [ ] Game over screen: score + "Play again" + "Watch ad for +X"

**Test on local server with SDK mock.** Yandex provides local test server in SDK docs.

**Gate:** Ads fire at correct moments. No console errors.

### Day 4 (Thursday): Assets + Polish

**Owner: Oleg + Claude Code | Duration: 3-4h**

Assets (all free, no budget):
- [ ] 8 sprites: Kenney.nl "Shape Animals" or custom geometric (Claude can generate SVG)
- [ ] Background: solid color or simple gradient
- [ ] Merge sound: free sfx from freesound.org
- [ ] UI font: Google Fonts (included in ZIP)

Polish:
- [ ] Merge animation (0.2s scale-up → particle → new object)
- [ ] Drop trajectory line (shows where object will land)
- [ ] Combo system: 3 merges in 2 sec = bonus points
- [ ] Background music: optional, loop (free from opengameart.org)

**Gate:** Game looks "good enough to not be embarrassing."

### Day 5 (Friday): Full Playtest + Bug Fixes

**Owner: Oleg + Kamil | Duration: 3h testing + 2h fixes**

- [ ] Play 5+ full sessions (game over → replay)
- [ ] Test on mobile (Chrome mobile, Yandex Browser mobile)
- [ ] Test window resize: portrait/landscape transitions
- [ ] Check: no browser scrollbar, no UI cutoff
- [ ] 10-minute gameplay test: can you play 10+ min? (drop-merge = yes by design)
- [ ] Run through full pre-submit checklist (15 items)
- [ ] Fix any found issues

**Gate:** Zero JS console errors. 10+ min gameplay confirmed. All checklist items green.

### Day 6 (Saturday): Asset Prep + Submission

**Owner: Oleg | Duration: 2-3h**

- [ ] Create icon: 512x512 PNG (game logo / best object in game)
- [ ] Create cover: 800x600 PNG (gameplay screenshot + title)
- [ ] Take 5 screenshots (different moments of gameplay)
- [ ] Write Russian description (500+ chars) — Claude writes, Oleg approves
- [ ] Write instructions (how to play, 2-3 sentences)
- [ ] Package ZIP: `index.html` at root, all assets included, no external CDN links
- [ ] Final ZIP size check: <100MB
- [ ] Submit to Yandex developer console

**Gate:** Submission confirmed. Email from Yandex received.

### Day 7 (Sunday): Buffer / Moderation Wait

**Yandex moderation: 3-5 working days = Thursday-Friday of next week**

- [ ] If anything was missed in Day 5-6: emergency fix and resubmit
- [ ] Monitor RSY account — should be verified by now
- [ ] Kamil review: show him the submission, explain the process
- [ ] Prepare for moderation outcomes: approval → celebration. Rejection → read reason, fix, resubmit (Day 8-9)

---

## Operational Recommendations

### Operating Model

**Single barrel (Oleg) with AI leverage.** Do not hire. Do not outsource. Claude Code is the ammunition. Oleg is the barrel who owns game quality, submission decisions, and financial setup. Kamil is the audience for experiment #1 and junior barrel by game #2.

### Agent/Human Split (Clear Boundaries)

| Agent Does | Human Does |
|---|---|
| Scaffold Phaser project | Judge if game "feels fun" |
| Implement physics/mechanics from spec | Play-test and feel game quality |
| Integrate Yandex SDK from docs | Make submission decisions |
| Generate metadata, descriptions | Set up legal/financial accounts |
| Run pre-submit checklist | Decide on visual style/theme |
| Generate SVG sprites on demand | Talk to Yandex support if needed |

### First Bottleneck (What Breaks First at x10)

**Fatal:** Moderation queue. At 5+ games, parallel submissions minimize wait time, but you need different game mechanics per submission — you can't submit the same mechanic twice. This means game diversity becomes the creative bottleneck by game #4.

**Prevention:** Template the infrastructure (boilerplate, SDK, checklist). Vary the mechanic early. Kamil becomes the second mechanic designer by game #3.

### Avoid

1. **Anti-pattern: starting Day 1 development without RSY account active.** RSY verification takes 1-3 days. Start it same day as developer account. Without RSY = zero revenue capability.
2. **Anti-pattern: skipping the pre-submit checklist.** Top rejection causes (SDK misconfiguration, ad setup, viewport issues) are all preventable. Each rejection = +5 working days delay minimum.
3. **Anti-pattern: shipping without 10+ min free gameplay.** Yandex enforces this for freemium games. Drop-merge is naturally infinite — verify, document, do not add paid content lock without testing.
4. **Anti-pattern: building for Kamil's taste instead of platform demographics.** The "cute animals merging" aesthetic serves both — 10-year-old finds it fun, 55+ women find it familiar. Win-win. Avoid edgy/dark themes.

---

## Research Sources

- [Требования к игре — Яндекс Игры](https://yandex.ru/dev/games/doc/ru/concepts/requirements) — official requirements, moderation takes 3-5 working days, top rejection causes by requirement number
- [Загрузка игры — Яндекс Игры](https://yandex.ru/dev/games/doc/ru/console/add-new-game) — official upload guide, step-by-step submission process
- [Сотрудничество с самозанятыми — РСЯ](https://yandex.ru/support/partner/ru/payments/with-self-employed) — official Yandex RSY self-employed cooperation page, 6% tax rate, RSY handles FNS reporting
- [Davilkus Games — DTF Гайд Яндекс Игры](https://dtf.ru/indie/3258027-long-yandeks-igry-gaid-na-100k-nanosek-s-klikerov-i-o-tom-kak-zaletet-v-veb-razrabotku) — practitioner guide, solo dev earning 100K+/month from clickers, templated SDK approach
- [Как я выкладывал головоломку на Яндекс Игры — DTF](https://dtf.ru/indie/2861055-kak-ya-vykladyval-golovolomku-na-yandeks-igry) — first-person submission experience, RSY registration notes
- [Через что нужно пройти на модерацию Яндекс Игры — vc.ru](https://vc.ru/dev/2086667-kak-proyti-moderatsiyu-na-yandeks-igry) — moderation war story, 10-minute gameplay requirement confirmed, freemium content lock issues
- [Part 1: Building a Game in 30 Hours Using AI — dev.to](https://dev.to/sweetpapa/part-1-building-a-game-in-30-hours-using-ai-heres-the-actual-timeline-1dj5) — AI-assisted game dev timeline, agent handles boilerplate, human handles game feel
- [Phaser.js in 2026 — seeles.ai](https://www.seeles.ai/resources/blogs/phaser-js-game-development-2026) — Phaser specs: 60fps with 500 physics bodies desktop, 200 mobile; Matter.js integrated
- [Налоги самозанятых 2026 — Яндекс Пэй](https://pay.yandex.ru/blog/articles/samozanyatyj-nalogi-obyazatelnye-platezhi) — 6% НПД rate, 2.4M RUB annual ceiling, register via Мой Налог app
- [Условия использования Яндекс Игры](https://yandex.ru/legal/yandexgames/ru/) — developer terms of use, license structure for game publishing
