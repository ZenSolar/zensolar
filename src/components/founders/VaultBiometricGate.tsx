import { useState } from "react";
import { Fingerprint, ShieldAlert, Loader2, KeyRound, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVaultBiometric } from "@/hooks/useVaultBiometric";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Props {
  userId: string;
  children: React.ReactNode;
}

export function VaultBiometricGate({ userId, children }: Props) {
  const { gate, enroll, unlock, reset } = useVaultBiometric(userId);
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState("");
  const navigate = useNavigate();

  const handleReset = async () => {
    setBusy(true);
    const { error } = await reset();
    setBusy(false);
    if (error) toast.error(error);
    else toast.success("Biometric reset. Please re-enroll.");
  };

  if (gate.status === "unlocked") {
    return <>{children}</>;
  }

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
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Exit
      </Button>
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
            {gate.status === "needs_enrollment" &&
              "Register Face ID / Touch ID to unlock the vault. One-time setup."}
            {gate.status === "needs_unlock" &&
              "Verify with Face ID / Touch ID to continue."}
            {gate.status === "unsupported" && gate.reason}
            {gate.status === "error" && gate.message}
          </p>
        </div>

        {gate.status === "needs_enrollment" && (
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

        {gate.status === "needs_unlock" && (
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
