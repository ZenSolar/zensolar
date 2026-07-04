import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Copy, Check, Share2, Sparkles, Lock, ShieldCheck, Hexagon } from "lucide-react";
import unlockedBadge from "@/assets/nft/hero/genesis-founder-unlocked.png";
import lockedBadge from "@/assets/nft/hero/genesis-founder-locked.png";

const SHARE_URL = "https://www.zensolar.com/nft/genesis-founder";
const OG_TITLE = "Genesis Founder · ZenSolar NFT No. 001";
const OG_DESC =
  "The founding badge of the ZenSolar collection — soulbound proof of being here at the beginning of clean-energy-backed on-chain rewards.";

export default function NftGenesisFounder() {
  const [unlocked, setUnlocked] = useState(true);
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  const share = async () => {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: OG_TITLE, text: OG_DESC, url: SHARE_URL });
        return;
      } catch {}
    }
    copyLink();
  };

  return (
    <>
      <Helmet>
        <title>{OG_TITLE}</title>
        <meta name="description" content={OG_DESC} />
        <link rel="canonical" href={SHARE_URL} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={OG_TITLE} />
        <meta property="og:description" content={OG_DESC} />
        <meta property="og:url" content={SHARE_URL} />
        <meta property="og:image" content={`https://www.zensolar.com${unlockedBadge}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={OG_TITLE} />
        <meta name="twitter:description" content={OG_DESC} />
        <meta name="twitter:image" content={`https://www.zensolar.com${unlockedBadge}`} />
      </Helmet>

      <main className="min-h-screen bg-background text-foreground relative overflow-hidden">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 h-[520px] w-[520px] rounded-full bg-token/10 blur-[160px]" />
          <div className="absolute bottom-[-10%] right-[-5%] h-[380px] w-[380px] rounded-full bg-primary/10 blur-[140px]" />
        </div>

        {/* Nav */}
        <div className="relative z-10 max-w-3xl mx-auto px-5 pt-6">
          <Link
            to="/nft-collection"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Collection
          </Link>
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-5 pt-6 pb-16">
          {/* Header eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 mb-4"
          >
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.28em] text-token/90">
              <Hexagon className="h-3 w-3" />
              ZenSolar Genesis · No. 001
            </span>
          </motion.div>

          {/* Badge stage */}
          <div className="relative mx-auto aspect-square max-w-[420px] w-full">
            {/* Radial stage backdrop */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: unlocked
                  ? "radial-gradient(circle at 50% 45%, hsl(var(--token) / 0.28), transparent 62%)"
                  : "radial-gradient(circle at 50% 45%, hsl(0 0% 100% / 0.04), transparent 62%)",
                transition: "background 500ms ease",
              }}
            />
            {/* Rotating conic ring — only when unlocked */}
            {unlocked && (
              <motion.div
                className="absolute inset-[6%] rounded-full opacity-60"
                style={{
                  background:
                    "conic-gradient(from 0deg, transparent, hsl(var(--token) / 0.5), transparent 40%, hsl(var(--primary) / 0.4), transparent 70%)",
                  filter: "blur(18px)",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
              />
            )}
            {/* Badge image */}
            <motion.img
              key={unlocked ? "u" : "l"}
              src={unlocked ? unlockedBadge : lockedBadge}
              alt={unlocked ? "Genesis Founder badge — unlocked" : "Genesis Founder badge — locked"}
              width={1024}
              height={1024}
              initial={{ opacity: 0, scale: 0.92, rotate: unlocked ? -6 : 0 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
              style={{
                filter: unlocked
                  ? "drop-shadow(0 0 40px hsl(var(--token) / 0.45))"
                  : "grayscale(0.2)",
              }}
            />
            {/* Locked overlay chip */}
            {!unlocked && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/60 backdrop-blur px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                <Lock className="h-3 w-3" />
                Locked
              </div>
            )}
          </div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-8 text-center text-4xl md:text-5xl font-bold tracking-tight"
          >
            Genesis{" "}
            <span className="bg-gradient-to-r from-token via-solar to-primary bg-clip-text text-transparent">
              Founder
            </span>
          </motion.h1>
          <p className="mt-3 text-center text-muted-foreground max-w-lg mx-auto">
            The founding badge of the ZenSolar collection. Awarded once, forever soulbound — proof
            you were here before the first kilowatt was minted.
          </p>

          {/* State toggle */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setUnlocked(true)}
              className={`px-4 py-2 rounded-full text-xs uppercase tracking-[0.2em] border transition-colors ${
                unlocked
                  ? "border-token/40 bg-token/10 text-token"
                  : "border-border/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              Unlocked
            </button>
            <button
              onClick={() => setUnlocked(false)}
              className={`px-4 py-2 rounded-full text-xs uppercase tracking-[0.2em] border transition-colors ${
                !unlocked
                  ? "border-white/20 bg-white/5 text-foreground"
                  : "border-border/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              Locked
            </button>
          </div>

          {/* Meta card */}
          <div className="mt-10 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 md:p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Token ID", value: "#001" },
                { label: "Standard", value: "ERC-1155" },
                { label: "Chain", value: "Base L2" },
                { label: "Supply", value: "Genesis · 1 of 1" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    {s.label}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-foreground">{s.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-5 border-t border-border/30 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 mt-0.5 text-token flex-shrink-0" />
                <span>Minted the first time a founding wallet connects to ZenSolar.</span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 mt-0.5 text-token flex-shrink-0" />
                <span>Soulbound — non-transferable proof of origin.</span>
              </div>
            </div>
          </div>

          {/* Share */}
          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <button
              onClick={share}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-token to-primary text-white font-semibold text-sm shadow-lg shadow-token/20 hover:opacity-95 transition-opacity"
            >
              <Share2 className="h-4 w-4" />
              Share badge
            </button>
            <button
              onClick={copyLink}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-border/50 text-sm text-foreground hover:bg-white/5 transition-colors"
            >
              {copied ? <Check className="h-4 w-4 text-token" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>

          <p className="mt-6 text-center text-[11px] text-muted-foreground/70">
            Part of the <span className="text-foreground/80">ZenSolar Genesis</span> collection —
            42 achievement NFTs backed by real clean energy.
          </p>
        </div>
      </main>
    </>
  );
}
