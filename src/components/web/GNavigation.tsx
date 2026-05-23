import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { prefetchRoute } from "@/lib/routePrefetch";

/**
 * Pass B · #6 — Gmail-style "g"-prefix navigation.
 *
 * Press "g" then a second key within 1.2 seconds to jump:
 *   g d → /          (Dashboard)
 *   g w → /wallet
 *   g p → /profile
 *   g s → /settings
 *   g e → /energy-log
 *   g m → /mint-history
 *   g n → /nft-collection
 *   g r → /referrals
 *   g l → /learn
 *
 * Shows a transient toast indicator while waiting for the second key so
 * users know the sequence was caught. Disabled while typing in inputs.
 */

const ROUTES: Record<string, { path: string; label: string }> = {
  d: { path: "/",                label: "Dashboard" },
  w: { path: "/wallet",          label: "Wallet" },
  p: { path: "/profile",         label: "Profile" },
  s: { path: "/settings",        label: "Settings" },
  e: { path: "/energy-log",      label: "Energy log" },
  m: { path: "/mint-history",    label: "Mint history" },
  n: { path: "/nft-collection",  label: "NFT collection" },
  r: { path: "/referrals",       label: "Referrals" },
  l: { path: "/learn",           label: "Learn" },
};

const SEQUENCE_TIMEOUT_MS = 1200;
const TOAST_ID = "g-nav-prefix";

export function GNavigation() {
  const navigate = useNavigate();
  const waiting = useRef<number | null>(null);

  useEffect(() => {
    const isEditable = (el: Element | null) => {
      if (!el) return false;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      return (el as HTMLElement).isContentEditable;
    };

    const clearWaiting = () => {
      if (waiting.current !== null) {
        window.clearTimeout(waiting.current);
        waiting.current = null;
      }
      toast.dismiss(TOAST_ID);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditable(document.activeElement)) return;

      // Waiting for the second key.
      if (waiting.current !== null) {
        const route = ROUTES[e.key.toLowerCase()];
        clearWaiting();
        if (route) {
          e.preventDefault();
          navigate(route.path);
          toast.success(`→ ${route.label}`, { duration: 1200 });
        }
        return;
      }

      // First key — start the sequence on "g".
      if (e.key === "g" || e.key === "G") {
        e.preventDefault();
        toast("g …", {
          id: TOAST_ID,
          duration: SEQUENCE_TIMEOUT_MS,
          description: "Press a key: d w p s e m n r l",
        });
        waiting.current = window.setTimeout(() => {
          waiting.current = null;
          toast.dismiss(TOAST_ID);
        }, SEQUENCE_TIMEOUT_MS);
        // Warm up likely chunks while user picks the second key.
        Object.values(ROUTES).forEach((r) => prefetchRoute(r.path));
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearWaiting();
    };
  }, [navigate]);

  return null;
}
