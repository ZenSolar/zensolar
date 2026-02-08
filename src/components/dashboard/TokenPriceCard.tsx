import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  TrendingUp, DollarSign, Coins, Edit2, Check, Wallet, 
  ChevronDown, ChevronUp, Images, ExternalLink, ShieldCheck, 
  ArrowUpRight, Zap 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

// Touch threshold constants
const TOUCH_DELTA_THRESHOLD = 15;
const TOUCH_TIME_THRESHOLD = 400;

interface TokenPriceCardProps {
  tokensHeld: number;
  defaultPrice?: number;
  onPriceChange?: (price: number) => void;
  nftCount?: number;
  nftLabel?: string;
  walletLink?: string;
}

export function TokenPriceCard({ 
  tokensHeld, defaultPrice = 0.10, onPriceChange, 
  nftCount, nftLabel = 'earned', walletLink 
}: TokenPriceCardProps) {
  const [tokenPrice, setTokenPrice] = useState<number>(defaultPrice);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(defaultPrice.toString());
  const [showPulse, setShowPulse] = useState(false);
  const [prevTokens, setPrevTokens] = useState(tokensHeld);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const totalValueUSD = tokensHeld * tokenPrice;

  const updatePrice = (newPrice: number) => {
    setTokenPrice(newPrice);
    onPriceChange?.(newPrice);
  };

  useEffect(() => {
    if (tokensHeld !== prevTokens && tokensHeld > prevTokens) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 1000);
      setPrevTokens(tokensHeld);
      return () => clearTimeout(timer);
    }
    setPrevTokens(tokensHeld);
  }, [tokensHeld, prevTokens]);

  const handlePriceSubmit = () => {
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed) && parsed >= 0) {
      updatePrice(parsed);
    } else {
      setInputValue(tokenPrice.toString());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handlePriceSubmit();
    else if (e.key === 'Escape') {
      setInputValue(tokenPrice.toString());
      setIsEditing(false);
    }
  };

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const createTouchEndHandler = (action: () => void) => (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    const deltaTime = Date.now() - touchStartRef.current.time;
    if (deltaX < TOUCH_DELTA_THRESHOLD && deltaY < TOUCH_DELTA_THRESHOLD && deltaTime < TOUCH_TIME_THRESHOLD) {
      e.preventDefault();
      action();
    }
    touchStartRef.current = null;
  };

  const formattedValue = totalValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ── Collapsed view ──
  if (isCollapsed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <Card className="wallet-card-glass relative overflow-hidden border-primary/15 shadow-lg shadow-primary/5">
          {/* Shimmer band */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/[0.06] to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
          </div>

          <CardContent className="relative p-3.5">
            <button
              onClick={() => setIsCollapsed(false)}
              onTouchStart={handleTouchStart}
              onTouchEnd={createTouchEndHandler(() => setIsCollapsed(false))}
              className="w-full flex items-center justify-between gap-3 group touch-manipulation"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary/25 to-primary/10 backdrop-blur-sm">
                    <Wallet className="h-4 w-4 text-primary" />
                  </div>
                  {/* Tiny verified dot */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-eco border-2 border-card" />
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <span className="font-semibold text-sm text-foreground leading-tight">My Wallet</span>
                  <span className="text-[11px] text-muted-foreground leading-tight">
                    {tokensHeld.toLocaleString()} tokens · ${tokenPrice.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <motion.div
                  className="text-right"
                  animate={showPulse ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-lg font-bold text-foreground tabular-nums">${formattedValue}</span>
                </motion.div>
                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
              </div>
            </button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ── Expanded view ──
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card className="wallet-card-glass relative overflow-hidden border-primary/15 shadow-xl shadow-primary/5">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-transparent to-eco/[0.04]" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/[0.04] to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
          {/* Corner accent */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary/[0.06] blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-eco/[0.06] blur-2xl" />
        </div>

        <CardContent className="relative p-5">
          {/* Header row */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <motion.div
                  className="p-2.5 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/10 backdrop-blur-sm shadow-inner shadow-primary/10"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <Wallet className="h-5 w-5 text-primary" />
                </motion.div>
                {/* Verified dot */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-eco border-2 border-card flex items-center justify-center">
                  <Check className="h-1.5 w-1.5 text-eco-foreground" />
                </div>
              </div>
              <div>
                <span className="font-bold text-lg text-foreground leading-tight block">My Wallet</span>
                <span className="text-[11px] text-muted-foreground leading-tight">$ZSOLAR Portfolio</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-[11px] text-eco bg-eco/10 px-2.5 py-1 rounded-full border border-eco/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-eco opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-eco" />
                </span>
                <span className="font-medium">Live</span>
              </div>
              <button
                onClick={() => setIsCollapsed(true)}
                onTouchStart={handleTouchStart}
                onTouchEnd={createTouchEndHandler(() => setIsCollapsed(true))}
                className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors touch-manipulation"
              >
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Balance section — large & prominent */}
          <div className="mb-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Token Balance</p>
            <motion.div
              className="flex items-baseline gap-1"
              animate={showPulse ? { scale: [1, 1.03, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <span className="text-2xl font-bold text-foreground tabular-nums tracking-tight">{tokensHeld.toLocaleString()}</span>
              <span className="text-sm font-medium text-muted-foreground">$ZSOLAR</span>
            </motion.div>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <DollarSign className="h-3 w-3" />
                <span className="tabular-nums font-medium">${formattedValue} USD</span>
              </div>
              <span className="text-muted-foreground/40">·</span>
              {/* Editable price */}
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-muted-foreground">@$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handlePriceSubmit}
                    className="h-6 w-16 text-xs font-medium p-1"
                    autoFocus
                  />
                  <button onClick={handlePriceSubmit} className="p-0.5 rounded hover:bg-muted/50">
                    <Check className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <span className="tabular-nums">@${tokenPrice.toFixed(2)}/token</span>
                  <Edit2 className="h-2.5 w-2.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[10px] opacity-50 group-hover:opacity-100 transition-opacity italic">tap to edit</span>
                </button>
              )}
            </div>
          </div>

          {/* On-chain verified badge */}
          {tokensHeld > 0 && (
            <div className="mb-4 p-3 rounded-xl bg-eco/[0.07] border border-eco/15">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-eco/15">
                  <ShieldCheck className="h-3.5 w-3.5 text-eco" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">On-Chain Verified</p>
                  <p className="text-[11px] text-muted-foreground">{tokensHeld.toLocaleString()} $ZSOLAR minted to your wallet</p>
                </div>
                <Check className="h-3.5 w-3.5 text-eco flex-shrink-0" />
              </div>
            </div>
          )}

          {/* NFT count row */}
          {nftCount !== undefined && (
            <div className="mb-4 flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/30 border border-border/50">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Images className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground flex-1">
                <span className="font-semibold text-foreground tabular-nums">{nftCount}</span> NFTs {nftLabel}
              </span>
            </div>
          )}

          {/* Quick action buttons */}
          <div className="flex gap-2">
            {walletLink && (
              <Button 
                variant="outline" 
                size="sm" 
                asChild 
                className="flex-1 h-9 text-xs font-medium border-primary/20 hover:bg-primary/10 hover:border-primary/30"
              >
                <Link to={walletLink}>
                  <Wallet className="h-3.5 w-3.5 mr-1.5" />
                  View Wallet
                </Link>
              </Button>
            )}
            <Button 
              variant="default" 
              size="sm" 
              asChild 
              className="flex-1 h-9 text-xs font-medium"
            >
              <Link to={walletLink ? walletLink.replace('wallet', '') : '/'}>
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                Mint More
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
