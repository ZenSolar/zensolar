import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  LayoutGrid,
  Crown,
  Sparkles,
  CheckCircle2,
  Lock,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { NFTBadge } from '@/components/ui/nft-badge';
import { getNftArtwork } from '@/lib/nftArtwork';
import type { NFTMilestone } from '@/lib/nftMilestones';

// Rarity configuration
const RARITY_CONFIG = {
  common: {
    label: 'Common',
    gradient: 'from-slate-400 to-slate-500',
    glow: 'shadow-slate-500/20',
    border: 'border-slate-400/30',
    bg: 'bg-slate-500/10',
  },
  uncommon: {
    label: 'Uncommon',
    gradient: 'from-emerald-400 to-emerald-600',
    glow: 'shadow-emerald-500/30',
    border: 'border-emerald-400/40',
    bg: 'bg-emerald-500/10',
  },
  rare: {
    label: 'Rare',
    gradient: 'from-blue-400 to-cyan-500',
    glow: 'shadow-blue-500/40',
    border: 'border-blue-400/50',
    bg: 'bg-blue-500/10',
  },
  epic: {
    label: 'Epic',
    gradient: 'from-purple-500 to-pink-500',
    glow: 'shadow-purple-500/50',
    border: 'border-purple-400/60',
    bg: 'bg-purple-500/15',
  },
  legendary: {
    label: 'Legendary',
    gradient: 'from-amber-400 to-orange-500',
    glow: 'shadow-amber-500/60',
    border: 'border-amber-400/70',
    bg: 'bg-amber-500/15',
  },
  mythic: {
    label: 'Mythic',
    gradient: 'from-rose-500 via-amber-400 to-rose-500',
    glow: 'shadow-rose-500/70',
    border: 'border-rose-400/80',
    bg: 'bg-rose-500/20',
  },
};

type RarityKey = keyof typeof RARITY_CONFIG;

function getRarityFromTier(tier: number, isCombo: boolean = false): RarityKey {
  if (isCombo) {
    if (tier >= 7) return 'mythic';
    if (tier >= 5) return 'legendary';
    if (tier >= 3) return 'epic';
    return 'rare';
  }
  if (tier >= 8) return 'legendary';
  if (tier >= 6) return 'epic';
  if (tier >= 4) return 'rare';
  if (tier >= 2) return 'uncommon';
  return 'common';
}

function getTierFromId(id: string): number {
  if (id === 'welcome') return 0;
  const parts = id.split('_');
  return parseInt(parts[1]) || 1;
}

function getCategoryFromId(id: string): string {
  if (id === 'welcome') return 'welcome';
  if (id.startsWith('solar_')) return 'solar';
  if (id.startsWith('battery_')) return 'battery';
  if (id.startsWith('charge_')) return 'charging';
  if (id.startsWith('ev_')) return 'ev';
  if (id.startsWith('combo_')) return 'combo';
  return 'unknown';
}

interface NFTGalleryProps {
  earnedMilestones: Set<string>;
  allMilestones: NFTMilestone[];
  onSelectNFT: (milestone: NFTMilestone) => void;
}

type SortOption = 'tier-asc' | 'tier-desc' | 'name' | 'category' | 'earned';
type FilterOption = 'all' | 'earned' | 'locked' | 'solar' | 'battery' | 'charging' | 'ev' | 'combo';

export function NFTGallery({ earnedMilestones, allMilestones, onSelectNFT }: NFTGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('tier-asc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [viewMode, setViewMode] = useState<'masonry' | 'grid'>('masonry');
  const [showFilters, setShowFilters] = useState(false);

  const filteredAndSortedNFTs = useMemo(() => {
    let result = [...allMilestones];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(nft => 
        nft.name.toLowerCase().includes(query) ||
        nft.description.toLowerCase().includes(query)
      );
    }

    // Apply category/status filter
    if (filterBy !== 'all') {
      if (filterBy === 'earned') {
        result = result.filter(nft => earnedMilestones.has(nft.id));
      } else if (filterBy === 'locked') {
        result = result.filter(nft => !earnedMilestones.has(nft.id));
      } else {
        result = result.filter(nft => getCategoryFromId(nft.id) === filterBy);
      }
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'tier-asc':
          return getTierFromId(a.id) - getTierFromId(b.id);
        case 'tier-desc':
          return getTierFromId(b.id) - getTierFromId(a.id);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'category':
          return getCategoryFromId(a.id).localeCompare(getCategoryFromId(b.id));
        case 'earned':
          const aEarned = earnedMilestones.has(a.id) ? 0 : 1;
          const bEarned = earnedMilestones.has(b.id) ? 0 : 1;
          return aEarned - bEarned;
        default:
          return 0;
      }
    });

    return result;
  }, [allMilestones, searchQuery, sortBy, filterBy, earnedMilestones]);

  const earnedCount = allMilestones.filter(nft => earnedMilestones.has(nft.id)).length;

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{earnedCount}</p>
              <p className="text-xs text-muted-foreground">NFTs Earned</p>
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{allMilestones.length - earnedCount}</p>
              <p className="text-xs text-muted-foreground">Locked</p>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'masonry' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('masonry')}
            className="h-9 w-9"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className="h-9 w-9"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search NFTs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Select value={filterBy} onValueChange={(v) => setFilterBy(v as FilterOption)}>
            <SelectTrigger className="w-[130px] bg-muted/50">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All NFTs</SelectItem>
              <SelectItem value="earned">Earned</SelectItem>
              <SelectItem value="locked">Locked</SelectItem>
              <SelectItem value="solar">Solar</SelectItem>
              <SelectItem value="battery">Battery</SelectItem>
              <SelectItem value="charging">Charging</SelectItem>
              <SelectItem value="ev">EV Miles</SelectItem>
              <SelectItem value="combo">Combo</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[140px] bg-muted/50">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tier-asc">Tier: Low → High</SelectItem>
              <SelectItem value="tier-desc">Tier: High → Low</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
              <SelectItem value="category">Category</SelectItem>
              <SelectItem value="earned">Earned First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters */}
      {(searchQuery || filterBy !== 'all') && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              "{searchQuery}"
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery('')} />
            </Badge>
          )}
          {filterBy !== 'all' && (
            <Badge variant="secondary" className="gap-1 capitalize">
              {filterBy}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterBy('all')} />
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={() => {
              setSearchQuery('');
              setFilterBy('all');
            }}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredAndSortedNFTs.length} of {allMilestones.length} NFTs
      </p>

      {/* NFT Grid */}
      <AnimatePresence mode="popLayout">
        <motion.div
          className={viewMode === 'masonry' 
            ? "columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4"
            : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          }
        >
          {filteredAndSortedNFTs.map((nft, index) => {
            const isEarned = earnedMilestones.has(nft.id);
            const tier = getTierFromId(nft.id);
            const isCombo = nft.id.startsWith('combo_');
            const rarity = getRarityFromTier(tier, isCombo);
            const config = RARITY_CONFIG[rarity];
            const artwork = getNftArtwork(nft.id);

            // Masonry uses break-inside-avoid
            const cardStyle = viewMode === 'masonry' ? { breakInside: 'avoid' as const } : {};

            return (
              <motion.div
                key={nft.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.02, duration: 0.3 }}
                style={cardStyle}
                className={viewMode === 'masonry' ? 'mb-4' : ''}
              >
                <button
                  onClick={() => onSelectNFT(nft)}
                  className={`
                    group relative w-full overflow-hidden rounded-2xl 
                    border-2 transition-all duration-300
                    ${isEarned 
                      ? `${config.border} ${config.bg} hover:shadow-xl hover:${config.glow}` 
                      : 'border-border/50 bg-muted/30 hover:border-border'
                    }
                    ${!isEarned && 'grayscale hover:grayscale-0'}
                  `}
                >
                  {/* Artwork */}
                  <div className="relative aspect-square overflow-hidden">
                    {artwork ? (
                      <img
                        src={artwork}
                        alt={nft.name}
                        className={`
                          w-full h-full object-cover
                          transition-transform duration-500 group-hover:scale-110
                          ${!isEarned && 'opacity-60'}
                        `}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <NFTBadge
                          milestoneId={nft.id}
                          size="lg"
                          isEarned={isEarned}
                          color={nft.color}
                          showGlow={isEarned}
                        />
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Shimmer Effect for High Tiers */}
                    {isEarned && tier >= 5 && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      {isEarned ? (
                        <div className="p-1.5 rounded-full bg-primary/90 backdrop-blur-sm">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />
                        </div>
                      ) : (
                        <div className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm">
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Rarity Badge */}
                    {isEarned && (
                      <div className="absolute top-2 left-2">
                        <Badge className={`bg-gradient-to-r ${config.gradient} text-white text-[10px] px-1.5 py-0.5`}>
                          {config.label}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm truncate">{nft.name}</h3>
                      {tier > 0 && (
                        <span className="text-[10px] text-muted-foreground">T{tier}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {nft.description}
                    </p>
                  </div>

                  {/* Glow Effect for Legendary+ */}
                  {isEarned && tier >= 6 && (
                    <div className={`absolute -inset-0.5 bg-gradient-to-r ${config.gradient} rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity -z-10`} />
                  )}
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Empty State */}
      {filteredAndSortedNFTs.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 px-4"
        >
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No NFTs Found</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Try adjusting your search or filter criteria to find what you're looking for.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSearchQuery('');
              setFilterBy('all');
            }}
          >
            Clear Filters
          </Button>
        </motion.div>
      )}
    </div>
  );
}
