import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { AnimatedEnergyFlow } from '@/components/dashboard/AnimatedEnergyFlow';
import { Activity, RotateCcw } from 'lucide-react';

export default function AdminLiveEnergyFlow() {
  const [solarPower, setSolarPower] = useState(3.2);
  const [homePower, setHomePower] = useState(0.7);
  const [batteryPower, setBatteryPower] = useState(-2.5);
  const [batteryPercent, setBatteryPercent] = useState(73);
  const [gridPower, setGridPower] = useState(0);
  const [evPower, setEvPower] = useState(11);

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
      label: '☀️ Sunny Day',
      desc: 'Solar powering everything + exporting',
      apply: () => { setSolarPower(5.8); setHomePower(1.2); setBatteryPower(2.0); setBatteryPercent(45); setGridPower(-1.5); setEvPower(1.1); }
    },
    {
      label: '🌙 Night Mode',
      desc: 'Battery & grid powering home',
      apply: () => { setSolarPower(0); setHomePower(0.9); setBatteryPower(-0.6); setBatteryPercent(60); setGridPower(0.3); setEvPower(0); }
    },
    {
      label: '🚗 Model X Charging',
      desc: 'Solar + battery powering Model X at 11kW',
      apply: () => { setSolarPower(7.2); setHomePower(1.5); setBatteryPower(-1.2); setBatteryPercent(65); setGridPower(0); setEvPower(11); }
    },
    {
      label: '💰 Grid Export',
      desc: 'Full battery, selling excess',
      apply: () => { setSolarPower(6.0); setHomePower(0.8); setBatteryPower(0); setBatteryPercent(100); setGridPower(-4.2); setEvPower(0); }
    },
    {
      label: '📱 Tesla Screenshot',
      desc: 'Matches your Tesla app values',
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
        {/* Visualization — force dark background regardless of theme */}
        <div className="lg:col-span-2 rounded-xl overflow-hidden border border-border/50 shadow-2xl">
          <AnimatedEnergyFlow
            data={{ solarPower, homePower, batteryPower, batteryPercent, gridPower, evPower }}
            className="w-full"
          />
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Scenario Presets</CardTitle>
              <CardDescription>Tap to visualize different energy scenarios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-2.5"
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

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Manual Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SliderControl label="☀️ Solar" value={solarPower} unit="kW" min={0} max={12} step={0.1} onChange={setSolarPower} />
              <SliderControl label="🏠 Home" value={homePower} unit="kW" min={0} max={8} step={0.1} onChange={setHomePower} />
              <SliderControl
                label="🔋 Battery"
                value={batteryPower}
                unit="kW"
                min={-5}
                max={5}
                step={0.1}
                onChange={setBatteryPower}
                suffix={batteryPower > 0 ? '(charging)' : batteryPower < 0 ? '(discharging)' : ''}
              />
              <SliderControl label="🔋 Battery %" value={batteryPercent} unit="%" min={0} max={100} step={1} onChange={setBatteryPercent} isInt />
              <SliderControl
                label="⚡ Grid"
                value={gridPower}
                unit="kW"
                min={-5}
                max={5}
                step={0.1}
                onChange={setGridPower}
                suffix={gridPower > 0 ? '(import)' : gridPower < 0 ? '(export)' : ''}
              />
              <SliderControl label="🚗 Model X" value={evPower} unit="kW" min={0} max={11.5} step={0.1} onChange={setEvPower} />

              <Button variant="ghost" size="sm" className="w-full mt-2" onClick={resetToTeslaDemo}>
                <RotateCcw className="h-3 w-3 mr-2" />
                Reset to Default
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Implementation Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• <strong>SVG particle animation</strong> with glow trails — speed and count scale with kW values</p>
          <p>• <strong>Always-dark canvas</strong> with stylized house + solar panel illustration</p>
          <p>• <strong>5 nodes</strong>: Solar, Powerwall, Home, Grid, Tesla Model X — exceeds Tesla's 4-node view</p>
          <p>• <strong>No new dependencies</strong> — pure SVG + existing Framer Motion</p>
          <p>• Ready for real-time API data from Tesla/Enphase/SolarEdge edge functions</p>
        </CardContent>
      </Card>
    </div>
  );
}

function SliderControl({
  label, value, unit, min, max, step, onChange, suffix, isInt,
}: {
  label: string; value: number; unit: string; min: number; max: number; step: number;
  onChange: (v: number) => void; suffix?: string; isInt?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs flex justify-between">
        <span>{label}</span>
        <span className="font-mono text-muted-foreground">
          {isInt ? value : value.toFixed(1)} {unit} {suffix && <span className="text-muted-foreground/60">{suffix}</span>}
        </span>
      </Label>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}
