## Plan

1. **Fix post-login redirect on `/auth`**
   - Update the email/password login success handler so it honors `?redirect=/simulator` instead of always navigating to `/`.
   - Reuse the existing `safeRedirectPath()` sanitizer so redirects remain same-origin and safe.

2. **Fix OAuth redirect preservation**
   - Update Google/Apple sign-in so the redirect target survives the OAuth round trip, using the existing `redirect` query value.
   - This prevents founders who choose social login from returning to the generic auth/home flow instead of `/simulator`.

3. **Add regression coverage**
   - Extend the existing simulator/auth redirect tests to lock in that Auth does not use a raw `navigate('/')` after successful login when a redirect param is present.
   - Keep the existing `/simulator` route contract: `/simulator` and `/founders/simulator` render `FoundersSimulator`, which handles auth → founder check → `VaultPinGate`.

## Expected result

- If Joseph or Michael is already signed in: `www.zensolar.com/simulator` shows the PIN gate.
- If signed out: `www.zensolar.com/simulator` shows login first, then after login returns to `/simulator`, shows the PIN gate, and then opens the simulator after the founder PIN is entered.