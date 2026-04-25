import { lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Coins, Loader2, Sparkles, Cpu } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { useSearchParams } from 'react-router-dom';

const HowItWorks = lazy(() => import('./HowItWorks'));
const Tokenomics = lazy(() => import('./Tokenomics'));
const ProofOfGenesis = lazy(() => import('./ProofOfGenesis'));
const Technology = lazy(() => import('./Technology'));

const Loading = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

export default function Learn() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'how-it-works';

  return (
    <>
      <SEO title="Learn" url="https://zensolar.lovable.app/learn" />
      <div className="space-y-0">
        <div className="container max-w-6xl mx-auto px-4 pt-6 pb-4">
          <h1 className="text-2xl font-bold tracking-tight">Learn</h1>
          <p className="text-sm text-muted-foreground mt-1">Everything about ZenSolar in one place</p>
        </div>

        <div className="container max-w-6xl mx-auto px-4">
          <Tabs value={tab} onValueChange={(v) => setSearchParams({ tab: v })}>
            <div className="overflow-x-auto -mx-4 px-4 pb-2">
              <TabsList className="inline-flex w-auto min-w-full sm:min-w-0 gap-1">
                <TabsTrigger value="how-it-works" className="gap-2 whitespace-nowrap">
                  <BookOpen className="h-4 w-4" />
                  How It Works
                </TabsTrigger>
                <TabsTrigger value="tokenomics" className="gap-2 whitespace-nowrap">
                  <Coins className="h-4 w-4" />
                  Tokenomics
                </TabsTrigger>
                <TabsTrigger value="proof-of-genesis" className="gap-2 whitespace-nowrap">
                  <Sparkles className="h-4 w-4" />
                  Proof-of-Genesis™
                </TabsTrigger>
                <TabsTrigger value="patent" className="gap-2 whitespace-nowrap">
                  <Cpu className="h-4 w-4" />
                  Patent Tech
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="how-it-works" className="mt-0">
              <Suspense fallback={<Loading />}>
                <HowItWorks />
              </Suspense>
            </TabsContent>

            <TabsContent value="tokenomics" className="mt-0">
              <Suspense fallback={<Loading />}>
                <Tokenomics />
              </Suspense>
            </TabsContent>

            <TabsContent value="proof-of-genesis" className="mt-0">
              <Suspense fallback={<Loading />}>
                <ProofOfGenesis />
              </Suspense>
            </TabsContent>

            <TabsContent value="patent" className="mt-0">
              <Suspense fallback={<Loading />}>
                <Technology />
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
