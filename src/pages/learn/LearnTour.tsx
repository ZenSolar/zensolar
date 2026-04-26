import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Check, Coins, Compass, Cpu, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SEO } from '@/components/SEO';
import { PageShell } from '@/components/layout/PageShell';
import { useLearnTheme } from '@/hooks/useLearnTheme';
import {
  HowItWorksSection,
  TokenomicsSection,
  ProofOfGenesisSection,
  PatentTechSection,
} from '@/components/learn/sections';
import { cn } from '@/lib/utils';

const STEPS = [
  { key: 'how', label: 'How it works', icon: BookOpen, Section: HowItWorksSection },
  { key: 'tokenomics', label: 'Tokenomics', icon: Coins, Section: TokenomicsSection },
  { key: 'proof', label: 'Proof-of-Genesis', icon: Sparkles, Section: ProofOfGenesisSection },
  { key: 'patent', label: 'Patent tech', icon: Cpu, Section: PatentTechSection },
] as const;

export default function LearnTour() {
  const learnTheme = useLearnTheme();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const initial = Math.max(0, Math.min(STEPS.length - 1, Number(params.get('step') ?? 0)));
  const [step, setStep] = useState(initial);

  useEffect(() => {
    document.documentElement.dataset.learnTheme = learnTheme;
    return () => {
      delete document.documentElement.dataset.learnTheme;
    };
  }, [learnTheme]);

  useEffect(() => {
    setParams({ step: String(step) }, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, setParams]);

  const Current = STEPS[step].Section;
  const progress = ((step + 1) / STEPS.length) * 100;
  const isLast = step === STEPS.length - 1;

  return (
    <>
      <SEO title="Guided tour" url="https://beta.zen.solar/learn/tour" />
      <div data-learn-theme={learnTheme} className="learn-surface">
        <PageShell
          title="Guided tour"
          description={`Step ${step + 1} of ${STEPS.length} — ${STEPS[step].label}`}
          icon={Compass}
          width="2xl"
          actions={
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link to="/learn">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Hub
              </Link>
            </Button>
          }
        >
          <div className="space-y-6">
            {/* Progress bar + step pills */}
            <div className="space-y-3 sticky top-0 z-10 bg-background/80 backdrop-blur-sm pb-3 -mx-1 px-1">
              <Progress value={progress} className="h-1.5" />
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1">
                {STEPS.map((s, i) => {
                  const done = i < step;
                  const active = i === step;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setStep(i)}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border whitespace-nowrap transition-all flex-shrink-0',
                        active && 'bg-primary text-primary-foreground border-primary shadow-sm',
                        done && !active && 'bg-primary/10 text-primary border-primary/30',
                        !active && !done && 'bg-card text-muted-foreground border-border/60 hover:border-primary/40',
                      )}
                    >
                      {done ? <Check className="h-3 w-3" /> : <span className="font-bold">{i + 1}</span>}
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active step content */}
            <Card className="learn-card border-border/60">
              <CardContent className="p-5 sm:p-6">
                <Current />
              </CardContent>
            </Card>

            {/* Prev / Next */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="min-w-[96px]"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Back
              </Button>
              <span className="text-[11px] text-muted-foreground font-medium">
                {step + 1} / {STEPS.length}
              </span>
              {isLast ? (
                <Button size="sm" onClick={() => navigate('/learn')} className="min-w-[96px]">
                  Finish
                  <Check className="h-3.5 w-3.5 ml-1" />
                </Button>
              ) : (
                <Button size="sm" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))} className="min-w-[96px]">
                  Next
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </PageShell>
      </div>
    </>
  );
}
