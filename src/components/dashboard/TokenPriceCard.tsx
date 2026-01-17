import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TrendingUp, DollarSign, Coins, Edit2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TokenPriceCardProps {
  tokensHeld: number;
  defaultPrice?: number;
}

export function TokenPriceCard({ tokensHeld, defaultPrice = 0.23 }: TokenPriceCardProps) {
  const [tokenPrice, setTokenPrice] = useState<number>(defaultPrice);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(defaultPrice.toString());

  const totalValueUSD = tokensHeld * tokenPrice;

  const handlePriceSubmit = () => {
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed) && parsed >= 0) {
      setTokenPrice(parsed);
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

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/20">
              <Coins className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold text-foreground">$ZSOLAR Token</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
            <TrendingUp className="h-3 w-3" />
            <span>Live</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Token Price */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Token Price</p>
            <div className="flex items-center gap-1">
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handlePriceSubmit}
                    className="h-8 w-20 text-lg font-bold p-1"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={handlePriceSubmit}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 group hover:bg-muted/50 rounded px-1 -mx-1 transition-colors"
                >
                  <span className="text-2xl font-bold text-foreground">
                    ${tokenPrice.toFixed(2)}
                  </span>
                  <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">Click to edit price</p>
          </div>

          {/* Holdings Value */}
          <div className="space-y-1 text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Your Holdings</p>
            <div className="flex items-center justify-end gap-1">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold text-green-500">
                {totalValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {tokensHeld.toLocaleString()} tokens
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
