import { Award, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface RewardProgressProps {
  tokensEarned: number;
  nftsEarned: number[];
}

const NFT_MILESTONES = [
  { name: 'Seedling', tokensRequired: 100, color: 'bg-emerald-500' },
  { name: 'Sprout', tokensRequired: 500, color: 'bg-green-500' },
  { name: 'Sapling', tokensRequired: 1000, color: 'bg-teal-500' },
  { name: 'Tree', tokensRequired: 5000, color: 'bg-cyan-500' },
  { name: 'Forest', tokensRequired: 10000, color: 'bg-primary' },
];

// Map NFT IDs to milestone names
const getNftNames = (nftIds: number[]): string[] => {
  return nftIds.map((id) => NFT_MILESTONES[id]?.name).filter(Boolean) as string[];
};

export function RewardProgress({ tokensEarned, nftsEarned }: RewardProgressProps) {
  const earnedNames = getNftNames(nftsEarned);
  
  // Find next milestone
  const nextMilestone = NFT_MILESTONES.find(
    (m) => !earnedNames.includes(m.name) && tokensEarned < m.tokensRequired
  );

  // Find previous milestone for progress calculation
  const currentMilestoneIndex = nextMilestone
    ? NFT_MILESTONES.indexOf(nextMilestone)
    : NFT_MILESTONES.length;
  const previousThreshold =
    currentMilestoneIndex > 0
      ? NFT_MILESTONES[currentMilestoneIndex - 1].tokensRequired
      : 0;

  const progress = nextMilestone
    ? ((tokensEarned - previousThreshold) /
        (nextMilestone.tokensRequired - previousThreshold)) *
      100
    : 100;

  const tokensNeeded = nextMilestone
    ? nextMilestone.tokensRequired - tokensEarned
    : 0;

  return (
    <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent" />
          <CardTitle className="text-base font-semibold">
            NFT Progress
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Earned NFTs */}
        {earnedNames.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {earnedNames.map((nft) => {
              const milestone = NFT_MILESTONES.find((m) => m.name === nft);
              return (
                <div
                  key={nft}
                  className={`px-3 py-1 rounded-full text-xs font-medium text-white ${
                    milestone?.color || 'bg-primary'
                  }`}
                >
                  <Award className="h-3 w-3 inline mr-1" />
                  {nft}
                </div>
              );
            })}
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
                {tokensEarned.toLocaleString()} / {nextMilestone.tokensRequired.toLocaleString()}
              </span>
            </div>
            <Progress value={Math.min(progress, 100)} className="h-3" />
            <p className="text-xs text-muted-foreground text-center">
              Earn <strong>{tokensNeeded.toLocaleString()} more $ZSOLAR</strong> to unlock {nextMilestone.name} NFT
            </p>
          </div>
        )}

        {!nextMilestone && (
          <p className="text-sm text-center text-muted-foreground">
            🎉 You've earned all available NFTs!
          </p>
        )}

        {/* Milestone roadmap */}
        <div className="flex justify-between items-center pt-2">
          {NFT_MILESTONES.map((milestone, index) => {
            const earned = earnedNames.includes(milestone.name);
            const isNext = milestone.name === nextMilestone?.name;
            return (
              <div
                key={milestone.name}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    earned
                      ? `${milestone.color} text-white`
                      : isNext
                      ? 'border-2 border-primary bg-primary/20'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {earned ? '✓' : index + 1}
                </div>
                <span className="text-[10px] text-muted-foreground hidden sm:block">
                  {milestone.name}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
