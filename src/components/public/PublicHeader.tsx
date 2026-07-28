import { Link } from "react-router-dom";

export function PublicHeader() {
  return (
    <header
      className="w-full border-b"
      style={{ borderColor: "#1B1E22", background: "#0A0C0E" }}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="text-[15px] font-medium tracking-tight"
          style={{ color: "#E8EAED", letterSpacing: "-0.01em" }}
        >
          ZenSolar
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
          <Link
            to="/auth"
            className="transition-colors"
            style={{ color: "#8B9198" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#E8EAED")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#8B9198")}
          >
            Log in
          </Link>
        </nav>
      </div>
    </header>
  );
}
