import { useState } from "react";
import { Fingerprint, ShieldAlert, Loader2, KeyRound, ArrowLeft, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVaultBiometric } from "@/hooks/useVaultBiometric";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";

interface Props {
  userId: string;
  children: React.ReactNode;
  allowPreviewBypass?: boolean;
}

function isHostedPreviewEnvironment() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host.endsWith(".lovableproject.com") || host.startsWith("id-preview--");
}

export function VaultBiometricGate({ userId, children, allowPreviewBypass = false }: Props) {
  const { gate, enroll, unlock, reset } = useVaultBiometric(userId);
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const previewSessionKey = `zen.preview-access:${location.pathname}`;
  const previewBypassAvailable = allowPreviewBypass && isHostedPreviewEnvironment();
  const [previewUnlocked, setPreviewUnlocked] = useState(() =>
    typeof window !== "undefined" && sessionStorage.getItem(previewSessionKey) === "1",
  );

  const goHome = () => {
    navigate("/", { replace: true });
    window.setTimeout(() => {
      if (window.location.pathname !== "/") {
        window.location.assign("/");
      }
    }, 120);
  };

  const goBack = () => {
    const fallback = location.pathname === "/founder-pack" ? "/founders" : "/";

    if (window.history.length > 1) {
      const currentPath = window.location.pathname + window.location.search + window.location.hash;
      navigate(-1);
      window.setTimeout(() => {
        const stillHere =
          window.location.pathname + window.location.search + window.location.hash === currentPath;
        if (stillHere) {
          navigate(fallback, { replace: true });
          window.setTimeout(() => {
            if (window.location.pathname === location.pathname) {
              window.location.assign(fallback);
            }
          }, 120);
        }
      }, 160);
      return;
    }

    navigate(fallback, { replace: true });
    window.setTimeout(() => {
      if (window.location.pathname === location.pathname) {
        window.location.assign(fallback);
      }
    }, 120);
  };

  const handleReset = async () => {
    setBusy(true);
    const { error } = await reset();
    setBusy(false);
    if (error) toast.error(error);
    else toast.success("Biometric reset. Please re-enroll.");
  };

  const handlePreviewAccess = () => {
    sessionStorage.setItem(previewSessionKey, "1");
    setPreviewUnlocked(true);
    toast.success("Preview access enabled for this beta sandbox.");
  };

  if (gate.status === "unlocked" || previewUnlocked) {
    return <>{children}</>;
  }

  const showPreviewBypass =
    previewBypassAvailable &&
    ["needs_enrollment", "needs_unlock", "unsupported", "error"].includes(gate.status);

  const handleEnroll = async () => {
    setBusy(true);
    const { error } = await enroll(label || "Founder Device");
    setBusy(false);
    if (error) toast.error(error);
    else toast.success("Biometric registered. Vault unlocked.");
  };

  const handleUnlock = async () => {
    setBusy(true);
    const { error } = await unlock();
    setBusy(false);
    if (error) toast.error(error);
  };

  return (
    <div className="min-h-[100svh] flex items-center justify-center p-6 bg-background relative">
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={goBack}
          className="text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={goHome}
          className="text-muted-foreground"
        >
          <Home className="h-4 w-4 mr-1" /> Home
        </Button>
      </div>
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
            {gate.status === "checking" ? (
              <Loader2 className="h-9 w-9 text-primary animate-spin" />
            ) : gate.status === "unsupported" || gate.status === "error" ? (
              <ShieldAlert className="h-9 w-9 text-destructive" />
            ) : (
              <Fingerprint className="h-9 w-9 text-primary" />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Founders Vault</h1>
          <p className="text-sm text-muted-foreground">
            {gate.status === "checking" && "Verifying biometric…"}
            {showPreviewBypass &&
              "Biometrics are blocked in this hosted preview. Use preview access to review the beta sandbox. Live founder access still requires Face ID / Touch ID."}
            {!showPreviewBypass && gate.status === "needs_enrollment" &&
              "Register Face ID / Touch ID to unlock the vault. One-time setup."}
            {!showPreviewBypass && gate.status === "needs_unlock" &&
              "Verify with Face ID / Touch ID to continue."}
            {!showPreviewBypass && gate.status === "unsupported" && gate.reason}
            {!showPreviewBypass && gate.status === "error" && gate.message}
          </p>
        </div>

        {showPreviewBypass && (
          <div className="space-y-3">
            <Button
              onClick={handlePreviewAccess}
              className="w-full"
              size="lg"
            >
              Continue in Preview
            </Button>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This bypass is limited to the hosted preview for this route only and does not change the real app.
            </p>
          </div>
        )}

        {!showPreviewBypass && gate.status === "needs_enrollment" && (
          <div className="space-y-3">
            <Input
              placeholder="Device label (e.g. Joseph's iPhone)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="text-center"
            />
            <Button
              onClick={handleEnroll}
              disabled={busy}
              className="w-full"
              size="lg"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <KeyRound className="h-4 w-4 mr-2" />
              )}
              Register Biometric
            </Button>
          </div>
        )}

        {!showPreviewBypass && gate.status === "needs_unlock" && (
          <div className="space-y-3">
            <Button
              onClick={handleUnlock}
              disabled={busy}
              className="w-full"
              size="lg"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Fingerprint className="h-4 w-4 mr-2" />
              )}
              Unlock with Biometric
            </Button>
            <Button
              onClick={handleReset}
              disabled={busy}
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
              Reset & re-enroll biometric
            </Button>
          </div>
        )}

        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Confidential · Founders Only
        </p>
      </div>
    </div>
  );
}
