import { useEffect } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useState, useMemo, useRef } from "react";
import { Loader2, Plus, MessageSquare, Trash2, ChevronLeft, Pin, PinOff, Pencil, Check, X, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDeasonThreads } from "@/hooks/useDeasonThreads";
import { DeasonChat } from "@/components/deason/DeasonChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface MessageMatch {
  thread_id: string;
  snippet: string;
}

/**
 * Full-page Deason chat with persistent threads, pin/rename/delete, and search.
 */
export default function Deason() {
  const { user, isLoading } = useAuth();
  const { threadId } = useParams<{ threadId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    threads,
    loading: threadsLoading,
    createThread,
    deleteThread,
    renameThread,
    togglePin,
    touchThread,
  } = useDeasonThreads();

  const [query, setQuery] = useState("");
  const [messageMatches, setMessageMatches] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const searchTimer = useRef<number | null>(null);

  // Auto-redirect on desktop only.
  useEffect(() => {
    if (isLoading || threadsLoading || !user || threadId) return;
    const isDesktop = typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
    if (!isDesktop) return;
    if (threads.length > 0) {
      navigate(`/deason/${threads[0].id}`, { replace: true });
    } else {
      void (async () => {
        const t = await createThread();
        if (t) navigate(`/deason/${t.id}`, { replace: true });
      })();
    }
  }, [isLoading, threadsLoading, user, threadId, threads, createThread, navigate]);

  // Debounced server-side search over deason_messages content for the current user.
  useEffect(() => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    const q = query.trim();
    if (!q || !user) {
      setMessageMatches({});
      return;
    }
    searchTimer.current = window.setTimeout(async () => {
      const { data } = await supabase
        .from("deason_messages")
        .select("thread_id,content")
        .eq("user_id", user.id)
        .ilike("content", `%${q}%`)
        .order("created_at", { ascending: false })
        .limit(50);
      const map: Record<string, string> = {};
      (data ?? []).forEach((row: any) => {
        if (map[row.thread_id]) return;
        const text =
          typeof row.content === "string"
            ? row.content
            : Array.isArray(row.content)
            ? row.content.find((p: any) => p.type === "text")?.text ?? ""
            : "";
        const idx = text.toLowerCase().indexOf(q.toLowerCase());
        if (idx < 0) return;
        const start = Math.max(0, idx - 30);
        map[row.thread_id] = (start > 0 ? "…" : "") + text.slice(start, idx + q.length + 60) + "…";
      });
      setMessageMatches(map);
    }, 250);
    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
  }, [query, user]);

  const filteredThreads = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter(
      (t) => t.title.toLowerCase().includes(q) || !!messageMatches[t.id]
    );
  }, [threads, query, messageMatches]);

  if (isLoading) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  const handleNewThread = async () => {
    const t = await createThread();
    if (t) navigate(`/deason/${t.id}`);
  };

  const handleOpenThread = (id: string) => {
    const q = query.trim();
    navigate(q ? `/deason/${id}?q=${encodeURIComponent(q)}` : `/deason/${id}`);
  };

  const startRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditingTitle(currentTitle);
  };

  const commitRename = async () => {
    if (!editingId) return;
    await renameThread(editingId, editingTitle);
    setEditingId(null);
    setEditingTitle("");
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete;
    setPendingDelete(null);
    const ok = await deleteThread(id);
    if (ok && threadId === id) navigate("/deason", { replace: true });
  };

  const pendingDeleteThread = threads.find((t) => t.id === pendingDelete);

  const sidebar = (
    <aside className="flex h-full w-full flex-col border-r border-border bg-card md:w-72">
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        <div className="text-sm font-semibold">Conversations</div>
        <Button size="sm" variant="ghost" onClick={handleNewThread} title="New chat">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations…"
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {threadsLoading && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
        {!threadsLoading && filteredThreads.length === 0 && (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            {query.trim()
              ? "No matches."
              : <>No saved chats yet. Tap <span className="font-medium">+</span> to start one.</>}
          </div>
        )}
        <ul className="space-y-1">
          {filteredThreads.map((t) => {
            const active = t.id === threadId;
            const isEditing = editingId === t.id;
            const snippet = messageMatches[t.id];
            return (
              <li key={t.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => !isEditing && handleOpenThread(t.id)}
                  onKeyDown={(e) => {
                    if (!isEditing && e.key === "Enter") handleOpenThread(t.id);
                  }}
                  className={cn(
                    "group flex cursor-pointer items-start gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                    active ? "bg-accent text-foreground" : "hover:bg-accent/60 text-muted-foreground"
                  )}
                >
                  {t.pinned ? (
                    <Pin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                  ) : (
                    <MessageSquare className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Input
                          autoFocus
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void commitRename();
                            if (e.key === "Escape") {
                              setEditingId(null);
                              setEditingTitle("");
                            }
                          }}
                          className="h-7 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => void commitRename()}
                          className="p-1 text-foreground hover:text-primary"
                          title="Save"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditingTitle("");
                          }}
                          className="p-1 hover:text-destructive"
                          title="Cancel"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="truncate">{t.title || "Untitled"}</div>
                        {snippet && (
                          <div className="mt-0.5 truncate text-[11px] text-muted-foreground/80">
                            {snippet}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void togglePin(t.id);
                        }}
                        className="p-1 hover:text-amber-500"
                        title={t.pinned ? "Unpin" : "Pin to top"}
                      >
                        {t.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => startRename(t.id, t.title, e)}
                        className="p-1 hover:text-foreground"
                        title="Rename"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingDelete(t.id);
                        }}
                        className="p-1 hover:text-destructive"
                        title="Delete conversation"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );

  const highlightQuery = searchParams.get("q") ?? undefined;

  return (
    <div className="mx-auto flex h-[100svh] w-full max-w-5xl">
      {/* Sidebar */}
      <div className={cn("h-full w-full md:flex md:w-72", threadId ? "hidden md:flex" : "flex")}>
        {sidebar}
      </div>

      {/* Chat pane */}
      <div className={cn("h-full flex-1 flex-col", threadId ? "flex" : "hidden md:flex")}>
        {threadId ? (
          <>
            <div className="flex items-center gap-2 border-b border-border bg-card px-2 py-1.5 md:hidden">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate("/deason")}
                className="h-8"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> All chats
              </Button>
            </div>
            <DeasonChat
              key={threadId}
              threadId={threadId}
              highlightQuery={highlightQuery}
              onUserMessage={() => touchThread(threadId)}
            />
          </>
        ) : (
          <div className="hidden md:flex h-full items-center justify-center text-sm text-muted-foreground">
            Select a conversation or start a new one.
          </div>
        )}
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteThread ? (
                <>
                  &ldquo;<span className="font-medium text-foreground">{pendingDeleteThread.title || "Untitled"}</span>&rdquo;
                  and all its messages will be permanently removed from your account. This cannot be undone.
                </>
              ) : (
                "All messages in this conversation will be permanently removed. This cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
