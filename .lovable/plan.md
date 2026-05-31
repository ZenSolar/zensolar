I understand the problem now: in mobile Chrome inside Lovable Preview, you enter `/investor`, but the page still behaves like a locked NDA page. The “You’ll unlock” rows appear, but tapping them does not open the pages because the app is not treating `lovable.dev` Preview correctly and/or the locked-section links still point at gated destinations.

Plan:

1. **Fix Preview detection for your exact phone URL**
   - Update the preview-host helper so `lovable.dev` and Lovable Preview iframe hosts are consistently treated as Preview.
   - This is the root mismatch visible in your video: the address bar is `lovable.dev`, but the investor page is still rendering the locked NDA flow.

2. **Force `/investor` to be unlocked only in Preview/dev**
   - In Preview, initialize the investor PIN and NDA state as already unlocked.
   - On production/custom domains, keep the real PIN + NDA behavior unchanged.

3. **Make the visible investor rows tappable in Preview**
   - For the “You’ll unlock” rows, use real links in Preview mode.
   - Route “Live Investor Demo” to `/demo-leonardo` in Preview instead of gated `/demo`.
   - Keep production behavior locked unless the NDA is actually completed.

4. **Add one small Preview-only visual cue**
   - Show a subtle “Preview unlocked” cue on `/investor` only when running in Lovable Preview/dev, so you can tell immediately that the developer bypass is active.

5. **Verify against the mobile Preview case**
   - Check that `/investor` on a 393px-wide mobile viewport shows unlocked/tappable materials without requiring the NDA.
   - Confirm production/custom domains are not changed.