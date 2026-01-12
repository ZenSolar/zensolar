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

  return (
    <div className="space-y-6">
      {/* Rewards Section - Tokens & NFTs */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Rewards</h2>
        
        <div className="grid gap-3">
          <MetricCard
            icon={Coins}
            label="Tokens Earned"
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
            value={`${data.nftsEarned.length} (${data.nftsEarned.join(', ')})`}
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
            Energy Activity
          </span>
        </div>
      </div>

      {/* Energy Data Section - API Data */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Activity Data</h2>
        
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
