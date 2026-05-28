import { useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Loader2, Plus, MessageSquare, Trash2, ChevronLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDeasonThreads } from "@/hooks/useDeasonThreads";
import { DeasonChat } from "@/components/deason/DeasonChat";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Full-page Deason chat with persistent threads.
 * Route shapes:
 *   /deason            → list view (mobile) / picks most-recent thread (desktop), creates one if none.
 *   /deason/:threadId  → opens that thread.
 */
export default function Deason() {
  const { user, isLoading } = useAuth();
  const { threadId } = useParams<{ threadId?: string }>();
  const navigate = useNavigate();
  const {
    threads,
    loading: threadsLoading,
    createThread,
    deleteThread,
    touchThread,
  } = useDeasonThreads();

  // When landing on /deason with no threadId on desktop, jump to most recent
  // or create a new one. On mobile we want to show the list, so only auto-redirect
  // when there's an existing thread to open seamlessly.
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

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this conversation? This cannot be undone.")) return;
    await deleteThread(id);
    if (threadId === id) navigate("/deason", { replace: true });
  };

  const sidebar = (
    <aside className="flex h-full w-full flex-col border-r border-border bg-card md:w-72">
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        <div className="text-sm font-semibold">Conversations</div>
        <Button size="sm" variant="ghost" onClick={handleNewThread} title="New chat">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {threadsLoading && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
        {!threadsLoading && threads.length === 0 && (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            No saved chats yet. Tap <span className="font-medium">+</span> to start one.
          </div>
        )}
        <ul className="space-y-1">
          {threads.map((t) => {
            const active = t.id === threadId;
            return (
              <li key={t.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/deason/${t.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") navigate(`/deason/${t.id}`);
                  }}
                  className={cn(
                    "group flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                    active ? "bg-accent text-foreground" : "hover:bg-accent/60 text-muted-foreground"
                  )}
                >
                  <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="flex-1 truncate">{t.title || "Untitled"}</span>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(t.id, e)}
                    className="opacity-0 group-hover:opacity-100 hover:text-destructive p-1"
                    title="Delete conversation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );

  // Mobile: show either sidebar OR chat (not both). Desktop: side-by-side.
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
            {/* Mobile back-to-list bar */}
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
              onUserMessage={() => touchThread(threadId)}
            />
          </>
        ) : (
          <div className="hidden md:flex h-full items-center justify-center text-sm text-muted-foreground">
            Select a conversation or start a new one.
          </div>
        )}
      </div>
    </div>
  );
}
