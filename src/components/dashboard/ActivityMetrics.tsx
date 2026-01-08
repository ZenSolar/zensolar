import { ActivityData } from '@/types/dashboard';
import { MetricCard } from './MetricCard';
import { 
  Sun, 
  Car, 
  Battery, 
  Zap, 
  Coins, 
  Award,
  Leaf
} from 'lucide-react';

interface ActivityMetricsProps {
  data: ActivityData;
}

export function ActivityMetrics({ data }: ActivityMetricsProps) {
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
            label="Solar Energy Produced"
            value={data.solarEnergyProduced}
            unit="kWh"
            colorClass="bg-solar"
          />
          
          <MetricCard
            icon={Car}
            label="EV Miles Driven"
            value={data.evMilesDriven}
            unit="miles"
            colorClass="bg-energy"
          />
          
          <MetricCard
            icon={Battery}
            label="Battery Storage Discharged"
            value={data.batteryStorageDischarged}
            unit="kWh"
            colorClass="bg-secondary"
          />
          
          <MetricCard
            icon={Zap}
            label="EV Charging kWh"
            value={data.evCharging}
            unit="kWh"
            colorClass="bg-accent"
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
