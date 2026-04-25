import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Scroll restoration:
 * - On forward navigation (PUSH): scroll to top.
 * - On back/forward (POP): restore the previous scroll position.
 *
 * Positions are kept in sessionStorage keyed by path+search so they survive
 * reloads inside the same tab. We avoid disturbing in-page anchor jumps
 * (when the URL has a hash) and respect prefers-reduced-motion.
 */
const SCROLL_KEY = "zen.scrollPositions.v1";
const MAX_ENTRIES = 50;

type ScrollMap = Record<string, number>;

function readMap(): ScrollMap {
  try {
    const raw = sessionStorage.getItem(SCROLL_KEY);
    return raw ? (JSON.parse(raw) as ScrollMap) : {};
  } catch {
    return {};
  }
}

function writeMap(map: ScrollMap) {
  try {
    const entries = Object.entries(map);
    const trimmed = entries.length > MAX_ENTRIES
      ? Object.fromEntries(entries.slice(-MAX_ENTRIES))
      : map;
    sessionStorage.setItem(SCROLL_KEY, JSON.stringify(trimmed));
  } catch {
    /* ignore quota */
  }
}

export function ScrollManager() {
  const location = useLocation();
  const navType = useNavigationType(); // "PUSH" | "POP" | "REPLACE"
  const prevKey = useRef<string | null>(null);

  // Save the current scroll position before unloading the route.
  useEffect(() => {
    const key = location.pathname + location.search;

    // Save scroll position on unmount of this route
    return () => {
      const map = readMap();
      map[key] = window.scrollY;
      writeMap(map);
    };
  }, [location.pathname, location.search]);

  // After the new route mounts, restore or reset.
  useEffect(() => {
    const key = location.pathname + location.search;
    if (prevKey.current === key) return;
    prevKey.current = key;

    // If navigating to a hash anchor, let the browser/anchor handler do it.
    if (location.hash) return;

    // Wait one frame so the new route has rendered before scrolling.
    const raf = requestAnimationFrame(() => {
      if (navType === "POP") {
        const map = readMap();
        const y = map[key] ?? 0;
        window.scrollTo({ top: y, left: 0, behavior: "auto" });
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
    });

    return () => cancelAnimationFrame(raf);
  }, [location.pathname, location.search, location.hash, navType]);

  return null;
}
