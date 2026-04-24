import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Hand,
  Layers,
  Cpu,
  ShieldCheck,
  Anchor,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import {
  VerifyOnChainDrawer,
  type VerifyOnChainData,
  type VerifyFocusKey,
} from './VerifyOnChainDrawer';

/**
 * ProtocolJourney — visualizes the 5 trademarked primitives that produced
 * this $ZSOLAR mint, in the order they actually fired.
 *
 *   1. Tap-to-Mint™         (user intent)
 *   2. Proof-of-Delta™      (kWh change verified)
 *   3. Proof-of-Origin™     (device + clean source verified)
 *   4. Mint-on-Proof™       (token minted only because proofs cleared)
 *   5. Proof-of-Permanence™ (anchored to the Eternal Ledger)
 *
 * Each step is a button that opens the on-chain Verify drawer pre-focused
 * on that primitive — so the receipt is both a teaching artifact AND a
 * direct entry point to the underlying cryptographic proof.
 *
 * Accessibility:
 *  - <ol> with semantic <h3> per step
 *  - aria-label on each step button summarizes status + name
 *  - Cleared indicator uses primary token (WCAG-compliant) + icon, never color alone
 *  - Placeholder values are explicit "Pending verification" never empty
 */

export type ProtocolJourneyData = {
  tapAt: string;                 // ISO timestamp the tap fired
  totalKwh: number;
  primaryProvider: string;       // e.g. "Enphase Enlighten"
  primaryDeviceId: string;       // e.g. "enphase-envoy-7821"
  deltaProof: string;            // hex
  originDeviceHash: string;      // hex
  tokensMinted: number;
  mintTxHash: string;
  blockNumber: string;
  permanenceRoot: string;
  permanenceAnchoredAt: string;  // ISO
};

type Step = {
  mark: string;
  tagline: string;
  icon: typeof Hand;
  what: string;
  evidence: { label: string; value: string; mono?: boolean; pending?: boolean }[];
  focusKey: VerifyFocusKey;
  cleared: boolean;
};

// ---------- safe formatters (never crash on bad data) ----------
const isFiniteNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const PLACEHOLDER = 'Pending verification';

function fmtKwh(n: number | undefined | null) {
  if (!isFiniteNum(n)) return null;
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
function fmtTime(iso: string | undefined | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}
function shortHex(h: string | undefined | null, head = 8, tail = 6) {
  if (!h || typeof h !== 'string' || h.length === 0) return null;
  const norm = h.startsWith('0x') ? h : '0x' + h;
  if (norm.length <= head + tail + 3) return norm;
  return `${norm.slice(0, head)}…${norm.slice(-tail)}`;
}
function safe(value: string | null | undefined): { value: string; pending: boolean } {
  if (!value || value === '0x' || value === '0x0000') return { value: PLACEHOLDER, pending: true };
  return { value, pending: false };
}

export function ProtocolJourney({ data }: { data: ProtocolJourneyData }) {
  const [openKey, setOpenKey] = useState<VerifyFocusKey | null>(null);

  // ---- safe-derived display values ----
  const tapAt = fmtTime(data.tapAt);
  const totalKwh = fmtKwh(data.totalKwh);
  const deltaShort = shortHex(data.deltaProof);
  const originShort = shortHex(data.originDeviceHash);
  const mintShort = shortHex(data.mintTxHash);
  const permShort = shortHex(data.permanenceRoot);
  const permAt = fmtTime(data.permanenceAnchoredAt);
  const tokens = fmtKwh(data.tokensMinted);

  const tapEv = safe(tapAt);
  const kwhEv = safe(totalKwh ? `${totalKwh} kWh` : null);
  const deltaEv = safe(deltaShort);
  const originEv = safe(originShort);
  const providerEv = safe(data.primaryProvider);
  const deviceEv = safe(data.primaryDeviceId);
  const tokensEv = safe(tokens ? `${tokens} $ZSOLAR` : null);
  const mintEv = safe(mintShort);
  const blockEv = safe(data.blockNumber);
  const permEv = safe(permShort);
  const permAtEv = safe(permAt);

  const steps: Step[] = [
    {
      mark: 'Tap-to-Mint™',
      tagline: 'One tap. Real energy → on-chain currency.',
      icon: Hand,
      focusKey: 'tap-to-mint',
      cleared: !tapEv.pending,
      what:
        "You tapped. That single intent triggered the protocol to read your devices and attempt a mint.",
      evidence: [
        { label: 'Tap fired at', value: tapEv.value, pending: tapEv.pending },
        { label: 'Energy considered', value: kwhEv.value, pending: kwhEv.pending },
      ],
    },
    {
      mark: 'Proof-of-Delta™',
      tagline: 'The math that proves change actually happened.',
      icon: Layers,
      focusKey: 'proof-of-delta',
      cleared: !deltaEv.pending && !kwhEv.pending,
      what:
        "We verified the difference between the device's start and end readings — a real, signed change in physical state.",
      evidence: [
        {
          label: 'Verified delta',
          value: kwhEv.pending ? PLACEHOLDER : `+${kwhEv.value}`,
          pending: kwhEv.pending,
        },
        { label: 'Delta proof', value: deltaEv.value, mono: !deltaEv.pending, pending: deltaEv.pending },
      ],
    },
    {
      mark: 'Proof-of-Origin™',
      tagline: 'Verifies the source — clean, real, and yours.',
      icon: Cpu,
      focusKey: 'proof-of-origin',
      cleared: !originEv.pending && !deviceEv.pending,
      what:
        'We confirmed the energy came from your specific verified device, owned by you, from a clean source.',
      evidence: [
        { label: 'Source provider', value: providerEv.value, pending: providerEv.pending },
        { label: 'Device ID', value: deviceEv.value, mono: !deviceEv.pending, pending: deviceEv.pending },
        { label: 'Origin hash', value: originEv.value, mono: !originEv.pending, pending: originEv.pending },
      ],
    },
    {
      mark: 'Mint-on-Proof™',
      tagline: 'No proof, no mint. Period.',
      icon: ShieldCheck,
      focusKey: 'mint-on-proof',
      cleared: !mintEv.pending && !tokensEv.pending,
      what:
        'Both proofs cleared. Only then did the protocol mint $ZSOLAR. No proof, no token — by construction.',
      evidence: [
        { label: 'Tokens minted', value: tokensEv.value, pending: tokensEv.pending },
        { label: 'Mint tx', value: mintEv.value, mono: !mintEv.pending, pending: mintEv.pending },
        { label: 'Block', value: blockEv.value, pending: blockEv.pending },
      ],
    },
    {
      mark: 'Proof-of-Permanence™',
      tagline: 'The Eternal Ledger.',
      icon: Anchor,
      focusKey: 'proof-of-permanence',
      cleared: !permEv.pending && !permAtEv.pending,
      what:
        'The mint and its proofs were anchored — permanent, tamper-evident, and verifiable by anyone, forever.',
      evidence: [
        { label: 'Permanence root', value: permEv.value, mono: !permEv.pending, pending: permEv.pending },
        { label: 'Anchored at', value: permAtEv.value, pending: permAtEv.pending },
      ],
    },
  ];

  // Drawer data — tolerates missing fields with safe fallbacks
  const drawerData: VerifyOnChainData = {
    poaHashShort: shortHex(data.mintTxHash, 9, 0)?.replace('0x', '').slice(0, 7) ?? '———————',
    poaHashFull: data.mintTxHash?.replace(/^0x/, '').slice(0, 64) ?? '',
    deltaProof: data.deltaProof || '',
    originDeviceHash: data.originDeviceHash || '',
    mintTxHash: data.mintTxHash || '',
    blockNumber: data.blockNumber || '—',
    permanenceRoot: data.permanenceRoot || '',
    permanenceAnchoredAt: data.permanenceAnchoredAt || new Date().toISOString(),
    segiProvider: data.primaryProvider || 'Unknown',
    tapToMint: true,
    explorerUrl: data.mintTxHash ? `https://basescan.org/tx/${data.mintTxHash}` : undefined,
  };

  return (
    <section aria-labelledby="protocol-journey-heading" className="space-y-4">
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-primary/30 bg-primary/[0.06]">
          <Sparkle />
          <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-primary">
            Protocol Journey
          </span>
        </div>
        <h2
          id="protocol-journey-heading"
          className="text-lg sm:text-xl font-bold tracking-tight leading-tight"
        >
          The five primitives that produced this mint.
        </h2>
        <p className="text-[12.5px] sm:text-sm text-muted-foreground leading-snug max-w-2xl">
          Every $ZSOLAR mint flows through the same five trademarked steps — in this exact order. Tap any
          step to inspect its on-chain proof.
        </p>
      </div>

      <ol className="relative space-y-3" aria-label="Five-step protocol journey for this mint">
        {/* Connector line */}
        <span
          aria-hidden
          className="absolute left-[19px] top-3 bottom-3 w-px bg-gradient-to-b from-primary/40 via-primary/25 to-primary/40"
        />

        {steps.map((step, i) => {
          const Icon = step.icon;
          const status = step.cleared ? 'Cleared' : 'Pending';
          return (
            <motion.li
              key={step.mark}
              initial={{ opacity: 0, x: -6 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="relative pl-12"
            >
              {/* Step icon */}
              <div
                className="absolute left-0 top-0 h-10 w-10 rounded-xl bg-primary/12 border border-primary/30 flex items-center justify-center shadow-sm"
                aria-hidden
              >
                <Icon className="h-4.5 w-4.5 text-primary" />
              </div>

              <button
                type="button"
                onClick={() => setOpenKey(step.focusKey)}
                aria-label={`Step ${i + 1} of 5: ${step.mark} — ${status}. Open verification details.`}
                className="group w-full text-left rounded-lg border border-border/70 bg-card/60 backdrop-blur-sm p-3.5 sm:p-4 space-y-2.5 hover:border-primary/50 hover:bg-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[15px] sm:text-base font-semibold leading-tight">
                        {step.mark}
                      </h3>
                      <ClearedBadge cleared={step.cleared} />
                    </div>
                    <p className="text-[12px] sm:text-[12.5px] text-primary/90 italic leading-snug">
                      {step.tagline}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-bold">
                      Step {i + 1} / 5
                    </span>
                    <ChevronRight
                      className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors"
                      aria-hidden
                    />
                  </div>
                </div>

                <p className="text-[12.5px] sm:text-[13px] text-foreground/85 leading-relaxed">
                  {step.what}
                </p>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 pt-1.5 border-t border-border/40">
                  {step.evidence.map((ev) => (
                    <div
                      key={ev.label}
                      className="flex items-center justify-between gap-2 min-w-0"
                    >
                      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
                        {ev.label}
                      </dt>
                      <dd
                        className={`text-[11.5px] truncate ${
                          ev.pending
                            ? 'text-muted-foreground/70 italic'
                            : ev.mono
                              ? 'font-mono text-foreground/90'
                              : 'font-medium text-foreground/90'
                        }`}
                      >
                        {ev.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </button>
            </motion.li>
          );
        })}
      </ol>

      {/* Single drawer instance, controlled by whichever step was tapped */}
      <VerifyOnChainDrawer
        data={drawerData}
        focus={openKey ?? undefined}
        open={openKey !== null}
        onOpenChange={(o) => {
          if (!o) setOpenKey(null);
        }}
        trigger={<span className="hidden" aria-hidden />}
      />
    </section>
  );
}

// ---------- subcomponents ----------

function ClearedBadge({ cleared }: { cleared: boolean }) {
  if (cleared) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary"
        role="status"
      >
        <CheckCircle2 className="h-3 w-3" aria-hidden />
        Cleared
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
      role="status"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" aria-hidden />
      Pending
    </span>
  );
}

function Sparkle() {
  return (
    <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 text-primary" fill="currentColor" aria-hidden>
      <path d="M12 2l1.6 5.6L19 9l-5.4 1.4L12 16l-1.6-5.6L5 9l5.4-1.4L12 2z" />
    </svg>
  );
}
