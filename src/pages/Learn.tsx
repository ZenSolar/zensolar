import { lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Coins, Loader2 } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { useSearchParams } from 'react-router-dom';

const HowItWorks = lazy(() => import('./HowItWorks'));
const Tokenomics = lazy(() => import('./Tokenomics'));

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
          <p className="text-sm text-muted-foreground mt-1">How ZenSolar works and token economics</p>
        </div>

        <div className="container max-w-6xl mx-auto px-4">
          <Tabs value={tab} onValueChange={(v) => setSearchParams({ tab: v })}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="how-it-works" className="gap-2">
                <BookOpen className="h-4 w-4" />
                How It Works
              </TabsTrigger>
              <TabsTrigger value="tokenomics" className="gap-2">
                <Coins className="h-4 w-4" />
                Tokenomics
              </TabsTrigger>
            </TabsList>

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
          </Tabs>
        </div>
      </div>
    </>
  );
}
