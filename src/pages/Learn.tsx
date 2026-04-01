import { lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, FileText, Cpu, Coins, Loader2 } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { useSearchParams } from 'react-router-dom';

const HowItWorks = lazy(() => import('./HowItWorks'));
const WhitePaper = lazy(() => import('./WhitePaper'));
const Technology = lazy(() => import('./Technology'));
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
          <p className="text-sm text-muted-foreground mt-1">Everything you need to know about ZenSolar</p>
        </div>

        <div className="container max-w-6xl mx-auto px-4">
          <Tabs value={tab} onValueChange={(v) => setSearchParams({ tab: v })}>
            <TabsList className="grid w-full max-w-2xl grid-cols-4">
              <TabsTrigger value="how-it-works" className="gap-1.5 text-xs sm:text-sm">
                <BookOpen className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">How It Works</span>
                <span className="sm:hidden">How</span>
              </TabsTrigger>
              <TabsTrigger value="white-paper" className="gap-1.5 text-xs sm:text-sm">
                <FileText className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">White Paper</span>
                <span className="sm:hidden">Paper</span>
              </TabsTrigger>
              <TabsTrigger value="technology" className="gap-1.5 text-xs sm:text-sm">
                <Cpu className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Technology</span>
                <span className="sm:hidden">Tech</span>
              </TabsTrigger>
              <TabsTrigger value="tokenomics" className="gap-1.5 text-xs sm:text-sm">
                <Coins className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Tokenomics</span>
                <span className="sm:hidden">Token</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="how-it-works" className="mt-0">
              <Suspense fallback={<Loading />}>
                <HowItWorks />
              </Suspense>
            </TabsContent>

            <TabsContent value="white-paper" className="mt-0">
              <Suspense fallback={<Loading />}>
                <WhitePaper />
              </Suspense>
            </TabsContent>

            <TabsContent value="technology" className="mt-0">
              <Suspense fallback={<Loading />}>
                <Technology />
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
