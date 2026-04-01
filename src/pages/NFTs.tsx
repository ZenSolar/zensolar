import { lazy, Suspense, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, History, Loader2 } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { useSearchParams } from 'react-router-dom';

const NftCollection = lazy(() => import('./NftCollection'));
const MintHistory = lazy(() => import('./MintHistory'));

const Loading = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

export default function NFTs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'collection';

  return (
    <>
      <SEO title="NFTs" url="https://zensolar.lovable.app/nfts" />
      <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">NFTs</h1>
          <p className="text-sm text-muted-foreground mt-1">Your collection and mint history in one place</p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setSearchParams({ tab: v })}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="collection" className="gap-2">
              <Award className="h-4 w-4" />
              Collection
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Mint History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="collection" className="mt-6">
            <Suspense fallback={<Loading />}>
              <NftCollection />
            </Suspense>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Suspense fallback={<Loading />}>
              <MintHistory />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
