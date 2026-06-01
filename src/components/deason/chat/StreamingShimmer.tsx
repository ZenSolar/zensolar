import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const PHRASES = ["Thinking…", "Reading your docs…", "Checking your bill…", "Crunching numbers…"];

/** Rotating shimmer label shown while a stream is in flight. */
export function StreamingShimmer() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setI((v) => (v + 1) % PHRASES.length), 1400);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
      <Sparkles className="h-3 w-3 animate-pulse text-amber-500" />
      <span
        className="bg-gradient-to-r from-muted-foreground via-foreground to-muted-foreground bg-[length:200%_100%] bg-clip-text text-transparent"
        style={{ animation: "deason-shimmer 1.6s linear infinite" }}
      >
        {PHRASES[i]}
      </span>
      <style>{`@keyframes deason-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}
