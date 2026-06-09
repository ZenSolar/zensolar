import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function InvestorWhyThisRound() {
  return (
    <>
      <Helmet>
        <title>ZenSolar — Why This Round</title>
        <meta
          name="description"
          content="Transparent breakdown of the $2.5M–$3.5M raise, use of funds, GTM approach, and our two-round path to self-sustainability."
        />
        <link rel="canonical" href="https://www.zensolar.com/investor/why-this-round" />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        <section className="mx-auto max-w-3xl px-5 pt-12 pb-20 md:pt-20">
          <Link
            to="/investor"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Investor Hub
          </Link>

          <div className="mt-8 mb-10">
            <div className="text-[11px] uppercase tracking-[0.28em] text-secondary/90 mb-4">
              Investor Materials
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold leading-[1.05] tracking-tight">
              Why This Round
            </h1>
            <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed">
              A transparent breakdown of the $2.5M–$3.5M raise, use of funds, GTM
              approach, and our two-round path to self-sustainability.
            </p>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/40 p-8 md:p-10">
            <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground mb-3">
              In progress
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">
              Detailed breakdown coming shortly.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              This page will walk through round sizing, milestones each tranche
              unlocks, hiring plan, GTM motion, and the path from seed to
              self-sustainability without a follow-on raise.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/deck"
                className="inline-flex items-center justify-center rounded-xl border border-secondary/40 bg-secondary/10 hover:bg-secondary/20 text-sm font-medium text-foreground px-5 py-3 transition-colors"
              >
                View the Full Deck
              </Link>
              <Link
                to="/investor/one-pager"
                className="inline-flex items-center justify-center rounded-xl border border-border/60 hover:border-secondary/40 text-sm font-medium text-foreground px-5 py-3 transition-colors"
              >
                Read the One-Pager
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
