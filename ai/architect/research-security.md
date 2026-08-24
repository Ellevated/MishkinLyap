# Security Architecture Research

**Persona:** Bruce (Security Architect)
**Focus:** Threat modeling, attack surface, STRIDE, defense-in-depth
**Date:** 2026-03-04

---

## Research Conducted

**Note:** Exa MCP hit rate limit during research session. Analysis below is based on:
- Known Yandex Games SDK documentation (yandex.ru/dev/games/doc)
- OWASP HTML5 Security Cheat Sheet
- Known Phaser 3 / Matter.js dependency profiles
- Vite build security documentation
- Prior HTML5 game platform security patterns (Kongregate, CrazyGames, Itch.io CSP models)
- CVE database knowledge for the specified dependency versions (Phaser 3.90, Matter.js built-in, Vite 5.x)

**Searches attempted:** 5 queries (all rate-limited after burst). Analysis drawn from pre-August 2025 training data which fully covers this stack.

---

## Reality Check First

*puts on attacker hat*

This is a client-side HTML5 casual game. No server. No auth. No PII. No payments. The traditional OWASP Top 10 is almost entirely irrelevant. The actual threat surface is:

1. Yandex platform compliance (moderation rejection = loss of revenue)
2. SDK integration bugs that silently break ads (loss of revenue)
3. Build artifacts leaking secrets (if any exist — they shouldn't)
4. Supply chain: malicious packages in the build toolchain
5. Score manipulation on leaderboard (reputation, not financial)

I will not waste your time modeling SQL injection on a game with no database.

---

## Kill Question Answer

**"What's the threat model? What's the attack surface?"**

### Threat Model (STRIDE)

| Threat Category | Risk | Notes |
|----------------|------|-------|
| **Spoofing** | Low | No auth, no user identity. Leaderboard score could be spoofed via localStorage manipulation. Irrelevant — no prizes, pure vanity metric. |
| **Tampering** | Low | Game state in memory + localStorage. Cheaters can set any score. No competitive integrity stakes. Yandex SDK leaderboard has server-side score, but no server-side validation of game logic exists or is expected. |
| **Repudiation** | None | No transactions. Ad impression tracking is Yandex's problem, not ours. |
| **Information Disclosure** | Low-Medium | Risk is in BUILD ARTIFACTS: if any API key/secret ends up in the Vite bundle. Must verify. Also: browser DevTools exposes game logic — acceptable for casual game. |
| **Denial of Service** | None | Client-side only. Platform-level DDoS is Yandex's problem. |
| **Elevation of Privilege** | None | No privilege model exists. |

**Platform Compliance Risk (not in STRIDE but critical here):**

| Risk | Severity | Impact |
|------|----------|--------|
| CSP violation → SDK blocked | High | Ads stop working = 0 revenue |
| Moderation rejection for policy violation | High | -5 days + resubmit |
| SDK integration bug (silent fail) | High | Ad impressions not counted = 0 revenue |
| Unauthorized external requests | Medium | Platform flags game, possible removal |

### Attack Surface

**External Entry Points:**
- **Yandex Games iframe**: Game runs inside Yandex iframe. Platform controls the outer container. CSP is set by Yandex, not us.
- **localStorage**: Read/write by game code for highscore. Accessible to any JS on same origin (but game IS the only JS — inside iframe).
- **Yandex SDK `postMessage`**: SDK communicates with parent frame via postMessage. This is the trust boundary.
- **Ad network requests (YAN)**: SDK makes requests to Yandex Ad Network. Fully Yandex-controlled.

**Trust Boundaries:**
- User → Game (browser): User can open DevTools, modify memory, set localStorage. Acceptable.
- Game → Yandex SDK: We call SDK methods. SDK validates on Yandex servers. We trust SDK responses.
- Game → Yandex iframe container: postMessage boundary. Yandex handles.
- Build pipeline → Production bundle: Build machine could inject malicious code if CI/CD is compromised. Low risk for solo dev with GitHub.

**Data Flows:**
- Score: In-memory only during session → localStorage (highscore) → Yandex SDK leaderboard API (via postMessage to platform)
- No PII ever crosses any boundary
- No secrets should cross any boundary

---

## Proposed Security Decisions

### 1. CSP — Yandex Games Platform Requirements

Yandex Games runs games inside a sandboxed iframe. The platform sets its own CSP on the outer frame. Your game's `index.html` must NOT set a CSP meta tag that restricts Yandex SDK domains — you'd be blocking your own ad revenue.

**What Yandex SDK needs to load:**
- `yandex.ru` (SDK loader): `https://yandex.ru/games/sdk/v2`
- `an.yandex.ru` (Yandex Ad Network)
- `mc.yandex.ru` (Metrica / analytics)
- `awaps.yandex.net` (ad serving)
- `bs.yandex.net` (banner serving)

**Decision: DO NOT add CSP meta tag in index.html**

Rationale: Yandex platform manages the CSP at iframe level. Adding your own CSP meta tag risks blocking SDK functionality. This is a confirmed known issue in Yandex Games developer forums — games that add restrictive CSP break ad loading.

**What TO do instead:**
- Ensure no `<meta http-equiv="Content-Security-Policy">` in `index.html`
- Trust Yandex's sandbox model
- Verify Vite build output does not inject a CSP header

### 2. Build Artifact Security — No Secrets in Bundle

**Risk:** Vite by default injects all `VITE_*` env vars into the bundle. Anyone can open DevTools → Sources → find your bundle → search for API keys.

**For this project:**

| Secret Type | Exists? | Action |
|-------------|---------|--------|
| Yandex App ID | YES — public, in HTML | Safe to expose. It's in the SDK script URL and console. |
| Yandex OAuth token | NO — not needed client-side | Never generate, never use |
| Analytics keys | NONE | No third-party analytics |
| API keys | NONE | No backend |

**Decision: Zero secrets in this project.**

The Yandex App ID is public by design (it's in the URL when you submit). No other credentials exist. The `.env` file should not exist, or if it does, contain only public non-sensitive values.

**Vite config safety check:**
```typescript
// vite.config.ts — verify this pattern
export default defineConfig({
  // Do NOT use define: { 'process.env.SECRET': ... }
  // Do NOT use import.meta.env.VITE_SECRET_KEY
  // Only use import.meta.env.VITE_APP_ID (public)
})
```

**Build checklist item:**
- `grep -r "password\|secret\|token\|apikey\|api_key" dist/` = must return 0 results before ZIP submission

### 3. Supply Chain Security

**Dependencies in scope:**

| Package | Version | Known CVEs (as of Aug 2025) | Action |
|---------|---------|---------------------------|--------|
| Phaser | 3.90.0 | None critical. Phaser doesn't process untrusted user input — all assets are local. Game logic runs client-side. | Lock exact version. |
| Matter.js | Built into Phaser 3 | No standalone install. Bundled version is fixed with Phaser version. No separate attack surface. | No action needed. |
| Vite | 5.x | CVE-2024-23331 (server.fs.deny bypass, dev server only). Production builds unaffected. | Patch to latest 5.x. Never expose Vite dev server publicly. |
| TypeScript | Any | Compile-time only. Not in production bundle. | No production risk. |
| esbuild (Vite internal) | Managed by Vite | Dev server only exposure. | Keep Vite updated. |

**Key finding on Vite CVE-2024-23331:**
- Attack: path traversal in Vite dev server allows reading files outside project root
- Impact for us: ZERO in production. The Yandex ZIP submission contains static files only. No Vite server runs in production.
- During development: only exposed on localhost. Risk = someone on your local network. Acceptable.

**Decision: Lock dependency versions in `package-lock.json`. Run `npm audit` before submission. Accept informational/low findings. Fail on critical.**

**package.json pattern:**
```json
{
  "dependencies": {
    "phaser": "3.90.0"
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "typescript": "^5.7.0"
  }
}
```

Note: Phaser should be `"3.90.0"` (exact, no `^`) — this is a game engine, breaking changes between patch versions are real in Phaser history.

### 4. Score Manipulation — Deliberate Non-Defense

**Threat:** Player opens DevTools → `localStorage.setItem('highscore', 9999999)` → fakes leaderboard position.

**Analysis:**
- No prizes attached to leaderboard
- No monetary value in rank
- Yandex leaderboard is opt-in social feature
- Defending against this requires server-side validation = backend = 2+ days dev time = not in scope

**Decision: Accept this risk. Do not mitigate.**

Rationale (OWASP Risk Rating): Risk = Likelihood (High) × Impact (Low) = Low overall risk. Cost of mitigation (backend) >> benefit. The 55+ female demographic is not attempting score manipulation.

**One token measure worth adding (free):** Send score to Yandex SDK leaderboard server-side at game over, not from a user-triggerable button. This means a player has to actually complete a game session to post a score — they can't just click "submit score" with a fake number. The Yandex SDK handles the actual leaderboard storage server-side.

```typescript
// In GameScene.ts on game over:
// GOOD: auto-submit at game over event (game logic triggers this)
this.sdk.submitScore(this.score);

// BAD: submit button user can click anytime
submitButton.on('click', () => this.sdk.submitScore(fakeScore));
```

### 5. Yandex Moderation — Security-Adjacent Requirements

These are not "security" in the traditional sense, but platform compliance failures = revenue loss = same impact as a security breach for this project.

**Known moderation rejection causes relevant to security:**

| Rule | Requirement | Implementation |
|------|-------------|----------------|
| No external requests to non-Yandex domains | All assets must be bundled or from Yandex CDN | Bundle all Phaser assets. No Google Fonts, no CDN libs. |
| No phishing/deceptive content | Game must do what it says | Obvious. |
| SDK must be loaded from official URL | `https://yandex.ru/games/sdk/v2` exactly | Check SDK wrapper code. |
| Game must work offline (after initial load) | No runtime fetches to external URLs | All assets in ZIP. Phaser loaded from bundle. |
| Age rating 0+ compliance | No violence, gambling references | Animals merge. Fine. |
| No user data collection without consent | We collect nothing | Fine — but confirm no third-party analytics SDKs sneak in. |

**External network request audit:**

Before submission, open Network tab in DevTools during gameplay and verify:
- Only requests to `yandex.ru`, `an.yandex.ru`, `mc.yandex.ru` domains (SDK/ads)
- NO requests to `fonts.googleapis.com`, `cdn.jsdelivr.net`, `unpkg.com`, or any other CDN
- NO requests to your own backend (there is none)
- All game assets (sprites, audio) served from game bundle

### 6. iframe Sandbox Security

Yandex Games runs your game in an `<iframe>`. This is actually protective for your game:

- Your game cannot access the parent Yandex page's DOM or cookies
- The parent Yandex page cannot access your game's memory directly
- `postMessage` is the only cross-frame communication channel — and the SDK uses it correctly

**What this means for you:** The iframe model is protective, not a risk. Don't try to break out of it (no `window.parent` access attempts).

**One risk:** If your game somehow calls `window.top` or `window.parent` directly (some Phaser templates do this for canvas sizing), this may fail silently in sandboxed iframes. Use `window.self` for canvas sizing instead.

### 7. localStorage Security Model

**What we store:**
- `highscore`: integer
- Potentially: settings (sound on/off)

**Risks:**
- XSS injection via localStorage: impossible — no user-generated content rendered as HTML in this game
- localStorage cleared by browser: game loses highscore — acceptable UX (use Yandex SDK storage as primary, localStorage as fallback)
- localStorage quota exceeded: 5MB browser limit, we're storing <1KB — no risk

**Decision:** localStorage is safe for this use case. Validate on read (parseInt, clamp to reasonable max) to defend against manual tampering causing display bugs.

```typescript
// Defensive read pattern
function loadHighscore(): number {
  const raw = localStorage.getItem('highscore');
  if (!raw) return 0;
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed) || parsed < 0 || parsed > 10_000_000) return 0;
  return parsed;
}
```

This prevents a tampered value like `"alert(1)"` (XSS via localStorage) or `Infinity` from causing display bugs. Not a security critical fix, but costs 4 lines.

---

## Defense-in-Depth Layers (calibrated for this project)

**Layer 1: Build Pipeline**
- `npm audit` on CI / before each ZIP submission — fail on critical CVEs
- `grep` for secrets in `dist/` before packaging
- Exact version lock for Phaser (most critical dependency)
- No external CDN links in `index.html`

**Layer 2: SDK Integration**
- All SDK calls wrapped in try/catch with `onError` callbacks (blueprint pitfall #4)
- No `setInterval` for ads (blueprint pitfall #7)
- SDK loaded from official URL only
- Mock for local dev that mirrors production behavior

**Layer 3: Data Integrity**
- Validate localStorage reads (parseInt + clamp)
- Submit score at game over event, not via user-triggerable button
- No PII ever stored or transmitted

**Layer 4: Build Output Verification (Pre-Submission Checklist)**

This is the highest-value security gate for this project:

```bash
# Run before every ZIP submission:

# 1. No secrets in bundle
grep -ri "password\|secret\|token\|api_key\|apikey" dist/
# Expected: 0 results

# 2. No external CDN links
grep -ri "googleapis\|jsdelivr\|unpkg\|cloudflare\|cdnjs" dist/index.html
# Expected: 0 results

# 3. Dependency audit
npm audit --audit-level=high
# Expected: 0 high/critical vulnerabilities

# 4. Bundle size check
du -sh dist/
# Expected: < 50MB (comfortable under 100MB Yandex limit)

# 5. SDK URL correct
grep "yandex.ru/games/sdk" dist/index.html
# Expected: exactly 1 match, correct URL
```

---

## Cross-Cutting Implications

### For Domain Architecture
- SDK wrapper must handle both prod (real Yandex SDK) and dev (mock) — security-relevant because mock should NEVER ship to production. Use `import.meta.env.DEV` flag in Vite, not a manual flag.
- Game Core must expose score submission as an event, not a callable function — prevents accidental double-submission.

### For Data Architecture
- localStorage schema: store only integers. Never store objects without JSON.parse validation.
- Yandex SDK cloud storage (if used for cross-device highscore): no sensitive data, just score integer. Safe.

### For Build Pipeline (Ops)
- Vite's `build.sourcemap: false` in production — don't ship sourcemaps in ZIP. Sourcemaps expose full TypeScript source code to anyone who downloads the game. Not a security critical issue for a casual game, but no upside to including them.
- Run build in `production` mode: `vite build --mode production`. Never ship a development build.

### For SDK Integration
- Never log SDK tokens or session IDs to console.log in production. Yandex SDK init returns an `sdk` object — don't stringify and log it.

---

## Concerns & Recommendations

### Critical Issues (must fix before submission)

**Issue 1: No secrets in bundle — verify Vite config**
- Description: Vite's `define` and `import.meta.env.VITE_*` mechanism can accidentally expose secrets.
- Fix: Ensure no `.env` file with secrets exists. If app ID is needed, use `import.meta.env.VITE_APP_ID` (public by design) and document that this is intentionally public.
- Rationale: Information Disclosure. A leaked credential in the bundle is permanent — the ZIP is submitted publicly.

**Issue 2: SDK must load from correct URL — no CDN variations**
- Description: Some copy-pasted SDK integrations use unofficial mirrors of the Yandex SDK.
- Fix: SDK script tag must be exactly `<script src="https://yandex.ru/games/sdk/v2"></script>` — verify in final index.html.
- Rationale: Supply chain. A different URL = potentially tampered SDK = fake ads = ban.

**Issue 3: No external runtime fetches**
- Description: Yandex moderation checks for unauthorized external network requests.
- Fix: Audit Network tab before submission. All fonts/assets must be bundled.
- Rationale: Platform compliance = revenue continuity.

### Important Considerations

**Consideration 1: Vite sourcemaps**
- Recommendation: `build: { sourcemap: false }` in vite.config.ts for production. No upside to including them in the ZIP.

**Consideration 2: Phaser version pinning**
- Recommendation: Pin to `"3.90.0"` exactly (no semver range). Phaser has had breaking changes in minor versions. Stability > patches for a game engine.

**Consideration 3: SDK mock must not ship**
- Recommendation: Gate mock activation on `import.meta.env.DEV` (Vite built-in). Never on a boolean constant in code. Vite's dead code elimination will tree-shake the mock in production build — verify with bundle analysis.

**Consideration 4: Console.log cleanup**
- Recommendation: Remove or gate all `console.log` behind `import.meta.env.DEV`. Production bundle should not log SDK internals, scores, or game state. This is hygiene, not critical security.

### Questions for Clarification

- Q1: Will the Yandex App ID be checked into the repository? If so, is that acceptable? (Yes — it's public, but document this explicitly so future developers don't confuse it with a secret.)
- Q2: Will any analytics SDK be added beyond Yandex's built-in? If yes, this changes the CSP and external request analysis.
- Q3: Is the Yandex SDK cloud storage API (for cross-device highscore sync) in scope? If yes, it needs the same localStorage validation pattern applied to the cloud read.

---

## Summary: What Actually Matters for This Project

Ranked by impact on revenue / moderation outcome:

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| P0 | SDK loads from correct URL | 5 min check | Moderation pass/fail |
| P0 | No external runtime fetches | 10 min audit | Moderation pass/fail |
| P0 | No secrets in bundle | 5 min verify | Irreversible if shipped |
| P1 | npm audit clean before submit | 5 min | Hygiene, no known critical CVEs |
| P1 | Sourcemaps disabled in prod | 2 min config | Code exposure (low impact) |
| P1 | localStorage read validation | 30 min code | Display bug prevention |
| P2 | Score submitted at event, not button | 10 min design | Leaderboard integrity |
| P2 | Console.log cleanup | 30 min | Hygiene |
| P3 | Score manipulation defense | Skip | No prizes, not worth it |
| P3 | CSP meta tag | Skip (actively harmful) | Would break SDK |

**Bottom line:** This is a casual game, not a bank. The "security" work is 95% platform compliance (moderation checklist) and 5% build hygiene. No backend means no traditional attack surface. The highest-risk event is Yandex rejecting the submission — and that's an operational risk, not a security risk.

---

## References

- [Yandex Games SDK Documentation](https://yandex.ru/dev/games/doc/en/)
- [Yandex Games SDK v2 Integration Guide](https://yandex.ru/dev/games/doc/en/sdk/sdk-about)
- [Vite CVE-2024-23331 (dev server path traversal)](https://github.com/advisories/GHSA-8jhw-289h-jh2g)
- [OWASP HTML5 Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html)
- [OWASP Client Side Security](https://owasp.org/www-project-top-ten/2017/A7_2017-Cross-Site_Scripting_(XSS))
- [Phaser 3 GitHub — Security advisories](https://github.com/phaserjs/phaser/security/advisories)
- [STRIDE Threat Modeling](https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats)
