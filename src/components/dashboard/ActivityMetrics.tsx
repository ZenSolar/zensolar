import type React from 'react';
import { ActivityData, calculateCO2Offset } from '@/types/dashboard';
import { MetricCard } from './MetricCard';
import { 
  Sun, 
  Car, 
  Battery, 
  Zap, 
  Coins, 
  Award,
  Leaf,
  Users,
  ChevronRight
} from 'lucide-react';
import { 
  calculateEarnedMilestones,
  calculateComboAchievements,
  SOLAR_MILESTONES,
  BATTERY_MILESTONES,
  EV_CHARGING_MILESTONES,
  EV_MILES_MILESTONES,
  getTotalNftCount
} from '@/lib/nftMilestones';
import { Card, CardContent } from '@/components/ui/card';

type CurrentActivity = {
  solarKwh: number;
  evMiles: number;
  batteryKwh: number;
  chargingKwh: number;
};

interface ActivityMetricsProps {
  data: ActivityData;
  currentActivity?: CurrentActivity;
}

export function ActivityMetrics({ data, currentActivity }: ActivityMetricsProps) {
  const labels = data.deviceLabels || {};

  // Build dynamic labels based on device names
  const evLabel = labels.vehicle 
    ? `${labels.vehicle}` 
    : 'EV Miles';

  const batteryLabel = labels.powerwall 
    ? `${labels.powerwall}` 
    : 'Battery';

  const homeChargerLabel = labels.homeCharger 
    ? `${labels.homeCharger}` 
    : labels.wallConnector
      ? `${labels.wallConnector}`
      : 'Home Charger';

  // Build solar label from Enphase system name or default
  const solarLabel = labels.solar 
    ? `${labels.solar}` 
    : 'Solar';

  // Calculate earned NFTs locally using actual energy data (uses lifetime for NFT progress)
  const solarEarned = calculateEarnedMilestones(data.solarEnergyProduced, SOLAR_MILESTONES);
  const batteryEarned = calculateEarnedMilestones(data.batteryStorageDischarged, BATTERY_MILESTONES);
  const chargingKwhLifetime = data.teslaSuperchargerKwh + data.homeChargerKwh;
  const chargingEarned = calculateEarnedMilestones(chargingKwhLifetime, EV_CHARGING_MILESTONES);
  const evMilesEarned = calculateEarnedMilestones(data.evMilesDriven, EV_MILES_MILESTONES);
  const comboEarned = calculateComboAchievements(solarEarned, evMilesEarned, chargingEarned, batteryEarned);

  // Total earned (including Welcome NFT)
  const totalEarned = 1 + solarEarned.length + evMilesEarned.length + chargingEarned.length + batteryEarned.length + comboEarned.length;
  const totalPossible = getTotalNftCount();

  // "Current Activity" is what is mintable: lifetime until first mint, then delta since last mint.
  const current: CurrentActivity = currentActivity ?? {
    solarKwh: Math.max(0, Math.floor(data.pendingSolarKwh || 0)),
    evMiles: Math.max(0, Math.floor(data.pendingEvMiles || 0)),
    batteryKwh: Math.max(0, Math.floor(data.pendingBatteryKwh || 0)),
    chargingKwh: Math.max(0, Math.floor(data.pendingChargingKwh || 0)),
  };

  const activityUnits = current.solarKwh + current.evMiles + current.batteryKwh + current.chargingKwh;
  const tokensToReceive = Math.floor(activityUnits * 0.93);

  // CO2 should reflect the same "current activity" basis shown in the UI
  const currentCo2Offset = Math.floor(
    calculateCO2Offset({
      ...data,
      solarEnergyProduced: current.solarKwh,
      evMilesDriven: current.evMiles,
      batteryStorageDischarged: current.batteryKwh,
    })
  );

  return (
    <div className="space-y-6">
      {/* 1. REWARDS SUMMARY - At the top */}
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card to-card/80">
        <CardContent className="p-4 space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Rewards Summary
          </h2>
          
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
              <div className="p-2.5 rounded-full bg-primary/20">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">NFTs Earned</p>
                <p className="text-lg font-bold text-foreground">{totalEarned} / {totalPossible}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/10 border border-accent/20">
              <div className="p-2.5 rounded-full bg-accent/20">
                <Users className="h-5 w-5 text-accent-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Referral Tokens</p>
                <p className="text-lg font-bold text-foreground">{data.referralTokens.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">$ZSOLAR</span></p>
              </div>
            </div>
          </div>
          
          {/* Lifetime Minted - Links to Mint History */}
          <div 
            className="p-3 rounded-xl bg-muted/50 border border-border cursor-pointer hover:bg-muted/80 transition-all hover:border-primary/30 group"
            onClick={() => window.location.href = '/mint-history'}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Coins className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Lifetime Minted</p>
                  <p className="text-xs text-muted-foreground">View mint history</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-foreground">{data.lifetimeMinted.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">$ZSOLAR</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. PENDING REWARDS - What can be minted NOW */}
      <Card className={`overflow-hidden transition-all ${activityUnits > 0 ? 'border-primary/40 shadow-lg shadow-primary/5' : 'border-border'}`}>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              {activityUnits > 0 && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                </span>
              )}
              Pending Rewards
            </h2>
          </div>

          <p className="text-xs text-muted-foreground">
            {activityUnits > 0 ? 'Ready to mint — you receive 93% as tokens' : 'No activity to mint yet'}
          </p>

          {/* Tokens to receive - prominent display */}
          <div className={`p-4 rounded-xl ${activityUnits > 0 ? 'bg-gradient-to-r from-primary/15 to-primary/5 border border-primary/30' : 'bg-muted/50 border border-border'}`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${activityUnits > 0 ? 'bg-primary' : 'bg-muted'}`}>
                <Coins className={`h-6 w-6 ${activityUnits > 0 ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tokens You'll Receive</p>
                <p className="text-2xl font-bold text-foreground">
                  {tokensToReceive.toLocaleString()}
                  <span className="text-sm font-normal text-muted-foreground ml-2">$ZSOLAR</span>
                </p>
              </div>
            </div>
          </div>

          {/* Activity breakdown - compact grid */}
          <div className="grid grid-cols-2 gap-2">
            <ActivityCard
              icon={Sun}
              value={current.solarKwh}
              unit="kWh"
              label={solarLabel}
              active={current.solarKwh > 0}
              colorClass="solar"
            />

            <ActivityCard
              icon={Car}
              value={current.evMiles}
              unit="mi"
              label={evLabel}
              active={current.evMiles > 0}
              colorClass="energy"
            />

            <ActivityCard
              icon={Battery}
              value={current.batteryKwh}
              unit="kWh"
              label={batteryLabel}
              active={current.batteryKwh > 0}
              colorClass="secondary"
            />

            <ActivityCard
              icon={Zap}
              value={current.chargingKwh}
              unit="kWh"
              label="EV Charging"
              active={current.chargingKwh > 0}
              colorClass="accent"
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. CURRENT ACTIVITY (Mintable activity units) */}
      <Card className="overflow-hidden">
        <CardContent className="p-4 space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Leaf className="h-5 w-5 text-eco" />
            Current Activity
          </h2>
          <p className="text-xs text-muted-foreground -mt-2">
            Since your last mint (or lifetime totals until your first mint)
          </p>

          <div className="space-y-2">
            <MetricCard icon={Sun} label={solarLabel} value={current.solarKwh} unit="kWh" tone="solar" />
            <MetricCard icon={Car} label={evLabel} value={current.evMiles} unit="mi" tone="energy" />
            <MetricCard icon={Battery} label={batteryLabel} value={current.batteryKwh} unit="kWh" tone="secondary" />
            <MetricCard icon={Zap} label="EV Charging" value={current.chargingKwh} unit="kWh" tone="accent" />
            <MetricCard icon={Leaf} label="CO2 Offset" value={currentCo2Offset} unit="lbs" tone="eco" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Compact activity card component
interface ActivityCardProps {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  unit: string;
  label: string;
  active: boolean;
  colorClass: 'solar' | 'energy' | 'secondary' | 'accent';
}

function ActivityCard({ icon: Icon, value, unit, label, active, colorClass }: ActivityCardProps) {
  // Map color classes to actual Tailwind classes (can't use dynamic class names)
  const colorStyles = {
    solar: {
      bg: active ? 'bg-solar/10' : 'bg-muted/30',
      border: active ? 'border-solar/30' : 'border-border/50',
      iconBg: active ? 'bg-solar/20' : 'bg-muted',
      iconColor: active ? 'text-solar' : 'text-muted-foreground',
    },
    energy: {
      bg: active ? 'bg-energy/10' : 'bg-muted/30',
      border: active ? 'border-energy/30' : 'border-border/50',
      iconBg: active ? 'bg-energy/20' : 'bg-muted',
      iconColor: active ? 'text-energy' : 'text-muted-foreground',
    },
    secondary: {
      bg: active ? 'bg-secondary/10' : 'bg-muted/30',
      border: active ? 'border-secondary/30' : 'border-border/50',
      iconBg: active ? 'bg-secondary/20' : 'bg-muted',
      iconColor: active ? 'text-secondary' : 'text-muted-foreground',
    },
    accent: {
      bg: active ? 'bg-accent/10' : 'bg-muted/30',
      border: active ? 'border-accent/30' : 'border-border/50',
      iconBg: active ? 'bg-accent/20' : 'bg-muted',
      iconColor: active ? 'text-accent-foreground' : 'text-muted-foreground',
    },
  };

  const styles = colorStyles[colorClass];

  return (
    <div className={`flex items-center gap-2.5 p-3 rounded-xl transition-all border ${styles.bg} ${styles.border}`}>
      <div className={`p-2 rounded-lg ${styles.iconBg}`}>
        <Icon className={`h-4 w-4 ${styles.iconColor}`} />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-base font-semibold text-foreground leading-tight">
          {value.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{unit}</span>
        </span>
        <span className="text-[10px] text-muted-foreground truncate">{label}</span>
      </div>
    </div>
  );
}
