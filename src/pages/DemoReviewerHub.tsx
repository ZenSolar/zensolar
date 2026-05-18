import { Link, Navigate } from 'react-router-dom';
import { ArrowRight, FileText, Presentation, ShieldCheck } from 'lucide-react';
import { isAuthorizedReviewer, getReviewerEmail, REVIEWER_PAGES } from '@/lib/reviewerAccess';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

const ICONS = [FileText, Presentation];

export default function DemoReviewerHub() {
  if (!isAuthorizedReviewer()) return <Navigate to="/demo" replace />;
  const email = getReviewerEmail();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:py-16">
      <div className="mb-10 flex flex-col items-start gap-4">
        <img src={zenLogo} alt="ZenSolar" className="h-8 w-auto" />
        <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          <ShieldCheck className="h-3.5 w-3.5" />
          NDA on file · Reviewer access
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          Welcome, Greg.
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          Below are the two private documents prepared for your review. You also have full access to
          the live ZenSolar demo via the sidebar — feel free to explore the product end-to-end.
        </p>
        {email && (
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
            Signed as {email}
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {REVIEWER_PAGES.map((page, i) => {
          const Icon = ICONS[i] ?? FileText;
          return (
            <Link
              key={page.path}
              to={page.path}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 p-6 backdrop-blur transition hover:border-primary/50 hover:bg-card"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-foreground">{page.title}</h2>
              <p className="mb-6 text-sm text-muted-foreground">{page.description}</p>
              <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                Open
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-10 rounded-xl border border-border/60 bg-muted/20 p-5 text-sm text-muted-foreground">
        Both pages are confidential and covered by the NDA you signed. Please don't share these
        URLs. Questions? Reply directly to the email that sent you the access code.
      </div>
    </div>
  );
}
