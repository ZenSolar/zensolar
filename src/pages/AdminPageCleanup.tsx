import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, Trash2, ExternalLink, X, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { SEO } from '@/components/SEO';

interface Flag {
  id: string;
  route: string;
  action: 'archive' | 'delete';
  note: string | null;
  status: 'pending' | 'processed' | 'cancelled';
  created_at: string;
  flagged_by: string;
  processed_at: string | null;
}

export default function AdminPageCleanup() {
  const { isAdmin, isChecking } = useAdminCheck();
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'processed' | 'cancelled' | 'all'>('pending');

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('page_cleanup_flags')
      .select('*')
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) {
      toast.error('Failed to load flags');
      return;
    }
    setFlags((data ?? []) as Flag[]);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const updateStatus = async (id: string, status: 'processed' | 'cancelled') => {
    const { error } = await supabase
      .from('page_cleanup_flags')
      .update({ status, processed_at: status === 'processed' ? new Date().toISOString() : null })
      .eq('id', id);
    if (error) {
      toast.error('Failed to update');
      return;
    }
    toast.success(`Marked ${status}`);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('page_cleanup_flags').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
      return;
    }
    toast.success('Removed');
    load();
  };

  const copyList = () => {
    const pending = flags.filter((f) => f.status === 'pending');
    const text = pending
      .map((f) => `- [${f.action.toUpperCase()}] ${f.route}${f.note ? ` — ${f.note}` : ''}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${pending.length} flags to clipboard`);
  };

  if (isChecking) {
    return <div className="p-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }
  if (!isAdmin) {
    return <div className="p-8 text-muted-foreground">Admin only.</div>;
  }

  const filtered = filter === 'all' ? flags : flags.filter((f) => f.status === filter);
  const counts = {
    pending: flags.filter((f) => f.status === 'pending').length,
    processed: flags.filter((f) => f.status === 'processed').length,
    cancelled: flags.filter((f) => f.status === 'cancelled').length,
  };

  return (
    <>
      <SEO title="Page Cleanup Queue — Admin" description="Review pages flagged for archive or deletion." />
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Page Cleanup Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pages flagged via the floating widget. Hand the pending list to AI to execute.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['pending', 'processed', 'cancelled', 'all'] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && <Badge variant="secondary" className="ml-2">{counts[f]}</Badge>}
            </Button>
          ))}
          <div className="ml-auto">
            <Button size="sm" variant="outline" onClick={copyList} disabled={counts.pending === 0}>
              Copy pending as markdown
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">No flags.</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((f) => (
              <div key={f.id} className="border border-border rounded-lg p-3 bg-card flex items-start gap-3">
                <div className="mt-1">
                  {f.action === 'archive' ? (
                    <Archive className="h-4 w-4 text-amber-500" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={f.route} className="font-mono text-sm font-medium hover:underline truncate">
                      {f.route}
                    </Link>
                    <Badge variant={f.action === 'delete' ? 'destructive' : 'outline'} className="text-[10px]">
                      {f.action}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">{f.status}</Badge>
                  </div>
                  {f.note && <p className="text-xs text-muted-foreground mt-1">{f.note}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(f.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Link to={f.route} title="Open route">
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  {f.status === 'pending' && (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        title="Mark processed"
                        onClick={() => updateStatus(f.id, 'processed')}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        title="Cancel flag"
                        onClick={() => updateStatus(f.id, 'cancelled')}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    title="Remove"
                    onClick={() => remove(f.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
