import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { AnimatedEnergyFlow } from '@/components/dashboard/AnimatedEnergyFlow';
import { Activity, Play, Pause, RotateCcw } from 'lucide-react';

export default function AdminLiveEnergyFlow() {
  const [solarPower, setSolarPower] = useState(3.2);
  const [homePower, setHomePower] = useState(0.7);
  const [batteryPower, setBatteryPower] = useState(-2.5);
  const [batteryPercent, setBatteryPercent] = useState(73);
  const [gridPower, setGridPower] = useState(0);
  const [evPower, setEvPower] = useState(0.8);
  const [isSimulating, setIsSimulating] = useState(false);

  const resetToTeslaDemo = () => {
    setSolarPower(3.2);
    setHomePower(0.7);
    setBatteryPower(-2.5);
    setBatteryPercent(73);
    setGridPower(0);
    setEvPower(0);
  };

  const presets = [
    { 
      label: 'Sunny Day', 
      desc: 'Solar powering everything',
      apply: () => { setSolarPower(5.8); setHomePower(1.2); setBatteryPower(2.0); setBatteryPercent(45); setGridPower(-1.5); setEvPower(1.1); }
    },
    { 
      label: 'Night Mode', 
      desc: 'Battery & grid powering home',
      apply: () => { setSolarPower(0); setHomePower(0.9); setBatteryPower(-0.6); setBatteryPercent(60); setGridPower(0.3); setEvPower(0); }
    },
    { 
      label: 'EV Charging', 
      desc: 'Solar charging everything',
      apply: () => { setSolarPower(7.2); setHomePower(1.5); setBatteryPower(1.2); setBatteryPercent(30); setGridPower(0); setEvPower(3.5); }
    },
    { 
      label: 'Grid Export', 
      desc: 'Full battery, selling to grid',
      apply: () => { setSolarPower(6.0); setHomePower(0.8); setBatteryPower(0); setBatteryPercent(100); setGridPower(-4.2); setEvPower(0); }
    },
    { 
      label: 'Tesla Screenshot', 
      desc: 'Matches your Tesla app',
      apply: resetToTeslaDemo,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Live Energy Flow Diagram
          </h1>
          <p className="text-muted-foreground mt-1">
            Tesla-inspired animated visualization — prototype for dashboard integration
          </p>
        </div>
        <Badge variant="outline" className="text-xs">Prototype</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visualization */}
        <Card className="lg:col-span-2 bg-gradient-to-b from-background to-muted/20">
          <CardContent className="p-4 md:p-6">
            <AnimatedEnergyFlow
              data={{
                solarPower,
                homePower,
                batteryPower,
                batteryPercent,
                gridPower,
                evPower,
              }}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="space-y-4">
          {/* Presets */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Scenario Presets</CardTitle>
              <CardDescription>Quick test different energy scenarios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-2"
                  onClick={preset.apply}
                >
                  <div>
                    <p className="font-medium text-sm">{preset.label}</p>
                    <p className="text-xs text-muted-foreground">{preset.desc}</p>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Manual Controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Manual Controls</CardTitle>
              <CardDescription>Fine-tune each parameter</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs flex justify-between">
                  <span>☀️ Solar</span>
                  <span className="font-mono">{solarPower.toFixed(1)} kW</span>
                </Label>
                <Slider value={[solarPower]} min={0} max={12} step={0.1} onValueChange={([v]) => setSolarPower(v)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs flex justify-between">
                  <span>🏠 Home</span>
                  <span className="font-mono">{homePower.toFixed(1)} kW</span>
                </Label>
                <Slider value={[homePower]} min={0} max={8} step={0.1} onValueChange={([v]) => setHomePower(v)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs flex justify-between">
                  <span>🔋 Battery</span>
                  <span className="font-mono">{batteryPower.toFixed(1)} kW {batteryPower > 0 ? '(charging)' : batteryPower < 0 ? '(discharging)' : ''}</span>
                </Label>
                <Slider value={[batteryPower]} min={-5} max={5} step={0.1} onValueChange={([v]) => setBatteryPower(v)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs flex justify-between">
                  <span>🔋 Battery %</span>
                  <span className="font-mono">{batteryPercent}%</span>
                </Label>
                <Slider value={[batteryPercent]} min={0} max={100} step={1} onValueChange={([v]) => setBatteryPercent(v)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs flex justify-between">
                  <span>⚡ Grid</span>
                  <span className="font-mono">{gridPower.toFixed(1)} kW {gridPower > 0 ? '(import)' : gridPower < 0 ? '(export)' : ''}</span>
                </Label>
                <Slider value={[gridPower]} min={-5} max={5} step={0.1} onValueChange={([v]) => setGridPower(v)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs flex justify-between">
                  <span>🚗 EV</span>
                  <span className="font-mono">{evPower.toFixed(1)} kW</span>
                </Label>
                <Slider value={[evPower]} min={0} max={11} step={0.1} onValueChange={([v]) => setEvPower(v)} />
              </div>

              <Button variant="ghost" size="sm" className="w-full mt-2" onClick={resetToTeslaDemo}>
                <RotateCcw className="h-3 w-3 mr-2" />
                Reset to Default
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Implementation Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Implementation Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• <strong>Animated particles</strong> flow along SVG paths using <code>animateMotion</code> — direction and speed reflect real-time power values</p>
          <p>• <strong>No extra dependencies</strong> — pure SVG + Framer Motion (already in stack)</p>
          <p>• <strong>5 nodes</strong>: Solar, Powerwall, Home, Grid, EV — more than Tesla's 4-node view</p>
          <p>• <strong>Responsive</strong> — uses viewBox so it scales to any container</p>
          <p>• When integrated with real API data, values will update via the existing Tesla/Enphase edge functions</p>
        </CardContent>
      </Card>
    </div>
  );
}
