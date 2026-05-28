import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useIsFounder } from '@/hooks/useIsFounder';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Mail, ArrowLeft, Send, Eye, LogIn } from 'lucide-react';
import { toast } from 'sonner';

type UserOption = { id: string; email: string | null; device_count?: number; providers?: string[]; device_types?: string[] };

export default function WeeklyDigestPreview() {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { isFounder, ready } = useIsFounder();
  const [previewing, setPreviewing] = useState(false);
  const [sending, setSending] = useState(false);
  const [payload, setPayload] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (ready && !isFounder) {
      toast.error('Founders only');
      navigate('/');
    }
  }, [isFounder, ready, navigate]);

  // Load registered users (requires real admin session).
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      setLoadingUsers(true);
      try {
        const { data, error } = await supabase.functions.invoke('admin-get-user-emails', {
          body: { withDevices: true },
        });
        if (error) throw error;
        if (cancelled) return;
        const list: UserOption[] = (data?.users || []).filter((u: UserOption) => !!u.email);
        setUsers(list);
        // Default target = current user if present in list
        if (user && list.some((u) => u.id === user.id)) {
          setTargetUserId(user.id);
        } else if (list[0]) {
          setTargetUserId(list[0].id);
        }
      } catch (e: any) {
        toast.error(e.message || 'Failed to load users');
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session, user]);

  const selectedUser = users.find((u) => u.id === targetUserId);

  const handlePreview = async () => {
    if (!session) {
      toast.error('Sign in required');
      return;
    }
    setPreviewing(true);
    setPayload(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-weekly-digest', {
        body: { dryRun: true, userId: targetUserId || undefined },
      });
      if (error) throw new Error(await readFnError(error));
      setPayload(data);
      toast.success('Preview generated');
    } catch (e: any) {
      toast.error(e.message || 'Preview failed');
    } finally {
      setPreviewing(false);
    }
  };

  const doSend = async () => {
    setConfirmOpen(false);
    if (!session) {
      toast.error('Sign in required');
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-weekly-digest', {
        body: { userId: targetUserId || undefined },
      });
      if (error) throw new Error(await readFnError(error));
      setPayload(data);
      toast.success(`Digest queued for ${data?.recipient}`);
    } catch (e: any) {
      toast.error(e.message || 'Send failed');
    } finally {
      setSending(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary shrink-0" />
            Weekly Digest (beta)
          </h1>
          <p className="text-sm text-muted-foreground">
            Generate and send this week's energy digest. Founders only.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={() => navigate('/admin/weekly-digest/email-preview')}
        >
          <Eye className="h-4 w-4 mr-2" /> View email design
        </Button>
      </div>


      {!session && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-6">
            <div className="flex-1 text-sm">
              You need to be signed in to send. The digest is sent from your authenticated account.
            </div>
            <Button onClick={() => navigate('/auth')} size="sm">
              <LogIn className="h-4 w-4 mr-2" /> Sign in
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pick recipient (beta manual send)</CardTitle>
          <CardDescription>
            In production this email goes automatically to each user's registered email.
            For testing you can pick any registered user.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={targetUserId}
            onValueChange={setTargetUserId}
            disabled={!session || loadingUsers || users.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={loadingUsers ? 'Loading users…' : 'Select a user'} />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.email}{user?.id === u.id ? ' (you)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="text-xs text-muted-foreground">
            Will send to: <span className="font-mono">{selectedUser?.email || '—'}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handlePreview}
              disabled={!session || previewing || sending || !targetUserId}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {previewing
                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                : <Eye className="h-4 w-4 mr-2" />}
              Preview data (no email)
            </Button>
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={!session || sending || previewing || !targetUserId}
              className="w-full sm:w-auto"
            >
              {sending
                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                : <Send className="h-4 w-4 mr-2" />}
              Send now
            </Button>
          </div>
        </CardContent>
      </Card>

      {payload && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Generated payload</CardTitle>
            <CardDescription>
              {payload.dryRun ? 'Dry run — nothing was sent.' : `Queued to ${payload.recipient}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="rounded-lg border bg-muted p-4 text-xs whitespace-pre-wrap break-words max-h-[600px] overflow-auto">
              {JSON.stringify(payload.payload, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send weekly digest?</AlertDialogTitle>
            <AlertDialogDescription>
              The digest will be generated and emailed to
              {selectedUser?.email ? ` ${selectedUser.email}` : ' the selected user'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doSend}>Send now</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

async function readFnError(error: any): Promise<string> {
  const ctx = error?.context;
  try {
    const body = await ctx?.json?.();
    if (body?.error) return body.detail ? `${body.error}: ${body.detail}` : body.error;
  } catch { /* ignore */ }
  return error?.message || 'Request failed';
}
