/**
 * Friendly error mapping for the mint-onchain edge function.
 *
 * The function can return HTTP 423 with { error: "mint_gate_blocked", reason, ... }
 * when one of the Five Pillars has flagged the user (open critical violation,
 * collusion signal, cross-source duplicate, chain tamper, anchor stall, etc.).
 *
 * supabase.functions.invoke returns non-2xx as { error: FunctionsHttpError }
 * with the parsed body on error.context (either .json or .body).
 */

export type MintErrorKind =
  | "gate_blocked"
  | "gate_check_failed"
  | "simulation_failed"
  | "rate_limited"
  | "insufficient_balance"
  | "generic";

export interface ParsedMintError {
  kind: MintErrorKind;
  title: string;
  message: string;
  /** True when the user is paused by the Mint Gate — should not be framed as a "failure". */
  isGate: boolean;
  /** Original reason code from the edge function, when available. */
  reason?: string;
}

const GATE_REASON_COPY: Record<string, string> = {
  open_invariant_violation:
    "Our protocol-integrity checks flagged something on your account. Our team has been notified — no energy is lost, you can retry once it clears.",
  open_collusion_signal:
    "Mint paused for review while we double-check a duplicate signal. No energy is lost — retry shortly.",
  cross_source_duplicate:
    "We detected two providers reporting the same energy. Mint paused to prevent double-counting — contact support if this looks wrong.",
  chain_hash_tamper:
    "Mint paused while we verify the integrity chain. Admin has been alerted automatically.",
  anchor_stale:
    "Mint paused — on-chain anchor is catching up. This usually clears within a few minutes.",
};

export function parseMintError(error: unknown, data?: any): ParsedMintError {
  // Pull body out of either the thrown supabase error or returned data
  const ctx = (error as any)?.context;
  const body = ctx?.json ?? ctx?.body ?? data ?? null;
  const code: string | undefined = body?.error ?? body?.code;
  const reason: string | undefined = body?.reason;
  const serverMsg: string | undefined = body?.message;
  const fallback =
    (error instanceof Error ? error.message : undefined) ?? "Minting failed";

  if (code === "mint_gate_blocked") {
    return {
      kind: "gate_blocked",
      title: "Mint paused for review",
      message:
        (reason && GATE_REASON_COPY[reason]) ||
        serverMsg ||
        "Mint paused for review — our team has been notified. No energy is lost, retry shortly.",
      isGate: true,
      reason,
    };
  }

  if (code === "mint_gate_check_failed" || code === "mint_gate_exception") {
    return {
      kind: "gate_check_failed",
      title: "Integrity check unavailable",
      message:
        "We couldn't verify your account integrity right now. Please retry in a moment — no energy is lost.",
      isGate: true,
      reason: code,
    };
  }

  if (code === "simulation_failed") {
    return {
      kind: "simulation_failed",
      title: "Transaction simulation failed",
      message:
        serverMsg ||
        "The on-chain simulation rejected this mint. Please contact support — your energy is safe.",
      isGate: false,
    };
  }

  if (code === "rate_limited") {
    return {
      kind: "rate_limited",
      title: "Slow down a moment",
      message: serverMsg || "Too many mints in a short window. Try again in a minute.",
      isGate: false,
    };
  }

  return {
    kind: "generic",
    title: "Minting failed",
    message: serverMsg || fallback,
    isGate: false,
  };
}
