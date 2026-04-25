import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Glossary used by <JargonTip term="..."> to show a one-line plain-language
 * explainer for crypto / Web3 jargon. Demo users (especially non-crypto
 * audiences) can hover/tap the inline ⓘ to learn the term without leaving
 * context. Keep entries SHORT — one sentence, no jargon-in-jargon.
 */
const GLOSSARY: Record<string, { title: string; body: string }> = {
  zsolar: {
    title: "$ZSOLAR",
    body: "The reward currency you earn for clean energy. Think loyalty points — but tradeable.",
  },
  mint: {
    title: "Mint",
    body: "Tap once to convert your verified clean energy into $ZSOLAR — like cashing in a check.",
  },
  nft: {
    title: "NFT",
    body: "A collectible badge for hitting a milestone (like 1,000 solar kWh). Yours forever.",
  },
  wallet: {
    title: "Wallet",
    body: "Your account that holds $ZSOLAR and NFTs. We create one for you automatically.",
  },
  burn: {
    title: "Burn",
    body: "Permanently removed from circulation — making the remaining supply more valuable.",
  },
  "tap-to-mint": {
    title: "Tap-to-Mint™",
    body: "One tap reads your device data, verifies the energy, and credits your account.",
  },
  "proof-of-genesis": {
    title: "Proof-of-Genesis™",
    body: "Our way of proving your clean energy is real before turning it into rewards.",
  },
  liquidity: {
    title: "Liquidity",
    body: "The pool of $ZSOLAR + USDC that lets you trade tokens at a fair market price.",
  },
};

interface JargonTipProps {
  term: keyof typeof GLOSSARY | string;
  /** Override the visible label (defaults to the term itself, capitalised). */
  children?: React.ReactNode;
  className?: string;
}

/**
 * Inline glossary marker. Use sparingly — one or two per screen at most.
 *
 * Example:
 *   <JargonTip term="zsolar">$ZSOLAR</JargonTip>
 *   <JargonTip term="mint">mint</JargonTip>
 */
export function JargonTip({ term, children, className }: JargonTipProps) {
  const entry = GLOSSARY[term as string];
  if (!entry) {
    // Fail open — render the label without a tooltip rather than crashing.
    return <>{children ?? term}</>;
  }
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-0.5 cursor-help underline decoration-dotted decoration-muted-foreground/60 underline-offset-4",
              className
            )}
          >
            {children ?? entry.title}
            <Info className="h-3 w-3 text-muted-foreground/70" aria-hidden />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px] text-xs leading-relaxed">
          <p className="font-semibold mb-0.5">{entry.title}</p>
          <p className="text-muted-foreground">{entry.body}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
