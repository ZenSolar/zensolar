import { Coins } from 'lucide-react';
import { LearnSubPageShell } from '@/components/learn/LearnSubPageShell';
import { Tokenomics101Card } from '@/components/tokenomics/Tokenomics101Card';

export default function LearnTokenomics() {
  return (
    <LearnSubPageShell
      title="Tokenomics"
      description="What you see is what you mint. 1 kWh = 1 $ZSOLAR."
      icon={Coins}
      seoTitle="$ZSOLAR Tokenomics"
      seoUrl="https://beta.zen.solar/learn/tokenomics"
    >
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        Every verified kWh mints a clean 1:1 to you. In the background, the protocol matches
        your mint — 25% to liquidity, 20% burned, 5% to treasury — plus a separate 3% transfer
        tax that recycles to LP on every swap.
      </p>
      <Tokenomics101Card />
    </LearnSubPageShell>
  );
}
