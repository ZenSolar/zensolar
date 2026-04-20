import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle2, Clock, ExternalLink, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface MintRequest {
  id: string;
  access_code: string | null;
  requester_name: string | null;
  requester_email: string | null;
  source: string;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
  resolved: boolean;
  resolved_at: string | null;
}

export default function AdminMintRequests() {
  const { user } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useAdminCheck();
  const [requests, setRequests] = useState<MintRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"open" | "resolved" | "all">("open");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("mint_access_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load requests");
      console.error(error);
    } else {
      setRequests((data ?? []) as MintRequest[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user && isAdmin) load();
  }, [user, isAdmin]);

  const toggleResolved = async (req: MintRequest) => {
    const next = !req.resolved;
    const { error } = await supabase
      .from("mint_access_requests")
      .update({
        resolved: next,
        resolved_at: next ? new Date().toISOString() : null,
        resolved_by: next ? user?.id ?? null : null,
      })
      .eq("id", req.id);
    if (error) {
      toast.error("Update failed");
      return;
    }
    toast.success(next ? "Marked resolved" : "Reopened");
    setRequests((prev) =>
      prev.map((r) =>
        r.id === req.id
          ? { ...r, resolved: next, resolved_at: next ? new Date().toISOString() : null }
          : r,
      ),
    );
  };

  if (roleLoading) {
    return (
      <div className="container max-w-4xl py-8 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container max-w-md py-16 text-center">
        <h1 className="text-xl font-semibold">Admins only</h1>
        <p className="text-muted-foreground text-sm mt-2">
          You don't have access to this page.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/">Go home</Link>
        </Button>
      </div>
    );
  }

  const filtered = requests.filter((r) =>
    tab === "open" ? !r.resolved : tab === "resolved" ? r.resolved : true,
  );

  const openCount = requests.filter((r) => !r.resolved).length;

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <Helmet>
        <title>Mint Access Requests | Admin</title>
        <meta name="description" content="Manage incoming mint access requests from VIP demo viewers." />
      </Helmet>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link to="/admin" aria-label="Back to admin">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mint Access Requests</h1>
            <p className="text-sm text-muted-foreground">
              People who tapped "Want to mint? Text Joe" from the demo.
            </p>
          </div>
        </div>
        {openCount > 0 && (
          <Badge variant="default" className="text-sm">
            {openCount} open
          </Badge>
        )}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-3">
          {loading ? (
            <>
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Inbox className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No requests here</p>
                <p className="text-sm mt-1">
                  {tab === "open" ? "All caught up." : "Nothing to show."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((r) => (
              <Card key={r.id} className={r.resolved ? "opacity-70" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {r.requester_name || r.requester_email || r.access_code || "Anonymous"}
                        {r.access_code && (
                          <Badge variant="outline" className="font-mono text-xs">
                            {r.access_code}
                          </Badge>
                        )}
                        {r.resolved ? (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Resolved
                          </Badge>
                        ) : (
                          <Badge className="gap-1">
                            <Clock className="h-3 w-3" /> Open
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                        {r.requester_email && ` · ${r.requester_email}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                      >
                        <a
                          href={`sms:+17202246234?&body=${encodeURIComponent(
                            `Hey ${r.requester_name || "there"} — saw your mint request. Let's get you set up.`,
                          )}`}
                        >
                          <ExternalLink className="h-3.5 w-3.5 mr-1" />
                          Text
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        variant={r.resolved ? "outline" : "default"}
                        onClick={() => toggleResolved(r)}
                      >
                        {r.resolved ? "Reopen" : "Mark resolved"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-muted-foreground space-y-1">
                  <div>Source: <span className="font-mono">{r.source}</span></div>
                  {r.ip_address && <div>IP: <span className="font-mono">{r.ip_address}</span></div>}
                  {r.user_agent && (
                    <div className="line-clamp-1">UA: <span className="font-mono">{r.user_agent}</span></div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
