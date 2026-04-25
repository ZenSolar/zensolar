import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Tracks an in-app navigation stack so we can offer a reliable "back" button
 * that never leaks users back to /auth, external pages, or pre-app history.
 *
 * Stored in sessionStorage so it survives full reloads inside the same tab
 * (PWA refresh, accidental refresh) but resets on a fresh session.
 */
const STACK_KEY = "zen.navStack.v1";
const MAX_DEPTH = 30;

/** Routes that act as "home" — back button hides on these. */
const HOME_ROUTES = new Set<string>([
  "/",
  "/index",
  "/home",
  "/dashboard",
  "/demo",
  "/demo/",
  "/auth",
]);

/** Sensible fallback parent for known sub-trees when stack is empty. */
function fallbackParent(pathname: string): string {
  if (pathname.startsWith("/admin")) return "/admin";
  if (pathname.startsWith("/demo/")) return "/demo";
  if (pathname.startsWith("/blog/")) return "/blog";
  return "/";
}

function readStack(): string[] {
  try {
    const raw = sessionStorage.getItem(STACK_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeStack(stack: string[]) {
  try {
    sessionStorage.setItem(STACK_KEY, JSON.stringify(stack.slice(-MAX_DEPTH)));
  } catch {
    /* ignore quota */
  }
}

/**
 * Mount once at the app root (inside Router). Records every route the user
 * visits so the back button can pop without relying on browser history.
 */
export function useAppHistoryTracker() {
  const location = useLocation();
  const last = useRef<string | null>(null);

  useEffect(() => {
    const here = location.pathname + location.search;
    if (last.current === here) return;
    last.current = here;

    const stack = readStack();

    // Deep-link protection: if this is the first entry the user is landing
    // on (no prior in-app history) AND it's a sub-route, seed the stack
    // with the proper parent so the back button always returns somewhere
    // sensible instead of falling out of the app.
    if (stack.length === 0) {
      const parent = fallbackParent(location.pathname);
      if (parent !== here && !isHomeRoute(here)) {
        stack.push(parent);
      }
    }

    // Avoid duplicate consecutive entries
    if (stack[stack.length - 1] !== here) {
      stack.push(here);
      writeStack(stack);
    }
  }, [location.pathname, location.search]);
}

export function isHomeRoute(pathname: string): boolean {
  return HOME_ROUTES.has(pathname);
}

/**
 * Returns a goBack() that pops the in-app stack, with a sensible fallback.
 * Also exposes whether a back action makes sense from the current route.
 */
export function useAppBack() {
  const navigate = useNavigate();
  const location = useLocation();

  const canGoBack = !isHomeRoute(location.pathname);

  const goBack = () => {
    const stack = readStack();
    // Pop current entry
    const here = location.pathname + location.search;
    while (stack.length && stack[stack.length - 1] === here) stack.pop();

    const prev = stack.pop();
    writeStack(stack);

    if (prev && prev !== here) {
      navigate(prev);
      return;
    }
    navigate(fallbackParent(location.pathname));
  };

  return { canGoBack, goBack };
}
