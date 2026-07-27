# Restore email + password auth

Locked decision: primary login = email + password. OTP/magic-link is no longer the required default. Passkey / Coinbase Smart Wallet activation stays where it is (`/onboarding/account`) — that's a wallet step, not a login method.

`useAuth` already exposes `signIn`, `signUp`, `resetPassword`, `updatePassword` via `supabase.auth.signInWithPassword` / `signUp` / `resetPasswordForEmail`, so no backend or hook changes are needed.

## Changes

### 1. Rebuild `src/pages/beta/BetaSignIn.tsx` (Quiet Current styling)
Replace the OTP form with a tabbed Log In / Sign Up surface:
- **Log In**: email + password → `signIn()`; on success → `/onboarding` (BetaResume decides where returning users land vs. resume onboarding).
- **Sign Up**: email + password (+ optional display name) → `signUp()` with `emailRedirectTo: ${origin}/onboarding`; on success either auto-signed-in → `/onboarding`, or show "check your email to confirm".
- **Forgot password** link → inline flow calling `resetPassword(email)` with redirect to `/reset-password`.
- **Optional Google / Apple buttons**: render only if the `lovable` OAuth helper is available (already wired via `src/integrations/lovable/index.ts`). Use `lovable.auth.signInWithOAuth("google" | "apple", { redirect_uri: window.location.origin + "/onboarding" })`. No workspace-level provider tool call in this task — only surface what's already enabled.
- Strip all passwordless copy ("No password required", "We'll email you a one-time code", "Send code", etc.).

### 2. Retire OTP verify step
- Delete the `/onboarding/verify` route registration in `src/App.tsx` (and the `/beta/signin` legacy alias can keep pointing at the new component).
- Leave `src/pages/beta/BetaVerify.tsx` on disk but unused, or remove it — decision at build time. Existing password accounts are unaffected because they never touched this route.

### 3. `/beta-welcome` "Log in" entry point (`src/pages/BetaLanding.tsx`)
- Keep the "Log in" link in the header pointing to `/onboarding/signin` (the new email+password screen). No copy change needed there beyond what's already shipped.

### 4. Post-login routing — don't force onboarding on existing users
`BetaResume.tsx` currently sends any authed user whose `beta_flow_step` is `done` to `/`, and anyone with a saved mid-flow step back into that step. Tighten the "already set up" check:
- If the user has ANY of: `beta_flow_step === 'done'`, a connected device in `connected_devices`, or a non-null `wallet_address` on `profiles` → navigate to `/` (dashboard) instead of resuming onboarding.
- Otherwise behave as today (resume saved step, else `computeNextStep`).

This means Joe / Harrison / other existing users hitting Log In land straight on the Clean Energy Center; brand-new signups still get the full onboarding.

### 5. Password reset page
Add `src/pages/ResetPassword.tsx` (Quiet Current styled) mounted at `/reset-password` as a public route in `src/App.tsx`. It:
- Reads the recovery session Supabase sets on redirect.
- Shows a "new password" + confirm form and calls `updatePassword()`.
- On success → `/onboarding` (BetaResume will send them to `/` per step 4).

### 6. Wallet step untouched
`src/pages/beta/BetaAccount.tsx` ("Secure your account" — Face ID / Coinbase Smart Wallet passkey) stays exactly as-is. It's a wallet activation, not a login method, and the flow still ends there before `/onboarding/done`.

### 7. Copy sweep
Grep for and remove passwordless framing on the primary login/signup surface only:
- "No password required"
- "We'll email you a one-time code"
- "Send code" / "Enter your code" on the main auth screens
Legacy `/beta/*` v1 routes and any AI-Concierge screens keep their own copy.

## Ship message
After the edits land, reply exactly:

> Primary auth restored to email + password — login and wallet activation remain separate.

## Technical notes
- No Supabase migrations, no `configure_auth` / `configure_social_auth` calls in this task — Google/Apple buttons render only if the workspace already has them enabled; otherwise they're hidden.
- Existing password users are unaffected (`signInWithPassword` is already how they authenticate elsewhere via `Auth.tsx`).
- The OTP path stops being reachable from the primary flow but doesn't break any historical sessions — sessions are cookie/localStorage based and independent of the sign-in method used to create them.
