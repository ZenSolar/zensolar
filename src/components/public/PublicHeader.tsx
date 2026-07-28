import { Link } from "react-router-dom";

const ZEN_LOGO = "/logos/zen-logo-horizontal-mono.png";

export function PublicHeader() {
  return (
    <header
      className="w-full border-b"
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
        <nav className="flex items-center gap-6 text-[13px]">
          <Link
            to="/invite"
            className="transition-colors"
            style={{ color: "#8B9198" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#E8EAED")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#8B9198")}
          >
            I have an invite code
          </Link>
          <a
            href="https://beta.zensolar.com/onboarding/signin"
            className="transition-colors"
            style={{ color: "#8B9198" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#E8EAED")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#8B9198")}
          >
            Log in
          </a>
        </nav>
      </div>
    </header>
  );
}
