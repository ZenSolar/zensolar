import { Sun, BatteryFull, Zap, Car } from 'lucide-react';
import type { ActivityType } from '@/hooks/useEnergyLog';
import { PillNav } from '@/components/layout/PillNav';

interface ActivityTabsProps {
  activeTab: ActivityType;
  onTabChange: (tab: ActivityType) => void;
}

const tabs = [
  { id: 'solar' as const, label: 'Solar', icon: Sun },
  { id: 'battery' as const, label: 'Battery', icon: BatteryFull },
  { id: 'ev-charging' as const, label: 'Charging', icon: Zap },
  { id: 'ev-miles' as const, label: 'EV Miles', icon: Car },
];

/**
 * Energy Log activity switcher. Uses the shared PillNav so it visually
 * matches Learn / Help / NFTs and reduces "tab style" sprawl across the app.
 */
export function ActivityTabs({ activeTab, onTabChange }: ActivityTabsProps) {
  return (
    <PillNav
      items={tabs}
      active={activeTab}
      onSelect={(id) => onTabChange(id as ActivityType)}
      ariaLabel="Activity type"
    />
  );
}
