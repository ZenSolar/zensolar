import { Link } from "react-router-dom";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter, CONTACT_EMAIL } from "@/components/public/PublicFooter";
import { ProofChain } from "@/components/public/ProofChain";
import { RequestAccessForm } from "@/components/public/RequestAccessForm";
import { SEO } from "@/components/SEO";

// Partner wordmarks (existing SVGs, muted to currentColor).
import teslaLogo from "@/assets/logos/tesla-wordmark.svg";
import enphaseLogo from "@/assets/logos/enphase-wordmark.svg";
import solaredgeLogo from "@/assets/logos/solaredge-wordmark.svg";
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

            <div className="w-full">
              <ProofChain />
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
              className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12 items-center"
              style={{ color: "#8B9198" }}
            >
              <img src={teslaLogo} alt="Tesla" className="h-5 sm:h-6 w-auto opacity-70" />
              <img src={enphaseLogo} alt="Enphase" className="h-5 sm:h-6 w-auto opacity-70" />
              <img src={wallboxLogo} alt="Wallbox" className="h-5 sm:h-6 w-auto opacity-70" />
              <img src={solaredgeLogo} alt="SolarEdge" className="h-5 sm:h-6 w-auto opacity-70" />
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
          <div className="mx-auto max-w-6xl px-5 sm:px-8 py-20 sm:py-28 space-y-10">
            <h2
              className="text-[24px] sm:text-[28px] font-medium tracking-tight"
              style={{ letterSpacing: "-0.015em" }}
            >
              Technology
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <TechCard
                name="Mint-on-Proof"
                body="Tokens exist only after verification. Nothing is pre-minted or issued speculatively."
              />
              <TechCard
                name="Proof-of-Delta"
                body="Every device tracks its own cumulative history, so the same activity can never be counted twice."
              />
              <TechCard
                name="Proof-of-Origin"
                body="Verification is bound to the physical device, not the account — auditable independent of who's using the app."
              />
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

function TechCard({ name, body }: { name: string; body: string }) {
  return (
    <div
      className="rounded-2xl border p-6 space-y-3"
      style={{ background: "#121417", borderColor: "#1B1E22" }}
    >
      <div className="text-[15px] font-semibold" style={{ color: "#E8EAED" }}>
        {name}
      </div>
      <p className="text-[14px] leading-relaxed" style={{ color: "#8B9198" }}>
        {body}
      </p>
    </div>
  );
}
