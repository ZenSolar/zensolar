import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { SEO } from "@/components/SEO";

export default function PublicInvite() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "invalid" | "rate" | "err">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "checking") return;
    const trimmed = code.trim();
    if (!trimmed) return;
    setStatus("checking");
    try {
      const { data, error } = await supabase.functions.invoke("redeem-invite", {
        body: { code: trimmed },
      });
      if (error) {
        const msg = String(error?.message ?? "");
        if (msg.includes("429")) setStatus("rate");
        else setStatus("err");
        return;
      }
      if (data?.ok) {
        window.location.assign("https://beta.zensolar.com");
        return;
      }
      if (data?.reason === "rate_limited") setStatus("rate");
      else setStatus("invalid");
    } catch (err: any) {
      const msg = String(err?.message ?? "");
      if (msg.includes("429")) setStatus("rate");
      else setStatus("err");
    }
  }

  return (
    <>
      <SEO
        title="Enter your invite code — ZenSolar"
        description="Redeem your ZenSolar invite code to access the beta."
        url="https://zensolar.com/invite"
      />
      <div style={{ background: "#0A0C0E", color: "#E8EAED" }} className="min-h-screen flex flex-col">
        <PublicHeader />
        <main className="flex-1 flex items-center justify-center px-5 sm:px-8 py-16">
          <div className="w-full max-w-md space-y-8">
            <div className="space-y-3">
              <h1
                className="text-[28px] sm:text-[32px] font-medium tracking-tight"
                style={{ letterSpacing: "-0.02em" }}
              >
                Enter your invite code
              </h1>
              <p className="text-[14px]" style={{ color: "#8B9198" }}>
                Codes are case-insensitive.
              </p>
            </div>

            <form
              onSubmit={submit}
              className="rounded-2xl border p-6 space-y-5"
              style={{ background: "#121417", borderColor: "#1B1E22" }}
            >
              <input
                autoFocus
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (status !== "idle" && status !== "checking") setStatus("idle");
                }}
                maxLength={64}
                placeholder="e.g. ZS-QUIETCURRENT"
                className="w-full bg-transparent outline-none text-[16px] px-0 py-2 border-b tracking-wider"
                style={{ color: "#E8EAED", borderColor: "#2A2D31", fontFamily: "ui-monospace, monospace" }}
                aria-label="Invite code"
              />

              {status === "invalid" && (
                <p className="text-[13px]" style={{ color: "#E8B04B" }}>
                  That code isn't valid. Double-check it and try again.
                </p>
              )}
              {status === "rate" && (
                <p className="text-[13px]" style={{ color: "#E8B04B" }}>
                  Too many attempts from this network. Please try again shortly.
                </p>
              )}
              {status === "err" && (
                <p className="text-[13px]" style={{ color: "#E8B04B" }}>
                  Something went wrong. Please try again.
                </p>
              )}

              <button
                type="submit"
                disabled={status === "checking" || !code.trim()}
                className="w-full rounded-full px-8 py-3 text-[14px] font-medium transition-all disabled:opacity-50"
                style={{
                  color: "#0A0C0E",
                  background: "linear-gradient(90deg, #00E19B 0%, #00C2FF 100%)",
                  boxShadow: "0 0 24px -4px rgba(0, 194, 255, 0.35)",
                }}
              >
                {status === "checking" ? "Checking…" : "Continue"}
              </button>
            </form>

            <p className="text-[13px] text-center" style={{ color: "#8B9198" }}>
              Don't have a code?{" "}
              <Link
                to="/#request-access"
                className="underline underline-offset-4"
                style={{ color: "#E8EAED" }}
              >
                Request access
              </Link>
            </p>
          </div>
        </main>
        <PublicFooter />
      </div>
    </>
  );
}
