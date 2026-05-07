import { Coins } from 'lucide-react';
import { LearnSubPageShell } from '@/components/learn/LearnSubPageShell';
import { Tokenomics101Card } from '@/components/tokenomics/Tokenomics101Card';

export default function LearnTokenomics() {
  return (
    <LearnSubPageShell
      title="Tokenomics"
      description="How $ZSOLAR earns value over time — in 4 simple ideas."
      icon={Coins}
      seoTitle="$ZSOLAR Tokenomics"
      seoUrl="https://beta.zen.solar/learn/tokenomics"
    >
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        Half of every subscription dollar automatically strengthens the token.
        Your new tokens lock for 12 months so the price can grow stronger.
      </p>
      <Tokenomics101Card />
    </LearnSubPageShell>
  );
}
