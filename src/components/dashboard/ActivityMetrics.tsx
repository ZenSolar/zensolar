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
    ? `${labels.vehicle} Miles` 
    : 'EV Miles';
  
  const batteryLabel = labels.powerwall 
    ? `${labels.powerwall} kWh` 
    : 'Battery Discharged';
  
  const homeChargerLabel = labels.homeCharger 
    ? `${labels.homeCharger}` 
    : labels.wallConnector
      ? `${labels.wallConnector}`
      : 'Home Charger';

  // Build solar label from Enphase system name or default
  const solarLabel = labels.solar 
    ? `${labels.solar} Solar` 
    : 'Solar Energy';

  // Calculate earned NFTs locally using actual energy data (uses lifetime for NFT progress)
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
  // These are the values that can be minted NOW
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
      {/* PERMANENT RULE: Always show this section when there's any pending activity */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          {activityUnits > 0 && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
          )}
          {activityUnits > 0 ? 'Pending Rewards' : 'Activity Since Last Mint'}
        </h2>
        <p className="text-xs text-muted-foreground -mt-2">
          {activityUnits > 0 
            ? 'New activity since your last mint — you receive 93% as tokens'
            : 'No new activity yet. Connect devices and accumulate energy data to mint tokens.'
          }
        </p>
        
        <div className="grid gap-3">
          {/* Always show pending tokens card */}
          <MetricCard
            icon={Coins}
            label={activityUnits > 0 ? "Tokens You'll Receive" : "Pending Tokens"}
            value={tokensToReceive}
            unit="$ZSOLAR"
            colorClass="bg-primary"
          />
          
          {/* Activity breakdown - show current pending values */}
          <div className="grid grid-cols-2 gap-2">
            <div className={`flex items-center gap-2 p-2 rounded-md ${data.pendingSolarKwh > 0 ? 'bg-solar/10 border border-solar/20' : 'bg-muted/50 border border-border'}`}>
              <Sun className={`h-4 w-4 ${data.pendingSolarKwh > 0 ? 'text-solar' : 'text-muted-foreground'}`} />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{Math.floor(data.pendingSolarKwh).toLocaleString()} kWh</span>
                <span className="text-[10px] text-muted-foreground">{solarLabel}</span>
              </div>
            </div>
            
            <div className={`flex items-center gap-2 p-2 rounded-md ${data.pendingEvMiles > 0 ? 'bg-energy/10 border border-energy/20' : 'bg-muted/50 border border-border'}`}>
              <Car className={`h-4 w-4 ${data.pendingEvMiles > 0 ? 'text-energy' : 'text-muted-foreground'}`} />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{Math.floor(data.pendingEvMiles).toLocaleString()} mi</span>
                <span className="text-[10px] text-muted-foreground">{evLabel}</span>
              </div>
            </div>
            
            <div className={`flex items-center gap-2 p-2 rounded-md ${data.pendingBatteryKwh > 0 ? 'bg-secondary/10 border border-secondary/20' : 'bg-muted/50 border border-border'}`}>
              <Battery className={`h-4 w-4 ${data.pendingBatteryKwh > 0 ? 'text-secondary' : 'text-muted-foreground'}`} />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{Math.floor(data.pendingBatteryKwh).toLocaleString()} kWh</span>
                <span className="text-[10px] text-muted-foreground">{batteryLabel}</span>
              </div>
            </div>
            
            <div className={`flex items-center gap-2 p-2 rounded-md ${data.pendingChargingKwh > 0 ? 'bg-accent/10 border border-accent/20' : 'bg-muted/50 border border-border'}`}>
              <Zap className={`h-4 w-4 ${data.pendingChargingKwh > 0 ? 'text-accent' : 'text-muted-foreground'}`} />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{Math.floor(data.pendingChargingKwh).toLocaleString()} kWh</span>
                <span className="text-[10px] text-muted-foreground">EV Charging</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Total Rewards Section - NFTs & Referrals */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Rewards Summary</h2>
        
        <div className="grid gap-3">
          <MetricCard
            icon={Award}
            label="NFTs Earned"
            value={`${totalEarned} / ${totalPossible}`}
            colorClass="bg-primary"
          />
          
          <MetricCard
            icon={Users}
            label="Referral Tokens"
            value={data.referralTokens}
            unit="$ZSOLAR"
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
