/**
 * useVaultBiometric — Founders Vault biometric gate using WebAuthn (Face ID / Touch ID).
 *
 * Strategy: "once per session + on resume after >5 min away"
 *  - First open: prompts biometric.
 *  - Subsequent navigations within session: no prompt.
 *  - PWA backgrounded for >5 min: re-prompt on resume.
 *
 * Stores credential metadata in `vault_webauthn_credentials` so we can show the user
 * which devices are enrolled and revoke them. The actual cryptographic verification
 * happens client-side via the Platform Authenticator (Face ID / Touch ID / Windows Hello).
 *
 * NOTE: For v1 we use the WebAuthn API to enforce the *user-present* gesture. The
 * server-side challenge/response signature verification is intentionally simplified —
 * a follow-up will add full FIDO2 challenge verification on the edge.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_FLAG = "zen.vault.unlocked";
const LAST_UNLOCK_KEY = "zen.vault.lastUnlock";
const REPROMPT_AFTER_MS = 5 * 60 * 1000; // 5 minutes

type GateState =
  | { status: "checking" }
  | { status: "needs_enrollment" }
  | { status: "needs_unlock" }
  | { status: "unlocked" }
  | { status: "unsupported"; reason: string }
  | { status: "error"; message: string };

function isUnlockFresh(): boolean {
  if (sessionStorage.getItem(SESSION_FLAG) !== "1") return false;
  const last = Number(sessionStorage.getItem(LAST_UNLOCK_KEY) ?? "0");
  return Date.now() - last < REPROMPT_AFTER_MS;
}

function markUnlocked() {
  sessionStorage.setItem(SESSION_FLAG, "1");
  sessionStorage.setItem(LAST_UNLOCK_KEY, String(Date.now()));
}

function clearUnlock() {
  sessionStorage.removeItem(SESSION_FLAG);
  sessionStorage.removeItem(LAST_UNLOCK_KEY);
}

function bufferToB64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.byteLength; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomChallenge(): Uint8Array {
  const c = new Uint8Array(32);
  crypto.getRandomValues(c);
  return c;
}

export function useVaultBiometric(userId: string | undefined) {
  const [gate, setGate] = useState<GateState>({ status: "checking" });
  const lastVisibilityCheck = useRef<number>(Date.now());

  // Initial check: do we have an enrolled credential?
  const refresh = useCallback(async () => {
    if (!userId) return;

    if (
      typeof window === "undefined" ||
      !window.PublicKeyCredential ||
      typeof navigator.credentials?.get !== "function"
    ) {
      setGate({
        status: "unsupported",
        reason: "Your browser does not support biometric authentication.",
      });
      return;
    }

    // Confirm a Platform Authenticator (Face ID / Touch ID) exists
    try {
      const available =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        setGate({
          status: "unsupported",
          reason:
            "No Face ID / Touch ID found on this device. Add the app to your iPhone Home Screen and enable biometrics.",
        });
        return;
      }
    } catch {
      // Continue — some browsers throw but still support get()
    }

    if (isUnlockFresh()) {
      setGate({ status: "unlocked" });
      return;
    }

    const { data, error } = await supabase
      .from("vault_webauthn_credentials")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    if (error) {
      setGate({ status: "error", message: error.message });
      return;
    }

    setGate({
      status: data && data.length > 0 ? "needs_unlock" : "needs_enrollment",
    });
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Re-prompt when PWA returns from background after >5 min
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "visible") {
        const elapsed = Date.now() - lastVisibilityCheck.current;
        if (elapsed > REPROMPT_AFTER_MS) {
          clearUnlock();
          refresh();
        }
        lastVisibilityCheck.current = Date.now();
      } else {
        lastVisibilityCheck.current = Date.now();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () =>
      document.removeEventListener("visibilitychange", onVisibility);
  }, [refresh]);

  const enroll = useCallback(
    async (deviceLabel: string) => {
      if (!userId) return { error: "Not signed in" };
      try {
        const challenge = randomChallenge();
        const cred = (await navigator.credentials.create({
          publicKey: {
            challenge,
          rp: { name: "ZenSolar Founders Vault", id: window.location.hostname },
            user: {
              id: new Uint8Array(new TextEncoder().encode(userId)).buffer as ArrayBuffer,
              name: deviceLabel || "Founder",
              displayName: deviceLabel || "Founder",
            },
            pubKeyCredParams: [
              { type: "public-key", alg: -7 }, // ES256
              { type: "public-key", alg: -257 }, // RS256
            ],
            authenticatorSelection: {
              authenticatorAttachment: "platform",
              userVerification: "required",
              residentKey: "preferred",
            },
            timeout: 60_000,
            attestation: "none",
          },
        })) as PublicKeyCredential | null;

        if (!cred) return { error: "Enrollment cancelled" };

        const credIdB64 = bufferToB64Url(cred.rawId);
        const response = cred.response as AuthenticatorAttestationResponse;
        const publicKey = bufferToB64Url(
          response.getPublicKey?.() ?? new ArrayBuffer(0),
        );

        const { error } = await supabase
          .from("vault_webauthn_credentials")
          .insert({
            user_id: userId,
            credential_id: credIdB64,
            public_key: publicKey || "platform-stored",
            device_label: deviceLabel || navigator.userAgent.slice(0, 60),
            transports:
              (response as AuthenticatorAttestationResponse & {
                getTransports?: () => string[];
              }).getTransports?.() ?? null,
          });

        if (error) return { error: error.message };

        await supabase.from("vault_access_log").insert({
          user_id: userId,
          event_type: "biometric_enrolled",
          success: true,
        });

        markUnlocked();
        setGate({ status: "unlocked" });
        return { error: null };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Enrollment failed";
        return { error: msg };
      }
    },
    [userId],
  );

  const unlock = useCallback(async () => {
    if (!userId) return { error: "Not signed in" };
    try {
      const { data: creds, error: credErr } = await supabase
        .from("vault_webauthn_credentials")
        .select("credential_id")
        .eq("user_id", userId);

      if (credErr) return { error: credErr.message };
      if (!creds || creds.length === 0) {
        setGate({ status: "needs_enrollment" });
        return { error: "No biometric registered. Please enroll." };
      }

      const challenge = randomChallenge();
      const allow = creds.map((c) => {
        const raw = Uint8Array.from(
          atob(
            c.credential_id.replace(/-/g, "+").replace(/_/g, "/") +
              "=".repeat((4 - (c.credential_id.length % 4)) % 4),
          ),
          (ch) => ch.charCodeAt(0),
        );
        return {
          id: raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer,
          type: "public-key" as const,
          transports: [
            "internal",
            "hybrid",
          ] as AuthenticatorTransport[],
        };
      });

      const assertion = (await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: allow,
          userVerification: "required",
          timeout: 60_000,
          rpId: window.location.hostname,
        },
      })) as PublicKeyCredential | null;

      if (!assertion) return { error: "Cancelled" };

      // Update last_used_at
      const usedId = bufferToB64Url(assertion.rawId);
      await supabase
        .from("vault_webauthn_credentials")
        .update({ last_used_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("credential_id", usedId);

      await supabase.from("vault_access_log").insert({
        user_id: userId,
        event_type: "vault_unlocked",
        success: true,
      });

      markUnlocked();
      setGate({ status: "unlocked" });
      return { error: null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unlock failed";
      await supabase.from("vault_access_log").insert({
        user_id: userId,
        event_type: "vault_unlock_failed",
        success: false,
        metadata: { error: msg },
      });
      return { error: msg };
    }
  }, [userId]);

  const lock = useCallback(() => {
    clearUnlock();
    setGate({ status: "needs_unlock" });
  }, []);

  return { gate, enroll, unlock, lock, refresh };
}
