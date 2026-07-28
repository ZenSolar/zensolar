import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProofChain } from "./ProofChain";

export function RequestAccessForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "ok" | "rate" | "err">("idle");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("unspecified");
  const [note, setNote] = useState("");
  const [hp, setHp] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    try {
      const { data, error } = await supabase.functions.invoke("submit-access-request", {
        body: { name, email, source, note, hp },
      });
      if (error) {
        // supabase-js throws on non-2xx; treat 429 payloads as rate.
        setStatus("err");
        return;
      }
      if (data?.ok) setStatus("ok");
      else if (data?.reason === "rate_limited") setStatus("rate");
      else setStatus("err");
    } catch (err: any) {
      const msg = String(err?.message ?? "");
      if (msg.includes("429")) setStatus("rate");
      else setStatus("err");
    }
  }

  if (status === "ok") {
    return (
      <div
        className="rounded-2xl border p-8 space-y-6"
        style={{ background: "#121417", borderColor: "#1B1E22" }}
      >
        <div style={{ color: "#E8EAED" }} className="text-[17px] leading-relaxed">
          Request received.
        </div>
        <p style={{ color: "#8B9198" }} className="text-[14px] leading-relaxed max-w-md">
          We review requests personally and reach out as we open new cohorts.
        </p>
        <div className="pt-2">
          <ProofChain compact />
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border p-6 sm:p-8 space-y-5"
      style={{ background: "#121417", borderColor: "#1B1E22" }}
    >
      {/* honeypot — visually hidden, keyboard-inert */}
      <input
        type="text"
        name="hp"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none",
        }}
      />

      <Field label="Name">
        <input
          required
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-transparent outline-none text-[15px] px-0 py-2 border-b"
          style={{ color: "#E8EAED", borderColor: "#2A2D31" }}
        />
      </Field>

      <Field label="Email">
        <input
          required
          type="email"
          maxLength={255}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-transparent outline-none text-[15px] px-0 py-2 border-b"
          style={{ color: "#E8EAED", borderColor: "#2A2D31" }}
        />
      </Field>

      <Field label="How did you hear about ZenSolar?">
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="w-full bg-transparent outline-none text-[15px] px-0 py-2 border-b appearance-none"
          style={{ color: "#E8EAED", borderColor: "#2A2D31" }}
        >
          <option value="unspecified" style={{ background: "#121417" }}>Select one</option>
          <option value="investor" style={{ background: "#121417" }}>I'm an investor</option>
          <option value="hardware" style={{ background: "#121417" }}>I have hardware to connect</option>
          <option value="other" style={{ background: "#121417" }}>Other</option>
        </select>
      </Field>

      {status === "rate" && (
        <p className="text-[13px]" style={{ color: "#E8B04B" }}>
          Too many submissions from this network. Please try again in an hour.
        </p>
      )}
      {status === "err" && (
        <p className="text-[13px]" style={{ color: "#E8B04B" }}>
          Something went wrong. Please try again.
        </p>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="relative w-full sm:w-auto rounded-full px-8 py-3 text-[14px] font-medium transition-all"
          style={{
            color: "#0A0C0E",
            background: "linear-gradient(90deg, #00E19B 0%, #00C2FF 100%)",
            boxShadow: "0 0 24px -4px rgba(0, 194, 255, 0.35)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 0 40px -4px rgba(0, 194, 255, 0.6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 0 24px -4px rgba(0, 194, 255, 0.35)";
          }}
        >
          {status === "submitting" ? "Sending…" : "Request Access"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[12px] uppercase tracking-wider" style={{ color: "#8B9198" }}>
        {label}
      </span>
      {children}
    </label>
  );
}
