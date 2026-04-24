import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Strips trailing junk characters (punctuation, brackets, whitespace) that
 * commonly get appended when URLs are pasted from chat / email / SMS — the
 * #1 cause of phantom 404s on otherwise-valid routes.
 *
 * Also collapses accidental double slashes ("//foo" → "/foo").
 */
const TRAILING_JUNK = /[\s.,;:!?)\\]\}>'"`»]+$/;

export function PathNormalizer() {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let next = pathname;

    // Handle specific legacy path redirect
    if (next === "/proof-of-genesis-receipt-preview") {
      navigate("/proof-of-genesis-receipt" + search + hash, { replace: true });
      return;
    }

    // Collapse repeated slashes (but keep root "/")
    if (next.length > 1) next = next.replace(/\/{2,}/g, "/");

    // Trim trailing punctuation/whitespace
    const trimmed = next.replace(TRAILING_JUNK, "");
    if (trimmed.length > 0) next = trimmed;

    // Trim trailing slash (except root)
    if (next.length > 1 && next.endsWith("/")) next = next.slice(0, -1);

    if (next !== pathname) {
      navigate(next + search + hash, { replace: true });
    }
  }, [pathname, search, hash, navigate]);

  return null;
}
