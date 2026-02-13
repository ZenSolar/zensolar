import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sun, BatteryFull, Zap, Car } from 'lucide-react';
import type { ActivityType } from '@/hooks/useEnergyLog';

interface ActivityTabsProps {
  activeTab: ActivityType;
  onTabChange: (tab: ActivityType) => void;
}

const tabs: { value: ActivityType; label: string; icon: React.ElementType }[] = [
  { value: 'solar', label: 'Solar', icon: Sun },
  { value: 'battery', label: 'Battery', icon: BatteryFull },
  { value: 'ev-charging', label: 'Charging', icon: Zap },
  { value: 'ev-miles', label: 'EV Miles', icon: Car },
];

export function ActivityTabs({ activeTab, onTabChange }: ActivityTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as ActivityType)}>
      <TabsList className="w-full grid grid-cols-4">
        {tabs.map(({ value, label, icon: Icon }) => (
          <TabsTrigger key={value} value={value} className="flex items-center gap-1 text-xs">
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
