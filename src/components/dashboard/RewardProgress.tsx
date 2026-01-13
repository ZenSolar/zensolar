import { Award, TrendingUp, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface RewardProgressProps {
  tokensEarned: number;
  nftsEarned: number[];
  isNewUser?: boolean;
}

const NFT_MILESTONES = [
  { id: 0, name: 'Welcome', kwhRequired: 0, description: 'Sign up reward', color: 'bg-amber-500' },
  { id: 1, name: 'First Harvest', kwhRequired: 500, description: '500 kWh generated', color: 'bg-lime-500' },
  { id: 2, name: 'Solar Pioneer', kwhRequired: 1000, description: '1,000 kWh generated', color: 'bg-emerald-500' },
  { id: 3, name: 'Energy Guardian', kwhRequired: 2500, description: '2,500 kWh generated', color: 'bg-teal-500' },
  { id: 4, name: 'Eco Warrior', kwhRequired: 5000, description: '5,000 kWh generated', color: 'bg-cyan-500' },
  { id: 5, name: 'Green Innovator', kwhRequired: 10000, description: '10,000 kWh generated', color: 'bg-blue-500' },
  { id: 6, name: 'Sustainability Champion', kwhRequired: 25000, description: '25,000 kWh generated', color: 'bg-indigo-500' },
  { id: 7, name: 'Renewable Hero', kwhRequired: 50000, description: '50,000 kWh generated', color: 'bg-purple-500' },
  { id: 8, name: 'Zen Master', kwhRequired: 100000, description: '100,000 kWh generated', color: 'bg-rose-500' },
];

export function RewardProgress({ tokensEarned, nftsEarned, isNewUser = true }: RewardProgressProps) {
  // Calculate total kWh from tokens (assuming 1 token per kWh for now)
  const totalKwh = tokensEarned;
  
  // Check which NFTs are earned
  const earnedMilestones = NFT_MILESTONES.filter((m) => {
    if (m.id === 0) return isNewUser; // Welcome NFT earned on signup
    return totalKwh >= m.kwhRequired;
  });

  // Find next milestone
  const nextMilestone = NFT_MILESTONES.find(
    (m) => m.id !== 0 && totalKwh < m.kwhRequired
  );

  // Calculate progress to next milestone
  const previousThreshold = 0;
  const progress = nextMilestone
    ? (totalKwh / nextMilestone.kwhRequired) * 100
    : 100;

  const kwhNeeded = nextMilestone
    ? nextMilestone.kwhRequired - totalKwh
    : 0;

  return (
    <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            <CardTitle className="text-base font-semibold">
              NFT Milestones
            </CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs gap-1">
            <Sparkles className="h-3 w-3" />
            Beta
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Earned NFTs */}
        {earnedMilestones.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Earned</p>
            <div className="flex flex-wrap gap-2">
              {earnedMilestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium text-white ${milestone.color}`}
                >
                  <Award className="h-3 w-3 inline mr-1" />
                  {milestone.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next milestone progress */}
        {nextMilestone && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Next: <strong className="text-foreground">{nextMilestone.name}</strong>
              </span>
              <span className="text-muted-foreground">
                {totalKwh.toLocaleString()} / {nextMilestone.kwhRequired.toLocaleString()} kWh
              </span>
            </div>
            <Progress value={Math.min(progress, 100)} className="h-3" />
            <p className="text-xs text-muted-foreground text-center">
              Generate <strong>{kwhNeeded.toLocaleString()} more kWh</strong> to unlock {nextMilestone.name} NFT
            </p>
          </div>
        )}

        {!nextMilestone && earnedMilestones.length === NFT_MILESTONES.length && (
          <p className="text-sm text-center text-muted-foreground">
            🎉 You've earned all available NFTs!
          </p>
        )}

        {/* Milestone roadmap - show first 5 for clean display */}
        <div className="flex justify-around items-center pt-2 overflow-x-auto">
          {NFT_MILESTONES.slice(0, 5).map((milestone, index) => {
            const earned = earnedMilestones.some((m) => m.id === milestone.id);
            const isNext = milestone.id === nextMilestone?.id;
            return (
              <div
                key={milestone.id}
                className="flex flex-col items-center gap-1 min-w-[50px]"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                    earned
                      ? `${milestone.color} text-white`
                      : isNext
                      ? 'border-2 border-primary bg-primary/20'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {earned ? '✓' : index + 1}
                </div>
                <span className="text-[10px] text-muted-foreground text-center max-w-[60px] truncate">
                  {milestone.name}
                </span>
                <span className="text-[9px] text-muted-foreground/70">
                  {milestone.id === 0 ? 'Signup' : `${(milestone.kwhRequired / 1000).toFixed(milestone.kwhRequired < 1000 ? 1 : 0)}k kWh`}
                </span>
              </div>
            );
          })}
          {/* Show "more" indicator */}
          <div className="flex flex-col items-center gap-1 min-w-[50px]">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs bg-muted text-muted-foreground">
              +{NFT_MILESTONES.length - 5}
            </div>
            <span className="text-[10px] text-muted-foreground text-center">
              More
            </span>
            <span className="text-[9px] text-muted-foreground/70">
              Milestones
            </span>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground/60 text-center pt-1">
          More milestones coming soon as the platform grows
        </p>
      </CardContent>
    </Card>
  );
}
