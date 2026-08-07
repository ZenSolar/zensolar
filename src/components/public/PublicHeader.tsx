import { Link } from "react-router-dom";

const ZEN_LOGO = "/logos/zen-logo-horizontal-new.png";

/**
 * Public marketing header.
 *
 * Both nav items are plain react-router <Link>s with no inline JS handlers —
 * hover styling is pure CSS so nothing can swallow the click. The header is
 * explicitly stacked above the ambient background layers (`qc-hexagons` sits
 * at z-index 1) so the links are always the topmost hit target.
 */
export function PublicHeader() {
  return (
    <header
      className="relative z-50 w-full border-b"
      style={{ borderColor: "#1B1E22", background: "#0A0C0E" }}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link to="/" aria-label="ZenSolar — home" className="flex items-center">
          <img
            src={ZEN_LOGO}
            alt="ZenSolar"
            className="h-7 sm:h-8 w-auto"
            style={{ display: "block" }}
          />
        </Link>
        <nav className="relative z-50 flex items-center gap-6 text-[13px]">
          <Link
            to="/invite"
            className="text-[#8B9198] hover:text-[#E8EAED] transition-colors underline-offset-4 hover:underline"
          >
            I have an invite code
          </Link>
          <a
            href="https://beta.zensolar.com/onboarding/signin?tab=login"
            className="text-[#8B9198] hover:text-[#E8EAED] transition-colors"
          >
            Log in
          </a>
        </nav>
      </div>
    </header>
  );
}
