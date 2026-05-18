import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { isAuthorizedReviewer } from '@/lib/reviewerAccess';

/** Persistent banner shown only to NDA-signed reviewers (e.g. Greg). */
export function ReviewerWelcomeBanner() {
  if (!isAuthorizedReviewer()) return null;

  return (
    <div className="mx-auto mt-3 max-w-5xl px-4">
      <Link
        to="/demo/reviewer"
        className="group flex flex-col gap-2 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-3 backdrop-blur transition hover:border-primary/50 hover:from-primary/15 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Reviewer access
            </div>
            <div className="truncate text-sm text-foreground">
              Your private seed pitch + companion deck are ready
            </div>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
          Open reviewer hub
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </div>
      </Link>
    </div>
  );
}
