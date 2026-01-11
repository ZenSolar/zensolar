import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Clock, CheckCircle, XCircle, Loader2, User } from "lucide-react";
import { format } from "date-fns";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton } from "@/components/ui/loading-skeleton";

type SupportRequest = {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  category: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
};

const statusColors: Record<string, string> = {
  open: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  in_progress: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  resolved: "bg-green-500/10 text-green-500 border-green-500/20",
  closed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const categoryLabels: Record<string, string> = {
  general: "General",
  technical: "Technical",
  account: "Account",
  solar: "Solar",
  tokens: "Tokens",
  other: "Other",
};

export function SupportRequestsTab() {
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [response, setResponse] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["support-requests", filter],
    queryFn: async () => {
      let query = supabase
        .from("support_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SupportRequest[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, admin_response }: { id: string; status: string; admin_response?: string }) => {
      const updates: Record<string, unknown> = { status };
      if (admin_response) {
        updates.admin_response = admin_response;
      }
      
      const { error } = await supabase
        .from("support_requests")
        .update(updates)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-requests"] });
      toast({ title: "Request updated", description: "The support request has been updated." });
      setSelectedRequest(null);
      setResponse("");
      setNewStatus("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update request.", variant: "destructive" });
    },
  });

  const handleUpdate = () => {
    if (!selectedRequest || !newStatus) return;
    updateMutation.mutate({
      id: selectedRequest.id,
      status: newStatus,
      admin_response: response || undefined,
    });
  };

  const openRequestModal = (request: SupportRequest) => {
    setSelectedRequest(request);
    setNewStatus(request.status);
    setResponse(request.admin_response || "");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Support Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <ListSkeleton count={5} />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Support Requests
              </CardTitle>
              <CardDescription>
                Manage user support requests
              </CardDescription>
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {!requests || requests.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No support requests"
              description="When users submit support requests, they'll appear here."
            />
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => openRequestModal(request)}
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{request.subject}</p>
                      <Badge variant="outline" className={statusColors[request.status]}>
                        {request.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {request.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(request.created_at), "MMM d, h:mm a")}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {categoryLabels[request.category] || request.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedRequest?.subject}</DialogTitle>
            <DialogDescription>
              Submitted {selectedRequest && format(new Date(selectedRequest.created_at), "PPp")}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge variant="secondary">
                  {categoryLabels[selectedRequest.category] || selectedRequest.category}
                </Badge>
                <Badge variant="outline" className={statusColors[selectedRequest.status]}>
                  {selectedRequest.status.replace("_", " ")}
                </Badge>
              </div>
              
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm font-medium mb-1">User Message:</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedRequest.message}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Admin Response (Optional)</label>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Add a response to this request..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Request"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
