import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Coins, Compass, Cpu, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';
import { PageShell } from '@/components/layout/PageShell';
import { useLearnTheme } from '@/hooks/useLearnTheme';

/**
 * Learn Hub — intentionally minimal.
 * New users land here and either (a) take the guided tour, or
 * (b) jump straight to a single focused topic page.
 * No glossary, no theme switcher, no quick-link wall — those live elsewhere.
 */

interface Topic {
  title: string;
  blurb: string;
  href: string;
  icon: typeof BookOpen;
  badge: string;
  read: string;
}

const TOPICS: Topic[] = [
  {
    title: 'How It Works',
    blurb: 'Connect → generate → tap → level up. Start here if you\'re new.',
    href: '/learn/how-it-works',
    icon: BookOpen,
    badge: 'Start here',
    read: '2 min',
  },
  {
    title: 'Tokenomics',
    blurb: '1T hard cap, 75/20/3/2 mint split, deflationary by design.',
    href: '/learn/tokenomics',
    icon: Coins,
    badge: 'The numbers',
    read: '3 min',
  },
  {
    title: 'Proof-of-Genesis™',
    blurb: 'Why we don\'t burn energy to make money — we prove it.',
    href: '/learn/proof-of-genesis',
    icon: Sparkles,
    badge: 'The thesis',
    read: '3 min',
  },
  {
    title: 'Patent Tech',
    blurb: 'The four-layer SEGI engine that turns device data into currency.',
    href: '/learn/patent-tech',
    icon: Cpu,
    badge: 'The engine',
    read: '4 min',
  },
];

export default function Learn() {
  const learnTheme = useLearnTheme();

  useEffect(() => {
    document.documentElement.dataset.learnTheme = learnTheme;
    return () => {
      delete document.documentElement.dataset.learnTheme;
    };
  }, [learnTheme]);

  return (
    <>
      <SEO title="Learn" url="https://beta.zen.solar/learn" />
      <div data-learn-theme={learnTheme} className="learn-surface">
        <PageShell
          title="Learn"
          description="Pick a topic, or take the 4-step guided tour."
          icon={BookOpen}
          width="2xl"
        >
          <div className="space-y-6">
            {/* Guided tour — primary CTA for new users */}
            <Card className="learn-card border-primary/40 bg-primary/5">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <Compass className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-base leading-tight">Guided tour</h3>
                      <Badge variant="secondary" className="text-[10px]">Recommended</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      4 short steps. ~10 minutes total. We'll walk you through everything.
                    </p>
                    <Button asChild size="sm" className="mt-3 h-8">
                      <Link to="/learn/tour">
                        Start tour
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Or jump to a single topic */}
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                Or jump to a topic
              </p>
              <div className="grid gap-2.5">
                {TOPICS.map((topic) => (
                  <Link key={topic.href} to={topic.href} className="group block">
                    <Card className="learn-card border-border/60 group-hover:border-primary/50 group-hover:shadow-md transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <topic.icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <h3 className="font-semibold text-sm leading-tight truncate">{topic.title}</h3>
                              <span className="text-[10px] text-muted-foreground font-medium flex-shrink-0">{topic.read}</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-snug line-clamp-1">{topic.blurb}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            {/* Subtle footer link to glossary */}
            <div className="pt-2 text-center">
              <Link
                to="/learn/glossary"
                className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
              >
                Look up a term in the glossary →
              </Link>
            </div>
          </div>
        </PageShell>
      </div>
    </>
  );
}
