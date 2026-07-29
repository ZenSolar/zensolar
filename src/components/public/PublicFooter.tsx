import { Link } from "react-router-dom";

export const CONTACT_EMAIL = "joe@zensolar.com";

export function PublicFooter() {
  return (
    <footer
      className="w-full border-t"
      style={{ borderColor: "#1B1E22", background: "#0A0C0E" }}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-6 sm:py-8 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex flex-wrap items-center justify-between gap-3 text-[13px]">
        <span style={{ color: "#8B9198" }}>© {new Date().getFullYear()} ZenSolar</span>
        <div className="flex items-center gap-6">
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#8B9198" }}>
            Contact
          </a>
          <Link to="/privacy" style={{ color: "#8B9198" }}>
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
