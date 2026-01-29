import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TrendingUp, DollarSign, Coins, Edit2, Check, Wallet, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface TokenPriceCardProps {
  tokensHeld: number;
  defaultPrice?: number;
  onPriceChange?: (price: number) => void;
}

export function TokenPriceCard({ tokensHeld, defaultPrice = 0.10, onPriceChange }: TokenPriceCardProps) {
  const [tokenPrice, setTokenPrice] = useState<number>(defaultPrice);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(defaultPrice.toString());
  const [showPulse, setShowPulse] = useState(false);
  const [prevTokens, setPrevTokens] = useState(tokensHeld);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const totalValueUSD = tokensHeld * tokenPrice;

  // Notify parent when price changes
  const updatePrice = (newPrice: number) => {
    setTokenPrice(newPrice);
    onPriceChange?.(newPrice);
  };

  // Pulse animation when tokens change
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
    if (e.key === 'Enter') {
      handlePriceSubmit();
    } else if (e.key === 'Escape') {
      setInputValue(tokenPrice.toString());
      setIsEditing(false);
    }
  };

  // Collapsed view - compact single row
  if (isCollapsed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 shadow-lg shadow-primary/5">
          <CardContent className="relative p-3">
            <button
              onClick={() => setIsCollapsed(false)}
              className="w-full flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-gradient-to-br from-primary/30 to-primary/10">
                  <Coins className="h-4 w-4 text-primary" />
                </div>
                <span className="font-bold text-foreground">$ZSOLAR</span>
                <span className="text-muted-foreground">|</span>
                <span className="font-bold text-foreground">${tokenPrice.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-3">
                <motion.div 
                  className="flex items-center gap-1.5"
                  animate={showPulse ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <span className="font-bold text-eco">
                    ${totalValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({tokensHeld.toLocaleString()})
                  </span>
                </motion.div>
                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Expanded view - full layout
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 shadow-xl shadow-primary/5">
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-eco/5 opacity-50" />
        
        {/* Subtle sparkle effect */}
        <div className="absolute top-2 right-16 opacity-20">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
        </div>
        
        <CardContent className="relative p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div 
                className="p-2.5 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 shadow-inner"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <Coins className="h-5 w-5 text-primary" />
              </motion.div>
              <span className="font-bold text-lg text-foreground">$ZSOLAR Token</span>
            </div>
            <div className="flex items-center gap-2">
              <motion.div 
                className="flex items-center gap-1.5 text-xs text-eco bg-eco/10 px-3 py-1.5 rounded-full border border-eco/20"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="font-medium">Live</span>
              </motion.div>
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1.5 rounded-md hover:bg-muted/50 transition-colors"
              >
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Token Price */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Token Price</p>
              <div className="flex items-center gap-1">
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xl font-bold text-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onBlur={handlePriceSubmit}
                      className="h-9 w-24 text-xl font-bold p-1.5"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={handlePriceSubmit}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 group hover:bg-muted/50 rounded-lg px-2 py-1 -mx-2 transition-all"
                  >
                    <span className="text-3xl font-bold text-foreground">
                      ${tokenPrice.toFixed(2)}
                    </span>
                    <Edit2 className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-primary/70 font-medium">Click to edit price</p>
            </div>

            {/* Holdings Value */}
            <div className="space-y-1.5 text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Your Holdings</p>
              <motion.div 
                className="flex items-center justify-end gap-1"
                animate={showPulse ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <span className="text-xl font-bold text-eco">$</span>
                <span className="text-3xl font-bold text-eco">
                  {totalValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </motion.div>
              <div className="flex items-center justify-end gap-1.5">
                <Wallet className="h-3 w-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground font-medium">
                  {tokensHeld.toLocaleString()} tokens
                </p>
              </div>
            </div>
          </div>

          {/* Minted to wallet indicator */}
          {tokensHeld > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 pt-3 border-t border-border/50"
            >
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 bg-eco/10 text-eco px-3 py-1.5 rounded-full">
                  <Check className="h-3 w-3" />
                  <span className="font-medium">{tokensHeld.toLocaleString()} tokens minted to your wallet</span>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
