import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, CheckCircle2, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MicroProtocolBadge, MICRO_PROTOCOL_BADGE_TOTAL_MS } from '@/components/proof/MicroProtocolBadge';
import { ProtocolCinematicSequence } from '@/components/proof/ProtocolCinematicSequence';

/**
 * MintFlowMicroPreview
 *
 * Internal preview page comparing the three default-flow candidates
 * for the post-mint confirmation experience:
 *
 *   A) Current fast flow (control)            — quick, direct, no PoG
 *   B) Fast flow + static "Proof of Genesis ✓" seal (NOW LIVE)
 *   C) Fast flow + 2.8s MicroProtocolBadge (the "middle option")
 *   D) Full ProtocolCinematicSequence (first-mint-only experience)
 *
 * Use the Replay buttons to compare. Mobile-first viewport.
 */

type Variant = 'fast' | 'fastSeal' | 'micro' | 'cinematic';

const VARIANTS: { key: Variant; label: string; subtitle: string; recommended?: string }[] = [
  { key: 'fast', label: 'A — Current fast flow', subtitle: 'Control. No PoG branding.' },
  { key: 'fastSeal', label: 'B — Fast + static PoG seal', subtitle: 'Now live in default flow.', recommended: 'LIVE' },
  { key: 'micro', label: 'C — Fast + micro-cinematic (2.8s)', subtitle: 'Middle option. Embedded.' },
  { key: 'cinematic', label: 'D — Full cinematic (~10s)', subtitle: 'First-mint-only experience.' },
];

export default function MintFlowMicroPreview() {
  const [active, setActive] = useState<Variant | null>(null);
  const [microActive, setMicroActive] = useState(false);
  const [showCinematic, setShowCinematic] = useState(false);

  const playVariant = (v: Variant) => {
    setActive(v);
    setMicroActive(false);
    setShowCinematic(false);
    // restart relevant animation
    requestAnimationFrame(() => {
      if (v === 'micro' || v === 'fastSeal' || v === 'fast') {
        setMicroActive(v === 'micro');
      }
      if (v === 'cinematic') {
        setShowCinematic(true);
      }
    });
  };

  return (
    <div className="min-h-[100svh] bg-background text-foreground pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold truncate">Mint Flow — Default Flow Candidates</h1>
            <p className="text-[11px] text-muted-foreground truncate">
              Internal preview · compare options before deciding
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-6 space-y-6">
        {/* Replay rail */}
        <section className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Tap to replay any variant
          </p>
          <div className="grid grid-cols-1 gap-2">
            {VARIANTS.map((v) => (
              <Button
                key={v.key}
                variant={active === v.key ? 'default' : 'outline'}
                onClick={() => playVariant(v.key)}
                className="justify-between h-auto py-3 px-4"
              >
                <span className="flex flex-col items-start text-left">
                  <span className="text-sm font-semibold flex items-center gap-2">
                    {v.label}
                    {v.recommended && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/40">
                        {v.recommended}
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{v.subtitle}</span>
                </span>
                <RotateCcw className="h-3.5 w-3.5 opacity-60" />
              </Button>
            ))}
          </div>
        </section>

        {/* Stage — mock dashboard mint dialog */}
        <section className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Preview
          </p>
          <Card className="p-6 bg-card/50 border-border/60 min-h-[320px] flex flex-col items-center justify-center gap-5">
            {!active && (
              <div className="text-center text-sm text-muted-foreground">
                Pick a variant above to preview the post-mint experience.
              </div>
            )}

            {/* A — Current fast flow */}
            {active === 'fast' && (
              <>
                <SuccessSeal />
                <SuccessCopy />
              </>
            )}

            {/* B — Fast + static PoG seal */}
            {active === 'fastSeal' && (
              <>
                <SuccessSeal />
                <SuccessCopy />
                <StaticPoGSeal />
              </>
            )}

            {/* C — Fast + micro-cinematic */}
            {active === 'micro' && (
              <>
                <SuccessSeal />
                <SuccessCopy />
                <MicroProtocolBadge
                  active={microActive}
                  onComplete={() => {
                    /* keep showing post-completion */
                  }}
                />
                <p className="text-[10px] text-muted-foreground">
                  Total runtime ≈ {(MICRO_PROTOCOL_BADGE_TOTAL_MS / 1000).toFixed(1)}s
                </p>
              </>
            )}

            {/* D — Full cinematic launches in portal */}
            {active === 'cinematic' && (
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Full cinematic playing in overlay…
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCinematic(false);
                    requestAnimationFrame(() => setShowCinematic(true));
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Replay cinematic
                </Button>
              </div>
            )}
          </Card>
        </section>

        {/* Recommendation */}
        <section className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
          <h2 className="text-sm font-semibold text-primary flex items-center gap-1.5">
            <Zap className="h-4 w-4" /> Recommended path
          </h2>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
            <li>
              <span className="text-foreground">Default flow (every mint):</span> Variant B is now live —
              fast confirmation + static "Proof of Genesis ✓" seal.
            </li>
            <li>
              <span className="text-foreground">First-ever mint only:</span> Variant D auto-plays once,
              gated by a per-user flag.
            </li>
            <li>
              <span className="text-foreground">Anytime, on demand:</span> Variant D replayable from the
              Proof-of-Genesis receipt page.
            </li>
            <li>
              <span className="text-foreground">Variant C is the swap-in</span> if you want a touch more
              animation in the default flow without the full cinematic.
            </li>
          </ul>
        </section>
      </main>

      {/* Cinematic overlay */}
      <ProtocolCinematicSequence
        open={showCinematic}
        onComplete={() => setShowCinematic(false)}
        onClose={() => setShowCinematic(false)}
        finaleSubtitle="47.32 $ZSOLAR minted"
        finaleTokenCount={47}
        tapAtIso={new Date().toISOString()}
      />
    </div>
  );
}

/* ---------- Mock pieces of the existing fast-flow dialog ---------- */

function SuccessSeal() {
  return (
    <div className="relative">
      <div className="absolute inset-[-8px] rounded-full border-2 border-primary/30 animate-[ping_1.5s_ease-out_1]" />
      <div className="absolute inset-[-16px] rounded-full border border-primary/15 animate-[ping_2s_ease-out_1]" />
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 via-primary/15 to-primary/5 flex items-center justify-center ring-2 ring-primary/40 shadow-[0_0_30px_hsl(var(--primary)/0.3)]">
        <CheckCircle2 className="h-10 w-10 text-primary" />
      </div>
    </div>
  );
}

function SuccessCopy() {
  return (
    <div className="text-center space-y-1">
      <h3 className="text-base font-bold">Transaction Complete!</h3>
      <p className="text-xs text-muted-foreground">
        ✨ Your tokens have been minted successfully!
      </p>
    </div>
  );
}

function StaticPoGSeal() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay: 0.2 }}
      className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 shadow-[0_0_14px_hsl(var(--primary)/0.2)]"
    >
      <CheckCircle2 className="h-3.5 w-3.5 text-primary" aria-hidden />
      <span className="text-xs font-semibold text-primary tracking-wide">
        Proof of Genesis ✓
      </span>
    </motion.div>
  );
}
