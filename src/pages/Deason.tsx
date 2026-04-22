import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DeasonChat } from "@/components/deason/DeasonChat";
import { Loader2 } from "lucide-react";

/**
 * Full-page Deason chat. Open to any authenticated user — the persona
 * (inner-circle vs public ZenSolar concierge) is decided server-side.
 */
export default function Deason() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="mx-auto flex h-[100svh] w-full max-w-3xl flex-col">
      <DeasonChat />
    </div>
  );
}
