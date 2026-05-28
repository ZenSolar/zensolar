import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Loader2, Plus, MessageSquare, Trash2, ChevronLeft, Pin, PinOff, Pencil, Check, X, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDeasonThreads, type DeasonThread } from "@/hooks/useDeasonThreads";
import { DeasonChat } from "@/components/deason/DeasonChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
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

const SEARCH_PAGE_SIZE = 25;
const UNDO_GRACE_MS = 8000;

/**
 * Full-page Deason chat with persistent threads, pin/rename/delete, paginated
 * search, and undoable deletes.
 */
export default function Deason() {
  const { user, isLoading } = useAuth();
  const { threadId } = useParams<{ threadId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
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
  const [searchLimit, setSearchLimit] = useState(SEARCH_PAGE_SIZE);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasMoreMatches, setHasMoreMatches] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  // Threads queued for hard-delete after grace period; hidden from sidebar.
  const [pendingUndo, setPendingUndo] = useState<Set<string>>(new Set());
  const undoTimers = useRef<Map<string, number>>(new Map());
  const searchTimer = useRef<number | null>(null);
  const listScrollRef = useRef<HTMLDivElement>(null);

  // Reset pagination on query change.
  useEffect(() => {
    setSearchLimit(SEARCH_PAGE_SIZE);
  }, [query]);

  // Auto-redirect on desktop only.
  useEffect(() => {
    if (isLoading || threadsLoading || !user || threadId) return;
    const isDesktop = typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
    if (!isDesktop) return;
    const visible = threads.filter((t) => !pendingUndo.has(t.id));
    if (visible.length > 0) {
      navigate(`/deason/${visible[0].id}`, { replace: true });
    } else {
      void (async () => {
        const t = await createThread();
        if (t) navigate(`/deason/${t.id}`, { replace: true });
      })();
    }
  }, [isLoading, threadsLoading, user, threadId, threads, pendingUndo, createThread, navigate]);

  // Debounced, paginated server-side search across the user's messages.
  useEffect(() => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    const q = query.trim();
    if (!q || !user) {
      setMessageMatches({});
      setHasMoreMatches(false);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    searchTimer.current = window.setTimeout(async () => {
      const { data } = await supabase
        .from("deason_messages")
        .select("thread_id,content")
        .eq("user_id", user.id)
        .ilike("content", `%${q}%`)
        .order("created_at", { ascending: false })
        .range(0, searchLimit - 1);
      const rows = data ?? [];
      setHasMoreMatches(rows.length >= searchLimit);
      const map: Record<string, string> = {};
      rows.forEach((row: any) => {
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
      setSearchLoading(false);
    }, 250);
    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
  }, [query, user, searchLimit]);

  // Infinite-scroll: load more matches as user nears bottom of list.
  const handleScroll = useCallback(() => {
    const el = listScrollRef.current;
    if (!el || !query.trim() || searchLoading || !hasMoreMatches) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
      setSearchLimit((n) => n + SEARCH_PAGE_SIZE);
    }
  }, [query, searchLoading, hasMoreMatches]);

  const filteredThreads = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible = threads.filter((t) => !pendingUndo.has(t.id));
    if (!q) return visible;
    return visible.filter(
      (t) => t.title.toLowerCase().includes(q) || !!messageMatches[t.id]
    );
  }, [threads, pendingUndo, query, messageMatches]);

  // Clean up any pending timers on unmount.
  useEffect(
    () => () => {
      undoTimers.current.forEach((id) => window.clearTimeout(id));
      undoTimers.current.clear();
    },
    []
  );

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

  const performHardDelete = async (id: string) => {
    undoTimers.current.delete(id);
    await deleteThread(id);
    setPendingUndo((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const undoDelete = (id: string) => {
    const t = undoTimers.current.get(id);
    if (t) window.clearTimeout(t);
    undoTimers.current.delete(id);
    setPendingUndo((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const id = pendingDelete;
    const target = threads.find((t) => t.id === id);
    setPendingDelete(null);

    // Optimistically hide + navigate away. Real DB delete is deferred so the
    // user has a chance to undo.
    setPendingUndo((prev) => new Set(prev).add(id));
    if (threadId === id) navigate("/deason", { replace: true });

    const timer = window.setTimeout(() => {
      void performHardDelete(id);
    }, UNDO_GRACE_MS);
    undoTimers.current.set(id, timer);

    toast({
      title: "Conversation deleted",
      description: target?.title ? `"${target.title}"` : "Removed from your saved chats.",
      duration: UNDO_GRACE_MS,
      action: (
        <ToastAction altText="Undo delete" onClick={() => undoDelete(id)}>
          Undo
        </ToastAction>
      ),
    });
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
      <div
        ref={listScrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-2"
      >
        {threadsLoading && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
        {!threadsLoading && filteredThreads.length === 0 && (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            {query.trim()
              ? searchLoading ? "Searching…" : "No matches."
              : <>No saved chats yet. Tap <span className="font-medium">+</span> to start one.</>}
          </div>
        )}
        <ul className="space-y-1">
          {filteredThreads.map((t) => (
            <ThreadRow
              key={t.id}
              t={t}
              active={t.id === threadId}
              editing={editingId === t.id}
              editingTitle={editingTitle}
              setEditingTitle={setEditingTitle}
              snippet={messageMatches[t.id]}
              onOpen={() => handleOpenThread(t.id)}
              onStartRename={(e) => startRename(t.id, t.title, e)}
              onCommitRename={() => void commitRename()}
              onCancelRename={() => {
                setEditingId(null);
                setEditingTitle("");
              }}
              onTogglePin={() => void togglePin(t.id)}
              onDelete={() => setPendingDelete(t.id)}
            />
          ))}
        </ul>
        {query.trim() && hasMoreMatches && (
          <div className="flex justify-center py-3">
            {searchLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchLimit((n) => n + SEARCH_PAGE_SIZE)}
                className="h-7 text-xs"
              >
                Load more matches
              </Button>
            )}
          </div>
        )}
      </div>
    </aside>
  );

  const highlightQuery = searchParams.get("q") ?? undefined;

  return (
    <div className="mx-auto flex h-[100svh] w-full max-w-5xl">
      <div className={cn("h-full w-full md:flex md:w-72", threadId ? "hidden md:flex" : "flex")}>
        {sidebar}
      </div>

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
                  will be removed. You can undo for a few seconds before it's permanent.
                </>
              ) : (
                "This conversation will be removed. You can undo for a few seconds before it's permanent."
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

interface ThreadRowProps {
  t: DeasonThread;
  active: boolean;
  editing: boolean;
  editingTitle: string;
  setEditingTitle: (v: string) => void;
  snippet?: string;
  onOpen: () => void;
  onStartRename: (e: React.MouseEvent) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}

function ThreadRow({
  t, active, editing, editingTitle, setEditingTitle, snippet,
  onOpen, onStartRename, onCommitRename, onCancelRename, onTogglePin, onDelete,
}: ThreadRowProps) {
  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !editing && onOpen()}
        onKeyDown={(e) => {
          if (!editing && e.key === "Enter") onOpen();
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
          {editing ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Input
                autoFocus
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onCommitRename();
                  if (e.key === "Escape") onCancelRename();
                }}
                className="h-7 text-sm"
              />
              <button type="button" onClick={onCommitRename} className="p-1 text-foreground hover:text-primary" title="Save">
                <Check className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={onCancelRename} className="p-1 hover:text-destructive" title="Cancel">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <>
              <div className="truncate">{t.title || "Untitled"}</div>
              {snippet && (
                <div className="mt-0.5 truncate text-[11px] text-muted-foreground/80">{snippet}</div>
              )}
            </>
          )}
        </div>
        {!editing && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
              className="p-1 hover:text-amber-500"
              title={t.pinned ? "Unpin" : "Pin to top"}
            >
              {t.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={onStartRename}
              className="p-1 hover:text-foreground"
              title="Rename"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
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
}
