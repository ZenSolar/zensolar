import { lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpCircle, MessageSquarePlus, Loader2 } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { useSearchParams } from 'react-router-dom';

const Help = lazy(() => import('./Help'));
const Feedback = lazy(() => import('./Feedback'));

const Loading = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

export default function HelpCenter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'help';

  return (
    <>
      <SEO title="Help & Feedback" url="https://zensolar.lovable.app/help-center" />
      <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Help & Feedback</h1>
          <p className="text-sm text-muted-foreground mt-1">Get answers or share your thoughts</p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setSearchParams({ tab: v })}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="help" className="gap-2">
              <HelpCircle className="h-4 w-4" />
              Help & FAQ
            </TabsTrigger>
            <TabsTrigger value="feedback" className="gap-2">
              <MessageSquarePlus className="h-4 w-4" />
              Feedback
            </TabsTrigger>
          </TabsList>

          <TabsContent value="help" className="mt-6">
            <Suspense fallback={<Loading />}>
              <Help />
            </Suspense>
          </TabsContent>

          <TabsContent value="feedback" className="mt-6">
            <Suspense fallback={<Loading />}>
              <Feedback />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
