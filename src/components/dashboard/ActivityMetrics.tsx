import { ActivityData } from '@/types/dashboard';
import { MetricCard } from './MetricCard';
import { 
  Sun, 
  Car, 
  Battery, 
  Zap, 
  Coins, 
  Award,
  Leaf,
  Users
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

interface ActivityMetricsProps {
  data: ActivityData;
}

export function ActivityMetrics({ data }: ActivityMetricsProps) {
  const labels = data.deviceLabels || {};
  
  // Build dynamic labels based on device names
  const evLabel = labels.vehicle 
    ? `${labels.vehicle} Miles Driven` 
    : 'EV Miles Driven';
  
  const batteryLabel = labels.powerwall 
    ? `${labels.powerwall} Discharged kWh` 
    : 'Battery Storage Discharged';
  
  const homeChargerLabel = labels.homeCharger 
    ? `${labels.homeCharger} kWh` 
    : labels.wallConnector
      ? `${labels.wallConnector} kWh`
      : 'Home Charger kWh';

  // Build solar label from Enphase system name or default
  const solarLabel = labels.solar 
    ? `${labels.solar} Solar Energy Produced` 
    : 'Solar Energy Produced';

  // Calculate earned NFTs locally using actual energy data
  const solarEarned = calculateEarnedMilestones(data.solarEnergyProduced, SOLAR_MILESTONES);
  const batteryEarned = calculateEarnedMilestones(data.batteryStorageDischarged, BATTERY_MILESTONES);
  const chargingKwh = data.teslaSuperchargerKwh + data.homeChargerKwh;
  const chargingEarned = calculateEarnedMilestones(chargingKwh, EV_CHARGING_MILESTONES);
  const evMilesEarned = calculateEarnedMilestones(data.evMilesDriven, EV_MILES_MILESTONES);
  const comboEarned = calculateComboAchievements(solarEarned, evMilesEarned, chargingEarned, batteryEarned);
  
  // Total earned (including Welcome NFT)
  const totalEarned = 1 + solarEarned.length + evMilesEarned.length + chargingEarned.length + batteryEarned.length + comboEarned.length;
  const totalPossible = getTotalNftCount();

  // Calculate pending tokens from pending activity values
  const pendingTokens = data.pendingTokens || 
    Math.floor(data.pendingSolarKwh) + 
    Math.floor(data.pendingEvMiles) + 
    Math.floor(data.pendingBatteryKwh) + 
    Math.floor(data.pendingChargingKwh);

  return (
    <div className="space-y-6">
      {/* Pending Rewards Section - What can be minted */}
      {pendingTokens > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Pending Rewards
          </h2>
          <p className="text-xs text-muted-foreground -mt-2">
            Activity since your last mint — eligible for token rewards
          </p>
          
          <div className="grid gap-3">
            <MetricCard
              icon={Coins}
              label="Tokens Ready to Mint"
              value={pendingTokens}
              unit="$ZSOLAR"
              colorClass="bg-primary"
            />
          </div>
        </div>
      )}

      {/* Total Rewards Section - Tokens & NFTs */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Total Rewards</h2>
        
        <div className="grid gap-3">
          <MetricCard
            icon={Coins}
            label="Lifetime Tokens Earned"
            value={data.tokensEarned}
            unit="$ZSOLAR"
            colorClass="bg-token"
          />
          
          <MetricCard
            icon={Users}
            label="Referral Tokens"
            value={data.referralTokens}
            unit="$ZSOLAR"
            colorClass="bg-accent"
          />
          
          <MetricCard
            icon={Award}
            label="NFTs Earned"
            value={`${totalEarned} / ${totalPossible}`}
            colorClass="bg-primary"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-xs text-muted-foreground uppercase tracking-wider">
            Lifetime Activity
          </span>
        </div>
      </div>

      {/* Lifetime Energy Data Section - Used for NFT Milestone Progress */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Activity Data</h2>
        <p className="text-xs text-muted-foreground -mt-2">
          Cumulative totals used for NFT milestone progress
        </p>
        
        <div className="grid gap-3">
          <MetricCard
            icon={Sun}
            label={solarLabel}
            value={data.solarEnergyProduced}
            unit="kWh"
            colorClass="bg-solar"
          />
          
          <MetricCard
            icon={Car}
            label={evLabel}
            value={data.evMilesDriven}
            unit="miles"
            colorClass="bg-energy"
          />
          
          <MetricCard
            icon={Battery}
            label={batteryLabel}
            value={data.batteryStorageDischarged}
            unit="kWh"
            colorClass="bg-secondary"
          />
          
          <MetricCard
            icon={Zap}
            label="Tesla Supercharger kWh"
            value={data.teslaSuperchargerKwh}
            unit="kWh"
            colorClass="bg-accent"
          />
          
          <MetricCard
            icon={Zap}
            label={homeChargerLabel}
            value={data.homeChargerKwh}
            unit="kWh"
            colorClass="bg-secondary"
          />
          
          <MetricCard
            icon={Leaf}
            label="CO2 Offset"
            value={data.co2OffsetPounds}
            unit="lbs"
            colorClass="bg-eco"
          />
        </div>
      </div>
    </div>
  );
}
