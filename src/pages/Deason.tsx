import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsFounder } from "@/hooks/useIsFounder";
import { DeasonChat } from "@/components/deason/DeasonChat";
import { Loader2 } from "lucide-react";

export default function Deason() {
  const { user, isLoading } = useAuth();
  const { isFounder, ready } = useIsFounder();

  if (isLoading || !ready) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isFounder) return <Navigate to="/" replace />;

  return (
    <div className="mx-auto flex h-[100svh] w-full max-w-3xl flex-col">
      <DeasonChat />
    </div>
  );
}
