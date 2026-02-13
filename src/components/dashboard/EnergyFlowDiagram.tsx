import { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sankey, Tooltip, Layer, Rectangle } from 'recharts';
import { motion } from 'framer-motion';
import { Activity, Sun, BatteryFull, Car, Home, Zap, RefreshCw, Info } from 'lucide-react';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EnergyFlowData {
  solarProduction: number; // kWh
  batteryCharge: number; // kWh charged to battery
  batteryDischarge: number; // kWh discharged from battery
  evCharging: number; // kWh to EV
  homeConsumption: number; // kWh to home
  gridExport: number; // kWh sold to grid
  gridImport: number; // kWh bought from grid
}

interface EnergyFlowDiagramProps {
  data?: EnergyFlowData;
  isLoading?: boolean;
  onRefresh?: () => void;
  period?: 'today' | 'week' | 'month' | 'year';
}

// Color palette matching design system
const nodeColors: Record<string, string> = {
  'Solar': 'hsl(45, 93%, 47%)', // solar yellow
  'Battery': 'hsl(142, 76%, 36%)', // green
  'EV': 'hsl(217, 91%, 60%)', // blue
  'Home': 'hsl(25, 95%, 53%)', // orange
  'Grid': 'hsl(262, 83%, 58%)', // purple
};

const nodeIcons: Record<string, React.ReactNode> = {
  'Solar': <Sun className="h-4 w-4" />,
  'Battery': <BatteryFull className="h-4 w-4" />,
  'EV': <Car className="h-4 w-4" />,
  'Home': <Home className="h-4 w-4" />,
  'Grid': <Zap className="h-4 w-4" />,
};

// Custom node component for the Sankey
const CustomNode = ({ x, y, width, height, index, payload }: any) => {
  const name = payload?.name || '';
  const color = nodeColors[name] || 'hsl(var(--primary))';
  
  return (
    <g>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        fillOpacity={0.9}
        rx={4}
        ry={4}
      />
      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize={12}
        fontWeight={600}
      >
        {name}
      </text>
    </g>
  );
};

// Custom link component with gradient
const CustomLink = ({ sourceX, targetX, sourceY, targetY, sourceControlX, targetControlX, linkWidth, index }: any) => {
  const gradientId = `linkGradient${index}`;
  
  return (
    <g>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
        </linearGradient>
      </defs>
      <path
        d={`
          M${sourceX},${sourceY}
          C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
        `}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={linkWidth}
        strokeOpacity={0.5}
      />
    </g>
  );
};

// Custom tooltip for flows
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0].payload;
  
  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
      {data.source && data.target ? (
        <>
          <p className="font-medium">{data.source.name} → {data.target.name}</p>
          <p className="text-muted-foreground">{data.value?.toFixed(1)} kWh</p>
        </>
      ) : (
        <p className="font-medium">{data.name}: {data.value?.toFixed(1)} kWh</p>
      )}
    </div>
  );
};

export function EnergyFlowDiagram({ 
  data, 
  isLoading = false, 
  onRefresh,
  period = 'today' 
}: EnergyFlowDiagramProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(period);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(350);
  
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  // Demo data when no real data is provided
  const demoData: EnergyFlowData = {
    solarProduction: 45.2,
    batteryCharge: 12.5,
    batteryDischarge: 8.3,
    evCharging: 18.7,
    homeConsumption: 22.4,
    gridExport: 4.1,
    gridImport: 2.8,
  };
  
  const flowData = data || demoData;
  
  // Build Sankey data structure
  const sankeyData = useMemo(() => {
    const nodes = [
      { name: 'Solar' },    // 0
      { name: 'Grid' },     // 1 (import source)
      { name: 'Battery' },  // 2
      { name: 'Home' },     // 3
      { name: 'EV' },       // 4
    ];
    
    const links: { source: number; target: number; value: number }[] = [];
    
    // Solar → Battery (charging)
    if (flowData.batteryCharge > 0) {
      links.push({ source: 0, target: 2, value: flowData.batteryCharge });
    }
    
    // Solar → Home
    const solarToHome = Math.max(0, flowData.solarProduction - flowData.batteryCharge - flowData.evCharging - flowData.gridExport);
    if (solarToHome > 0) {
      links.push({ source: 0, target: 3, value: solarToHome });
    }
    
    // Solar → EV
    const solarToEV = Math.min(flowData.evCharging, flowData.solarProduction - flowData.batteryCharge);
    if (solarToEV > 0) {
      links.push({ source: 0, target: 4, value: solarToEV });
    }
    
    // Solar → Grid (export)
    if (flowData.gridExport > 0) {
      links.push({ source: 0, target: 1, value: flowData.gridExport });
    }
    
    // Battery → Home
    if (flowData.batteryDischarge > 0) {
      links.push({ source: 2, target: 3, value: flowData.batteryDischarge });
    }
    
    // Grid → Home (import)
    if (flowData.gridImport > 0) {
      links.push({ source: 1, target: 3, value: flowData.gridImport });
    }
    
    // Filter out zero-value links
    const validLinks = links.filter(l => l.value > 0.1);
    
    return { nodes, links: validLinks };
  }, [flowData]);
  
  // Calculate key metrics
  const metrics = useMemo(() => {
    const selfConsumption = flowData.solarProduction > 0 
      ? ((flowData.solarProduction - flowData.gridExport) / flowData.solarProduction * 100).toFixed(0)
      : '0';
    
    const gridIndependence = (flowData.solarProduction + flowData.batteryDischarge) > 0
      ? (((flowData.solarProduction + flowData.batteryDischarge - flowData.gridImport) / 
          (flowData.solarProduction + flowData.batteryDischarge)) * 100).toFixed(0)
      : '0';
    
    const solarPoweredEV = flowData.evCharging > 0 && flowData.solarProduction > 0
      ? Math.min(100, (flowData.solarProduction / flowData.evCharging * 100)).toFixed(0)
      : '0';
    
    return { selfConsumption, gridIndependence, solarPoweredEV };
  }, [flowData]);
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Energy Flow</CardTitle>
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Visualizes how energy flows between your solar panels, battery, EV, home, and grid.</p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {(['today', 'week', 'month'] as const).map((p) => (
                <Button
                  key={p}
                  variant={selectedPeriod === p ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs capitalize"
                  onClick={() => setSelectedPeriod(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
            {onRefresh && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRefresh}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-solar/10 border border-solar/20 text-center"
          >
            <p className="text-2xl font-bold text-solar">{metrics.selfConsumption}%</p>
            <p className="text-xs text-muted-foreground">Self-Consumption</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center"
          >
            <p className="text-2xl font-bold text-primary">{metrics.gridIndependence}%</p>
            <p className="text-xs text-muted-foreground">Grid Independence</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-3 rounded-lg bg-accent/10 border border-accent/20 text-center"
          >
            <p className="text-2xl font-bold text-accent">{metrics.solarPoweredEV}%</p>
            <p className="text-xs text-muted-foreground">Solar-Powered EV</p>
          </motion.div>
        </div>
        
        {/* Sankey Diagram */}
        <div ref={containerRef} className="relative h-[250px] w-full overflow-hidden">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sankeyData.links.length > 0 ? (
            <Sankey
              width={containerWidth}
              height={250}
              data={sankeyData}
              node={<CustomNode />}
              nodePadding={50}
              nodeWidth={10}
              linkCurvature={0.5}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <Tooltip content={<CustomTooltip />} />
            </Sankey>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <Activity className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm">Connect your devices to see energy flow</p>
            </div>
          )}
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-3 mt-4 pt-4 border-t">
          {Object.entries(nodeColors).map(([name, color]) => (
            <div key={name} className="flex items-center gap-1.5">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-muted-foreground">{name}</span>
            </div>
          ))}
        </div>
        
        {/* Data attribution */}
        {!data && (
          <div className="mt-3 text-center">
            <Badge variant="outline" className="text-xs">
              Demo Data — Connect devices for real metrics
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
