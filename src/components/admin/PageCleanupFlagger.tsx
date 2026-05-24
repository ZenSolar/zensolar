import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Archive, Trash2, X, Loader2, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * Floating admin-only widget for flagging the current route for archive
 * or deletion. Persists to `page_cleanup_flags`; review queue lives at
 * /admin/page-cleanup. Hidden on /auth.
 */
export function PageCleanupFlagger() {
  const { isAdmin } = useAdminCheck();
  const { user } = useAuth();
  const location = useLocation();
  const route = location.pathname;

  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [existing, setExisting] = useState<{ action: string; status: string } | null>(null);

  // Hide on auth route — admins won't be logged in there anyway
  const hidden = !isAdmin || !user || route.startsWith('/auth') || route === '/admin/page-cleanup';

  useEffect(() => {
    if (hidden) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('page_cleanup_flags')
        .select('action, status')
        .eq('route', route)
        .maybeSingle();
      if (!cancelled) setExisting(data ?? null);
    })();
    return () => { cancelled = true; };
  }, [route, hidden]);

  if (hidden) return null;

  const submit = async (action: 'archive' | 'delete') => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('page_cleanup_flags')
      .upsert(
        { route, action, flagged_by: user.id, note: note || null, status: 'pending' },
        { onConflict: 'route' },
      );
    setSaving(false);
    if (error) {
      toast.error('Failed to flag page', { description: error.message });
      return;
    }
    toast.success(`Flagged ${route} for ${action}`);
    setExisting({ action, status: 'pending' });
    setOpen(false);
    setNote('');
  };

  return (
    <div className="fixed bottom-24 left-3 z-[60] md:bottom-6 md:left-6">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className={cn(
            'h-10 w-10 rounded-full flex items-center justify-center shadow-lg border backdrop-blur-md transition-all',
            existing
              ? 'bg-amber-500/90 border-amber-400 text-white'
              : 'bg-card/90 border-border text-muted-foreground hover:text-foreground',
          )}
          title={existing ? `Flagged: ${existing.action}` : 'Flag this page for cleanup'}
          aria-label="Flag page for cleanup"
        >
          {existing ? <Check className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
        </button>
      ) : (
        <div className="w-72 rounded-lg border border-border bg-card/95 backdrop-blur-md shadow-xl p-3 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-foreground">Flag for cleanup</div>
              <div className="text-[11px] text-muted-foreground truncate font-mono">{route}</div>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          {existing && (
            <div className="text-[11px] px-2 py-1.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              Already flagged as <span className="font-semibold">{existing.action}</span> ({existing.status}). Resubmitting overwrites it.
            </div>
          )}
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why? (optional)"
            className="text-xs min-h-[60px] resize-none"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              disabled={saving}
              onClick={() => submit('archive')}
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
              Archive
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="flex-1"
              disabled={saving}
              onClick={() => submit('delete')}
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
