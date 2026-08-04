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
        Every verified kWh mints a clean 1:1 to you. Each verified unit issues 1.25 $ZSOLAR —
        1.0 to you and 0.25 to the treasury. There is no liquidity mint and no burn at mint.
        A separate 3% transfer tax recycles to LP on every swap.
      </p>
      <Tokenomics101Card />
    </LearnSubPageShell>
  );
}
