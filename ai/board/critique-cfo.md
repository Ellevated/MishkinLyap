# CFO Cross-Critique — Round 1

**Prepared by:** CFO (Unit Economist)
**Date:** 2026-03-04
**Project:** Casual HTML5 game, Yandex Games platform

---

## Peer-A (CTO)

### Agree

- **Build vs Buy framework is financially correct.** Peer-A's conclusion that Phaser + Matter.js is the right stack aligns perfectly with cost minimization. Zero licensing cost, proven open-source clones exist — this reduces technical risk, which IS financial risk in a zero-budget project.
- **TypeScript recommendation is valid from a cost perspective.** Better AI code generation = fewer debugging hours = lower opportunity cost for Oleg. The ROI of compile-time error catching in a 7-day sprint is real.
- **The $5 Feronato source code option** (mentioned implicitly) is a rational economic decision — spend $5 to save 20+ hours of development. Peer-A correctly identifies this class of "buy commodity" thinking.
- **SDK pitfalls analysis has direct financial impact.** Every moderation rejection = +5 working days delay = opportunity cost and delayed revenue. Peer-A's detailed SDK integration guide directly reduces this risk.

### Disagree

- **No financial framing of technical decisions.** Peer-A does not once calculate the dollar cost of wrong decisions. "Bubble Shooter is 2x complex" — but what does that mean financially? It means 15-20 extra hours at $200/hr opportunity cost = $3,000-4,000 in time value. Should be stated explicitly.
- **Drop Merge genre recommendation lacks market saturation analysis.** Peer-A says "Drop Merge wins" from implementation ease, but does not address Peer-C's (Devil's Advocate) point that the genre peaked in 2023 and the wow-factor is now normalized. Implementation ease is not the same as retention quality, and retention quality is what drives CPMV.
- **Asset sourcing time is underestimated.** "4-8 hours for assets" is probably right, but Peer-A doesn't factor this into the DAU/revenue model. Better art = higher CPMV, potentially 2x. This is a financial variable, not just an aesthetic one.

### Gap

- **Zero financial analysis.** Peer-A wrote an excellent technical document with zero revenue projections, no CPMV estimates, no reference to how technical decisions translate into income. For a board-level report, this is a significant omission. We're not building for engineering elegance — we're building for revenue.
- **No moderation probability estimate.** Peer-A lists all the correct SDK pitfalls but doesn't say: "probability of first-attempt moderation pass = X%." That's the single biggest financial uncertainty in this project. A 50% first-pass rate means expected delay of +3-5 days on average, which pushes the educational moment for Kamil by nearly 2 weeks.

### Integration

Peer-A's technical findings reinforce my revenue model in one important way: the three-ad-format recommendation (interstitial + rewarded + banner) is technically confirmed as implementable within the 7-day timeline. Each format is a 1-2 hour integration. This validates my ads-only, no-IAP recommendation — the ad infrastructure is achievable.

**Rating: 4/5 stars.** Excellent technical depth, zero financial translation. Good as input to CFO analysis, not a standalone financial argument.

---

## Peer-B (CMO)

### Agree

- **"Novinka" as the only free predictable traffic channel** is financially accurate. CAC = 0₽ only during this window. After it ends, organic DAU drops sharply — my financial model accounts for this cliff (300 DAU Week 1 → 80 DAU Month 1 in Scenario A).
- **Card Completion Progress as ranking factor** is directly relevant to revenue. Lower ML ranking = less organic traffic = fewer ad impressions = less revenue. This is a financial variable dressed as a marketing variable. Peer-B correctly identifies it as critical.
- **A/B icon testing built into Yandex console** is a high-ROI optimization. 2 icon variants, split test, pick winner in days. At zero cost, this could improve CTR by 20-40%, which compounds into DAU and revenue. My model didn't account for this optimization lever — it should be added.
- **Rating ≤ 30 = auto-delete after 3 weeks** is the survival floor. Below this, all revenue goes to zero. Peer-B correctly frames this as the primary operational risk for Week 1-3.

### Disagree

- **"Success = rating > 30 at week 3" is too narrow as a success definition.** Peer-B defines success from the CMO lens (platform acceptance), but for OQ-1 (success definition for this experiment), the financial success metric must be the growing balance in the developer console, visible to Kamil. A game can have rating > 30 but earn only 17₽. That's a survival win but not the educational moment we're targeting.
- **No revenue numbers.** Peer-B mentions eCPM of 68₽ from one case study (DTF, 3,500 players, 1,204₽ in 2 weeks) but doesn't build this into a revenue model. CMO should at minimum provide an expected DAU range for Week 1, which I can then run through the CPMV formula.
- **Turkish localization recommendation** needs financial qualification. Adding a third language draft (TR) takes 2-4 hours. What incremental DAU does this add? If Turkey represents 5% of the 40% international traffic, that's 2% DAU uplift. At 100 DAU average, that's 2 additional DAU. Revenue impact: ~3-8₽/month. Not worth the time.

### Gap

- **No CAC analysis for post-Novinka phase.** After the free window closes, what does it cost to acquire players? Peer-B doesn't address paid promotion options, their price points, or whether any make sense at this scale. Correct answer: none of them make sense (CAC > LTV at this DAU), but it should be stated.
- **No revenue estimation from retention improvements.** Peer-B recommends leaderboard to improve retention, but doesn't quantify: "leaderboard adds X% D7 retention, which translates to Y additional DAU at month 2, which adds Z₽/month." The financial case for each UX investment should be stated.

### Integration

Peer-B's CTR and retention framework modifies my revenue model. If Card Completion Progress = green + A/B icon test can improve CTR by 30%, then my Scenario A DAU estimates should be 30% higher. Revised Scenario A: 390 DAU Week 1 (instead of 300), 104 DAU Month 1 (instead of 80). Revenue impact: ~+30% across the model. Small in absolute terms but meaningful for hitting the 3,000₽ threshold faster.

**Rating: 4/5 stars.** Strong on traffic mechanics, weak on translating them to financial outcomes. Excellent input for refining DAU assumptions.

---

## Peer-C (Devil's Advocate)

### Agree

- **Moderation timeline is the #1 underestimated financial risk.** Peer-C is absolutely right that "1 week" is development only, not total time to revenue. If moderation takes 3-5 days and the first submission is rejected (realistic probability: 30-50% based on the developer war stories cited), the educational moment for Kamil slips by 2+ weeks. This directly delays the "first kopek" milestone.
- **Economics failure mode analysis is largely correct.** Peer-C cites real data: KvaytG earned 429₽ from 8 games in 2 weeks, Vasenni earned 64₽ from first game. These are the true worst-case benchmarks. My Scenario A (1,680₽ in 3 months) is more optimistic than Peer-C's worst case.
- **Contrarian thesis that success should be redefined** is financially sound. If the goal is "Kamil sees code = money," then even 17₽ on the balance after 2 weeks is mission accomplished. The 3,000₽ withdrawal threshold is a secondary metric, not the educational KPI.
- **"Buy $5 Feronato source"** — Peer-C identifies this as the rational economic decision for a time-constrained project. I agree. At $200/hour opportunity cost, saving even 10 hours of development = $2,000 value vs $5 cost. Obvious trade.

### Disagree

- **"Drop Merge in 2026 is 2.5 years past peak hype"** overstates the timing problem. Peer-C confuses trend hype with genre viability. Word games, solitaire, and match-3 peaked 10-15 years ago and still drive massive DAU on Yandex Games. The question is not "is the genre trending" but "is the genre playable and retaining on this platform." Drop-merge retains because the physics is inherently satisfying, not because it's trending.
- **"3,000₽ withdrawal threshold is unreachable for first game"** is too pessimistic. My financial model shows Scenario B reaches 3,000₽ within 3 months. Peer-C's analysis cherry-picks the worst performers (64₽, 429₽ for 8 games) without accounting for the quality differential. The Sergey Eland case (600-800₽/day peak at 300-500 DAU) shows that quality matters enormously.
- **Execution timeline of "31-62 hours" is overstated** when using an open-source clone as base. Peer-C notes this themselves: "using sgbj/suika-clone saves 70% time." Using the clone + Claude Code assistance brings this to 15-25 hours of actual work, not 31-62. This is closer to my 40-hour estimate.

### Gap

- **No alternative financial model offered.** Peer-C correctly identifies all the risks but doesn't provide a revised financial projection that accounts for them. What does the risk-adjusted revenue model look like? Expected value accounting for: 40% chance of first-pass moderation rejection, 30% chance of game getting auto-deleted at week 3, 70% chance of post-Novinka DAU below my Scenario A. This calculation would be more useful than a list of risks.
- **The $5 Feronato source code has a risk Peer-C doesn't mention.** If that source code is widely purchased and deployed on Yandex Games, there's an increased risk of moderation rejection for "duplicate." This is the anti-duplicate rule Peer-C themselves cited from September 2025. Internal contradiction.

### Integration

Peer-C's moderation timeline analysis forces a revision of my "First kopek: Day 1-2 after publish" milestone. Corrected timeline:

| Milestone | Original Estimate | Revised (with moderation risk) |
|-----------|------------------|-------------------------------|
| Development complete | Day 7 | Day 7 |
| First submission | Day 8 | Day 8 |
| Moderation approval (P50) | Day 13-15 | Day 13-15 |
| Moderation approval (after rejection, P25) | — | Day 21-25 |
| First kopek | Day 14-16 | Day 14-26 |
| Balance > 0₽ visible | Week 2-3 | Week 2-4 |

The educational moment for Kamil shifts right by 0-2 weeks depending on moderation luck. Success definition for OQ-1 must account for this — "balance growing" is still achievable, but the timeline has wider error bars than I initially stated.

**Rating: 5/5 stars.** Best financial realism of all peers. Peer-C is doing what a CFO should do — stress-testing the optimistic assumptions with concrete data. The only weakness is not providing an alternative financial model after identifying all the risks.

---

## Peer-E (COO)

### Agree

- **Self-employed registration as Day 0 gate** is exactly right financially. Cannot receive RSY payments without самозанятый status. Any delay here = revenue blocked at the payment stage even if the game is live. This is the single financial prerequisite.
- **RSY (Рекламная Сеть Яндекса) account as separate required setup** is a critical financial detail I partially mentioned but Peer-E documents exhaustively with steps. The 3,000₽ minimum threshold and 25th-of-month payment schedule are confirmed here, which validates my financial model's withdrawal timeline.
- **Self-employed income ceiling of 2.4M RUB/year** is a useful financial planning constraint. At our projected revenue (2,000-14,000₽ in first 3 months), this ceiling is irrelevant for the experiment. But it matters for OQ-6 (portfolio scaling) — Peer-E correctly identifies when to transition to IP structure.
- **Automation ROI calculation** is the right thinking. 10-15 hours saved per subsequent game via boilerplate = at $200/hr opportunity cost = $2,000-3,000 value per game at zero marginal cost. The factory model math works even at small scale.
- **Moderation as the permanent bottleneck** at 5-10 games is correctly identified. 3-5 days per game, serial not parallel (for same mechanic). This caps throughput at ~5 games per month maximum, which caps portfolio revenue ceiling.

### Disagree

- **Day-by-day plan assumes 4-6h/day focus** — Peer-E notes this but doesn't stress-test it against Oleg's anti-pattern #1 ("starts many, finishes few"). The financial risk here is 100% project completion probability vs. realistic ~70-80% given parallel projects. A 20-30% probability of abandonment should be factored into the expected value of the experiment.
- **"Sophisticated analytics from Day 1"** is premature optimization. Peer-E recommends game-analytics.ru dashboard, RSY cabinet tracking, daily monitoring. This is right for a portfolio but overkill for a one-game experiment. The opportunity cost of setting up dashboards in Day 7 is time not spent on game quality, which directly affects CPMV.
- **"Kamil becomes junior barrel by game #2"** is strategically important but the financial return on Kamil's time should be explicit. If his game #2 generates 500₽/month, that's the ROI on the educational investment. State it.

### Gap

- **No revenue model.** Peer-E wrote the most operationally complete document of all peers, yet contains zero revenue projections, no CPMV figures, no analysis of ad format revenue contribution. This is a process document, not a financial planning document. The board needs both.
- **No sensitivity analysis on key financial variables.** Peer-E identifies moderation rejection as a risk but doesn't quantify: "if we're rejected once, revenue timeline shifts by X days and expected first-month revenue drops from Y₽ to Z₽."
- **IP transition trigger is undefined.** Peer-E says "transition to IP at 1.5M RUB/year" but doesn't calculate at what portfolio size this threshold is reached. At 3,000₽/month per game (optimistic), you'd need 41 games running simultaneously to hit the IP threshold. That's a portfolio of 41 games — context that would change Peer-E's scaling recommendations.

### Integration

Peer-E's operational plan is the execution backbone for my financial model. Specifically:
- Day 0: самозанятый registration + RSY setup = financial infrastructure complete
- Day 6: Submission = revenue clock starts (moderation pending)
- Payment schedule: RSY pays on ~25th of month = first payout possible Month 2-3

This confirms my "Stage 2 financial success" timeline: 3,000₽ balance → withdrawal on 25th of Month 2-3 is achievable under Scenario B. Peer-E's ops plan validates the sequencing.

**Rating: 4/5 stars.** Operationally outstanding, financially silent. Best execution guide of the group, but the board needs revenue analysis, not just process design.

---

## Peer-F (CPO)

### Agree

- **Switching cost = LOW is the honest financial assessment.** Peer-F is correct that any drop-merge clone replaces our game instantly. This means LTV is structurally capped by lack of lock-in. My model already accounts for this: DAU drops sharply after the Novinka week because there is nothing tying players to our specific game except the habit formed in the first session.
- **"Wow moment" in first 5 seconds drives retention, which drives CPMV.** Peer-F is right that CPMV scales with session quality. A game that produces a strong emotional response in the first 30 seconds retains better → longer sessions → more ad impressions → higher effective CPMV. This is the financial mechanism behind the UX recommendations.
- **Cute animals > fruits for differentiation.** Peer-F presents data (Capy Merge, Drop the Cat examples) showing animal-themed drop-merge is underserved vs. fruit-themed. Lower competition = higher probability of standing out in the Novinka week = higher Week 1 DAU = better revenue launch. Financially sound recommendation.
- **Retention benchmarks for browser-based games** (D1: 25-35%, D7: 8-15%) are more conservative than mobile benchmarks and appropriately calibrated for Yandex Games. My financial model used implicit assumptions in this range.
- **AARP data on 55+ gamer behavior** is directly financially relevant: this audience removes games with aggressive ads. Over-monetizing (forcing interstitial before first game over) destroys the retention that drives CPMV. Peer-F makes the financial case for patient ad strategy.

### Disagree

- **"Cute animals require more art effort"** is a financial concern Peer-F doesn't address. 8 animal sprites are harder to source or generate than 8 geometric shapes or fruits. Peer-F says "Kenney.nl has animal sprites" — which is true, but the quality and theming coherence of animal sprites requires more curation time than circles or fruits. In a 7-day sprint, this 4-6 hour difference matters.
- **D1 retention benchmark of 25-35% for browser games** may be too optimistic for a game with no marketing and low brand recognition. Real data from developer reports shows 180 players in Week 1 (DACKZI case) with very low return rates. Peer-F's benchmarks are probably from better-marketed or higher-quality games.
- **"No need for daily rewards — scope creep"** is correct for this experiment. But Peer-F should explicitly state the financial implication: without daily rewards, D30 retention is likely 2-5% rather than 8-12%. At 30 DAU by Month 3 (at 2-5% of initial 300), this validates my Scenario A being the base case, not an optimistic outlier.

### Gap

- **No revenue numbers whatsoever.** Like most peers, Peer-F analyzes retention and UX without connecting to CPMV and revenue. The financial loop is: better retention → longer sessions → more ad impressions per DAU → higher effective CPMV → more revenue. Peer-F builds the retention case but never closes the loop to rubles.
- **The "jobs to be done" analysis doesn't address monetization willingness.** Peer-F identifies three jobs (kill time, rest brain, feel progress) but doesn't analyze: for which of these is the player most tolerant of ads? This matters for ad strategy design. "Killing 5 minutes" = impatient = less ad-tolerant. "Feeling progress" = invested = more ad-tolerant.
- **The audience reconciliation table is excellent but missing a row.** Peer-F has "Tolerance for ads" — Kamil tolerates rewarded, 55+ women don't tolerate forced. But the revenue implication is: **rewarded video is the highest-revenue ad format but requires investment in the reward mechanism.** The financial case for rewarded video implementation (2-4 hours of dev time, adds 20-40% incremental revenue at same DAU) is not made.

### Integration

Peer-F's cute animals recommendation changes the visual theme assumption in my model. The financial argument for cute animals:
- More differentiated from existing clones → higher CTR in Novinka → 20-30% more Week 1 DAU
- Better fit for 55+ women → higher D7 retention → 20-40% more Month 1 DAU vs. geometric/fruit theme
- Combined revenue impact: potentially +40-60% vs. a generic fruit clone

This is enough to shift my base case from "Scenario A likely" to "Scenario A-B weighted average likely" — call it 150 DAU in Month 1 instead of 80-200 range midpoint.

Peer-F's rewarded video emphasis also reinforces my recommendation: implement all three ad formats including rewarded video. The "soft ad" philosophy (no forced ads in first 60 seconds) does NOT mean less revenue — it means the same revenue with better retention, which compounds into more revenue over months 2-3.

**Rating: 5/5 stars.** Best product thinking of all peers. The retention → monetization connection is implicit rather than explicit, but all the inputs are there. If Peer-F had added one paragraph connecting D7 retention to monthly revenue, this would be a complete financial argument.

---

## Ranking by Financial Rigor

1. **Peer-C (Devil's Advocate)** — Only peer who cited real developer earnings data (429₽ for 8 games, 64₽ first game, 17₽ worst case), stress-tested timeline assumptions, and identified the moderation risk as a financial variable. Didn't provide a revised financial model, but all the raw inputs are there. This is what CFO thinking looks like.

2. **Peer-F (CPO)** — Retention benchmarks, audience analysis, and switching cost assessment are all financially relevant. The DAU and retention data directly feeds into revenue projections. Missing: explicit ruble translation of insights.

3. **Peer-B (CMO)** — Traffic mechanics analysis is financially grounded (one real case study with numbers: 3,500 players, 1,204₽, eCPM 68₽). Card Completion Progress as ranking factor has direct revenue implications. Missing: revenue model.

4. **Peer-E (COO)** — Best process documentation, самозанятый/RSY setup details are the financial infrastructure of the project. Income ceiling of 2.4M RUB is the right portfolio-level financial constraint. Missing: any revenue numbers.

5. **Peer-A (CTO)** — Zero financial analysis. Excellent technical input that feeds my model indirectly, but no attempt to connect technical decisions to revenue outcomes.

---

## Biggest Gaps Across All Peers

1. **Nobody closed the loop from retention to rubles.** Five research reports analyzed retention, UX, traffic mechanics, and operations without once calculating: "DAU × sessions/day × ad impressions × CPMV = revenue." This is the fundamental formula for this business. Only my report (CFO) built the explicit model. Board cannot make OQ-1 and OQ-4 decisions without this calculation.

2. **Moderation probability is unquantified.** Every peer mentioned moderation risk. Nobody gave a probability estimate for first-pass success. This is the single largest financial uncertainty: 50% first-pass rate means expected additional delay of 4-5 days (and additional opportunity cost of Oleg's time). Expected revenue in Month 1 should be discounted by this factor.

3. **The 3,000₽ withdrawal threshold vs. educational success threshold conflict is unresolved.** Multiple peers (C, E) mention the threshold but treat it as binary: either you hit it or you don't. The CFO framing — Stage 1 (balance > 0₽, educational success) vs. Stage 2 (3,000₽, financial success) — was not adopted by any other peer. This distinction is critical for OQ-1 and should be the board consensus.

---

## Revised CFO Position

### What I Believe Differently After Peer Review

**Three updates to my original analysis:**

1. **Moderation timeline risk was underweighted.** My "First kopek: Day 1-2 after publish" milestone was optimistic. Realistically, first-attempt moderation adds 5-7 working days, and first-rejection scenarios (probability: ~35% based on peer-C data) add another 8-12 working days. Expected time from development complete to first revenue: **14-21 days** (vs. my original "7-10 days").

2. **Cute animals theme adds measurable revenue upside.** Peer-F's differentiation argument (animals > fruits for 55+ audience) translates to ~30-40% higher CTR in Novinka week, compounding into higher Month 1 DAU. This shifts my base case from Scenario A to approximately "Scenario A+":
   - Week 1 DAU: 400 (up from 300)
   - Month 1 DAU: 110 (up from 80)
   - Month 1 revenue: ~600₽ (up from 434₽)
   - 3-month cumulative: ~2,200₽ (up from 1,680₽)

3. **A/B icon testing is a free revenue optimization I missed.** Peer-B identified this built-in tool. A 30% CTR improvement from the winning icon variant adds ~30% to Week 1 revenue with zero additional development cost. My model should include this as a standard operating procedure, not an optional enhancement.

### Updated Financial Model

**Scenario A+ (Revised Base Case):**
- Cute animal theme (not fruit/geometric)
- Card Completion Progress = green before submission
- A/B icon test from Day 1 post-publish
- All 3 ad formats (interstitial + rewarded + banner)
- Moderation first-pass success (probability: ~65%)

| Period | DAU | Revenue | Cumulative |
|--------|-----|---------|------------|
| Week 1 (Novinka) | 400 | ~550₽ | 550₽ |
| Month 1 (post-boost) | 110 | ~650₽ | 1,200₽ |
| Month 2 | 80 | ~480₽ | 1,680₽ |
| Month 3 | 60 | ~360₽ | 2,040₽ |

**Revised 3-month estimate: ~2,000₽** (up from 1,680₽ in original Scenario A, still below 3,000₽ withdrawal threshold under base case).

**Scenario B (Optimistic — quality game, good retention):** ~12,000-15,000₽ in 3 months, with first withdrawal possible in Month 2-3.

**Expected Value (probability-weighted):**
- 65% chance of Scenario A+ → 2,040₽ contribution
- 25% chance of Scenario B → 3,000₽+ contribution
- 10% chance of game removal (DAU never recovers) → 200₽ contribution

**EV = 0.65 × 1,680 + 0.25 × 12,000 + 0.10 × 200 = 1,092 + 3,000 + 20 = ~4,100₽ expected**

This is actually more optimistic than my original Scenario A estimate, driven by Peer-F's animal theme argument and Peer-B's A/B icon testing insight.

### Updated Recommendations for OQ-1 (Success Definition)

**Revised OQ-1 Recommendation: Two-stage success with explicit probability acknowledgment.**

Stage 1 — Educational Success (Weeks 2-4):
- Balance > 0₽ in developer console (probability: ~85% if game passes moderation)
- Kamil can see: "game published → players → money accumulating"
- **This is the primary success metric. Achievable even with 17₽.**

Stage 2 — Financial Success (Month 2-4):
- Balance reaches 3,000₽ → actual withdrawal
- Probability: ~25% under Scenario A+, ~70% under Scenario B
- **This is the secondary metric. Meaningful but not the educational goal.**

OQ-1 answer: **Success = Stage 1 achieved within 4 weeks of development start.** Stage 2 is a bonus that the Scenario B game quality can achieve in 3 months.

### Updated Recommendations for OQ-4 (Monetization)

**Revised OQ-4 Recommendation: Ads-only, but implement rewarded video as priority.**

Original recommendation was ads-only with all three formats. After reviewing Peer-F's retention analysis, I revise the priority order:

1. **Interstitial after Game Over** — Mandatory. Highest revenue per impression, natural trigger.
2. **Rewarded Video for extra life or bonus** — Elevated to high priority. Peer-F's data shows 55+ women tolerate rewarded video (player-initiated) but reject forced interstitial mid-session. Implementing this: (a) adds 20-40% incremental revenue at same DAU, (b) actually improves retention by giving players agency in the ad experience.
3. **Sticky Banner** — Maintain, but deprioritize if it conflicts with "large UI elements for 55+ audience" requirement. A banner eating 50px of game space is a retention risk for this demographic.

**IAP remains NO** — 50% Yandex commission, 2-3 day integration cost, negligible revenue at <500 DAU. Math unchanged.

**Final verdict: CONDITIONAL GO.** Unit economics work because costs are zero. Educational ROI is positive at any revenue level. Financial ROI is positive under Scenario B, marginal under Scenario A. The experiment is worth running.

---

## Research Sources Used in This Report

The cross-critique analysis draws from:
- My original research: `/ai/board/research-cfo.md` — revenue model, CPMV benchmarks, margin analysis
- Peer-A (CTO): Technical stack confirmation, SDK integration risk quantification
- Peer-B (CMO): Traffic mechanics, Card Completion Progress ranking impact, A/B icon testing tool, eCPM 68₽ case study
- Peer-C (Devil's Advocate): Real developer earnings data (429₽/8 games, 64₽/1st game, 17₽ worst case), moderation timeline reality, $5 Feronato source option
- Peer-E (COO): RSY payment structure (3,000₽ threshold, 25th of month), самозанятый 2.4M RUB ceiling, day-by-day operational plan
- Peer-F (CPO): Retention benchmarks (D1 25-35%, D7 8-15% for browser games), cute animals differentiation argument, AARP data on 55+ ad tolerance, rewarded video revenue case
