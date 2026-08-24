# Board Strategy Alternatives -- Round 1

## Executive Summary

**Date:** 2026-03-04
**Input:** 6 director research reports + 6 cross-critiques + founder brief + open questions
**Output:** 3 coherent strategy alternatives

**Open Questions Resolution (Board Consensus):**

| OQ | Question | Board Answer | Consensus |
|----|----------|-------------|-----------|
| OQ-1 | Success definition | Stage 1: balance > 0 growing. Stage 2: 3,000 withdrawal (bonus) | 6/6 agree |
| OQ-2 | Target audience | Platform demographics (women 35-65) primary, Kamil secondary | 6/6 agree |
| OQ-3 | Genre | Drop Merge (Suika mechanic) | 6/6 agree |
| OQ-4 | Monetization | Ads only, no IAP | 6/6 agree |
| OQ-5 | Visual style | Cute animals (NOT fruits, NOT geometric) | 5/6 agree (Devil changed to agree post-critique) |
| OQ-6 | Scale | Plan for portfolio from Day 1, invest incrementally | 5/6 agree |

**Kill Questions Status:**

| Director | Kill Question | Status |
|----------|-------------|--------|
| CPO | What does user lose if we disappear? | WEAK -- low switching cost, mitigated by animal theme emotional attachment |
| CFO | CAC payback < 12 months? | N/A (CAC = 0) -- reframed as "revenue covers time?" CONDITIONAL PASS |
| CMO | One repeatable channel? | PASS -- Yandex "Novosti" + ML algorithm retention loop (repeatable via portfolio) |
| COO | What breaks at 10x? | PASS -- moderation queue is bottleneck, solved by boilerplate + parallel submissions |
| CTO | Same stack from scratch? | PASS -- Phaser + Matter.js + TypeScript confirmed by all peers + 5 open-source clones |
| Devil | What do we know that nobody agrees with? | MEDIUM RISK -- "This is an educational experiment, not a business. Even 17 rubles = success." |

---

## Conflicts Detected and Resolved

### Conflict 1: Timeline -- "1 Week" vs Reality

**The Conflict:**
- **Founder** says: 1 week total, hard deadline
- **Devil + COO + CMO** say: 3 weeks minimum (dev + moderation + potential rejection)

**Evaporating Cloud Analysis:**

```
              Goal: Kamil sees "code = money" quickly
             /                                    \
    Need A: Ship fast                   Need B: Pass moderation
         |                                    |
    Want X: 1-week deadline             Want Y: Quality + compliance
         \                                    /
                    CONFLICT
```

**Resolution:** Redefine "1 week" as "1 week of development." Total cycle = 3 weeks. Week 1 = build. Week 2 = polish + submit + moderation wait. Week 3 = go-live + Novinski window. Kamil participates in ALL weeks, not just Week 1. The educational lesson becomes "build, submit, wait, earn" -- more realistic than "code and money in 7 days." (Devil: moderation timeline, COO: 3-week plan, CMO: launch strategy)

**Integrated Into:** All 3 strategies

---

### Conflict 2: Quality Bar -- "Good Enough" vs "Polished"

**The Conflict:**
- **Devil** says: Lower the bar, this is educational, any published game = success
- **COO + CPO** say: "Ship fast then polish does NOT work on Yandex Games" -- rating < 30 at week 3 = auto-deletion = Kamil sees "dad's code got deleted"

**Evaporating Cloud Analysis:**

```
              Goal: Educational success for Kamil
             /                                       \
    Need A: Ship something fast           Need B: Game survives on platform
         |                                        |
    Want X: Minimum quality (pass moderation)  Want Y: Quality for retention (rating > 30)
         \                                        /
                       CONFLICT
```

**Resolution:** The educational lesson is STRONGER if the game survives and earns. "Dad's game got deleted" teaches the wrong lesson. Therefore: minimum quality bar = rating > 30 survival threshold. This requires decent retention, which requires quality UX. But the SCOPE should be minimal -- proven mechanic, proven theme, proven stack. Quality through combination, not invention. (COO: "ship fast then polish = death on Yandex", CPO: retention benchmarks, Devil: success redefinition)

**Integrated Into:** All 3 strategies

---

### Conflict 3: Sticky Banner -- Revenue vs Retention

**The Conflict:**
- **CFO** says: All 3 ad formats (interstitial + rewarded + sticky banner) for maximum revenue
- **CPO** says: Minimal ads, 55+ audience hates aggressive advertising, AARP confirms

**Evaporating Cloud Analysis:**

```
              Goal: Maximize educational demonstration of revenue
             /                                       \
    Need A: Revenue visible in dashboard      Need B: Players don't churn from ads
         |                                         |
    Want X: All 3 ad formats                  Want Y: No ads during gameplay
         \                                         /
                       CONFLICT
```

**Resolution:** Sticky banner is acceptable ONLY if positioned outside the gameplay canvas (in the score area above the game). Interstitial ONLY after game over, never before first game over. Rewarded video = player-initiated (offer at game over screen for extra life or bonus). This maximizes revenue without triggering the "aggressive ad" churn pattern for 55+ audience. (COO: proposed specific banner placement, CPO: AARP data, CFO: revenue calculations)

**Integrated Into:** All 3 strategies

---

### Conflict 4: "Drop Merge is Dead" vs "Drop Merge is Proven"

**The Conflict:**
- **Devil** says: Drop merge peaked in Oct 2023, 2.5 years ago. Genre is saturated. Drop Merge 2048 (rating 78) already exists on Yandex. Why enter a dead genre?
- **CTO + CPO + CMO** say: Drop merge is the optimal genre for 1-week AI-assisted development. Open-source clones exist. Mechanics naturally fit 55+ audience. Bubble Shooter is 2-3x harder to implement.

**Evaporating Cloud Analysis:**

```
              Goal: Published game that earns revenue
             /                                        \
    Need A: Genre with audience appeal         Need B: Genre buildable in 1 week
         |                                          |
    Want X: Evergreen genre (Bubble Shooter?)   Want Y: Drop Merge (simplest to build)
         \                                          /
                        CONFLICT
```

**Resolution:** The Devil confuses "hype dead" with "genre dead." Tetris (1984), Solitaire (1990s), Match-3 (2012) all peaked decades ago and still dominate. For the 55+ Yandex audience, drop merge physics may be genuinely novel -- this demographic did NOT experience the 2023 Suika hype cycle. The 12-20h implementation estimate (CTO) vs 20-35h for Bubble Shooter makes drop merge the correct choice given the timeline constraint. Differentiation comes from theme (animals, not fruits), not from genre novelty. (CTO: implementation complexity comparison, COO: "quality at launch" requires simpler scope, Devil: competition data, CPO: 55+ audience unfamiliarity with genre)

**Integrated Into:** All 3 strategies use Drop Merge as base

---

## Strategy 1: "Kamil's First Ruble" -- Minimum Viable Educational Experiment

### Core Idea

Ship a working drop-merge game in the fastest possible way using an open-source clone as the foundation. Optimize for ONE goal: Kamil sees a growing ruble balance in the developer dashboard. Do not optimize for revenue, retention ranking, or long-term viability. Accept that the game may be auto-deleted after 3 weeks -- the lesson was learned before that happens.

### Target Customer

- **Primary:** Kamil (educational recipient)
- **Secondary:** Any Yandex Games player who clicks on the game during Novinski window
- **Design for:** Good enough to pass moderation and generate ANY revenue

### Revenue Model (CFO Lens)

- **Pricing:** Free, ad-supported (interstitial after game over + rewarded video)
- **Unit Economics:** CAC = 0. Revenue = whatever organic traffic generates.
- **Scenario:** CFO Scenario A (conservative): ~378 rub Week 1, ~434 rub/month post-boost
- **3-Month Estimate:** 1,000-2,000 rub total (Source: CFO Scenario A, validated against DACKZI runner case 36 CPMV)
- **Path to 3,000 rub withdrawal:** 3-6 months (no guarantee)

**CFO Kill Question:** N/A -- not a business. Educational ROI is positive at any revenue > 0.

### Go-to-Market (CMO Lens)

- **Primary channel:** Yandex "Novinski" organic (7-day free traffic window)
- **Card Completion:** Minimum viable (description RU + EN, icon, cover, 3 screenshots). NOT green status -- just enough for moderation.
- **No A/B testing:** Single icon variant. Ship fast, don't optimize.
- **Naming:** Simple descriptive. "Zveryata Merge" / "Animal Merge"

**CMO Kill Question:** Channel = Novinski organic. One-shot, not repeatable without portfolio.

### Operating Model (COO Lens)

- **Total timeline:** 2 weeks (5 days dev + 5 days moderation buffer)
- **Agent/Human split:** Claude Code does 80% of code from open-source clone reference. Oleg judges game feel + submits. Kamil plays and watches.
- **Day 0:** Samozanyatyy + RSY registration (Source: COO, CFO both insist Day 0)
- **Days 1-3:** Fork sgbj/suika-clone, retheme to animals, integrate SDK
- **Days 4-5:** QA, metadata, submit
- **Days 6-12:** Moderation wait

**COO Kill Question:** What breaks at 10x? Not applicable -- this is a one-shot.

### Technical Approach (CTO Lens)

- **Stack:** TypeScript + Phaser 3.90 + Matter.js (built-in) + Vite
- **Build vs Buy:** 90% buy. Use sgbj/suika-clone as direct foundation. Only customize: animal sprites, progression chain, colors, sounds.
- **SDK:** Minimal -- interstitial on game over, rewarded video on "continue" button. Skip sticky banner (reduces scope).
- **Hiring:** N/A

**CTO Kill Question:** Same stack from scratch? YES -- confirmed by 5 open-source clones.

### UX Priorities (CPO Lens)

- **Job to be done:** "Kill 5 minutes" (lowest bar)
- **Retention drivers:** Highscore, "play again" button
- **Wow moment:** First merge with sound (must work, but doesn't need polish beyond functional)
- **Switching cost:** Zero. No leaderboard, no progression beyond basic 8 tiers.

**CPO Kill Question:** What does user lose? Honestly, nothing. But that's acceptable for this strategy.

### Risks (Devil Lens)

- **Most likely failure:** Game passes moderation but earns < 100 rub total. Kamil sees a number but it's disappointingly small.
- **Competitive threat:** Drop Merge 2048 (rating 78) captures all traffic in the genre. Our game gets no algorithmic promotion after Novinski week.
- **Moderation risk:** Rejected as Suika duplicate (Sept 2025 anti-duplicate rules). Mitigated by animal theme.
- **Platform risk:** Rating < 30 at week 3 = auto-deletion. Under this strategy, likely to happen (no retention optimization).

**Devil Kill Question:** This is education, not business. 17 rub = success. Manage expectations accordingly.

### Trade-offs

**Strengths:**
- Fastest time to "Kamil sees money" (2 weeks total)
- Lowest risk of founder burnout / attention drift (anti-pattern #1)
- Simplest scope = highest probability of completion

**Weaknesses:**
- Likely auto-deleted after 3 weeks (rating < 30)
- Revenue probably 50-300 rub, never reaches 3,000 rub withdrawal threshold
- No reusable infrastructure for future games
- Educational lesson may be weak: "code = tiny money that disappears"

### Rationale
- Devil: "This is education, not business. 17 rub = success" (research-devil.md, Contrarian Insight)
- CFO: "Even 17 rub in first week proves code = money to a 10-year-old" (research-cfo.md, Kamil's Educational Moment)
- COO: Founded risk is "starts many, finishes few" -- smallest scope = highest completion probability (COO RACI analysis)
- CTO: sgbj/suika-clone reduces development to 2-3 days of customization (research-cto.md, Focus Area 1)

---

## Strategy 2: "Zverata" -- Quality-First Launch with Platform Survival

### Core Idea

Build a genuinely good drop-merge game with cute animals theme, optimized for the 55+ female Yandex Games audience. Quality bar = rating > 30 survival threshold. Use the full 3-week timeline (1 week dev, 1 week polish + submit, 1 week moderation). This strategy aims for the game to SURVIVE on the platform and generate passive income for months -- teaching Kamil that quality code = sustainable money.

### Target Customer

- **Primary:** Women 35-65 on Yandex Games (58% of 45M MAU platform) (Source: CPO research, CMO validation)
- **Secondary:** Kamil (10) and general casual gamers
- **Design for:** 5-7 minute relaxing sessions, no time pressure, cute satisfying merges
- **JTBD:** "Relax brain" + "feel progress" (Source: CPO Jobs-to-be-Done analysis)

### Revenue Model (CFO Lens)

- **Pricing:** Free, ad-supported (all 3 formats)
  - Interstitial after game over (highest CPM, natural trigger)
  - Rewarded video for extra life/bonus (player-initiated, 55+ tolerant -- Source: CPO AARP data)
  - Sticky banner in score area above gameplay canvas (non-intrusive -- Source: COO conflict resolution)
- **Unit Economics:**
  - CAC = 0 rub
  - CPMV estimate: 80-120 rub (drop-merge sessions 5-15 min = higher viewability than runners/clickers -- Source: CFO CPMV analysis, drop-merge sessions from CPO)
  - Week 1 DAU: 300-600 (Novinski boost, Source: CFO Scenarios A-B)
  - Month 1 DAU: 80-200 post-boost
  - Month 3 DAU: 40-120 steady state
- **3-Month Revenue:**
  - Base case (Scenario A+): ~2,000 rub (Source: CFO revised model post-critique)
  - Quality case (Scenario B): ~12,000-15,000 rub
  - Expected value (probability-weighted): ~4,100 rub (Source: CFO EV calculation in critique)
- **Path to 3,000 rub withdrawal:** 2-4 months under Scenario A+, 1-2 months under Scenario B
- **Gross margin:** ~94% (6% samozanyatyy tax, Source: CFO margin analysis)

**CFO Kill Question:** Revenue covers time investment? At opportunity cost framing: NO ($8,000 equivalent time vs $44 expected revenue). At educational ROI framing: YES. Conditional pass.

### Go-to-Market (CMO Lens)

- **Primary channel:** Yandex "Novinski" organic 7-day window
- **Card Completion Progress:** GREEN (100%) BEFORE submission (Source: CMO -- this is an ML ranking factor, not optional)
- **Metadata requirements:**
  - 2 icon variants for built-in A/B test (Source: CMO, A/B tool in Yandex console)
  - Cover image (800x600)
  - 5 screenshots (gameplay moments)
  - Gameplay video clip (Source: CMO Card Completion checklist)
  - RU + EN descriptions (500+ chars each)
  - Categories: Casual, Puzzle
  - Age: 0+
- **Naming formula:** [Theme] + [Action] (Source: CMO naming analysis)
  - RU: "Zveryata: Sliyanie" or "Pushistoe Sliyanie"
  - EN: "Animal Merge" or "Fluffy Merge"
  - NOT: "Suika", "Clone", or any brand reference
- **Post-launch:**
  - Day 1 post-approval: Activate A/B icon test
  - Monitor rating daily (target > 40 by day 7)
  - Monitor session length (target > 5 min avg)
  - If rating 30-40 at day 14: emergency game-feel fix
  - If rating < 30: evaluate patch vs accept as learning

**CMO Kill Question:** Repeatable channel = Novinski window per game. For portfolio: repeatable. For single game: one-shot event into ML retention loop.

### Operating Model (COO Lens)

**Total timeline: 3 weeks**

**Week 1 -- Build + Polish**

| Day | Owner | Gate |
|-----|-------|------|
| Day 0 | Oleg | Samozanyatyy registered + RSY application submitted + GitHub repo created |
| Day 1 | Claude Code + Oleg | Drop mechanic works (physics, collision). SDK mock ready for local dev. |
| Day 2 | Claude Code + Oleg + Kamil | Merge loop complete. Game over triggers. "Play Again" instant. Kamil smiles at merge = pass. Sound test: 3 merge sound variants, pick best. |
| Day 3 | Claude Code | SDK integration: all 7 CTO pitfalls verified. Interstitial + rewarded + banner fire correctly. Leaderboard connected. GameplayAPI.start/stop correct. |
| Day 4 | Oleg + Claude Code | 8 animal sprites sourced (Kenney CC0). Merge animation (0.2s scale + particle burst). Background + UI. Large touch targets (44px+), large text (18px+). |
| Day 5 | Oleg + Kamil | Mobile QA on real device. Portrait + landscape. No scrollbar. No JS errors. 10+ min gameplay confirmed. 15-point pre-submit checklist all green. |

**Week 2 -- Submit + Productive Wait**

| Day | Owner | Activity |
|-----|-------|----------|
| Day 6 | Oleg | 2 icon variants created. Cover. 5 screenshots. RU + EN descriptions. Gameplay video. Card Completion = green. |
| Day 7 | Oleg | ZIP packaged (< 100MB, index.html at root, no CDN). Submit to Yandex console. |
| Days 8-12 | Oleg + Kamil | Moderation wait. Productive use: push boilerplate repo, write 7-day playbook, curate asset library, scope game #2 concept with Kamil. |
| If rejected | Oleg | Read rejection reason. Classify (technical/content/duplicate). Fix. Resubmit. +5 working days. |

**Week 3 -- Go-Live + Novinski Window**

| Day | Activity |
|-----|----------|
| Day 1 post-approval | Activate A/B icon test. Verify ads fire on real platform. |
| Days 1-3 | Monitor D1 retention (target: 25%+). If < 20% = emergency UX review. |
| Days 3-7 | Monitor rating (target: > 40). Fix any game-feel bugs immediately. |
| Day 7 | Exit Novinski. Rating must be > 30. |
| Day 21 | Platform auto-check. Rating > 30 = survived. |

**Agent/Human split:**

| Agent (Claude Code) | Human (Oleg) |
|---------------------|--------------|
| Scaffold Phaser + Matter.js project | Judge "does merge feel satisfying?" |
| Implement physics/merge/scoring from reference clone | Play-test 5+ sessions on mobile |
| Integrate all 7 SDK functions with error handling | Set up samozanyatyy + RSY accounts |
| Generate 3 merge animation variants | Select animal progression chain with Kamil |
| Write RU + EN metadata from brief | Approve final submission |
| Run 15-point pre-submit checklist | Respond to moderation rejection |
| Generate icon/cover concepts | A/B test decision |

**COO Kill Question:** What breaks at 10x? Moderation queue (3-5 days per game). Mitigated by boilerplate repo (saves 10-15h per subsequent game) and parallel submission tracks.

### Technical Approach (CTO Lens)

- **Stack:** TypeScript + Phaser 3.90.0 + Matter.js (built-in) + Vite 5.x
- **Reference architecture:** sgbj/suika-clone (structural pattern, not direct copy)
- **Build vs Buy:**

| Build (our differentiation) | Buy/Reuse (commodity) |
|----|----|
| Animal progression chain (8 tiers: hamster to bear) | Phaser 3 framework |
| Scoring system + personal best tracking | Matter.js physics (via Phaser) |
| Game over detection (danger line) | Yandex Games SDK |
| Ad trigger manager (game-over only, no forced) | Kenney Animal Pack Redux (CC0 sprites) |
| Merge animation spec (0.2s, spring easing, particles) | Freesound CC0 merge sounds |
| UI layout (large elements for 55+ audience) | Vite build tooling |

- **Project structure:**
```
src/
  main.ts              -- SDK init wrapper, Phaser config
  scenes/
    PreloadScene.ts    -- Asset loading
    MenuScene.ts       -- Start screen, best score
    GameScene.ts       -- Core gameplay
  objects/
    Animal.ts          -- Matter.js circle + sprite + tier label
    MergeChain.ts      -- 8-tier progression config
  sdk/
    YandexSDK.ts       -- SDK wrapper + mock for local dev
    AdManager.ts       -- Interstitial, rewarded, banner
  config/
    GameConfig.ts      -- Constants, sizing, tier definitions
```

- **SDK pitfalls addressed (from CTO research):**
  1. Phaser init inside YaGames.init().then() -- not before
  2. game_api_pause/resume event handlers
  3. Pause physics + audio before any ad call
  4. onError callback on every ad call (game never freezes)
  5. GameplayAPI.start/stop at correct moments
  6. SDK mock for local development
  7. No setInterval ad calls (only event-triggered)

- **Pre-submit checklist:** 15 items from COO + 7 SDK pitfalls from CTO = unified SUBMIT_CHECKLIST.md

**CTO Kill Question:** Same stack from scratch? YES. All 7 first-principles checks pass. (Source: CTO revised position post-critique)

### UX Priorities (CPO Lens)

- **Primary JTBD:** "Rest the brain" -- relaxing puzzle without social pressure (Source: CPO JTBD analysis)
- **Wow moment:** First merge of two identical animals with satisfying sound + particle animation in first 30 seconds of play. BEFORE any advertisement. (Source: CPO "wow moment" analysis, validated by AARP 55+ data)
- **Retention drivers:**
  1. Personal highscore + "New Record!" celebration (Source: CPO switching costs analysis)
  2. Visual progression -- player sees "next animal" they haven't reached yet (Source: CPO progression mechanics)
  3. Yandex leaderboard via SDK (Source: CMO -- factor for editorial featuring)
  4. "One more try" reflex -- prominent "Play Again" button, zero delay at game over
- **Animal progression chain (Source: CPO visual style recommendation):**
```
Hamster -> Rabbit -> Kitten -> Cat -> Dog -> Fox -> Panda -> Bear (final)
```
- **Anti-patterns enforced:**
  1. NO ad in first 60 seconds (Source: CPO AARP data -- #1 cause of uninstall for 55+)
  2. NO text tutorial (Source: CPO -- 30-40% abandon before first merge with text tutorials)
  3. Implicit tutorial only: arrow pointing to drop zone, player acts naturally
  4. NO forced game over screen with delay -- instant "Play Again"
  5. Large UI: 44px minimum touch targets, 18px minimum text (Source: CPO 55+ audience needs)

**CPO Kill Question:** What does user lose? Personal highscore + emotional attachment to "my" animal versions. Low switching cost, but the animal theme creates stronger emotional fingerprint than geometric shapes or fruits. (Source: CPO Cozy Merge 96% positive reviews as evidence)

### Risks (Devil Lens)

- **Most likely failure mode:** Game survives but earns 50-200 rub/month. Never reaches 3,000 rub withdrawal threshold within 3 months. Kamil sees a number but can't touch real money.
  - **Probability:** ~40% (Source: CFO probability estimates, Devil case studies)
  - **Mitigation:** Redefine success to Kamil as "balance growing" not "money in hand." Show him the dashboard weekly.

- **Competitive threat:** Drop Merge 2048 (rating 78, score 4.5) already exists on Yandex Games (Source: Devil research). Our game enters with rating 0 against established competitor.
  - **Mitigation:** Animal theme differentiates. We don't need to beat Drop Merge 2048 -- we need rating > 30 to survive.

- **Market timing:** 2.5 years after Suika peak (Source: Devil timeline analysis). But CTO and COO argue genres normalize, they don't die. Solitaire peaked in 1990s, still dominates.
  - **Mitigation:** Target audience (55+ women) likely hasn't played Suika clones extensively. For them, physics merge may be novel.

- **Moderation risk:** Rejection as Suika duplicate (Sept 2025 rules, Source: Devil research).
  - **Probability:** ~15-25% with animal theme (lower than fruit theme)
  - **Mitigation:** Animals, unique branding, 15-point checklist, 7 SDK pitfalls verified.

- **Founder risk:** Oleg's anti-pattern #1 "starts many, finishes few." If attention shifts to another project on Day 3, game dies.
  - **Mitigation:** 3-week plan with daily gates. Each day has binary pass/fail. Structure forces completion.

**Devil Kill Question:** "What do we know that nobody agrees with?" This is an educational experiment disguised as a business. Accepting this reframe is what makes it succeed -- expectations align with reality.

### Trade-offs

**Strengths:**
- Optimizes for platform survival (rating > 30)
- Teaches Kamil that QUALITY code = money (stronger educational lesson)
- Creates reusable boilerplate for game #2 (portfolio option preserved)
- 3-week timeline is realistic and achievable
- Cute animals theme: differentiated, audience-appropriate, moderation-safe

**Weaknesses:**
- Takes 3 weeks instead of 1 (expectation management needed with Kamil)
- Still unlikely to reach 3,000 rub in Month 1 (base case: 2,000 rub in 3 months)
- More effort from Oleg (5-6 full days of focused work vs 3 days in Strategy 1)
- Retention metrics are uncertain -- browser D1 benchmarks may not apply to Yandex specifically

### Rationale

This is the **board consensus strategy**. Evidence:

- CPO: "Cute animals + wow moment in first 5 seconds + no ads before first game over" (research-cpo.md, Must-Have recommendations + AARP 2023 data on 55+ gamers)
- CFO: "Scenario A+ with animal theme: ~2,000 rub in 3 months. EV ~4,100 rub probability-weighted" (critique-cfo.md, Updated Financial Model)
- CMO: "Card Completion = green before submission is ML ranking factor, not optional" (research-cmo.md, Focus Area 2)
- COO: "Ship fast then polish does NOT work on Yandex Games. Quality at launch = everything" (research-coo.md, Focus Area 5)
- CTO: "Phaser + Matter.js confirmed by all peers. Animals > geometric shapes. All 7 first-principles checks pass." (critique-cto.md, Revised Position)
- Devil: "Conditional GO. Cute animals theme. Open-source base. RSY Day 0. Timeline = 3 weeks. Success = balance > 0." (critique-devil.md, Final Verdict)

---

## Strategy 3: "Animal Factory" -- Portfolio-First with Game 1 as Prototype

### Core Idea

Treat Game 1 not as a standalone experiment but as the first unit in a portfolio factory. Invest extra time on Day 0 to build reusable infrastructure (boilerplate repo, SDK wrapper, asset library, publishing checklist). Game 1 takes slightly longer (3-4 weeks) but every subsequent game takes 5-7 days from concept to submission. The educational lesson for Kamil becomes: "build a system that makes money, not a single game."

### Target Customer

Same as Strategy 2 for Game 1. Portfolio diversifies across genres by Game 3-4.

### Revenue Model (CFO Lens)

**Portfolio revenue model (after 3-6 months):**

| Games | Monthly Revenue (each) | Total Monthly | Source |
|-------|----------------------|---------------|--------|
| 1 game (Month 1) | 300-800 rub | 300-800 rub | CFO Scenario A+ |
| 3 games (Month 3) | 200-500 rub each | 600-1,500 rub | CFO scaling, COO automation ROI |
| 5 games (Month 6) | 150-400 rub each | 750-2,000 rub | Extrapolation with DAU decay |

- **Portfolio benchmark:** mrttrt published 52 games, earned 15,000+ rub total (~289 rub/game average). (Source: CFO research, Source 4)
- **Better benchmark:** Davilkus Games (solo teen dev) portfolio of clickers = 100K+/month at scale. (Source: COO research, comparable model)
- **Path to 3,000 rub withdrawal:** 2-3 months with portfolio of 2-3 games generating combined revenue
- **Self-employed ceiling:** 2.4M rub/year. Irrelevant at current scale, transition to IP at ~1.5M/year. (Source: COO scaling analysis)

**CFO Kill Question:** Portfolio math works even with conservative per-game estimates. 5 games x 300 rub/month = 1,500 rub/month = 3,000 rub in 2 months. This is how the 3,000 withdrawal becomes realistic.

### Go-to-Market (CMO Lens)

**Portfolio launch cadence:**
- Game 1: Animal drop-merge (3 weeks total)
- Game 2: Different mechanic, same audience (1.5 weeks dev with boilerplate + 1 week moderation)
- Game 3: Kamil's first solo game with Oleg mentoring (2 weeks)
- Repeatable channel: Each new game gets its own Novinski 7-day window

**CMO Kill Question:** The portfolio IS the repeatable channel. Each publication = new Novinski window. This is the only way "Novinski organic" becomes a repeatable acquisition strategy.

### Operating Model (COO Lens)

**Phase 1: Factory Setup (Days 0-2, one-time)**
- Samozanyatyy + RSY registration
- GitHub boilerplate repo: Phaser + Matter.js + Yandex SDK pre-integrated
- SDK wrapper module (AdManager.ts + YandexSDK.ts) -- copy-paste per game
- SUBMIT_CHECKLIST.md (15 moderation items + 7 SDK pitfalls)
- Asset library folder (Kenney curated packs)
- Metadata template (title formula, description structure)

**Phase 2: Game 1 Development (Days 3-10)**
Same as Strategy 2 Week 1, but using boilerplate from Day 0.

**Phase 3: Submit + Productive Wait (Days 11-20)**
Same as Strategy 2 Week 2, but productive wait is specifically used for:
- Documenting the 7-day development playbook
- Scoping Game 2 mechanic
- Kamil picks Game 2 concept (mentor moment: "what does the Yandex audience want?")

**Phase 4: Game 2 onward (repeating cycle)**
- 5-7 day development cycle per game (with boilerplate saving 10-15h per game -- Source: COO automation ROI)
- Submit game N+1 while game N is in moderation (parallel tracks)
- Each game = different mechanic (anti-duplicate rule prevents same-genre spam)
- Kamil takes primary developer role by Game 3-4

**Automation ROI:**

| Investment | Time Cost | Per-Game Savings | Payback |
|-----------|-----------|------------------|---------|
| Boilerplate repo | 4-6h (Day 0) | 4-6h per game | Game 2 |
| SDK wrapper | 2-3h (Day 0) | 2-3h per game | Game 2 |
| Asset library curation | 2-3h (Day 0) | 2-3h per game | Game 2 |
| Metadata template | 1-2h (Day 0) | 1-2h per game | Game 2 |
| **Total** | **9-14h** | **9-14h per game** | **Game 2 = full payback** |

(Source: COO Process Design & Automation ROI section)

**COO Kill Question:** At 10x (10 games), bottleneck = moderation queue (3-5 days per game, serial for same genre). Solution: different genres per game, parallel submission tracks. By Game 4, Kamil = second barrel (QA + concept + metadata).

### Technical Approach (CTO Lens)

Same stack as Strategy 2, with infrastructure additions:
- **Boilerplate repo** as the reusable foundation
- **SDK wrapper** extracted as a standalone module
- **Game-specific config file** that changes per game (theme, progression, colors)
- **Build script** that outputs Yandex-compatible ZIP from Vite

### UX Priorities (CPO Lens)

Same as Strategy 2 for Game 1. Portfolio enables experimentation:
- Game 1: Drop merge (proven mechanic, animal theme)
- Game 2: Different genre (test another hypothesis with same audience)
- Game 3: Kamil's choice (educational moment: he designs for an audience, not himself)

### Risks (Devil Lens)

- **Most likely failure:** Game 1 underperforms, Oleg loses motivation before Game 2. Anti-pattern #1 triggers.
  - **Mitigation:** Game 1 success = balance > 0. Low bar. Game 2 starts during moderation wait (no dead time).
- **Portfolio trap:** Quantity over quality. KvaytG made 8 games in 2 weeks = 429 rub total. (Source: Devil research)
  - **Mitigation:** Quality bar per game (rating > 30 target). Not factory-of-junk.
- **Scope creep:** Building "factory infrastructure" becomes the project instead of shipping games. (Founder anti-pattern #2: "optimizes tooling instead of product")
  - **Mitigation:** Infrastructure investment capped at Days 0-2. After that: ship Game 1. No more tooling until Game 1 is live.

### Trade-offs

**Strengths:**
- Only strategy where 3,000 rub withdrawal becomes realistic within 3 months
- Creates infrastructure for Kamil to build independently
- Repeatable revenue model (each game = new revenue stream)
- Stronger educational lesson: "build systems, not just products"
- Boilerplate investment pays back on Game 2

**Weaknesses:**
- Highest total time investment (3-4 weeks for Game 1 + ongoing)
- Highest risk of founder attention drift (multi-week commitment)
- Quality-quantity tension is real (KvaytG cautionary tale)
- Assumes Oleg commits to multiple games, not one-shot
- Kamil may lose interest waiting for the "factory" to work

### Rationale
- COO: "Plan for portfolio from Day 1, but invest infrastructure incrementally. Boilerplate repo needed by Game 2." (research-coo.md, OQ-6 Decision)
- CFO: "Portfolio math: 5 games x 300 rub/month > 3,000 rub withdrawal threshold" (Source: CFO portfolio extrapolation)
- CMO: "The channel IS the portfolio. Each publication = new Novinski window." (critique-cmo.md, Biggest Gaps #3)
- CTO: "Boilerplate repo as first infrastructure investment... reusable SDK wrapper module." (critique-cto.md, Agree with COO)
- Devil: "manki2games closed shop after 5 games -- portfolio doesn't guarantee success" (research-devil.md, case study)

---

## Cross-Strategy Comparison

| Dimension | Strategy 1: Kamil's First Ruble | Strategy 2: Zverata (Quality Launch) | Strategy 3: Animal Factory (Portfolio) |
|-----------|-------------------------------|-------------------------------------|---------------------------------------|
| **Core goal** | Kamil sees any money | Game survives + earns sustainably | Build revenue system |
| **Timeline** | 2 weeks | 3 weeks | 3-4 weeks (Game 1) + ongoing |
| **Dev effort** | 3 days coding | 5-6 days coding | 7-8 days (incl. infra) |
| **Quality bar** | Pass moderation | Rating > 30 survival | Rating > 30 + reusable infra |
| **Revenue (Month 1)** | 50-300 rub | 300-800 rub | 300-800 rub (Game 1 only) |
| **Revenue (Month 3)** | 100-500 rub (if survives) | 1,000-4,000 rub | 1,500-5,000 rub (3 games) |
| **3,000 rub withdrawal** | Unlikely (6-12 months) | Possible (3-4 months) | Probable (2-3 months with portfolio) |
| **CAC payback** | N/A (CAC = 0) | N/A (CAC = 0) | N/A (CAC = 0) |
| **Primary channel** | Novinski organic | Novinski + ML retention loop | Novinski per game (repeatable) |
| **Tech risk** | Low | Low | Low |
| **Org complexity** | Low | Medium | Medium-High |
| **Time to first money** | Day 14-20 post-start | Day 18-25 post-start | Day 20-30 post-start |
| **Founder attention risk** | Low (short commitment) | Medium (3 weeks) | High (ongoing commitment) |
| **Educational value** | Basic: code = some money | Strong: quality code = sustainable money | Strongest: systems = scalable money |
| **Reusability** | None | Partial (code learnings) | Full (boilerplate, playbook, infra) |
| **Kamil involvement** | Observer | Tester + animal chooser | Co-designer by Game 3 |

---

## Recommendation Framework (for Founder)

### Choose Strategy 1 ("Kamil's First Ruble") if:

- Oleg cannot commit more than 1 week of focused effort
- The ONLY goal is "Kamil sees a non-zero ruble number in a dashboard"
- There is zero interest in making a second game
- Other projects are pulling attention (anti-pattern #1 risk is HIGH)
- Oleg is comfortable with the game likely being auto-deleted after 3 weeks

**Risk profile:** Lowest effort, lowest return, highest chance of completion, lowest chance of meaningful educational impact.

### Choose Strategy 2 ("Zverata") if:

- Oleg can commit 3 focused weeks without major distractions
- The goal is "Kamil sees quality code earning sustainable money"
- There is moderate interest in MAYBE making a second game later
- Oleg wants a game he can show to people without embarrassment
- "Game survives on platform" matters for the educational story

**Risk profile:** Moderate effort, moderate return, high chance of completion if founder stays focused, strong educational impact. **This is the board consensus recommendation.**

### Choose Strategy 3 ("Animal Factory") if:

- Oleg is genuinely interested in casual game development as a side income stream
- Kamil learning to build his own games (by Game 3) is a real goal, not just talk
- Oleg can commit 1-2 months of part-time effort (3-5 hours/week after Game 1)
- The 3,000 rub withdrawal threshold matters (Kamil holding real money)
- Building reusable infrastructure excites Oleg (warning: anti-pattern #2 "optimizes tooling")

**Risk profile:** Highest effort, highest potential return, highest risk of abandonment, strongest educational value IF completed.

---

## Chairman's Note

The board has achieved remarkable consensus on the tactical questions: drop-merge genre, cute animals theme, ads only, 3-week timeline, samozanyatyy on Day 0. All 6 directors converged on these after cross-critique.

The strategic divergence is on AMBITION LEVEL:
- Strategy 1 = minimum viable lesson
- Strategy 2 = quality lesson with sustainability
- Strategy 3 = systems thinking lesson with ongoing revenue

Given the founder's profile (anti-pattern #1: "starts many, finishes few"), Strategy 2 is the optimal balance. It is ambitious enough to create a meaningful educational experience but bounded enough (3 weeks, single game, clear gates) to have high completion probability.

If the founder feels strong momentum after Game 1 ships, the transition from Strategy 2 to Strategy 3 is natural: extract the boilerplate during moderation wait, scope Game 2, and evolve into the portfolio model. Strategy 2 does not foreclose Strategy 3 -- it is a stepping stone.

**The decision is the founder's. The board has spoken.**

---

## Next Steps

1. **Founder decision:** Choose one strategy (or announce "Strategy 2 with option to evolve into 3")
2. **Day 0 actions (all strategies):** Register samozanyatyy via Moy Nalog app + create RSY account at partner.yandex.ru + create Yandex developer account
3. **Write business blueprint:** Document chosen strategy in `ai/blueprint/business-blueprint.md`
4. **Proceed to Architect:** Hand off to `/architect` skill for system design (Phaser project structure, SDK integration architecture, build pipeline)
