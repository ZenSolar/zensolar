import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, Flame, Droplets, Landmark, Wallet, Zap } from 'lucide-react';
import { 
  MINT_DISTRIBUTION, 
  TRANSFER_TAX, 
  PRICES, 
  formatTokenAmount, 
  formatUSD 
} from '@/lib/tokenomics';

export function TokenFlowCalculator() {
  const [rawKwh, setRawKwh] = useState(1000);
  const [sellPercent, setSellPercent] = useState(25);

  // Mint phase
  const grossTokens = rawKwh; // 1 kWh = 1 token
  const mintBurned = Math.floor(grossTokens * MINT_DISTRIBUTION.burn / 100);
  const mintLP = Math.floor(grossTokens * MINT_DISTRIBUTION.lp / 100);
  const mintTreasury = Math.floor(grossTokens * MINT_DISTRIBUTION.treasury / 100);
  const userReceives = Math.floor(grossTokens * MINT_DISTRIBUTION.user / 100);

  // Sell phase (transfer tax)
  const tokensSold = Math.floor(userReceives * sellPercent / 100);
  const taxBurned = Math.floor(tokensSold * TRANSFER_TAX.burn / 100);
  const taxLP = Math.floor(tokensSold * TRANSFER_TAX.lp / 100);
  const taxTreasury = Math.floor(tokensSold * TRANSFER_TAX.treasury / 100);
  const sellerReceives = tokensSold - taxBurned - taxLP - taxTreasury;

  // Totals
  const tokensHeld = userReceives - tokensSold;
  const totalBurned = mintBurned + taxBurned;
  const totalLP = mintLP + taxLP;
  const heldValue = formatUSD(tokensHeld * PRICES.launchFloor);
  const soldValue = formatUSD(sellerReceives * PRICES.launchFloor);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-primary" />
          Token Flow Calculator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          See exactly how many tokens you receive after mint burn and transfer taxes.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inputs */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Monthly kWh Produced</label>
            <Input
              type="number"
              value={rawKwh}
              onChange={(e) => setRawKwh(Math.max(0, parseInt(e.target.value) || 0))}
              min={0}
              max={100000}
            />
            <p className="text-xs text-muted-foreground">Average US home: 750-1,200 kWh/mo</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Sell Rate: {sellPercent}%
            </label>
            <Slider
              value={[sellPercent]}
              onValueChange={(v) => setSellPercent(v[0])}
              min={0}
              max={100}
              step={5}
            />
            <p className="text-xs text-muted-foreground">
              {sellPercent === 0 ? 'Diamond hands 💎' : sellPercent <= 25 ? 'Conservative seller' : sellPercent <= 50 ? 'Moderate seller' : 'Heavy seller'}
            </p>
          </div>
        </div>

        {/* Flow visualization */}
        <div className="space-y-3">
          {/* Gross mint */}
          <FlowStep
            icon={Zap}
            label="Energy Produced"
            value={`${formatTokenAmount(grossTokens)} kWh → ${formatTokenAmount(grossTokens)} tokens minted`}
            color="text-primary"
            bg="bg-primary/10"
          />

          <ArrowDown className="h-4 w-4 text-muted-foreground/50 mx-auto" />

          {/* Mint distribution */}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <MiniStat icon={Wallet} label="You receive" value={formatTokenAmount(userReceives)} sub={`${MINT_DISTRIBUTION.user}%`} color="text-primary" />
            <MiniStat icon={Flame} label="Burned" value={formatTokenAmount(mintBurned)} sub={`${MINT_DISTRIBUTION.burn}%`} color="text-destructive" />
            <MiniStat icon={Droplets} label="To LP" value={formatTokenAmount(mintLP)} sub={`${MINT_DISTRIBUTION.lp}%`} color="text-accent" />
            <MiniStat icon={Landmark} label="Treasury" value={formatTokenAmount(mintTreasury)} sub={`${MINT_DISTRIBUTION.treasury}%`} color="text-muted-foreground" />
          </div>

          {sellPercent > 0 && (
            <>
              <ArrowDown className="h-4 w-4 text-muted-foreground/50 mx-auto" />

              <FlowStep
                icon={Flame}
                label={`Selling ${sellPercent}% (${formatTokenAmount(tokensSold)} tokens)`}
                value={`7% transfer tax applied`}
                color="text-destructive"
                bg="bg-destructive/10"
              />

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <MiniStat icon={Wallet} label="Seller gets" value={formatTokenAmount(sellerReceives)} sub={soldValue} color="text-primary" />
                <MiniStat icon={Flame} label="Burned" value={formatTokenAmount(taxBurned)} sub="3%" color="text-destructive" />
                <MiniStat icon={Droplets} label="To LP" value={formatTokenAmount(taxLP)} sub="2%" color="text-accent" />
                <MiniStat icon={Landmark} label="Treasury" value={formatTokenAmount(taxTreasury)} sub="2%" color="text-muted-foreground" />
              </div>
            </>
          )}
        </div>

        {/* Summary */}
        <div className="grid gap-3 sm:grid-cols-3 p-4 rounded-xl bg-muted/50 border border-border/30">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Tokens Held</p>
            <p className="text-xl font-bold text-foreground">{formatTokenAmount(tokensHeld)}</p>
            <p className="text-xs text-primary">{heldValue} @ $0.10</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Burned</p>
            <p className="text-xl font-bold text-destructive">{formatTokenAmount(totalBurned)}</p>
            <p className="text-xs text-muted-foreground">{((totalBurned / grossTokens) * 100).toFixed(1)}% of minted</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Added to LP</p>
            <p className="text-xl font-bold text-accent">{formatTokenAmount(totalLP)}</p>
            <p className="text-xs text-muted-foreground">Strengthening the floor</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center italic">
          The more people sell, the scarcer the supply gets. Time is on the holder's side.
        </p>
      </CardContent>
    </Card>
  );
}

function FlowStep({ icon: Icon, label, value, color, bg }: { 
  icon: React.ElementType; label: string; value: string; color: string; bg: string;
}) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl ${bg} border border-border/20`}>
      <Icon className={`h-5 w-5 ${color} flex-shrink-0`} />
      <div>
        <p className={`text-sm font-semibold ${color}`}>{label}</p>
        <p className="text-xs text-muted-foreground">{value}</p>
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub: string; color: string;
}) {
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-background border border-border/30">
      <Icon className={`h-4 w-4 ${color} flex-shrink-0`} />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-sm font-bold text-foreground">{value}</p>
        <p className={`text-[10px] ${color}`}>{sub}</p>
      </div>
    </div>
  );
}
