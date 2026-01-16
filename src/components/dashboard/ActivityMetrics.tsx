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

  // Calculate activity units from PENDING activity values (since last mint)
  const activityUnits = 
    Math.floor(data.pendingSolarKwh) + 
    Math.floor(data.pendingEvMiles) + 
    Math.floor(data.pendingBatteryKwh) + 
    Math.floor(data.pendingChargingKwh);
  
  // User receives 93% of activity units as tokens (5% burn, 1% LP, 1% treasury)
  const tokensToReceive = Math.floor(activityUnits * 0.93);
  
  return (
    <div className="space-y-6">
      {/* Pending Rewards Section - What can be minted NOW (delta since last mint) */}
      {activityUnits > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Pending Rewards
          </h2>
          <p className="text-xs text-muted-foreground -mt-2">
            Activity since your last mint — you receive 93% as tokens
          </p>
          
          <div className="grid gap-3">
            <MetricCard
              icon={Coins}
              label="Tokens You'll Receive"
              value={tokensToReceive}
              unit="$ZSOLAR"
              colorClass="bg-primary"
            />
            
            {/* Breakdown of pending by category */}
            <div className="grid grid-cols-2 gap-2">
              {data.pendingSolarKwh > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-solar/10 border border-solar/20">
                  <Sun className="h-4 w-4 text-solar" />
                  <span className="text-sm font-medium">{Math.floor(data.pendingSolarKwh).toLocaleString()} kWh</span>
                </div>
              )}
              {data.pendingEvMiles > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-energy/10 border border-energy/20">
                  <Car className="h-4 w-4 text-energy" />
                  <span className="text-sm font-medium">{Math.floor(data.pendingEvMiles).toLocaleString()} mi</span>
                </div>
              )}
              {data.pendingBatteryKwh > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/10 border border-secondary/20">
                  <Battery className="h-4 w-4 text-secondary" />
                  <span className="text-sm font-medium">{Math.floor(data.pendingBatteryKwh).toLocaleString()} kWh</span>
                </div>
              )}
              {data.pendingChargingKwh > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-accent/10 border border-accent/20">
                  <Zap className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">{Math.floor(data.pendingChargingKwh).toLocaleString()} kWh</span>
                </div>
              )}
            </div>
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
            Since Last Mint
          </span>
        </div>
      </div>

      {/* Activity Data Section - Delta since last mint */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Activity Data</h2>
        <p className="text-xs text-muted-foreground -mt-2">
          New activity since your last token mint
        </p>
        
        <div className="grid gap-3">
          <MetricCard
            icon={Sun}
            label={solarLabel}
            value={data.pendingSolarKwh}
            unit="kWh"
            colorClass="bg-solar"
          />
          
          <MetricCard
            icon={Car}
            label={evLabel}
            value={data.pendingEvMiles}
            unit="miles"
            colorClass="bg-energy"
          />
          
          <MetricCard
            icon={Battery}
            label={batteryLabel}
            value={data.pendingBatteryKwh}
            unit="kWh"
            colorClass="bg-secondary"
          />
          
          <MetricCard
            icon={Zap}
            label="Tesla Supercharger"
            value={data.pendingSuperchargerKwh || 0}
            unit="kWh"
            colorClass="bg-accent"
          />
          
          <MetricCard
            icon={Zap}
            label={homeChargerLabel}
            value={data.pendingHomeChargerKwh || 0}
            unit="kWh"
            colorClass="bg-accent"
          />
          
          <MetricCard
            icon={Leaf}
            label="CO2 Offset (lifetime)"
            value={data.co2OffsetPounds}
            unit="lbs"
            colorClass="bg-eco"
          />
        </div>
      </div>

      {/* Lifetime Minted - Links to Mint History */}
      <div 
        className="mt-4 p-4 rounded-lg bg-muted/50 border border-border cursor-pointer hover:bg-muted/80 transition-colors"
        onClick={() => window.location.href = '/mint-history'}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Coins className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Lifetime Minted</p>
              <p className="text-xs text-muted-foreground">View full mint history</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-foreground">{data.lifetimeMinted.toLocaleString()} $ZSOLAR</span>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
