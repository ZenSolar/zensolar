# ZenSolar Beta Onboarding & Device Connection — Design + Implementation Brief (v2)

**v2 change note:** adds home battery and home charger (Tesla Wall Connector / Wallbox) handling on top of the original Tesla-vehicle + solar flow. The core shape — invite → passwordless sign-in → one simple branch point → connect → prove it worked → done — is unchanged. Battery and charger slot into that shape rather than adding new branches to the front door.

Scope: beta friends-and-family cohort expansion only. Goal is reliable device connection and clean telemetry, not public-launch polish. This brief does not touch tokenomics, minting, or Proof-of-Origin/Proof-of-Delta verification logic — it covers the path from invite link to a connected account producing usable data.

---

## 0. Technical grounding

**Tesla.** OAuth consent covers both the vehicle (`vehicle_device_data` scope) and Tesla Energy products (`energy_device_data` scope). Tesla added Powerwall, solar, and home charging (Wall Connector) to the Fleet API together as a single "energy site" — meaning one Tesla Energy authorization typically returns all of a home's Tesla-connected devices as one bundle, not three separate grants. Vehicle data additionally requires **virtual key pairing** in the Tesla mobile app (Locks screen) — this is the one step that leaves our UI, and it applies only to the vehicle, not to Powerwall or Wall Connector. Backend prerequisite: ZenSolar must host a public key at a fixed URL on our domain before the Tesla path works at all.

**Solar + battery (Enphase, SolarEdge).** Both platforms use standard OAuth against the homeowner's existing monitoring account (Enlighten or SolarEdge portal). When a battery is installed alongside solar — which is the common case — it's almost always part of the same monitored "system" or "site" the homeowner already has an account for. In practice this means the one OAuth grant used to connect solar also exposes the battery in that account's device list, with no separate consent step required.

**Wallbox (non-Tesla home charger).** Wallbox runs its own ecosystem (the myWallbox account/app) with no bundling relationship to Tesla, Enphase, or SolarEdge. It doesn't have the same cleanly documented public third-party OAuth as the others, so plan on a dedicated connect step and confirm current API/partnership terms with Wallbox before building — this is the one connection in the whole flow that can't ride on an account the user already connected for something else.

Sources: [Tesla Fleet API developer guide](https://developer.tesla.com/docs/fleet-api/virtual-keys/developer-guide), [Tesla Fleet API overview](https://developer.tesla.com/docs/fleet-api/getting-started/what-is-fleet-api), [Electrek: Tesla adds Powerwall, solar, and charger to its API](https://electrek.co/2024/01/04/tesla-adds-powerwall-solar-charger-api-devs/), [Enphase Enlighten API quickstart](https://developer-v4.enphase.com/docs/quickstart.html), [Wallbox integration reference (Home Assistant community)](https://community.home-assistant.io/t/wallbox-api-reference-used-in-ha-wallbox-integration/450859).

**Engineering prerequisites (do before building UI):**
- Tesla developer app registered, OAuth redirect URI configured, public key hosted at `https://<domain>/.well-known/appspecific/com.tesla.3p.public-key.pem`.
- Enphase and/or SolarEdge developer app credentials provisioned.
- Wallbox API access/partnership terms confirmed — this is not a drop-in OAuth like the others, so it needs its own technical validation before it's promised in the UI.
- A place to store connection status + last-received-telemetry timestamp **per device category, per user** (vehicle, solar, battery, charger independently) — the summary screen and the auto-discovery logic both depend on this.

---

## 1. Product reality this flow has to handle

Users show up with any combination of: Tesla vehicle, solar, battery, Wallbox, Tesla Wall Connector, mixed OEMs (e.g., Tesla vehicle + Enphase solar + Enphase battery, or solar + Wallbox with no Tesla vehicle at all). That looks like a lot of surface area, but it collapses to a simple fact: **there are only three accounts a user can ever connect** — Tesla, a solar OEM (Enphase or SolarEdge), and Wallbox. Vehicle, Powerwall, and Wall Connector all ride on the Tesla connection. Battery almost always rides on the solar OEM connection. Only Wallbox stands alone. So the front door only ever needs to ask "which of these three accounts applies to you," and everything else — battery in particular — gets figured out automatically once that account is connected.

---

## 2. How battery is handled

Battery is **not** its own question on the first screen. It's handled two ways, in this priority order:

1. **Auto-discovery (primary path).** The moment a Tesla Energy or solar-OEM connection succeeds, we read that account's device list. If a battery is present — Powerwall, Enphase battery, SolarEdge battery — it's marked Connected automatically and shown on that module's snapshot screen as its own line (e.g., "Solar: 4.2 kW · Battery: 78% charged"). No extra OAuth, no extra screen, no extra question. This covers the large majority of real installs, since batteries are almost always installed and monitored through the same account as the solar system.
2. **"Anything else at home?" follow-up (safety net).** After the user's selected connections are done, one short optional screen asks if anything wasn't picked up automatically — battery included. This catches the edge case where a battery is on a separate account from solar (e.g., a retrofit), or where the user didn't realize solar and battery would be bundled and want to double check. Selecting battery here just re-runs the same OEM picker/connect module already built for solar — it is not a new flow.

Net effect: most users never see a battery-specific screen at all. It just appears, connected, on their summary.

---

## 3. How Wallbox / home charger is handled

Charger splits cleanly by brand, because only one of the two can piggyback on an existing connection:

- **Tesla Wall Connector:** auto-discovered exactly like Powerwall, via the same Tesla Energy authorization used for the vehicle (or used on its own if the user has a Wall Connector but no vehicle — Tesla Energy OAuth doesn't require also connecting a car). No separate screen.
- **Wallbox (or other non-Tesla charger):** cannot be auto-discovered from any other connection, so it gets its own explicit step — a short brand picker (if the user indicated "home charger" on the first screen) followed by its own connect module (pre-consent brief → Wallbox auth → snapshot), same pattern as solar.

This is also why the first screen needs to ask about a charger at all, even though it doesn't need to ask about battery: charger is the one category where "auto-detect only" would silently miss the Wallbox users entirely.

---

## 4. Ideal simplified flow (revised)

1. **Invite link** → personalized landing page, expectations set up front (read-only, ~3–5 minutes, disconnect anytime).
2. **Passwordless sign-in** → email/phone + code, no password.
3. **"What's at your home?"** — one screen, checkboxes (multi-select, not single-choice, since combos are common): Tesla vehicle · Solar panels · Home battery · Home EV charger · Not sure / none yet. This is still the only branch point in the flow — it just now produces up to three connection modules instead of up to two.
4. **Run only the modules implied by the checkboxes**, each self-contained (pre-consent brief → provider OAuth → snapshot), in this order when more than one applies: Tesla → Solar OEM → Wallbox. Order doesn't functionally matter but keeping it consistent avoids surprising engineering or the user.
   - If "Tesla vehicle" and/or "Home battery" (Powerwall) and/or "Home EV charger = Tesla Wall Connector" were selected, they all resolve through **one** Tesla connection — we don't ask the user to connect Tesla three times.
   - If "Solar panels" and/or "Home battery" were selected and the user isn't on Tesla Energy, they resolve through **one** solar-OEM connection.
   - If "Home EV charger" was selected and it isn't a Tesla Wall Connector, it gets its own Wallbox connection.
5. **Battery auto-detection** happens silently inside steps 4a/4b as described in section 2 — never its own screen unless the "anything else" follow-up is used.
6. **Proof of connection** on every module's snapshot screen: one real data point per connected category, shown immediately.
7. **"Anything else at home?"** — one optional, skippable screen offering to connect anything not picked up (mainly battery-on-a-different-account and anything the user didn't check the first time).
8. **Summary/done screen** with four independent statuses: Vehicle, Solar, Battery, Charger.

Total screens for any one user: still bounded — a Tesla-vehicle-and-Wall-Connector-only user sees roughly the same screen count as before (the charger just shows up on the Tesla snapshot), while a "everything" user (vehicle + solar + battery + Wallbox) sees at most three connection modules, not four, because battery never gets its own.

---

## 5. Minimum screens / steps (updated)

| # | Screen | Shown to |
|---|--------|----------|
| 1 | Invite landing | everyone |
| 2 | Sign in (email/phone entry) | everyone |
| 3 | Verify code | everyone |
| 4 | "What's at your home?" (multi-select checkboxes) | everyone |
| 5 | Tesla: pre-consent brief | anyone who checked vehicle, battery(if Tesla), or charger(if Wall Connector) |
| 6 | Tesla: OAuth (external) | same |
| 7 | Tesla: virtual key pairing (vehicle only, skipped if only Powerwall/Wall Connector) | vehicle selected |
| 8 | Tesla: connected + snapshot (vehicle / Powerwall / Wall Connector, whichever apply) | same as 5 |
| 9 | Solar OEM: provider picker + pre-consent brief (Enphase / SolarEdge / "not sure") | anyone who checked solar or non-Tesla battery |
| 10 | Solar OEM: OAuth (external) | same |
| 11 | Solar OEM: connected + snapshot (solar, plus battery if auto-detected) | same |
| 12 | Charger: brand picker (Tesla Wall Connector / Wallbox / not sure) — only shown if charger checked and not resolved by Tesla | anyone who checked charger and it isn't a Wall Connector already covered by step 8 |
| 13 | Wallbox: pre-consent brief | non-Tesla charger |
| 14 | Wallbox: OAuth/connect (external) | non-Tesla charger |
| 15 | Wallbox: connected + snapshot | non-Tesla charger |
| 16 | "Anything else at home?" (optional, skippable) | everyone, once, after all selected modules run |
| 17 | Summary / done (4 independent statuses) | everyone |

Screens 5–8, 9–11, and 13–15 are each one reusable "connect a thing" module. Screen 12 is a two-second router, not a real detour, for the one case (charger) that needs to know which of two accounts to use.

---

## 6. Success criteria

**Vehicle connected**
- Virtual key paired and confirmed.
- At least one successful `vehicle_device_data` pull within 2 minutes of pairing, shown to the user.
- Recurring pull scheduled; last-received timestamp visible in backend within 15 minutes.

**Solar connected**
- OAuth/token exchange completed with the solar OEM (Enphase, SolarEdge, or Tesla Energy).
- At least one successful production-data pull shown immediately post-connect.
- Recurring pull scheduled; timestamp visible within 15 minutes.

**Battery connected**
- *Auto-discovered case (expected majority):* a battery device is present in the device list returned by the already-authorized Tesla Energy or solar-OEM connection; at least one successful state-of-charge pull within 2 minutes of the parent connection completing; shown as its own line on the snapshot, not merged into the solar number.
- *Manually connected case (via "anything else"):* equivalent OAuth completed on its own account, plus the same first-pull confirmation.
- Either way: battery status on the summary screen is never inferred from "solar is connected" — it needs its own confirmed data pull before it shows Connected.

**Wallbox / charger connected**
- *Tesla Wall Connector:* detected via the Tesla Energy site data returned from the Tesla connection; at least one successful pull of charger status (online / plugged-in / last session power) within 2 minutes.
- *Wallbox:* OAuth/token exchange completed with Wallbox directly; at least one successful status pull within 2 minutes.
- Recurring pull scheduled for either; timestamp visible within 15 minutes.

**Flow-level (all cohorts):** user reaches the summary screen in roughly 5 minutes of active time (excluding time spent inside the Tesla app pairing or hunting for account credentials), and an abandoned session resumes exactly where it left off via the same invite/magic link rather than restarting.

---

## 7. Likely drop-off points and how to prevent them

**First-screen overload.** Adding battery and charger to the product surface creates real pressure to turn screen 4 into a hardware questionnaire. Prevented by keeping it strictly checkboxes with no follow-up sub-questions on that same screen — "which brand," "how many panels," etc. all get deferred to the relevant connect module, not asked up front.

**Confusion about whether battery needs its own connection.** A user who checked "home battery" may expect a distinct consent screen for it and worry when they don't get one. Prevented by a short reassurance line on the solar/Tesla pre-consent screen when battery was checked: "If you have a battery, we'll find it automatically once you connect [Provider] — no extra step needed."

**Wallbox as an unexpected third login.** Someone who already connected Tesla and solar may feel "done" and be annoyed by a third OAuth prompt for a charger. Prevented by only ever prompting for Wallbox if the user explicitly checked "home charger" and it resolved to non-Tesla — never inferred or assumed — and by framing it in copy as quick and optional, with a clear skip path.

**Battery genuinely on a different account than solar (retrofit case).** Auto-discovery misses this by design. Prevented by the "anything else at home?" follow-up screen, which exists specifically to catch this without requiring a new flow — it just re-opens the same OEM picker.

**Existing risks, unchanged from v1:** account-creation friction (passwordless fixes it), OAuth screens looking like phishing (pre-consent brief fixes it), virtual key pairing being the highest-friction single step (dedicated screen + polling + troubleshooting fixes it), no proof of success (live data snapshot fixes it), and one failed connection blocking others (fully independent modules + independent summary statuses fixes it).

---

## 8. Screen copy

**4. What's at your home?** *(replaces v1's single-choice screen)*
> Headline: What's at your home?
> Body (subtext): Check everything that applies — we'll figure out the details.
> Options (checkboxes): Tesla vehicle · Solar panels · Home battery · Home EV charger · Not sure / none of these yet

**5. Tesla pre-consent brief** *(unchanged from v1, plus one line when battery was checked)*
> Headline: Next, you'll approve access on Tesla's site
> Body: We're about to send you to tesla.com to log in and approve ZenSolar. We never see your Tesla password, and you can revoke access anytime from your Tesla account.
> Conditional line (if battery checked): If you have a Powerwall, we'll find it automatically once you approve access — no extra step needed.
> Button: Continue to Tesla

**7. Virtual key pairing** *(vehicle only — unchanged from v1)*
> Headline: One more step — pair ZenSolar in the Tesla app
> Body: Open the Tesla app on your phone, go to your vehicle, tap Locks, and add ZenSolar as a key. We'll pick it up automatically — no need to come back and confirm.
> Button: Open Tesla app
> Status line (live): Waiting for pairing... / Still there? Here's what usually helps →

**8. Tesla connected + snapshot** *(now shows whichever of vehicle/Powerwall/Wall Connector apply)*
> Headline: You're connected
> Body (dynamic, one line per detected device): Vehicle — Battery 82% · Range 240 mi / Home battery — 78% charged / Wall Connector — Online

**9. Solar provider picker** *(unchanged, plus battery reassurance)*
> Headline: Which solar system do you have?
> Options: Enphase (Enlighten app) · SolarEdge · Tesla Solar / Powerwall · Not sure
> Body (subtext): If you also have a battery, it's usually part of this same account — we'll find it automatically.

**11. Solar connected + snapshot** *(now shows battery if detected)*
> Headline: You're connected
> Body (dynamic): Solar — 4.2 kW now, 18 kWh today. Battery detected — 78% charged.

**12. Charger brand picker** *(new — only reached if charger checked and not already resolved by Tesla)*
> Headline: Which charger do you have?
> Options: Tesla Wall Connector · Wallbox · Not sure
> Body (subtext for "Not sure"): Check the app you use to manage your charger — the name usually matches.

**13. Wallbox pre-consent brief** *(new, same pattern as solar)*
> Headline: Next, log in to Wallbox to approve access
> Body: We're sending you to Wallbox's own site. We never see your Wallbox password, and you can revoke access anytime from your Wallbox account.
> Button: Continue to Wallbox

**15. Wallbox connected + snapshot** *(new)*
> Headline: You're connected
> Body: Charger — Online, ready to charge.

**16. Anything else at home?** *(new)*
> Headline: Anything else we can connect?
> Body: If you have a battery or charger that wasn't picked up automatically, you can connect it here — or skip this and do it later.
> Options: Add a battery · Add a charger · Nothing else, I'm done

**17. Summary / done** *(replaces v1's single "All set" screen)*
> Headline: You're all set, [name]
> Body: Here's what's connected:
> — Vehicle: [Connected / Not connected]
> — Solar: [Connected / Not connected]
> — Battery: [Connected (auto-detected) / Connected / Not connected]
> — Charger: [Connected / Not connected]
> Subtext: Thanks for helping us test ZenSolar — we'll reach out as we roll out more. You can disconnect anything anytime from your account settings.
> Button: Done

**Error / denied consent (any provider — unchanged pattern from v1)**
> Headline: No worries — access wasn't approved
> Body: You can try again anytime, or skip this for now and connect it later.
> Buttons: Try again · Skip for now

---

## 9. Updated summary-screen states

The summary screen shows four rows, each with an independent status — never a combined pass/fail. Possible states per row:

| Row | Possible states |
|---|---|
| **Vehicle** | Connected · Pending (pairing in progress) · Not connected · Skipped |
| **Solar** | Connected · Not connected · Skipped |
| **Battery** | Connected — auto-detected · Connected — manually added · Not detected · Not connected · Skipped |
| **Charger** | Connected (Tesla Wall Connector) · Connected (Wallbox) · Not connected · Skipped |

"Not detected" (battery only) is distinct from "Not connected" — it means we checked the account and found no battery, which is an honest and expected state for solar-only households, not a failure to communicate as one. Every row that isn't Connected should carry a one-tap way to retry or add it, either inline or via the "anything else" screen.

---

## 10. Revised Lovable implementation section

This section supersedes the v1 implementation brief — build to this version.

### Screens to add
- Invite landing (personalized by invite token)
- Passwordless sign-in (email/phone entry)
- Verify code
- "What's at your home?" multi-select checkbox screen
- Tesla pre-consent brief (with conditional battery line)
- Tesla virtual-key pairing screen with polling status + troubleshooting panel (vehicle only)
- Tesla connected/snapshot screen (dynamic: vehicle / battery / charger rows, whichever were granted)
- Solar provider picker + pre-consent brief (with battery reassurance line)
- Solar connected/snapshot screen (dynamic: solar + battery if detected)
- Charger brand picker (Tesla Wall Connector / Wallbox / not sure)
- Wallbox pre-consent brief
- Wallbox connected/snapshot screen
- "Anything else at home?" follow-up screen
- Summary screen with four independent status rows
- Shared error/denied-consent screen (reused across all three connect modules)

### Screens to change
- v1's single-choice "What do you have" screen → replace with the multi-select checkbox version in section 5 above.
- v1's single "All set" screen → replace with the four-row summary in section 9.
- Whatever existing sign-up/login screen exists today → replace with passwordless email/phone + code, no password field, for beta users.
- Existing device-connection screen(s), if any → consolidate into the three connect modules (Tesla, Solar OEM, Wallbox) rather than a generic settings page per brand.

### Order of operations
1. Invite link → Invite landing.
2. → Sign in → Verify code (creates/loads account, tagged with invite source).
3. → "What's at your home?" (multi-select).
4. Compute which connect modules are needed from the checkboxes:
   - **Tesla module** runs if vehicle, or battery-with-no-solar-OEM-selected-yet (ambiguous, default to letting Tesla Energy claim it first), or charger-and-brand-later-resolves-to-Wall-Connector.
   - **Solar OEM module** runs if solar was checked, or battery was checked and the user isn't on Tesla Energy.
   - **Charger routing** (screen 12) runs only if charger was checked and hasn't already been satisfied by a Tesla Wall Connector detected in the Tesla module; if it resolves to Wallbox, run the **Wallbox module**.
5. Run whichever modules apply, each independently resumable: pre-consent brief → external OAuth → return → (vehicle only: virtual key pairing) → connected/snapshot, with auto-detection of bundled battery inside the Tesla and Solar OEM modules.
6. → "Anything else at home?" — always shown once, after all applicable modules have run or been skipped, offering to add battery/charger manually if not already Connected.
7. → Summary screen, always reachable regardless of how many connections succeeded, showing the four independent status rows.

State persists per user at each step and per category (vehicle/solar/battery/charger independently), so the invite/magic link always resumes at the correct next step rather than restarting the whole sequence.

### Success / error states
- **Sign-in:** success advances automatically on valid code; error shows inline "That code didn't match — try again," resend option, max 3 attempts before suggesting a fresh code.
- **OAuth consent (Tesla, solar OEM, or Wallbox):** success returns to that module's connected/snapshot screen; explicit denial or cancellation returns to the shared error screen with Try again / Skip for now; no return within ~60s times out to the same error screen.
- **Virtual key pairing (vehicle only):** success detected via backend polling, auto-advances; no response after ~90s surfaces troubleshooting inline; always leave a skip path so a stuck vehicle pairing never blocks battery/solar/charger from finishing.
- **Battery auto-detection:** if the parent connection (Tesla or solar OEM) succeeds but no battery device is found in the account's device list, show "No battery detected on this account" as an honest, non-error state — do not present it as a failure, and surface it as "Not detected" (not "Not connected") on the summary.
- **Charger routing:** if the user checked "home charger" and the Tesla module already detected a Wall Connector, skip the brand picker and Wallbox flow entirely — don't ask a question we already know the answer to.
- **Data snapshot pull (any module):** if the first pull fails or is empty despite a successful connection, show "Connected — first data may take a few minutes" rather than blocking or implying failure.
- **"Anything else at home?":** fully optional; "Nothing else, I'm done" advances immediately with no confirmation dialog; selecting Add a battery/charger re-enters the relevant existing module rather than a new flow.
- **Summary screen:** always reachable regardless of completion state; four independent rows, never a single combined pass/fail; every non-Connected row offers a one-tap retry/add action.

### What not to change
- Tokenomics, wallet, minting, or any subscription/tier UI — out of scope for this brief entirely.
- Proof-of-Origin / Proof-of-Delta verification logic and the mint-to-chain path — this brief only affects how a device or account gets connected, not what happens to data afterward.
- Any existing OAuth app registrations, scopes, or redirect URIs already configured with Tesla/Enphase/SolarEdge — reuse them; don't re-register.
- Any non-beta (public) onboarding flow, if one exists separately — this brief is scoped to the friends-and-family beta cohort only.
- Do not build brand-specific UI beyond Tesla, Enphase, SolarEdge, and Wallbox for this beta round — "Not sure" options exist precisely so unsupported brands don't need their own path yet; log them for future prioritization instead of building for them now.
