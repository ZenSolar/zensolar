import { motion } from 'framer-motion';
import {
  Hand,
  Layers,
  Cpu,
  ShieldCheck,
  Anchor,
  CheckCircle2,
} from 'lucide-react';

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
 * Each step shows the actual receipt data that satisfied it — so the
 * receipt is also a teaching artifact for the protocol itself.
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
  evidence: { label: string; value: string; mono?: boolean }[];
};

function fmtKwh(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}
function shortHex(h: string, head = 8, tail = 6) {
  if (!h.startsWith('0x')) h = '0x' + h.replace(/^0x/, '');
  if (h.length <= head + tail + 3) return h;
  return `${h.slice(0, head)}…${h.slice(-tail)}`;
}

export function ProtocolJourney({ data }: { data: ProtocolJourneyData }) {
  const steps: Step[] = [
    {
      mark: 'Tap-to-Mint™',
      tagline: 'One tap. Real energy → on-chain currency.',
      icon: Hand,
      what:
        "You tapped. That single intent triggered the protocol to read your devices and attempt a mint.",
      evidence: [
        { label: 'Tap fired at', value: fmtTime(data.tapAt) },
        { label: 'Energy considered', value: `${fmtKwh(data.totalKwh)} kWh` },
      ],
    },
    {
      mark: 'Proof-of-Delta™',
      tagline: 'The math that proves change actually happened.',
      icon: Layers,
      what:
        "We verified the difference between the device's start and end readings — a real, signed change in physical state.",
      evidence: [
        { label: 'Verified delta', value: `+${fmtKwh(data.totalKwh)} kWh` },
        { label: 'Delta proof', value: shortHex(data.deltaProof), mono: true },
      ],
    },
    {
      mark: 'Proof-of-Origin™',
      tagline: 'Verifies the source — clean, real, and yours.',
      icon: Cpu,
      what:
        'We confirmed the energy came from your specific verified device, owned by you, from a clean source.',
      evidence: [
        { label: 'Source provider', value: data.primaryProvider },
        { label: 'Device ID', value: data.primaryDeviceId, mono: true },
        { label: 'Origin hash', value: shortHex(data.originDeviceHash), mono: true },
      ],
    },
    {
      mark: 'Mint-on-Proof™',
      tagline: 'No proof, no mint. Period.',
      icon: ShieldCheck,
      what:
        'Both proofs cleared. Only then did the protocol mint $ZSOLAR. No proof, no token — by construction.',
      evidence: [
        { label: 'Tokens minted', value: `${fmtKwh(data.tokensMinted)} $ZSOLAR` },
        { label: 'Mint tx', value: shortHex(data.mintTxHash), mono: true },
        { label: 'Block', value: data.blockNumber },
      ],
    },
    {
      mark: 'Proof-of-Permanence™',
      tagline: 'The Eternal Ledger.',
      icon: Anchor,
      what:
        'The mint and its proofs were anchored — permanent, tamper-evident, and verifiable by anyone, forever.',
      evidence: [
        { label: 'Permanence root', value: shortHex(data.permanenceRoot), mono: true },
        { label: 'Anchored at', value: fmtTime(data.permanenceAnchoredAt) },
      ],
    },
  ];

  return (
    <section className="space-y-4">
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-primary/30 bg-primary/[0.06]">
          <Sparkle />
          <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-primary">
            Protocol Journey
          </span>
        </div>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight leading-tight">
          The five primitives that produced this mint.
        </h2>
        <p className="text-[12.5px] sm:text-sm text-muted-foreground leading-snug max-w-2xl">
          Every $ZSOLAR mint flows through the same five trademarked steps — in this exact order. This
          is the receipt of that journey.
        </p>
      </div>

      <ol className="relative space-y-3">
        {/* Connector line */}
        <span
          aria-hidden
          className="absolute left-[19px] top-3 bottom-3 w-px bg-gradient-to-b from-primary/40 via-primary/25 to-primary/40"
        />

        {steps.map((step, i) => {
          const Icon = step.icon;
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
              <div className="absolute left-0 top-0 h-10 w-10 rounded-xl bg-primary/12 border border-primary/30 flex items-center justify-center shadow-sm">
                <Icon className="h-4.5 w-4.5 text-primary" />
              </div>

              <div className="rounded-lg border border-border/70 bg-card/60 backdrop-blur-sm p-3.5 sm:p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[15px] sm:text-base font-semibold leading-tight">
                        {step.mark}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-primary/90 font-bold">
                        <CheckCircle2 className="h-3 w-3" /> Cleared
                      </span>
                    </div>
                    <p className="text-[12px] sm:text-[12.5px] text-primary/85 italic leading-snug">
                      {step.tagline}
                    </p>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70 font-bold shrink-0">
                    Step {i + 1} / 5
                  </span>
                </div>

                <p className="text-[12.5px] sm:text-[13px] text-foreground/85 leading-relaxed">
                  {step.what}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 pt-1.5 border-t border-border/40">
                  {step.evidence.map((ev) => (
                    <div key={ev.label} className="flex items-center justify-between gap-2 min-w-0">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
                        {ev.label}
                      </span>
                      <span
                        className={`text-[11.5px] truncate text-foreground/90 ${
                          ev.mono ? 'font-mono' : 'font-medium'
                        }`}
                      >
                        {ev.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </section>
  );
}

function Sparkle() {
  return (
    <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 text-primary" fill="currentColor" aria-hidden>
      <path d="M12 2l1.6 5.6L19 9l-5.4 1.4L12 16l-1.6-5.6L5 9l5.4-1.4L12 2z" />
    </svg>
  );
}
