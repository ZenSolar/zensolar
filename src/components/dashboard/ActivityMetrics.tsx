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
          label="EV Charging"
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
  );
}
