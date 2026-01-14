import { cn } from '@/lib/utils';
import {
  Sun,
  Zap,
  Shield,
  Sword,
  Lightbulb,
  Trophy,
  Crown,
  Sparkles,
  Star,
  Car,
  Map,
  Route,
  Compass,
  Gauge,
  Medal,
  Plug,
  BatteryCharging,
  Gamepad2,
  Battery,
  Dumbbell,
  Activity,
  Home,
  Package,
  CircuitBoard,
  Briefcase,
  Brain,
  Flame,
  Diamond,
  Globe,
  Target,
  type LucideIcon,
} from 'lucide-react';

// Icon mapping for each NFT milestone
export const NFT_ICON_MAP: Record<string, LucideIcon> = {
  // Solar
  solar_welcome: Star,
  solar_1: Sun,
  solar_2: Zap,
  solar_3: Shield,
  solar_4: Flame,
  solar_5: Lightbulb,
  solar_6: Package,
  solar_7: CircuitBoard,
  solar_8: Sparkles,
  
  // EV Miles
  ev_1: Zap,
  ev_2: Car,
  ev_3: Route,
  ev_4: Map,
  ev_5: Gauge,
  ev_6: Activity,
  ev_7: Crown,
  
  // EV Charging
  charge_1: Zap,
  charge_2: Plug,
  charge_3: BatteryCharging,
  charge_4: Activity,
  charge_5: Target,
  charge_6: CircuitBoard,
  
  // Battery
  battery_1: Battery,
  battery_2: Home,
  battery_3: Package,
  battery_4: Shield,
  battery_5: Gauge,
  battery_6: CircuitBoard,
  
  // Combos
  combo_1: Target,
  combo_2: Flame,
  combo_3: Diamond,
  combo_4: Star,
  combo_5: Globe,
  combo_6: Trophy,
  combo_7: Crown,
};

interface NFTBadgeProps {
  milestoneId: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isEarned?: boolean;
  color?: string;
  className?: string;
  showGlow?: boolean;
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
  xl: 'h-14 w-14',
};

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
  xl: 'h-7 w-7',
};

export function NFTBadge({ 
  milestoneId, 
  size = 'md', 
  isEarned = true,
  color = 'bg-primary',
  className,
  showGlow = true,
}: NFTBadgeProps) {
  const Icon = NFT_ICON_MAP[milestoneId] || Star;
  
  return (
    <div
      className={cn(
        'relative rounded-full flex items-center justify-center transition-all duration-300',
        sizeClasses[size],
        isEarned ? color : 'bg-muted',
        isEarned && showGlow && 'shadow-lg',
        !isEarned && 'opacity-50 grayscale',
        className
      )}
      style={isEarned && showGlow ? {
        boxShadow: `0 0 20px hsl(var(--primary) / 0.4)`,
      } : undefined}
    >
      <Icon 
        className={cn(
          iconSizes[size],
          isEarned ? 'text-white' : 'text-muted-foreground'
        )} 
      />
      
      {/* Shine effect for earned badges */}
      {isEarned && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
      )}
    </div>
  );
}

// Inline badge for use in lists/pills
interface NFTBadgeInlineProps {
  milestoneId: string;
  name: string;
  color?: string;
  isEarned?: boolean;
  className?: string;
}

export function NFTBadgeInline({
  milestoneId,
  name,
  color = 'bg-primary',
  isEarned = true,
  className,
}: NFTBadgeInlineProps) {
  const Icon = NFT_ICON_MAP[milestoneId] || Star;
  
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap',
        isEarned ? `${color} text-white` : 'bg-muted text-muted-foreground',
        !isEarned && 'opacity-60',
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {name}
    </div>
  );
}

export default NFTBadge;
