import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { isPreviewMode } from "@/lib/previewMode";

// Only the founders themselves see the insider/strategy prompt set.
// Everyone else (Jo, Todd, Judy, beta users, demo users) gets the
// curiosity-driven public prompts — even if they have uncapped Deason
// access via the deason_inner_circle table. "Inner-circle access" controls
// quota + tone server-side; the *prompt suggestions* shown in the UI are
// intentionally beginner-friendly for everyone except Joe & Michael.
const INNER_CIRCLE = new Set([
  "joe@zen.solar",
  "mjcheets@gmail.com",
]);

export type DeasonPersona = "inner-circle" | "public";

/**
 * Determines which Deason persona the current user gets:
 *  - "inner-circle": full strategic co-pilot (Joe, Michael, Jo, Todd)
 *  - "public": warm ZenSolar concierge (everyone else, demo + beta)
 *
 * The server is the source of truth — this hook only mirrors the same
 * email allowlist for UI affordances (e.g. showing "Founders-only" header
 * vs "ZenSolar Concierge"). All gating decisions still happen server-side.
 *
 * Preview mode forces "inner-circle" so the editor shows the full surface.
 */
export function useUserPersona() {
  const { user, isLoading } = useAuth();
  const [persona, setPersona] = useState<DeasonPersona | null>(null);

  useEffect(() => {
    if (isPreviewMode()) {
      setPersona("inner-circle");
      return;
    }
    if (!user) {
      setPersona(null);
      return;
    }
    const email = (user.email ?? "").toLowerCase().trim();
    setPersona(INNER_CIRCLE.has(email) ? "inner-circle" : "public");
  }, [user]);

  return {
    persona,
    isInnerCircle: persona === "inner-circle",
    isPublic: persona === "public",
    ready: !isLoading && persona !== null,
  };
}
