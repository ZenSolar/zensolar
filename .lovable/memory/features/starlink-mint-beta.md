---
name: Starlink Mint (manual attestation, beta)
description: Manual screenshot-OCR mint flow at /starlink. 1 GB transferred = 1 $ZSOLAR. Cumulative reading model with delta vs last attestation. Storage bucket starlink-attestations (private). Edge function starlink-mint uses Lovable AI Gemini for OCR. First reading capped at 200 GB.
type: feature
---
Starlink has no public consumer API, so the seed implementation is a manual attestation:

- User uploads (or enters manually) the cumulative Download/Upload GB from the Starlink mobile app's Data Usage screen.
- `starlink-mint` edge function OCRs the screenshot with `google/gemini-2.5-flash` via the Lovable AI gateway, returns `{download_gb, upload_gb, confidence}` JSON.
- Backend computes `delta_gb = max(0, current_total - previous_total)`. First-ever reading is capped at 200 GB so we don't credit a brand-new user for their lifetime usage.
- Credit rule: **1 GB = 1 $ZSOLAR** (mirrors the kWh 1:1 UI framing). The full mint split / LP recycle still applies at the protocol level — UI only shows the 1:1 number, same as kWh.
- Persisted in `public.starlink_attestations` (RLS: user can read+insert own, admin can read all). Screenshot lives in private bucket `starlink-attestations/{user_id}/...`.
- Page lives at `/starlink` (protected). Sidebar entry: "Starlink Mint" with `Satellite` icon, right after Ecosystem.
- Does NOT currently insert into `mint_transactions` — that chain stays reserved for on-chain confirmed mints. When Starlink graduates from beta, plumb it through `mint-onchain` with `source='starlink'`.
- Ties to patent ZEN-002 (Starlink + Optimus tokenization via cryptographic attestation).
