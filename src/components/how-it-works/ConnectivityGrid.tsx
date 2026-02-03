import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sun, Battery, Car, Plug, CheckCircle2 } from 'lucide-react';
import teslaLogo from '@/assets/logos/tesla-logo.png';
import enphaseLogo from '@/assets/logos/enphase-logo.png';
import solarEdgeLogo from '@/assets/logos/solaredge-logo.png';
import wallboxLogo from '@/assets/logos/wallbox-logo.png';

const providers = [
  {
    name: 'Tesla',
    logo: teslaLogo,
    devices: ['Solar Panels', 'Powerwall', 'Vehicles'],
    icon: Sun,
    color: 'from-red-500 to-red-600',
  },
  {
    name: 'Enphase',
    logo: enphaseLogo,
    devices: ['Microinverters', 'Battery Storage'],
    icon: Sun,
    color: 'from-orange-500 to-amber-500',
  },
  {
    name: 'SolarEdge',
    logo: solarEdgeLogo,
    devices: ['Inverters', 'Optimizers'],
    icon: Sun,
    color: 'from-blue-500 to-blue-600',
  },
  {
    name: 'Wallbox',
    logo: wallboxLogo,
    devices: ['EV Chargers'],
    icon: Plug,
    color: 'from-emerald-500 to-green-500',
  },
];

const deviceTypes = [
  { icon: Sun, label: 'Solar Panels', desc: 'Track kWh production' },
  { icon: Battery, label: 'Home Batteries', desc: 'Track discharge cycles' },
  { icon: Car, label: 'Electric Vehicles', desc: 'Track miles driven' },
  { icon: Plug, label: 'EV Chargers', desc: 'Track charging sessions' },
];

export function ConnectivityGrid() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Works With Your Devices</h2>
        <p className="text-muted-foreground">
          Connect in seconds using secure OAuth—we never see your passwords
        </p>
      </div>

      {/* Device Types */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {deviceTypes.map((device, index) => (
          <motion.div
            key={device.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <Card className="h-full hover:border-primary/30 transition-colors">
              <CardContent className="p-4 text-center space-y-2">
                <div className="p-3 rounded-xl bg-primary/10 w-fit mx-auto">
                  <device.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="font-medium text-sm text-foreground">{device.label}</p>
                <p className="text-xs text-muted-foreground">{device.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Provider Logos */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <p className="text-xs font-medium text-muted-foreground text-center uppercase tracking-wide mb-4">
            Supported Providers
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {providers.map((provider, index) => (
              <motion.div
                key={provider.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-muted/50 transition-colors group"
              >
                <div className="relative">
                  <img 
                    src={provider.logo} 
                    alt={provider.name}
                    className="h-10 object-contain filter grayscale group-hover:grayscale-0 transition-all"
                  />
                  <CheckCircle2 className="absolute -top-1 -right-1 h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex flex-wrap gap-1 justify-center">
                  {provider.devices.map(device => (
                    <Badge key={device} variant="secondary" className="text-xs">
                      {device}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">
            More providers coming soon—let us know what you use!
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
