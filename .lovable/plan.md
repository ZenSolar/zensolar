## Plan

I understand the issue now: in Lovable Preview mode, `/investor` itself opens, but the investor materials still act as if the NDA/access flow blocks the buttons.

## Fix

1. **Treat Preview mode as already NDA-unlocked on `/investor`**
   - Keep the real published site unchanged.
   - In Lovable Preview/dev only, synthesize the signed NDA state immediately so the page renders the unlocked materials panel instead of the locked CTA flow.

2. **Make investor buttons route to preview-safe pages**
   - Investor Pitch → `/investor/pitch`
   - Demo → preview-safe demo route such as `/demo-leonardo` instead of the gated `/demo`
   - Tokenomics → the correct existing tokenomics page route
   - Founder/seed materials → existing internal route where available

3. **Remove Preview friction only**
   - No backend changes.
   - No change to published/custom-domain behavior.
   - No real NDA bypass for public users.

4. **Verify the mobile Preview behavior**
   - On `/investor`, the unlocked section should show in Preview mode.
   - Tapping the cards/buttons should navigate to their content without requiring an NDA, PIN, or access code.