import { Sparkles } from 'lucide-react';
import { LearnSubPageShell } from '@/components/learn/LearnSubPageShell';
import { ProofOfGenesisSection } from '@/components/learn/sections';

export default function LearnProofOfGenesis() {
  return (
    <LearnSubPageShell
      title="Proof-of-Genesis™"
      description="The consensus primitive that mints from verified clean energy."
      icon={Sparkles}
      seoTitle="Proof-of-Genesis"
      seoUrl="https://beta.zen.solar/demo/learn/proof-of-genesis"
    >
      <ProofOfGenesisSection />
    </LearnSubPageShell>
  );
}
