import { Link } from "react-router-dom";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter, CONTACT_EMAIL } from "@/components/public/PublicFooter";
import { ProofChain } from "@/components/public/ProofChain";
import { RequestAccessForm } from "@/components/public/RequestAccessForm";
import { SEO } from "@/components/SEO";

// Partner wordmarks. Per-logo tuning — NOT a shared filter/height recipe.
// Tesla: use clean text-only wordmark (the old tesla-wordmark.svg contained
// both a glyph path AND a <text> element drawing "TESLA" — literal doubled render).
import teslaLogo from "@/assets/logos/tesla-wordmark-clean.svg";
import enphaseLogo from "@/assets/logos/enphase-wordmark.svg";
import solaredgeLogo from "@/assets/logos/solaredge-cropped.svg";
import wallboxLogo from "@/assets/logos/wallbox-logo.svg";

export default function PublicHome() {
  return (
    <>
      <SEO
        title="ZenSolar — Clean energy, cryptographically verified."
        description="ZenSolar turns verified solar, battery, and EV activity into on-chain proof — and rewards the households and hardware that generate it."
        url="https://zensolar.com/"
      />
      <div style={{ background: "#0A0C0E", color: "#E8EAED" }} className="min-h-screen">
        <PublicHeader />

        {/* HERO */}
        <section className="mx-auto max-w-6xl px-5 sm:px-8 pt-16 sm:pt-24 pb-16 sm:pb-24">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center">
            <div className="space-y-8 max-w-2xl">
              <h1
                className="text-[34px] sm:text-[46px] lg:text-[54px] leading-[1.05] font-medium tracking-tight"
                style={{ color: "#E8EAED", letterSpacing: "-0.02em" }}
              >
                Clean energy, cryptographically verified.
              </h1>
              <p
                className="text-[16px] sm:text-[17px] leading-relaxed max-w-xl"
                style={{ color: "#8B9198" }}
              >
                ZenSolar turns verified solar, battery, and EV activity into on-chain
                proof — and rewards the households and hardware that generate it.
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <a
                  href="#request-access"
                  className="rounded-full px-8 py-3 text-[14px] font-medium transition-all"
                  style={{
                    color: "#0A0C0E",
                    background: "linear-gradient(90deg, #00E19B 0%, #00C2FF 100%)",
                    boxShadow: "0 0 24px -4px rgba(0, 194, 255, 0.35)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 0 40px -4px rgba(0, 194, 255, 0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 0 24px -4px rgba(0, 194, 255, 0.35)";
                  }}
                >
                  Request Access
                </a>
                <Link
                  to="/invite"
                  className="text-[14px] underline-offset-4 hover:underline"
                  style={{ color: "#8B9198" }}
                >
                  I have an invite code
                </Link>
              </div>
            </div>

            <div className="w-full space-y-3">
              <ProofChain />
              <p
                className="text-[11px] uppercase tracking-[0.14em] text-center sm:text-left"
                style={{ color: "#8B9198", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
              >
                Proof-of-Genesis — verified in real time
              </p>
            </div>
          </div>
        </section>

        {/* CREDIBILITY STRIP */}
        <section
          className="border-y"
          style={{ borderColor: "#1B1E22", background: "#0A0C0E" }}
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-8 py-10 space-y-6">
            <p
              className="text-[12px] uppercase tracking-wider"
              style={{ color: "#8B9198" }}
            >
              Connects to the hardware you already own.
            </p>
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12 items-center justify-items-center"
              style={{ color: "#8B9198" }}
            >
              {/* Per-logo tuning — each asset has its own source conventions.
                  Do NOT collapse this back into a shared filter/height recipe. */}
              <img
                src={teslaLogo}
                alt="Tesla"
                className="h-4 sm:h-5 w-auto"
                style={{ color: "#E8EAED", opacity: 0.6 }}
              />
              <img
                src={enphaseLogo}
                alt="Enphase"
                className="h-4 sm:h-5 w-auto"
                style={{ filter: "brightness(0) invert(1)", opacity: 0.55 }}
              />
              <img
                src={wallboxLogo}
                alt="Wallbox"
                className="h-10 sm:h-12 w-auto"
                style={{ filter: "brightness(0) invert(1)", opacity: 0.6 }}
              />
              <img
                src={solaredgeLogo}
                alt="SolarEdge"
                className="h-7 sm:h-8 w-auto"
                style={{ filter: "brightness(0) invert(1)", opacity: 0.55 }}
              />
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mx-auto max-w-4xl px-5 sm:px-8 py-20 sm:py-28">
          <h2 className="text-[24px] sm:text-[28px] font-medium tracking-tight mb-10" style={{ letterSpacing: "-0.015em" }}>
            How it works
          </h2>
          <ol className="divide-y" style={{ borderColor: "#1B1E22" }}>
            {[
              "Connect your hardware",
              "We verify what it actually produces",
              "Verified activity becomes $ZSOLAR, provably",
            ].map((step, i) => (
              <li
                key={step}
                className="grid grid-cols-[auto_1fr] gap-6 py-6 items-baseline"
                style={{ borderColor: "#1B1E22" }}
              >
                <span
                  className="text-[12px] tabular-nums"
                  style={{ color: "#8B9198", fontFamily: "ui-monospace, monospace" }}
                >
                  0{i + 1}
                </span>
                <p className="text-[17px]" style={{ color: "#E8EAED" }}>{step}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* TECHNOLOGY */}
        <section
          className="border-y"
          style={{ borderColor: "#1B1E22", background: "#0A0C0E" }}
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-8 py-20 sm:py-28 space-y-12">
            <h2
              className="text-[24px] sm:text-[28px] font-medium tracking-tight"
              style={{ letterSpacing: "-0.015em" }}
            >
              Technology
            </h2>

            {/* Static hairline connector on desktop implies "one pipeline"
                without spending motion budget. Chain metaphor, not animation. */}
            <div className="relative">
              <div
                aria-hidden
                className="hidden md:block absolute left-0 right-0 top-[46px] h-px"
                style={{ background: "#1B1E22" }}
              />
              <div className="grid gap-4 md:grid-cols-3 relative">
                <TechCard
                  index="01"
                  name="Mint-on-Proof"
                  body="Tokens exist only after verification. Nothing is pre-minted or issued speculatively."
                  glyph={<MintOnProofGlyph />}
                />
                <TechCard
                  index="02"
                  name="Proof-of-Delta"
                  body="Every device tracks its own cumulative history, so the same activity can never be counted twice."
                  glyph={<ProofOfDeltaGlyph />}
                />
                <TechCard
                  index="03"
                  name="Proof-of-Origin"
                  body="Verification is bound to the physical device, not the account — auditable independent of who's using the app."
                  glyph={<ProofOfOriginGlyph />}
                />
              </div>
            </div>

            <p className="text-[13px] max-w-2xl" style={{ color: "#8B9198" }}>
              Patent-pending. Currently verifying end-to-end on Sepolia ahead of mainnet deployment.
            </p>
          </div>
        </section>

        {/* TRUST */}
        <section className="mx-auto max-w-4xl px-5 sm:px-8 py-20 sm:py-28">
          <h2
            className="text-[24px] sm:text-[28px] font-medium tracking-tight mb-8"
            style={{ letterSpacing: "-0.015em" }}
          >
            Trust
          </h2>
          <p className="text-[17px] mb-4" style={{ color: "#E8EAED" }}>
            Joseph Maushart, co-founder.
          </p>
          <div className="flex flex-wrap gap-6 text-[14px]" style={{ color: "#8B9198" }}>
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-[#E8EAED]">
              {CONTACT_EMAIL}
            </a>
            <Link to="/privacy" className="hover:text-[#E8EAED]">
              Privacy
            </Link>
          </div>
        </section>

        {/* REQUEST ACCESS */}
        <section
          id="request-access"
          className="border-t"
          style={{ borderColor: "#1B1E22", background: "#0A0C0E" }}
        >
          <div className="mx-auto max-w-2xl px-5 sm:px-8 py-20 sm:py-28 space-y-8">
            <div className="space-y-3">
              <h2
                className="text-[24px] sm:text-[28px] font-medium tracking-tight"
                style={{ letterSpacing: "-0.015em" }}
              >
                Request access
              </h2>
              <p className="text-[15px]" style={{ color: "#8B9198" }}>
                Tell us who you are. We review each request personally.
              </p>
            </div>
            <RequestAccessForm />
          </div>
        </section>

        <PublicFooter />
      </div>
    </>
  );
}

function TechCard({
  index,
  name,
  body,
  glyph,
}: {
  index: string;
  name: string;
  body: string;
  glyph: React.ReactNode;
}) {
  return (
    <div
      className="relative rounded-2xl border p-6 space-y-4"
      style={{ background: "#121417", borderColor: "#1B1E22" }}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex items-center justify-center rounded-lg border"
          style={{
            width: 44,
            height: 44,
            background: "#0A0C0E",
            borderColor: "#1B1E22",
            color: "#E8EAED",
          }}
        >
          {glyph}
        </div>
        <span
          className="text-[11px] tabular-nums tracking-[0.14em]"
          style={{
            color: "#8B9198",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          }}
        >
          {index}
        </span>
      </div>
      <div
        className="text-[14px] tracking-[0.02em]"
        style={{
          color: "#E8EAED",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        }}
      >
        {name}
      </div>
      <p className="text-[14px] leading-relaxed" style={{ color: "#8B9198" }}>
        {body}
      </p>
    </div>
  );
}

/* Monoline glyphs — 24px grid, 2px stroke, rounded caps.
   Restrained geometric hints at each mechanism. No decoration, no color. */

function MintOnProofGlyph() {
  // Verification checkmark inside a bounded frame — token minted only after proof.
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </svg>
  );
}

function ProofOfDeltaGlyph() {
  // Two nodes linked by a delta (triangle) — cumulative history, no double-count.
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="5" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
      <path d="M7 12h3" />
      <path d="M14 12h3" />
      <path d="M12 8.5l2.2 3.5-2.2 3.5-2.2-3.5z" />
    </svg>
  );
}

function ProofOfOriginGlyph() {
  // Fingerprint-style device signature — verification bound to hardware.
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="6" y="3" width="12" height="18" rx="2" />
      <path d="M9 8.5c1-1 4-1 5 0" />
      <path d="M9 12c1-1.2 4-1.2 5 0" />
      <path d="M10 15.5c.8-.6 2.2-.6 3 0" />
    </svg>
  );
}
