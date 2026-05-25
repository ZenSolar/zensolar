import { Sun, BatteryFull, Zap, Car, Home } from 'lucide-react';
import type { ActivityType } from '@/hooks/useEnergyLog';
import { PillNav } from '@/components/layout/PillNav';

interface ActivityTabsProps {
  activeTab: ActivityType;
  onTabChange: (tab: ActivityType) => void;
}

// Charging is ALWAYS split — Supercharger and Home are independent tabs.
const tabs = [
  { id: 'solar' as const, label: 'Solar', icon: Sun },
  { id: 'battery' as const, label: 'Battery', icon: BatteryFull },
  { id: 'supercharger' as const, label: 'Supercharger', icon: Zap },
  { id: 'home-charging' as const, label: 'Home', icon: Home },
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
