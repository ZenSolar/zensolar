import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Loader2, Mail, CheckCircle2, XCircle, Ban, Clock,
  Eye, MousePointerClick, RefreshCw, ArrowLeft, Search,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

type Status = 'pending' | 'sent' | 'failed' | 'dlq' | 'suppressed' | 'bounced' | 'complained';

interface SendRow {
  id: string;
  message_id: string | null;
  template_name: string;
  recipient_email: string;
  status: Status;
  error_message: string | null;
  created_at: string;
}

interface OpenRow {
  id: string;
  message_id: string;
  template_name: string | null;
  recipient_email: string | null;
  opened_at: string;
  user_agent: string | null;
  ip_address: string | null;
}

interface ClickRow {
  id: string;
  message_id: string;
  link_key: string;
  destination_url: string | null;
  template_name: string | null;
  recipient_email: string | null;
  clicked_at: string;
  user_agent: string | null;
  ip_address: string | null;
}

const RANGES: Record<string, number> = {
  '24h': 1,
  '7d': 7,
  '30d': 30,
  'all': 3650,
};

const STATUS_VARIANT: Record<Status, { label: string; className: string; icon: any }> = {
  sent: { label: 'Sent', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 },
  pending: { label: 'Pending', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: Clock },
  failed: { label: 'Failed', className: 'bg-red-500/15 text-red-400 border-red-500/30', icon: XCircle },
  dlq: { label: 'Failed (DLQ)', className: 'bg-red-500/15 text-red-400 border-red-500/30', icon: XCircle },
  suppressed: { label: 'Suppressed', className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', icon: Ban },
  bounced: { label: 'Bounced', className: 'bg-orange-500/15 text-orange-400 border-orange-500/30', icon: XCircle },
  complained: { label: 'Complained', className: 'bg-purple-500/15 text-purple-400 border-purple-500/30', icon: Ban },
};

function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_VARIANT[status] || STATUS_VARIANT.pending;
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`gap-1 ${cfg.className}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

export default function EmailAnalytics() {
  const navigate = useNavigate();
  const { isAdmin, isChecking } = useAdminCheck();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sends, setSends] = useState<SendRow[]>([]);
  const [opens, setOpens] = useState<OpenRow[]>([]);
  const [clicks, setClicks] = useState<ClickRow[]>([]);

  const [range, setRange] = useState<string>('7d');
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [drillMessageId, setDrillMessageId] = useState<string | null>(null);

  useEffect(() => {
    if (!isChecking && !isAdmin) {
      toast.error('Admin access required');
      navigate('/');
    }
  }, [isAdmin, isChecking, navigate]);

  const load = async () => {
    setRefreshing(true);
    try {
      const days = RANGES[range] ?? 7;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const [sendsRes, opensRes, clicksRes] = await Promise.all([
        supabase
          .from('email_send_log')
          .select('*')
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(1000),
        supabase
          .from('email_opens')
          .select('*')
          .gte('opened_at', since)
          .order('opened_at', { ascending: false })
          .limit(1000),
        supabase
          .from('email_link_clicks')
          .select('*')
          .gte('clicked_at', since)
          .order('clicked_at', { ascending: false })
          .limit(1000),
      ]);

      if (sendsRes.error) throw sendsRes.error;
      if (opensRes.error) throw opensRes.error;
      if (clicksRes.error) throw clicksRes.error;

      setSends((sendsRes.data || []) as SendRow[]);
      setOpens((opensRes.data || []) as OpenRow[]);
      setClicks((clicksRes.data || []) as ClickRow[]);
    } catch (err: any) {
      console.error('load email analytics failed', err);
      toast.error(err.message || 'Failed to load email analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, range]);

  const dedupedSends = useMemo(() => {
    const map = new Map<string, SendRow>();
    for (const row of sends) {
      const key = row.message_id || row.id;
      const existing = map.get(key);
      if (!existing || new Date(row.created_at) > new Date(existing.created_at)) {
        map.set(key, row);
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [sends]);

  const templates = useMemo(() => {
    const set = new Set<string>();
    dedupedSends.forEach((s) => set.add(s.template_name));
    return Array.from(set).sort();
  }, [dedupedSends]);

  const filtered = useMemo(() => {
    return dedupedSends.filter((s) => {
      if (templateFilter !== 'all' && s.template_name !== templateFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !s.recipient_email.toLowerCase().includes(q) &&
          !s.template_name.toLowerCase().includes(q) &&
          !(s.message_id || '').toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [dedupedSends, templateFilter, statusFilter, search]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const sent = filtered.filter((s) => s.status === 'sent').length;
    const failed = filtered.filter((s) => s.status === 'failed' || s.status === 'dlq' || s.status === 'bounced').length;
    const pending = filtered.filter((s) => s.status === 'pending').length;
    const suppressed = filtered.filter((s) => s.status === 'suppressed' || s.status === 'complained').length;

    const messageIds = new Set(filtered.map((s) => s.message_id).filter(Boolean) as string[]);
    const uniqueOpens = new Set(
      opens.filter((o) => messageIds.has(o.message_id)).map((o) => o.message_id),
    ).size;
    const totalClicks = clicks.filter((c) => messageIds.has(c.message_id)).length;

    return { total, sent, failed, pending, suppressed, uniqueOpens, totalClicks };
  }, [filtered, opens, clicks]);

  const drillData = useMemo(() => {
    if (!drillMessageId) return null;
    const send = dedupedSends.find((s) => s.message_id === drillMessageId);
    const allSends = sends
      .filter((s) => s.message_id === drillMessageId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const emailOpens = opens.filter((o) => o.message_id === drillMessageId);
    const emailClicks = clicks.filter((c) => c.message_id === drillMessageId);
    return { send, allSends, emailOpens, emailClicks };
  }, [drillMessageId, dedupedSends, sends, opens, clicks]);

  if (isChecking || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" />
              Email Analytics
            </h1>
            <p className="text-sm text-muted-foreground">
              Delivery status, opens, and link clicks across all transactional + auth emails.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger><SelectValue placeholder="Time range" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>

          <Select value={templateFilter} onValueChange={setTemplateFilter}>
            <SelectTrigger><SelectValue placeholder="Template" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All templates</SelectItem>
              {templates.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="dlq">DLQ</SelectItem>
              <SelectItem value="suppressed">Suppressed</SelectItem>
              <SelectItem value="bounced">Bounced</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search recipient / template / id"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-foreground' },
          { label: 'Sent', value: stats.sent, color: 'text-emerald-400' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-400' },
          { label: 'Failed', value: stats.failed, color: 'text-red-400' },
          { label: 'Unique opens', value: stats.uniqueOpens, color: 'text-blue-400' },
          { label: 'Link clicks', value: stats.totalClicks, color: 'text-violet-400' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</div>
              <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Send log ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Opens</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>Sent at</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">No emails match the current filters.</TableCell></TableRow>
              ) : filtered.slice(0, 200).map((s) => {
                const opensCount = s.message_id
                  ? opens.filter((o) => o.message_id === s.message_id).length
                  : 0;
                const clicksCount = s.message_id
                  ? clicks.filter((c) => c.message_id === s.message_id).length
                  : 0;
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.template_name}</TableCell>
                    <TableCell className="text-sm">{s.recipient_email}</TableCell>
                    <TableCell><StatusBadge status={s.status} /></TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-sm">
                        <Eye className="h-3 w-3" /> {opensCount}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-sm">
                        <MousePointerClick className="h-3 w-3" /> {clicksCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(s.created_at), 'MMM d, HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!s.message_id}
                        onClick={() => s.message_id && setDrillMessageId(s.message_id)}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filtered.length > 200 && (
            <p className="text-xs text-muted-foreground mt-2">
              Showing first 200 of {filtered.length}. Narrow filters to see more.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!drillMessageId} onOpenChange={(o) => !o && setDrillMessageId(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email details</DialogTitle>
            <DialogDescription className="font-mono text-xs break-all">
              {drillMessageId}
            </DialogDescription>
          </DialogHeader>
          {drillData?.send && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Template</div>
                  <div className="font-mono">{drillData.send.template_name}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Recipient</div>
                  <div>{drillData.send.recipient_email}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Latest status</div>
                  <StatusBadge status={drillData.send.status} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Sent at</div>
                  <div>{format(new Date(drillData.send.created_at), 'PPpp')}</div>
                </div>
              </div>

              {drillData.send.error_message && (
                <div className="rounded border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                  {drillData.send.error_message}
                </div>
              )}

              <div>
                <div className="text-sm font-semibold mb-2">Status timeline</div>
                <div className="space-y-1 text-xs">
                  {drillData.allSends.map((s) => (
                    <div key={s.id} className="flex justify-between gap-3 border-b border-border/50 py-1">
                      <span><StatusBadge status={s.status} /></span>
                      <span className="text-muted-foreground">{format(new Date(s.created_at), 'MMM d HH:mm:ss')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Eye className="h-4 w-4" /> Opens ({drillData.emailOpens.length})
                </div>
                {drillData.emailOpens.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No opens recorded yet.</p>
                ) : (
                  <div className="space-y-1 text-xs">
                    {drillData.emailOpens.map((o) => (
                      <div key={o.id} className="border-b border-border/50 py-1">
                        <div>{format(new Date(o.opened_at), 'MMM d HH:mm:ss')} — {o.ip_address || 'unknown ip'}</div>
                        <div className="text-muted-foreground truncate">{o.user_agent}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <MousePointerClick className="h-4 w-4" /> Link clicks ({drillData.emailClicks.length})
                </div>
                {drillData.emailClicks.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No link clicks recorded yet.</p>
                ) : (
                  <div className="space-y-1 text-xs">
                    {drillData.emailClicks.map((c) => (
                      <div key={c.id} className="border-b border-border/50 py-1">
                        <div className="flex justify-between gap-2">
                          <span className="font-mono">{c.link_key}</span>
                          <span className="text-muted-foreground">{format(new Date(c.clicked_at), 'MMM d HH:mm:ss')}</span>
                        </div>
                        <a
                          href={c.destination_url || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary truncate block"
                        >
                          {c.destination_url}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
