## Narrative Restructure: Bitcoin vs ZenSolar

Swap the comparison card from ticker framing ($ZSOLAR) to brand framing (ZenSolar) while keeping $ZSOLAR everywhere else.

### What changes

**File: `src/components/tokenomics/ProofOfGenesisThesis.tsx`**

| Location | Current | New |
|---|---|---|
| Card title (line ~146) | `Bitcoin vs $ZSOLAR` | `Bitcoin vs ZenSolar` |
| Mobile table label (line ~177) | `$ZSOLAR` | `ZenSolar` |
| Desktop table header (line ~204) | `$ZSOLAR` | `ZenSolar` |

**What stays as `$ZSOLAR`**
- Body text: "Why $ZSOLAR has a credible path…" (line ~114), thesis paragraphs, bar-chart labels ($ZSOLAR · floor/stretch target), and all tokenomics math references.
- Every other page in the app — no global find/replace.

**Already correct**
- `src/pages/FoundersProofOfGenesis.tsx` already reads "Bitcoin vs ZenSolar — Side by Side".

### Why this scope
The user chose brand-vs-brand for the *comparison narrative* only. The $ZSOLAR ticker remains the canonical token symbol everywhere else.