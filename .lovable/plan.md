## Fix Patent-pending card on Investor.tsx

The screenshot matches `src/pages/Investor.tsx` (line 248), which still has the old text. The `InvestorPitch.tsx` card was already updated last turn, but the `Investor.tsx` card was missed.

### Change

In `src/pages/Investor.tsx` line 248, replace:

`U.S. App. 19/634,402 covers Proof of Genesis™, Mint-on-Proof™, Proof-of-Delta™.`

with:

`U.S. App. 19/634,402 covers the Proof of Genesis™ protocol — a novel system for turning verified clean-energy production into a hard-capped, asset-backed digital currency on Base.`

Heading "Patent-pending" stays unchanged. No other files touched.