import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Mail, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface RenderedTemplate {
  templateName: string;
  displayName: string;
  subject: string;
  html: string;
  text: string;
  status: 'ready' | 'unknown_template' | 'render_failed';
  errorMessage?: string;
}

const TEMPLATES_TO_PREVIEW = ['todd-android-invite', 'jo-founder-vip-welcome'];

export default function EmailPreview() {
  const navigate = useNavigate();
  const { isAdmin, isChecking } = useAdminCheck();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [templates, setTemplates] = useState<RenderedTemplate[]>([]);

  useEffect(() => {
    if (!isChecking && !isAdmin) {
      toast.error('Admin access required');
      navigate('/');
    }
  }, [isAdmin, isChecking, navigate]);

  const load = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-preview-emails', {
        body: { templates: TEMPLATES_TO_PREVIEW },
      });
      if (error) throw error;
      setTemplates(data?.templates || []);
    } catch (err: any) {
      console.error('preview load failed', err);
      toast.error(err.message || 'Failed to load previews');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  if (isChecking || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" />
              Email Preview
            </h1>
            <p className="text-sm text-muted-foreground">
              In-app preview of Todd & Jo emails — HTML and plain-text. No inbox needed.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Reload
        </Button>
      </div>

      {templates.map((t) => (
        <Card key={t.templateName}>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between gap-2">
              <span>{t.displayName}</span>
              <span className="font-mono text-xs text-muted-foreground">{t.templateName}</span>
            </CardTitle>
            <CardDescription>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Subject:</span>{' '}
              <span className="text-foreground">{t.subject || '—'}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {t.status !== 'ready' ? (
              <div className="flex items-start gap-2 rounded border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium">{t.status === 'unknown_template' ? 'Template not found' : 'Render failed'}</div>
                  {t.errorMessage && <div className="text-xs mt-1 font-mono">{t.errorMessage}</div>}
                </div>
              </div>
            ) : (
              <Tabs defaultValue="html">
                <TabsList>
                  <TabsTrigger value="html">HTML</TabsTrigger>
                  <TabsTrigger value="text">Plain text</TabsTrigger>
                  <TabsTrigger value="source">HTML source</TabsTrigger>
                </TabsList>
                <TabsContent value="html" className="mt-3">
                  <div className="rounded-lg overflow-hidden border bg-white">
                    <iframe
                      title={`${t.templateName}-preview`}
                      srcDoc={t.html}
                      sandbox=""
                      className="w-full h-[700px] bg-white"
                    />
                  </div>
                </TabsContent>
                <TabsContent value="text" className="mt-3">
                  <pre className="rounded-lg border bg-muted p-4 text-xs whitespace-pre-wrap break-words max-h-[700px] overflow-auto">
                    {t.text}
                  </pre>
                </TabsContent>
                <TabsContent value="source" className="mt-3">
                  <pre className="rounded-lg border bg-muted p-4 text-xs whitespace-pre-wrap break-words max-h-[700px] overflow-auto">
                    {t.html}
                  </pre>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
