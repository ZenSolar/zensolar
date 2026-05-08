import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

// Only the founders themselves see the insider/strategy prompt set.
// Everyone else (Jo, Todd, Judy, beta users, demo users, signed-out viewers
// on the preview domain) gets the curiosity-driven public prompts — even if
// they have uncapped Deason access via the deason_inner_circle table.
// "Inner-circle access" controls quota + tone server-side; the *prompt
// suggestions* shown in the UI are intentionally beginner-friendly for
// everyone except Joe & Michael.
const INNER_CIRCLE = new Set([
  "joe@zen.solar",
  "mjcheets@gmail.com",
]);

export type DeasonPersona = "inner-circle" | "public";

/**
 * Determines which Deason persona the current user gets:
 *  - "inner-circle": full strategic co-pilot (Joe, Michael)
 *  - "public": warm ZenSolar concierge (everyone else: demo, beta, signed-out)
 *
 * The server is the source of truth — this hook only mirrors the same
 * email allowlist for UI affordances. All gating decisions still happen
 * server-side.
 *
 * IMPORTANT: We deliberately do NOT escalate to "inner-circle" based on
 * preview mode / hostname. Preview includes beta.zen.solar and *.lovable.app,
 * which is exactly where demo viewers land — leaking insider prompts there
 * was the bug that caused every demo user to see "Why did we move from 10B
 * to 1T tokens?" instead of the public concierge prompts.
 */
export function useUserPersona() {
  const { user, isLoading } = useAuth();
  const [persona, setPersona] = useState<DeasonPersona>("public");

  useEffect(() => {
    if (!user) {
      setPersona("public");
      return;
    }
    const email = (user.email ?? "").toLowerCase().trim();
    setPersona(INNER_CIRCLE.has(email) ? "inner-circle" : "public");
  }, [user]);

  return {
    persona,
    isInnerCircle: persona === "inner-circle",
    isPublic: persona === "public",
    ready: !isLoading,
  };
}
