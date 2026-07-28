
# New Public Front Door — zensolar.com (rev 3, ready to build)

Rev 3 folds in the five hard rules. Everything else from rev 2 stands.

## Hard rules (locked)

1. **Invite success redirect** on valid code: `window.location.assign('https://beta.zensolar.com')` — literal, absolute, no query params, no path.
2. **Header "Log in"** links to `/auth` (existing working auth entry — verified as the shared sign-in route used by the rest of the app). Opens same-tab; no `target="_blank"`.
3. **ProofChain** renders structural labels only: `device`, `Δ`, `SHA-256(device_id ‖ ts ‖ Δ ‖ prev_hash)`, `proofₙ`. Zero currency, zero balances, zero minted totals, zero counters. Hardcoded ban in component; verification step asserts no `$`, no digit-grouped numbers, no "ZSOLAR" inside the SVG.
4. **`/privacy`**: current page audited this pass. If missing or a stub, ship a minimal honest privacy page at `src/pages/Privacy.tsx` covering only what is true: what we collect (name, email, optional source field from the access form; IP hash + user agent from the two edge functions for abuse prevention), how it is stored (Lovable Cloud, RLS, service-role read only), retention ("we keep access requests until we've responded and for a reasonable follow-up window"), who to contact, and a plain "we do not sell data" line. No fabricated GDPR/CCPA/SOC2 claims. No cookie banner theater.
5. **Founder line**: literal string `Joseph Maushart, co-founder.` Nothing else. No prior-employer claim, no title inflation. One line, accurate, modest.

## Routing

- New `src/pages/PublicHome.tsx` and `src/pages/PublicInvite.tsx`.
- `src/pages/Home.tsx`: `zensolar.com` / `www.zensolar.com` and preview hosts render `PublicHome`. `beta.*` untouched.
- `src/App.tsx`: add `/invite` (public, bare). Confirm `/auth` and `/privacy` remain reachable.
- `.lovable/routes.config.ts`: register `/`, `/invite`, `/privacy`.

## Backend

### Migrations

- `public.access_requests` — name, email, source enum, note, `hp` honeypot, `ip_hash`, `user_agent`. RLS: `service_role` only (all writes go through edge function).
- `public.invite_codes` — `code citext unique`, label, `active`, `expires_at`, `redeem_count`, `last_redeemed_at`. RLS: `service_role` only. Seed with existing `8712387` + a handful of new codes.
- `public.invite_redeem_attempts` — `ip_hash`, `attempted_at`, `success`, `code_tried_hash`, `kind` (`invite`|`access`). RLS: `service_role` only.
- Grants: `service_role` full on all three; no `anon` grants.

### Edge functions (both public, no JWT)

- `redeem-invite`: IP-hash with `INVITE_IP_PEPPER`; reject 429 at ≥5 failures / 15 min or ≥20 attempts / hour; constant-time compare; log every attempt; success returns `{ ok: true }` → client redirects to **`https://beta.zensolar.com`** exactly.
- `submit-access-request`: honeypot short-circuits with `{ ok: true }`; Zod validation; per-IP throttle (3 / hour); insert via service role.

### Secrets

- `INVITE_IP_PEPPER` — `generate_secret`, 64 chars.

## Design tokens (unchanged)

Public-scoped in `tailwind.config.ts`: canvas `#0A0C0E`, surface `#121417`, elevated `#1B1E22`, accent gradient `#00E19B → #00C2FF`, keyframes `pulse-current` + `chain-flow`.

## Page structure

1. **Header** — wordmark left; right: `<Link to="/invite">I have an invite code</Link>` and `<Link to="/auth">Log in</Link>`.
2. **Hero** — headline, subhead, `<ProofChain />`, primary CTA `Request Access` (anchors `#request-access`), secondary text link to `/invite`.
3. **CredibilityStrip** — Tesla, Enphase, Wallbox, SolarEdge SVGs, muted `currentColor`.
4. **HowItWorks** — 3 plain steps, hairline rules.
5. **Technology** — Mint-on-Proof / Proof-of-Delta / Proof-of-Origin cards + Sepolia line.
6. **Trust** — `Joseph Maushart, co-founder.` + `mailto:` + `/privacy` link.
7. **RequestAccess** (`#request-access`) — form (name, email, source select) + hidden `hp` honeypot. Success panel: compact `<ProofChain compact />` + "We review requests personally and reach out as we open new cohorts."
8. **Footer** — contact `mailto:` + `/privacy`.

## Flagship: `<ProofChain />`

Pure SVG, 4 labeled structural nodes (device → Δ → SHA-256(...) → proofₙ), animated stroke gradient + slow cross-fade emission every ~3s, contained not full-bleed, respects `prefers-reduced-motion`. **Component has no props for currency/balance/counter; verification asserts none render.**

## Motion & copy discipline

Two moving elements only (ProofChain + CTA glow). No waitlist / counter / exclamation / superlative copy. No emoji, no crypto tropes.

## Privacy page (`src/pages/Privacy.tsx`)

Minimal, in the same Quiet Current type/surfaces:

- What we collect: name + email + optional source note from the access form; hashed IP + user agent from `submit-access-request` and `redeem-invite` for abuse prevention.
- Where it lives: Lovable Cloud (Supabase), RLS-restricted, service-role read only.
- Retention: kept until responded to and a reasonable follow-up window; access requests can be deleted on request.
- Sharing: not sold, not shared with third parties beyond hosting infrastructure.
- Contact: same `mailto:` as the footer.
- Last updated date.

No cookie banner, no invented regulatory attestations.

## Files

**New**
- `src/pages/PublicHome.tsx`
- `src/pages/PublicInvite.tsx`
- `src/components/public/ProofChain.tsx`
- `src/components/public/PublicHeader.tsx`
- `src/components/public/PublicFooter.tsx`
- `src/components/public/RequestAccessForm.tsx`
- `supabase/functions/redeem-invite/index.ts`
- `supabase/functions/submit-access-request/index.ts`

**Edited**
- `src/pages/Home.tsx`, `src/App.tsx`, `tailwind.config.ts`, `.lovable/routes.config.ts`
- `src/pages/Privacy.tsx` — only if audit finds it missing/stub; otherwise left alone.

## Verification (Playwright + curl)

- `/` at 390×844 and 1440×900: hero copy, animated `<svg>` present, CTA glow, no `HomeNav`/counters/emoji/`$`. Assert ProofChain SVG contains none of `$`, `ZSOLAR`, `MINT`, digit-grouped numbers.
- Header "Log in" href === `/auth`; "I have an invite code" href === `/invite`.
- `/invite`: submit seeded code → `window.location` becomes exactly `https://beta.zensolar.com`; garbage code → inline error, no redirect; 6th wrong attempt in 15 min → 429 shown as calm inline error.
- `submit-access-request` curl: good payload → row lands; honeypot filled → silent success, no row; 4th within an hour → 429.
- `/privacy` renders and contains only true claims listed above; founder section renders exactly `Joseph Maushart, co-founder.`

## Explicitly out of scope

Beta product, OAuth, wallet, dashboard, admin UI for access requests, CAPTCHA, migrating legacy 7-digit codes.
