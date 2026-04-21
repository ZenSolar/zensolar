import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Archive, ArrowRight, Coins, FileCode, DollarSign, Crown, Lightbulb } from 'lucide-react';

interface ArchivedItem {
  title: string;
  description: string;
  url: string;
  modelName: string;
  archivedDate: string;
  icon: typeof Coins;
  category: 'tokenomics' | 'contracts' | 'fundraising' | 'patent';
}

const ARCHIVED_ITEMS: ArchivedItem[] = [
  {
    title: 'FINAL $ZSOLAR Tokenomics',
    description: 'Original 10B hard cap, 90/7.5/2.5 allocation, $0.10 launch floor, $9.99 subscription.',
    url: '/admin/archive/final-tokenomics-10b',
    modelName: '10B Strategy ($0.10 Floor)',
    archivedDate: 'April 2026',
    icon: Crown,
    category: 'tokenomics',
  },
  {
    title: 'Smart Contracts (10B)',
    description: 'Original Solidity contract parameters: MAX_SUPPLY 10,000,000,000, 75/20/3/2 mint distribution.',
    url: '/admin/archive/contracts-10b',
    modelName: '10B Strategy ($0.10 Floor)',
    archivedDate: 'April 2026',
    icon: FileCode,
    category: 'contracts',
  },
  {
    title: 'Fundraising Plan (10B)',
    description: 'Original fundraising milestones, projections, and circulating supply schedule based on 10B cap.',
    url: '/admin/archive/fundraising-10b',
    modelName: '10B Strategy ($0.10 Floor)',
    archivedDate: 'April 2026',
    icon: DollarSign,
    category: 'fundraising',
  },
  {
    title: 'Mint-on-Proof Patent (v1)',
    description: 'Original patent reference page — pre-Tesla/SpaceX scope expansion, pre-1T cap rationale.',
    url: '/admin/archive/patent-mint-on-proof-v1',
    modelName: '10B Strategy ($0.10 Floor)',
    archivedDate: 'April 2026',
    icon: Lightbulb,
    category: 'patent',
  },
];

const CATEGORY_LABELS = {
  tokenomics: 'Tokenomics',
  contracts: 'Smart Contracts',
  fundraising: 'Fundraising',
  patent: 'Patent',
} as const;

export default function AdminArchive() {
  const grouped = ARCHIVED_ITEMS.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ArchivedItem[]>);

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30">
            <Archive className="h-3.5 w-3.5 mr-2" />
            Time Capsule
          </Badge>
        </div>
        <h1 className="text-3xl font-bold">Tokenomics Model Archive</h1>
        <p className="text-muted-foreground max-w-2xl">
          Frozen, read-only snapshots of every superseded tokenomics model. Use this to look back at exactly 
          what we built before each major economic shift. The current live model is the <span className="font-semibold text-foreground">1T Trillionaire Strategy</span>.
        </p>
      </motion.div>

      {/* Active model callout */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-emerald-500/5 border border-primary/30"
      >
        <div className="flex items-start gap-3">
          <Coins className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Currently Active: 1T Trillionaire Strategy (v2)</p>
            <p className="text-sm text-muted-foreground">
              1,000,000,000,000 hard cap · Joseph 15% / Michael 5% / Treasury 7.5% / Team 2.5% / Community 70% · 
              $19.99 subscription · Built for trillionaire founder outcomes at $1+ token price.
            </p>
          </div>
        </div>
      </motion.div>

      {Object.entries(grouped).map(([category, items], catIdx) => (
        <motion.section
          key={category}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + catIdx * 0.05 }}
          className="space-y-3"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {items.map((item) => (
              <Link key={item.url} to={item.url} className="group">
                <Card className="h-full transition-all hover:border-primary/40 hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10">
                        <item.icon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <CardDescription className="text-xs">
                      {item.modelName} · Archived {item.archivedDate}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </motion.section>
      ))}
    </div>
  );
}
