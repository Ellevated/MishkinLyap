# COO Cross-Critique — Round 1

**Director:** Keith Rabois (COO lens)
**Date:** 2026-03-04
**Peer-E (self) excluded from ranking**

---

## Director A (CTO)

### Agree

- **TypeScript + Vite recommendation is operationally correct.** Better AI code generation = faster iteration = fewer human debugging hours. This directly reduces the 4-8h SDK integration time I flagged.
- **"Use existing open-source Suika clone as reference, not blank slate"** aligns perfectly with my process design. If sgbj/suika-clone exists and is readable, forking the structural pattern saves at minimum 1 full day of scaffold work. Barrels build on proven patterns.
- **SDK pitfall documentation is genuinely useful.** The three critical pitfalls (game before SDK init, no game_api_pause handling, GameplayAPI.start timing) are exactly the kind of pre-submit checklist items I recommended but did not detail. A missed pitfall = rejection = +5 working day delay. This is fatal in a 7-day pipeline.
- **Project structure (scenes/objects/sdk/config) is correct.** Enforcing this from Day 1 makes the codebase Claude Code-friendly and Kamil-inheritable on game #2.

### Disagree

- **"TypeScript is the right call"** may be correct technically but A doesn't account for Kamil's learning curve. If the educational goal is Kamil reading and understanding the code by game #2, TypeScript adds a compilation layer he'll need to learn. Plain JS is readable without a build step. This is a secondary concern for game #1, but worth flagging.
- **Focus Area 3 (Hiring) is irrelevant for this project** and wastes page space. The analysis correctly notes this is a "solo + AI setup" and then fills two paragraphs with hiring tables. That's ammunition analysis for a zero-hire scenario. Should have been cut.

### Gap

- **Zero discussion of the development day-by-day operational feasibility.** A tells us what to build and what patterns to use, but doesn't tell us if it fits in 7 days. The project structure looks like 8-10 days of implementation if Claude Code is writing from scratch. No triage on what's MVP vs. nice-to-have.
- **SDK mock setup on Day 1 is operationally critical** — A mentions it but doesn't flag it as Day 1 gate. Without the mock, all local development breaks. This needs to be in the Day 1 checklist, not buried in Focus Area 5.
- **No mention of ZIP packaging complexity.** Vite builds need to be configured correctly for ZIP output without external CDN dependencies. This is a gotcha that can cost 2-4 hours on submission day if not planned.

### Integration

A's SDK pitfall documentation directly upgrades my pre-submit checklist. The 7 pitfalls from A's Focus Area 5 should be incorporated verbatim into the submission checklist. The Vite/TypeScript decision has minor implications for the Claude Code prompting strategy — need to specify TypeScript in the scaffold prompt.

**Rating: 4/5** — Strong technical foundation with operational blind spots on timeline feasibility and scope triaging.

---

## Director B (CMO)

### Agree

- **"Card Completion Progress = green before publication" is operationally non-negotiable.** B correctly identifies this as an ML ranking factor, not optional polish. This should be in the Day 6 submission checklist as a binary gate: green or don't submit.
- **Two icon variants ready at launch for A/B testing** is the right move. This is a zero-cost operational improvement — Claude Code can generate SVG variants in 30 minutes, and the A/B tool is built into the console. There's no reason not to have two.
- **"Novinka window = 7 days, everything must be ready"** correctly frames the launch as a one-shot event. My research confirmed the same: quality at launch > quality after iteration. B's CMO lens reinforces this from the traffic side.
- **Dual-language drafts (RU + EN) before submission** is confirmed correct. B provides the operational justification I lacked: 40% of traffic is international, single-language draft = immediate 40% addressable market loss.
- **"Suika" in the name = auto-reject** is a specific moderation rule I should have flagged explicitly.

### Disagree

- **Video gameplay as a requirement for Card Completion = green is potentially a trap.** B lists it as high priority. Recording, editing, and uploading a gameplay video adds 2-4 hours to Day 6 which is already the most loaded day. If it's not required for first-pass moderation and only affects the "featuring" score, the ROI is questionable for a 7-day sprint. B doesn't separate "required for moderation" vs "required for ML ranking boost."
- **Turkish localization recommendation** — B cites this as official Yandex guidance. For a first game with zero track record, adding Turkish localization (even AI-translated) is scope creep on Day 6. The 40% international traffic mostly isn't Turkish speakers. Should be game #2 improvement, not Day 1 requirement.

### Gap

- **No operational plan for what happens during the 3-5 day moderation wait.** B's launch timeline ends at "submit." What does Oleg do during moderation? Start boilerplate for game #2? Iterate on the submission assets? No guidance.
- **A/B test results timeline not addressed.** The A/B icon test needs "a few days" per B. If the Novinka window is 7 days and you spend 3 days getting A/B results, you've wasted half the window. The test should be configured on Day 1 post-approval, with a decision trigger at Day 3.
- **No mention of what "good" CTR looks like from the icon.** B describes the mechanism but gives no benchmark. Without a target, Oleg can't decide when to stop iterating.

### Integration

B's Card Completion checklist and dual-language draft requirement are now gates in my Day 6 submission process. The CMO lens also surfaces a gap in my plan: the moderation wait period (3-5 days) has no operational content assigned. I'm now recommending: moderation days = boilerplate repo setup + Day 0 work for game #2.

**Rating: 4/5** — Best platform-specific marketing intelligence on the board. Operationally thin on post-submission workflow.

---

## Director C (Devil's Advocate)

### Agree

- **"1 week is development, not total cycle"** is the most operationally honest statement on the board. My timeline says "7 days to submission." C correctly flags that submission day + 3-5 day moderation + potential rejection cycle means the realistic total time to live game is 2-3 weeks. This is not pessimism — this is correct triage. Teams that don't plan for rejection will be blindsided.
- **"Moderation rejection is a 5+ day event, not a setback"** — reframing this as a planned scenario rather than a failure state is operationally mature. I should have built an explicit "Rejection Recovery Playbook" into my plan.
- **"Use open-source clone as base, not blank slate"** aligns with A's recommendation and my own philosophy. This is now consensus: start from sgbj/suika-clone, customize to 30% delta, don't invent what already works.
- **Founder risk (anti-pattern #1 is "starts many, finishes few")** — C correctly identifies the single-barrel failure mode. If Oleg's attention shifts to another project on Day 3, game is dead. This is a process design problem: the 7-day plan needs to be structured so each day has a binary gate that forces completion before moving on.
- **"Redefine success: balance > 0₽ = win"** — this is not defeatism, it's correct goal calibration for an educational experiment. The CFO also reaches the same conclusion. If the educational ROI (Kamil sees code = money) is the primary KPI, then even 17₽ is a successful experiment.

### Disagree

- **"Drop-merge is 2.5 years past peak hype"** is real but not fatal for Yandex Games. Yandex's platform serves a demographic (55+ women) that discovers genres later than early adopters. Bubble Shooter peaked globally in 2012 and it's still the #1 genre on Yandex in 2026. The "hype cycle" argument assumes the target audience follows the same curve as gaming media. They don't.
- **"Bubble Shooter is more evergreen"** — C recommends this as an alternative but the CTO analysis shows Bubble Shooter requires 2-3x more implementation complexity (BFS algorithms, floating island detection, color management). For a 7-day sprint, this is the wrong trade. C is correct about the competitive landscape but wrong about the alternative.
- **"Drop-merge clones can get rejected as duplicates"** — C cites Yandex's September 2025 duplicate rules. However, the specific anti-duplicate rule targets games that "just change the background." A different object theme (animals vs. fruits) with unique branding is not a duplicate. This risk is manageable with 30 minutes of differentiation work, not a fundamental threat.
- **"KvaytG made 8 games in 2 weeks and earned 429₽"** — this is the wrong comparison. KvaytG made 8 low-quality games. One quality game with good retention mechanics is not comparable to 8 junk clones. C is using this as market evidence when it's execution evidence.

### Gap

- **C identifies problems without operationalizing solutions.** "Plan 3 weeks instead of 1 week" is correct but not actionable. What happens in week 2? What happens in week 3? C's framework is critique without a replacement operational plan.
- **No specific moderation rejection recovery protocol.** C says "moderation can take 6 months in the worst case" but doesn't differentiate between first-time technical rejection (3-5 days to fix and resubmit) vs. systemic rejection (wrong game type, unresolvable). The expected case is 1 rejection round, not 6 months. C overstates this risk.

### Integration

C forces a material revision to my timeline: I'm adding an explicit "Rejection Scenario" to the operational plan. Day 6-7 is submission. Days 8-13 are the moderation wait. Days 14-18 are the rejection recovery buffer. The "go-live" target should be stated as "week 2-3" not "day 7."

C also validates that the educational success definition (balance > 0₽) is operationally sound. This should be stated as the primary KPI in the operational plan, with financial break-even as a secondary target.

**Rating: 3/5** — Correctly identifies the fatal timeline error but offers weak operational alternatives. Risk identification without operational mitigation is incomplete analysis.

---

## Director D (CFO)

### Agree

- **Ads-only monetization for v1** — I agree. The IAP analysis is rigorous: 50% platform cut + 2-3 days integration time + manual approval requirement = clearly negative ROI for a 7-day sprint. Ads-only is the correct call and D proves it with numbers.
- **Three ad formats (interstitial + rewarded + sticky banner)** — agreed. The incremental revenue from rewarded video at the same DAU is meaningful. The CPO research confirms rewarded video can be player-triggered after game over, which avoids the "aggressive ad" churn trigger.
- **самозанятый registration Day 1 is non-negotiable** — D confirms: 6% tax vs. 13-22% for individual. And without it, zero legal withdrawal capability. This is in my plan but D provides the financial justification I was missing.
- **Financial model (Scenario A and B) is the most rigorous quantitative analysis on the board.** CPMV range of 30-300₽ with developer-validated benchmarks is exactly what's needed to calibrate expectations. Week 1 revenue of 378-2,520₽ depending on quality is honest and useful.
- **"First kopek on Day 1-2 post-publish" milestone for Kamil** — this is the right framing for the educational goal. A growing number in the dashboard is the lesson, not the absolute amount.

### Disagree

- **"Probability of Stage 2 (3,000₽) in 3 months: 40-90%"** — the optimistic scenario (90%) requires Scenario B (600 DAU Week 1, 200 DAU steady state). The CTO and Devil's Advocate both establish that first-time games typically see 80-300 DAU in Week 1 Novinka boost. Scenario B is achievable but requires top-quartile execution. I'd calibrate Stage 2 probability lower: 20-40% realistic, not 40-90%.
- **Gross margin of ~94% is accurate but potentially misleading** — Yandex's actual platform revenue share is not disclosed. The CPMV figures developers report are already net-to-developer after Yandex takes their cut. So the real gross margin depends on whether Yandex's undisclosed cut is already baked in. D acknowledges this ambiguity but should flag it more prominently.

### Gap

- **No cash flow timing analysis.** D establishes the 3,000₽ withdrawal threshold but doesn't map when exactly the first withdrawal can occur. RSY pays on the 25th of the month. If the game launches on March 15 and earns 3,000₽ by April 10, the first payout is May 25 — 70 days after launch. For Kamil's educational moment, "when does the money actually arrive in the account" matters more than when the balance hits 3,000₽.
- **No analysis of what happens if the game gets auto-deleted at week 3.** D's model assumes the game survives. If rating drops below 30 and the game is deleted, the developer loses the RSY balance accrued. Is the balance paid out anyway? D doesn't address this.

### Integration

D's financial model validates my revenue forecast directionally. More importantly, it gives me specific numbers for the "what to tell Kamil" section: "You might see your first ruble in 3-5 days after launch. You'll see 100₽ in 2-3 weeks. Getting to 3,000₽ where you can actually withdraw takes 2-4 months." This is honest and still motivating.

The cash flow timing gap needs to be addressed in the operational plan: RSY payout schedule (25th of month, 3,000₽ minimum) should be explicitly communicated to set correct expectations.

**Rating: 5/5** — Most rigorous quantitative analysis on the board. Methodologically sound, developer-validated numbers, correct monetization recommendation. The CFO lens adds the most decision-relevant information to my operational plan.

---

## Director F (CPO)

### Agree

- **"Cute animals > fruits for differentiation"** — this recommendation is operationally correct and the research supports it. Animals avoid the Suika-clone perception problem that C flagged. The specific progression chain (hamster → rabbit → kitten → cat → dog → fox → panda → bear) is immediately actionable and doesn't require additional assets beyond what Kenney.nl provides.
- **"Wow moment in first 5 seconds, before any ad"** — this is the single most important UX operational rule. The retention literature F cites confirms it: first merge + good sound + good animation = dopamine hook that creates the emotional fingerprint of the game. Suppress all ads until after the first game over, no exceptions.
- **"Game Over screen must have prominent 'Play Again' with no delay"** — agreed. Every second between game over and the replay button increases tab-close probability. This is an implementation detail that needs to be in the Day 2 gate.
- **D1 retention benchmark of 25-35% for browser casual** is the right operational target. If the game can't hit 25% D1 retention, it won't survive the 3-week platform survival threshold. F gives the connection between retention metrics and the auto-delete rule that I should have made explicit in my QC section.
- **Leaderboard (Yandex SDK) as the primary return mechanism** — agreed. Personal best + platform leaderboard = the simplest possible return trigger. No daily rewards needed, no FOMO mechanics. Just "beat your own score."

### Disagree

- **"69% of 50+ gamers feel overlooked" (AARP 2023) applied to Yandex Games** — the AARP data is from US/North American market. Yandex Games serves Russian-speaking users, predominantly in Russia. The cultural and demographic behaviors may differ meaningfully. The principle (don't show aggressive ads to this demographic) is likely valid, but the specific percentage should be cited with a caveat about geographic applicability.
- **"Sticky banner during gameplay is a mild ad"** — F doesn't address this directly but the CPO recommendation to "only show interstitial after game over" implicitly removes the sticky banner from the recommendation. But the CFO includes sticky banner as a revenue stream (3 formats). These two recommendations are in conflict. The operational resolution: sticky banner acceptable if positioned outside the game viewport (score area or below), interstitial only after game over. This tension needs explicit resolution.

### Gap

- **No operational spec for the "first 5 seconds experience."** F correctly identifies this as the most critical UX moment but doesn't specify what it looks like. Drop one object, it falls, it hits another, they merge — this is the tutorial. But is there a visual prompt? An arrow? A voice cue? F says "implicit tutorial (arrow + drop)" but doesn't specify how this is implemented in Phaser. This is a Day 1-2 implementation requirement that needs a concrete spec.
- **The animal progression chain (hamster → bear) needs asset validation.** Are all 8 animals available in Kenney.nl CC0 without licensing issues? F lists them but doesn't confirm asset availability. If we need to source 3 of 8 from elsewhere or generate them with AI, the Day 4 asset work becomes the bottleneck.
- **No connection between retention metrics and the moderation checklist.** F establishes that D7 retention determines platform survival but doesn't connect this to what the developer can control at launch. The operational link is: leaderboard = return trigger = D7 retention = platform survival. This chain should be explicit in the recommendations.

### Integration

F's research drives two material changes to my operational plan:

1. **Day 2 gate must include the Game Over screen** — not just the merge loop. "Prominent Play Again with no delay" is a binary requirement, not optional.

2. **Theme decision is resolved: animals.** F's recommendation, C's differentiation argument, and B's naming formula all converge on: cute animals + [Name] Merge format (Зверята / Animal Merge). This eliminates the theme as an open question.

F's retention benchmarks are now the QC targets in my operational plan: D1 target = 25%+, D7 target = 10%+. If Day 3 analytics show D1 < 20%, emergency fix protocol triggers.

**Rating: 4/5** — Best audience and retention research. Operationally rich on UX requirements. Weaknesses are in asset validation and the sticky banner/interstitial conflict with CFO recommendations.

---

## Ranking by Operational Rigor

1. **Director D (CFO)** — Only director with validated quantitative model. Developer-sourced CPMV benchmarks, IAP vs. ads ROI calculation, correct monetization call. Every number has a source. Decisions are directly computable from the data.

2. **Director A (CTO)** — Critical technical foundation. SDK pitfall documentation saves at minimum one rejection cycle (5+ days). Stack choice is evidence-based, project structure is operationally sound. Loses points for ignoring timeline feasibility and including irrelevant hiring content.

3. **Director F (CPO)** — Theme decision (animals), retention benchmarks, and UX anti-patterns are all immediately actionable. AARP data applicability is questionable but the principles are correct. Strong product instincts.

4. **Director B (CMO)** — Best platform-specific intelligence (Card Completion Progress, dual-language drafts, A/B icon testing). Loses points for not separating moderation requirements from ML ranking optimization, and for leaving the post-submission period operationally empty.

5. **Director C (Devil's Advocate)** — Correctly identifies the #1 fatal error in the consensus timeline (development week ≠ go-live week). Reduces overconfidence appropriately. Loses points for weak alternative operational plans and for misusing the KvaytG data as market evidence rather than execution evidence.

---

## Biggest Gaps Across All Directors

### Gap 1: The Moderation Rejection is a Planned Event, Not a Risk

Every director (including myself) frames moderation rejection as a risk to mitigate. It should be framed as a planned scenario with a playbook. The correct operational model is:

```
Day 6-7: Submit
Days 8-12: Moderation wait (use for boilerplate + game #2 prep)
Day 12-13: First decision
  → Approved: go live, activate A/B test, monitor
  → Rejected: Rejection Recovery Playbook (read reason, classify, fix, resubmit)
Days 14-18: Rejection recovery buffer (if needed)
Day 18-20: Second moderation round
Go-live target: Week 2-3, not Day 7
```

No director provided this complete timeline. C identified the problem but didn't provide the playbook. A and B both assume first-pass approval.

### Gap 2: The Moderation Wait Period Has Zero Operational Content

All directors deliver their analysis up to "submit on Day 6-7" and then stop. The 3-5 day moderation wait is operationally valuable time. The correct use of this period:

- Day 8: Push boilerplate repo (extract reusable components from game #1 code)
- Day 9: Document the 7-day playbook (write it while memory is fresh)
- Day 10: Curate Kenney asset library for game #2 theme
- Day 11-12: Scope game #2 concept (Kamil involvement here)

This is the only time in the pipeline where there is no time pressure. No director used it.

### Gap 3: The Sticky Banner Conflict is Unresolved

CFO recommends all 3 ad formats (interstitial + rewarded + sticky banner) for maximum revenue. CPO recommends minimal ads to protect retention for the 55+ demographic. No director resolved this tension with a concrete implementation decision.

**COO resolution:** Sticky banner is acceptable positioned in the score area above the game container, never overlapping gameplay canvas. Interstitial after game over only, minimum 3 minutes between interstitials. Rewarded video on demand (extra life offer at game over before restart). This maximizes revenue without triggering the "aggressive ad" churn pattern.

---

## Revised Position

### What I Now Believe Differently

**Before peer review:** Timeline of 7 days to game publish was the central operational frame.

**After peer review:** The correct operational frame is 3 weeks total cycle to go-live:
- Week 1: Development + submission
- Week 2: Moderation wait + rejection recovery buffer
- Week 3: Go-live + first Novinka week

This is not pessimism. It's accurate triage. Planning for 7 days and hitting 14 is a failure. Planning for 14-21 and hitting 10 is an efficiency gain.

**Before peer review:** Theme was "geometric shapes or use Kamil's preference."

**After peer review:** Theme is resolved — **cute animals**. Evidence from CPO (differentiation, demographic fit), CMO (naming formula works), and Devil's Advocate (Suika-clone rejection risk) all converge. Animals > fruits. Non-negotiable.

**Before peer review:** SDK integration details were abstracted as "4-8h task."

**After peer review:** The 7 specific SDK pitfalls from the CTO must be incorporated into the Day 3 checklist verbatim. One missed pitfall = one rejection = one lost week. This is a fatal bottleneck that deserves explicit checklist coverage, not abstraction.

---

## Updated Operational Plan

### Revised Timeline (3-Week Total Cycle)

**Week 1 — Build + Submit**

| Day | Primary Owner | Gate |
|-----|--------------|------|
| Day 0 | Oleg | самозанятый registered + RSY account started + GitHub repo created + Phaser scaffold with SDK mock |
| Day 1 | Claude Code + Oleg QA | Drop mechanic works, objects fall with physics, collision detected |
| Day 2 | Claude Code + Oleg + Kamil test | Merge loop complete, game over triggers, "Play Again" instant |
| Day 3 | Claude Code + Oleg verify | All 7 SDK pitfalls verified, ads fire correctly, leaderboard connected |
| Day 4 | Oleg + Claude Code | 8 animal sprites sourced (Kenney.nl CC0), merge animation + sound |
| Day 5 | Oleg + Kamil | Mobile QA on device, 15-point pre-submit checklist green, no JS errors |
| Day 6 | Oleg | Icon x2 variants (A/B ready), cover, 5 screenshots, RU+EN drafts, Card Completion = green |
| Day 7 | Oleg | ZIP packaged, submitted to Yandex console, confirmation email received |

**Week 2 — Moderation Wait (Productive)**

| Activity | Output |
|----------|--------|
| Push boilerplate repo | Reusable Phaser + Matter.js + Yandex SDK template |
| Write 7-day playbook doc | Template for game #2 |
| Curate animal sprite library | Kenney folder with 20+ sorted sprites |
| Scope game #2 concept | Kamil picks mechanic, Oleg validates platform fit |
| Rejection scenario: if rejected on Day 12 | Read reason → classify → Rejection Recovery Playbook → fix → resubmit |

**Week 3 — Go-Live**

| Activity | Gate |
|----------|------|
| Approval received | Activate A/B icon test immediately |
| Monitor Day 1-3 | D1 retention target: 25%+. If <20% → emergency UX review |
| Monitor Day 3-7 | Rating > 30 at end of Novinka week |
| Week 3 debrief | Revenue: any positive number = educational success. 3,000₽ target = Month 2-4 |

### Updated Agent/Human Split

| Agent Does | Human Does |
|-----------|-----------|
| Phaser scaffold with TypeScript + Vite | Judge if first merge "feels satisfying" |
| All 7 SDK integrations with error handling | Play-test 5 sessions on mobile device |
| Generate 3 merge animation variants | Select animal theme and progression chain |
| Write RU + EN metadata from brief | Approve final submission |
| Run 15-point pre-submit checklist | Set up самозанятый + RSY (legal accounts) |
| Generate 5 icon concepts + 2 cover variants | Decide which 2 icons for A/B test |
| Verify all 7 CTO-documented SDK pitfalls | Make rejection response decision |

### KPI Revisions (Post-Peer Review)

| KPI | Original | Revised | Why |
|-----|---------|---------|-----|
| Go-live timeline | Day 7 | Week 2-3 | Moderation wait is not negotiable |
| Success definition | Revenue generating | Balance > 0₽ growing (Stage 1), 3,000₽ in 2-4 months (Stage 2) | CFO + Devil's Advocate convergence |
| D1 retention target | >3 min session | 25%+ D1 retention | CPO benchmarks + platform survival link |
| Theme | Open / geometric | Cute animals | CPO + CMO + Devil's Advocate convergence |
| Ad implementation | Interstitial + rewarded | Interstitial (game over only) + Rewarded (on-demand) + Sticky banner (score area, non-overlapping) | CFO revenue + CPO retention balance |
| SDK integration | 4-8h task | Day 3 dedicated with 7-point verification checklist | CTO pitfall documentation |

### Avoid (Updated)

1. **Anti-pattern: planning for Day 7 go-live.** Moderation = 3-5 days, rejection recovery = +5 days. Total cycle = 2-3 weeks. State this explicitly before starting.
2. **Anti-pattern: fruit theme.** Saturated, no differentiation, Suika-clone rejection risk. Animals are operationally and commercially superior.
3. **Anti-pattern: interstitial before first game over.** This is the #1 churn trigger for the 55+ demographic. Zero exceptions.
4. **Anti-pattern: moderation wait = idle time.** Use it for boilerplate repo + game #2 scoping. This is the only low-pressure time in the entire pipeline.
5. **Anti-pattern: assuming first-pass moderation approval.** Build the Rejection Recovery Playbook before submitting, not after rejection arrives.
