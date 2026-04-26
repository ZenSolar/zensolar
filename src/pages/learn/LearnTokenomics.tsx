import { Coins } from 'lucide-react';
import { LearnSubPageShell } from '@/components/learn/LearnSubPageShell';
import { TokenomicsSection } from '@/components/learn/sections';

export default function LearnTokenomics() {
  return (
    <LearnSubPageShell
      title="Tokenomics"
      description="The supply, the splits, and the deflation that powers $ZSOLAR."
      icon={Coins}
      seoTitle="$ZSOLAR Tokenomics"
      seoUrl="https://beta.zen.solar/demo/learn/tokenomics"
    >
      <TokenomicsSection />
    </LearnSubPageShell>
  );
}
