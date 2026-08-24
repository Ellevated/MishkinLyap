# CMO Cross-Critique — Round 1

**Director:** Tim Miller (CMO)
**Date:** 2026-03-04

---

## Peer A — CTO (Piyush Gupta lens)

### Agree

- **Phaser + Matter.js is the right call.** I agree 100% that this stack minimizes implementation friction for a 1-week sprint. The evidence is strong: multiple working open-source clones prove feasibility, and the zero-config physics integration is a genuine advantage over PixiJS path. From a CMO lens this is critical — shipping speed IS the marketing strategy here. The launch window in "Novosti" (New Games) is 7 days. Every hour spent fighting custom physics bridges is an hour not spent on the icon A/B test or Card Completion.

- **TypeScript + Vite recommendation is correct.** Not just for code quality — better AI codegen means faster iteration cycles, which means more time to tune the "aha moment." I care about this because activation quality (how quickly the player gets to first merge) is the single biggest driver of D1 retention.

- **Reference existing clone, don't start blank.** This aligns with my "one channel" philosophy applied to technical execution. Don't invent — combine what works. Using sgbj/suika-clone as structural reference is exactly right.

### Disagree

- **SDK pitfalls section is excellent technically but misses the growth angle.** The CTO correctly identifies `GameplayAPI.start/stop` as a ranking signal, but treats it as a compliance checkbox. From CMO perspective this is a *growth lever*: correct GameplayAPI implementation improves algorithm score → more impressions → better launch week performance. This isn't just "medium severity avoid rejection" — it's the algorithmic hook that feeds the ML funnel. It should be called out as a conversion rate factor, not a moderation requirement.

- **No guidance on pre-launch metadata optimization.** The tech report covers SDK integration deeply but treats the game card (icon, cover, descriptions) as an afterthought. From my research: Card Completion Progress directly affects ML ranking. A perfect SDK integration with a 50% complete card will lose to a mediocre SDK + green card. The CTO should have flagged this as a build dependency: get card assets ready in parallel with code.

### Gap

- **No traffic funnel analysis.** The CTO tells us how to build the game correctly, but not how the game gets discovered. There's no mention of how Phaser build output affects load time (which Yandex uses as a signal), no mention of icon CTR as the top-of-funnel metric, no mention of how mobile viewport optimization affects the "Novosti" impression quality. These are technical decisions with direct marketing consequences.

- **Rating = 30 threshold not incorporated into development priorities.** The CTO knows about the auto-deletion rule (mentioned briefly) but doesn't derive technical implications: the leaderboard SDK integration isn't optional polish — it's a D7 retention mechanism that directly determines whether the game survives past week 3. Should have been flagged as P0, not P2.

### Integration

The CTO research is the strongest complement to my own. It fills the "how to build" gap in my report. My revised recommendation: treat CTO's 7-day implementation plan as the production schedule, but assign CMO priorities to each day. Day 3 (SDK integration) needs to include not just ad calls but the leaderboard and GameplayAPI signals — those are marketing infrastructure, not just tech plumbing.

**Rating: 5/5** — Highest quality research, specific, actionable, backed by real open-source references.

---

## Peer C — Devil's Advocate (Peter Thiel lens)

### Agree

- **Moderation timeline is brutally accurate and everyone else underestimates it.** The DA correctly identifies that "1 week" only covers development, not the 3-5 day moderation + potential rejection cycle. This is the single biggest gap in my own research. I called out "submit on Day 0, approve on Day 3-5" but treated first-pass approval as the baseline. The DA's realistic timeline of 2-3 weeks end-to-end is correct and I should have said it more explicitly.

- **Drop-merge saturation signal is real.** The 2.5 years since Suika Game peak, the 29K game deletions in 2025, Yandex's anti-duplicate rules — these are genuine signals that the genre has moved from "exciting" to "expected." From a channel perspective, this matters because the ML algorithm at Yandex rewards novelty and engagement. A game entering a saturated genre starts with a handicap in the algorithm.

- **"Переопределить успех" insight is correct.** The DA's framing of MVO (Minimum Viable Outcome) = balance > 0₽ vs. maximizing revenue is exactly right for this project context. This changes the marketing strategy: instead of optimizing for scale, optimize for a single clean demonstration loop (code → players → money). The kill question becomes "does Kamil see a growing number?" not "what's the CAC?"

- **Kamil's taste vs. platform demographics conflict is real.** The DA correctly flags that design decisions made to please a 10-year-old will kill retention among 55+ women. The conflict between who builds it and who plays it is a legitimate product-market fit risk.

### Disagree

- **"Buy the $5 Feronato source" recommendation misses the moderation risk.** The DA suggests buying Feronato's Phaser Suika source to save development time. Problem: Yandex's September 2025 anti-duplicate rules specifically target games where developers "just change the background." Buying a known commercial source and retheming it is exactly the pattern Yandex's moderation is trained to catch. From a CAC/risk perspective, the cost of a moderation rejection (+5 working days) exceeds the $5 savings by a factor of 1000x. Better to use as structural *reference* (as CTO recommended) without direct copy-paste.

- **"Educational reframing" underestimates the business case.** The DA argues that because this is a learning experiment, we shouldn't optimize for commercial success. I disagree: the correct optimization is to maximize probability of seeing real money in a real balance, because *that* is what makes the lesson land. A game that earns 17₽ teaches the same lesson as one that earns 200₽, but the latter teaches it with more conviction. The DA's "lower the bar" recommendation could lead to shipping a game too weak to pass Yandex's auto-deletion threshold, which would teach the wrong lesson entirely.

- **"Bubble Shooter is more relevant (#1 traffic)"** — the DA floats this without data. My research shows the platform demographic is 58% women 55+ who play casual/puzzle. The CTO report confirms Bubble Shooter complexity is 2-3x higher for the same retention value. The DA should have compared actual implementation cost vs. expected traffic, not just cited genre ranking.

### Gap

- **No alternative strategy recommended with specific metrics.** The DA identifies every problem but the solutions are generic: "add one real twist," "buy the source," "plan 3 weeks." There's no channel analysis: *if* drop-merge is saturated, which genre has better DAU/effort ratio? What's the actual search volume on Yandex for "merge game" vs. "bubble shooter"? A true contrarian needs to propose a better alternative with numbers, not just poke holes in the consensus.

- **Misses the portfolio angle entirely.** From a CMO perspective, the most interesting path is a portfolio strategy: publish game 1 as a learning experiment, build boilerplate, publish games 2-3 faster with better quality, optimize by data. The DA correctly notes that developer "mrttrt" with 52 games earned 15K+ — but doesn't extract the lesson: the channel *is* the portfolio, and game 1 is the acquisition cost for the playbook.

### Integration

The DA's research forced me to revise my launch timeline from "7 days" to "7 days development + 5-10 days moderation." This is a meaningful correction. The "3 weeks end-to-end" framing changes how we communicate success to Kamil: the lesson isn't "we built a game in a week," it's "we built, submitted, and waited — and the money arrived."

**Rating: 4/5** — Best at identifying failure modes. Weaker on alternative strategies with data. The contrarian lens is valuable precisely because it stress-tests optimistic assumptions.

---

## Peer D — CFO (Unit Economist)

### Agree

- **CAC = 0 transforms the analysis completely.** The CFO correctly reframes the standard CAC payback question. When acquisition cost is zero, the economics reduce to: "is there any positive return on time invested?" The answer is yes, but the CFO correctly quantifies the magnitude — it's small. This is exactly the analysis I should have done more explicitly in my own report.

- **All 3 ad formats (interstitial + rewarded + sticky banner) = correct.** The CFO proves this with math: rewarded video adds 20-40% incremental revenue at same DAU. From a CMO lens, rewarded video also has a secondary benefit — it's *player-initiated*, which means it's a lower churn risk than interstitials. The CFO got this right.

- **"No IAP in v1" is correct.** The CFO's math is decisive: at <500 DAU, IAP adds <15% revenue while consuming 25-40% of the 7-day sprint budget. This is the right call. I agree completely. From a growth perspective, IAP at this scale also increases complexity without improving the "code → money" demonstration loop for Kamil.

- **Two-stage success definition is useful.** Stage 1 = balance growing (even 100₽ proves model). Stage 2 = withdrawal (3,000₽). This framing maps cleanly to my "survival threshold" vs. "growth" framework. Stage 1 aligns with "rating > 30 at week 3."

- **Самозанятый registration as Day 0 action** — 100% agree. This is a prerequisite for the lesson to work. If Kamil sees a growing balance but can't withdraw, the lesson is incomplete. The CFO correctly flags this as blocking infrastructure.

### Disagree

- **The financial model is built on assumptions that aren't stress-tested by acquisition funnel.** The CFO's Scenario A assumes 300 DAU in week 1 and 80 DAU in month 1. But these numbers don't flow from a channel model — they're estimates. From a CMO perspective: these numbers are direct outputs of Card Completion Progress (affects ML ranking → affects impressions in "Novosti"), icon CTR (determines click-to-play conversion), and D1 retention (determines whether the algorithm continues showing the game). The CFO treats DAU as an exogenous input when it's actually the output of the entire marketing and product strategy.

- **CPMV range (30-300₽) is presented without conditional logic.** The CFO shows the range but doesn't explain what drives a game to 300₽ CPMV vs. 30₽. From my research: session length is the primary driver (longer sessions = more visible impressions = higher CPMV). Drop-merge naturally produces 5-15 min sessions vs. runner/clicker at 1-3 min. The CFO should have modeled this explicitly: drop-merge mechanically earns 2-5x the CPMV of a comparable click game, which changes the scenario assumptions materially.

### Gap

- **No analysis of ad frequency optimization.** The CFO recommends 3 ad formats but doesn't model the retention impact of ad frequency. From my research: too-frequent interstitials (especially any before first game over) are the #1 churn cause for the 55+ audience. If the CFO had modeled "high frequency ads → 20% more revenue in week 1 → 40% churn increase → 60% less revenue in weeks 2-4," the recommendation would be: optimize for retention first, ad frequency second. The net lifetime value is higher with fewer, better-timed ads.

- **No competitive revenue benchmarks for the genre.** The CFO uses developer case studies (runner, clicker) but doesn't have drop-merge-specific data. Given the genre's longer session length, CPMV for drop-merge should be modeled at the high end of the range (100-200₽), not at the conservative midpoint.

### Integration

The CFO report is the strongest financial foundation in the peer set. It gives me the numbers I needed to complete my funnel model:

**Revised revenue expectation:**
- Week 1: 378-2,520₽ (CFO scenarios A-B)
- Month 1-3: 1,680-13,680₽ (CFO scenarios A-B)
- Realistic for quality game: 3,000-8,000₽ in 3 months

This means the 3,000₽ withdrawal threshold is reachable within the first 3 months for a decent-quality game — which makes the educational experiment more credible.

**Rating: 4/5** — Best financial model in the peer set. Could be stronger with retention-to-revenue linkage.

---

## Peer E — COO (Keith Rabois lens)

### Agree

- **"Ship fast then polish does NOT work on Yandex Games"** — this is the single most important operational insight in the entire peer set. The standard SaaS/startup advice to ship MVP and iterate is wrong for this platform because of the Yandex auto-deletion rule. Quality at launch > quality after iteration. This directly reinforces my recommendation: Card Completion = 100% BEFORE publish, not as an iteration step.

- **Pre-submit checklist as a zero-rejection investment.** The COO's 15-point checklist is the best tool for preventing the scenario the DA identified: a moderation rejection that adds 5+ days to the timeline. From a channel perspective, the "Novosti" window is time-limited — a rejection that delays launch by 5 days is a direct reduction of the available traffic window. The checklist has a CAC-equivalent value I'd estimate at 5 working days × $200/hour × 4 hours = $4,000 equivalent.

- **RSY registration on Day 0, not Day 7.** The COO correctly identifies this as a process dependency: RSY takes 1-3 days to verify. Delay here = delayed revenue regardless of game quality. This is the biggest operational failure mode that isn't technical.

- **Boilerplate repo after game 1 ships** — correct prioritization. Build the reusable infrastructure only after validating the single-game hypothesis. Don't invest in factory tooling before proving the unit economics of one unit.

### Disagree

- **Day-by-day plan is high-fidelity but under-weights marketing preparation.** The COO plan is excellent for engineering execution, but Days 5-6 allocate only 2-3 hours to icon, cover, screenshots, and descriptions. From my research, the icon A/B test (built into Yandex Games console) requires 2 variants ready at launch. Icon creation and testing deserves its own half-day, not 30 minutes within a day that also includes packaging and submission. The algorithm sees Card Completion progress as a ranking factor — rushing this step is a direct revenue impact.

- **"Kamil becomes co-barrel on game #3" underestimates distraction risk.** The COO suggests Kamil takes game #2 as primary developer with Oleg mentoring. This is an interesting vision, but from a channel/growth perspective: if the bottleneck is moderation queue (3-5 days per game), having Kamil independently build games while Oleg is in moderation wait for another game makes sense. However, mixing educational goals (Kamil learns) with production goals (ship quality game) is a risk the DA correctly identified — Kamil's taste diverges from platform demographics. Better: Kamil as QA + "does this feel fun" tester, not primary developer, until game #4+.

### Gap

- **No mention of post-approval marketing.** The COO plan ends at Day 7 (submission). But the "Novosti" window is the first week post-*approval*, not post-submission. The 3-5 day moderation wait means the marketing preparation (icon variants, second language draft, leaderboard active) should happen *during* the moderation wait, not before submission. The COO plan should have a "Week 2: Moderation Wait + Marketing Prep" phase.

- **Quality metrics are survival-oriented, not growth-oriented.** The COO's quality targets (rating > 30, player rating > 4.0, session > 3 min) are minimum thresholds, not optimization targets. The difference between "survives" and "goes viral on platform" is in the metrics above these thresholds: D1 retention > 35%, sessions > 7 min, leaderboard participation rate. These should be in the COO's quality dashboard.

### Integration

The COO report gives me the operational infrastructure I needed to back up my launch strategy. Combined with my CMO research:

**Key integration:** The pre-submit checklist (COO) + Card Completion = green (CMO) = same requirement expressed from two angles. I'm now more confident this is the #1 operational priority.

**Revised Day 6 recommendation:** Split into Day 6A (icon A/B test preparation — 2 variants, full card completion) and Day 6B (packaging + submission). Don't rush the marketing assets.

**Rating: 4/5** — Best operational detail in the peer set. Strongest on process. Weaker on post-launch marketing and growth optimization.

---

## Peer F — CPO (Jeanne Bliss lens)

### Agree

- **"Cute animals" wins over "fruits" for the target demographic.** This is a meaningful upgrade to my own recommendation. I originally suggested fruits or animals as equivalent options. The CPO makes a clear case: fruits = already saturated (hundreds of Suika clones), cute animals = differentiated AND proven for the 55+ female audience (Cozy Merge 96% positive, Drop the Cat, Capy Merge). The differentiation argument alone makes animals the correct choice. The competitive angle: fruits compete directly with the original Suika aesthetic in an already-crowded category.

- **"Wow moment" must occur before any advertising.** The CPO correctly identifies the first 30-60 seconds as the retention-critical window. This aligns with my "aha moment" analysis: first merge with physics + sound + animation must happen in the first 10 drops. The CPO adds the advertising constraint: no interstitial until after the first game over. This is both a retention recommendation and a revenue optimization — a player who leaves in frustration at 45 seconds generates zero impressions anyway.

- **AARP 2023 data on 55+ gamers is gold.** 52.4M gamers over 50, 12 hours/week, 69% feel games aren't designed for them, aggressive ads are #1 complaint. This is the clearest audience research in the entire peer set. The CPO turned this into specific UX recommendations: 44px minimum touch targets, 18px minimum text. These are actionable and directly relevant to the Yandex Games mobile-first platform.

- **"Ложное противоречие" between Kamil and 55+ audience is correct.** Cute animals work for both. The CPO's resolution — mechanics for Kamil, aesthetics for the platform demographic — is exactly right and better articulated than my own version.

- **Cozy Merge (96% positive, Steam) as evidence for "cozy aesthetic + merge = works."** This is the strongest single data point in all peer research for validating the visual approach. 96% positive reviews on Steam is an extraordinary signal.

### Disagree

- **D1 retention benchmarks are mixing mobile and browser.** The CPO cites Gold & Goblins at 56% D1 retention as a "genre standard." Gold & Goblins is a mobile app with a $60M marketing budget — its retention is not a useful benchmark for a new HTML5 game on Yandex Games with zero marketing spend. The CPO does provide a browser-adjusted range (25-35% D1 for browser casual), but presents the 56% number in a way that could lead to unrealistic expectations. From a CMO perspective: set the benchmark at 25-35% D1, call anything above 35% excellent, and design the product to consistently hit that range.

- **"Daily rewards = scope creep" dismissal is too fast.** The CPO correctly excludes daily rewards from MVP scope. But from a retention funnel perspective, even a simple "personal best" badge visible on the game over screen (which takes 30 minutes to implement) can drive D2-D7 returns. The distinction between "daily reward system" (out of scope) and "personal best tracking" (in scope, minimal effort) should have been made explicit.

- **No conversion funnel analysis.** The CPO covers retention deeply but doesn't model the top-of-funnel: how many impressions in "Novosti" → how many clicks → how many activations. The "aha moment" analysis is excellent, but it's focused on keeping users who already activated. The bigger problem for a new game is: *getting* to activation in the first place. Icon CTR is the missing link.

### Gap

- **No recommendation on leaderboard strategy.** The CPO mentions Yandex leaderboard SDK as a "medium complexity" lock-in mechanism but doesn't prioritize it. From my CMO research: the leaderboard feature is specifically called out by Yandex as a factor for "Editorial Picks" (наш выбор) featuring, which is a free distribution boost. The CPO should have flagged this as P1, not P2.

- **Sound design under-specified.** The CPO correctly identifies "merge sound = dopamine trigger" but doesn't provide actionable specifics. Given that the sound of the merge is described as the most impactful single element for the "aha moment" — the CPO should have recommended: test 3 different merge sounds before launch, pick the one that generates the strongest physical response. This is a 30-minute investment with potentially high retention ROI.

### Integration

The CPO research makes me revise one significant recommendation in my original report. I suggested fruits or animals as equivalent visual options with a lean toward fruits for "Suika-compatible" recognition. The CPO's evidence changes this:

**Revised visual recommendation:** Animals are the correct choice, specifically because:
1. Fruits are saturated (CPO + DA both confirm)
2. Cute animals = proven for 55+ female audience (CPO data)
3. Differentiation from existing clones improves algorithm novelty score
4. Cozy Merge's 96% positive reviews validate the aesthetic approach

**New name formula:** `[Animal name] + [Action]` → "Зверята: Слияние" / "Animal Merge" beats "Фруктопад" on differentiation.

**Rating: 5/5** — Best retention research. Best audience analysis. Actionable UX recommendations backed by real data. Tied with CTO for highest quality in the peer set.

---

## Ranking by Growth Rigor

1. **Peer A (CTO)** — Most complete research. Specific technology choices with working open-source references, implementation hours by genre, SDK pitfalls with code examples. Gives us confidence that the 7-day build is achievable. The implementation risk is the biggest growth risk — getting this wrong kills the "Novosti" window before it starts.

2. **Peer F (CPO)** — Best audience and retention research. AARP data + Cozy Merge case study + retention benchmarks calibrated to browser platform. Changes two of my recommendations: animals > fruits, and the "wow moment" window specification. This is growth-relevant because retention is the algorithm input that determines whether we survive past week 3.

3. **Peer D (CFO)** — Best financial model. Specific CPMV benchmarks from real developer data, two-scenario model calibrated against actual cases, clear decision on IAP (no). The math on "3,000₽ in 3 months" with a decent game makes the educational experiment financially credible.

4. **Peer E (COO)** — Best operational execution plan. Pre-submit checklist, RSY Day 0, 7-day day-by-day plan. Directly complements my CMO launch strategy with operational infrastructure. Reveals that "Novosti" window optimization requires everything to be ready before the first morning post-approval.

5. **Peer C (Devil's Advocate)** — Most valuable for risk identification. Correctly extends the timeline to 3 weeks, validates saturation concerns, identifies founder-risk as the real bottleneck. Weaker on alternative strategies with specific metrics. The contrarian value is highest when reading alongside the optimistic research.

---

## Revised Position Post-Peer Review

### What I Now Believe Differently

**1. Visual theme: Animals > Fruits (changed)**

My original research treated fruits and animals as equivalent options. After reviewing the CPO's evidence (Cozy Merge 96% positive, AARP data on 55+ audience preferences, saturation of fruit clones), I now believe animals are clearly superior. Fruits = competing directly with the original Suika aesthetic. Animals = differentiated, proven for target demographic, equally cute for Kamil.

**Revised name formula:** `[Cute animal name] + [Action verb]` in both languages
- "Зверята" / "Animal Merge"
- "Пушистое Слияние" / "Fluffy Merge"
- "Котослияние" / "Cat Merge"

**2. Launch timeline: 7 days development + 10 days to live (changed)**

My original research focused on the 7-day "Novosti" window post-launch. I underweighted moderation time. The realistic end-to-end is:
- Days 1-7: Development
- Days 8-10: Pre-submission prep + submit
- Days 10-15: Moderation wait
- Day 15+: Live in "Novosti"

Kamil sees the lesson complete in ~3 weeks, not 1 week. This should be communicated upfront.

**3. Card Completion + Icon A/B test = Day 6 must not be rushed (reinforced)**

Three separate peers (CTO on SDK, COO on pre-submit checklist, CPO on icon CTR) all converge on the same point: the marketing assets are as critical as the technical assets. I need to allocate a dedicated half-day for: 2 icon variants, cover image, video clip, screenshots, RU + EN descriptions. This is not a "30 minutes at the end" task — it determines the CTR from "Novosti" impressions.

**4. Retention = survival metric, not optimization metric (sharpened)**

The COO's insight that "ship fast then polish does NOT work on Yandex Games" combined with the CPO's retention benchmarks crystallizes the growth strategy:

The launch quality determines whether we survive past day 21 (rating threshold). Survival is not optional. Therefore:
- No ad before first game over (CPO)
- Leaderboard in v1 (my research + CPO)
- Sound design for merge (CPO — 3 variants, test before launch)
- Animals not fruits (CPO)
- Full Card Completion (my research + COO)

These are non-negotiable for week-1 retention. Everything else is optional.

### Updated Launch Strategy

**Primary Channel:** Yandex "Novosti" organic (unchanged — only free channel available)

**Pre-launch checklist (revised with peer inputs):**

| Priority | Item | Source |
|----------|------|--------|
| P0 | Самозанятый + RSY registration | COO Day 0 |
| P0 | Card Completion = 100% (green) | CMO |
| P0 | 2 icon variants for A/B test | CMO + COO |
| P0 | No ad before first game over | CPO |
| P0 | Leaderboard SDK active | CMO + CPO |
| P1 | Animals visual theme (not fruits) | CPO |
| P1 | Sound: 3 merge sound variants tested | CPO |
| P1 | RU + EN descriptions | CMO |
| P1 | GameplayAPI.start/stop correct | CTO |
| P1 | Pre-submit 15-point checklist clean | COO |
| P2 | TR (Turkish) localization | CMO |
| P2 | Video gameplay clip | CMO |

**Post-launch week 1 (Novosti window):**
- Launch A/B test on day 1 post-approval (not post-submission)
- Monitor rating daily (target: > 40 by day 7)
- Monitor session length (target: > 5 min avg)
- Fix any game-feel bugs immediately (COO escalation path)

**Week 3-4 (post-Novosti):**
- If rating > 40: iterate retention features (new animal tiers, seasonal theme)
- If rating 30-40: emergency game-feel fix + consider adding daily bonus (minimal scope)
- If rating < 30: evaluate emergency patch vs. "accept as learning, build game 2 with boilerplate"

**Updated Kill Question Answer:**

**One repeatable channel: Yandex "Novosti" organic → ML algorithm retention loop**

The channel isn't just "Novosti" (which is a one-time event per game). The *repeatable* element is: publish game → Novosti window → if retention > threshold → ML promotes in catalogue → organic growth. With a portfolio of games, this loop repeats.

CAC = 0₽ per acquisition
Conversion from impression to session: depends on icon CTR (A/B test ongoing)
D1 retention target: 25-35% (browser benchmark)
Survival threshold: rating > 30 at week 3

This is the full channel description. The metric that matters is not "impressions in Novosti" (vanity) — it is "rating at day 21" (survival) and "D7 retention" (growth signal).

---

## Biggest Gaps Across All Peers

**1. Icon CTR is the missing top-of-funnel metric.**

Every peer analyzed what happens after a player loads the game. Nobody quantified the conversion from "impression in Novosti catalogue" to "click." This is the actual top-of-funnel metric. A 5% icon CTR vs. a 2% icon CTR is a 2.5x difference in activated users from the same number of impressions — with zero additional cost. The A/B test capability is built into the Yandex console, which means we have a tool to optimize this directly. This should have been the #1 focus of the CMO section, and it was largely absent from peer research too.

**2. Post-moderation marketing prep is in no one's plan.**

The moderation wait is 3-5 working days. Every peer treated this as "dead time." It's actually prime time for: finalizing icon variants, optimizing descriptions for keyword placement, preparing the leaderboard so it's active on day 1 post-approval, and testing the game on multiple mobile devices. The game goes live the moment it's approved — there's no "launch day" to prepare for. Marketing prep must be done *during* moderation wait, not after.

**3. Portfolio strategy is mentioned but not modeled.**

Multiple peers (DA, COO) reference the portfolio approach as the path to meaningful revenue. Nobody built a model: at what game count does the boilerplate investment pay back? If game 1 takes 40 hours and game 2 takes 25 hours (with boilerplate), and each game earns 2,000₽/month in steady state, the payback on the boilerplate investment is game 2 itself. This changes the framing: game 1 is the cost of building the factory, not just an educational experiment.
