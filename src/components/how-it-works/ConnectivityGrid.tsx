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
    devices: ['Solar', 'Powerwall', 'Vehicles'],
  },
  {
    name: 'Enphase',
    logo: enphaseLogo,
    devices: ['Microinverters', 'Battery'],
  },
  {
    name: 'SolarEdge',
    logo: solarEdgeLogo,
    devices: ['Inverters', 'Optimizers'],
  },
  {
    name: 'Wallbox',
    logo: wallboxLogo,
    devices: ['EV Chargers'],
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
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Section Header */}
      <div className="text-center space-y-3">
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl md:text-3xl font-bold text-foreground"
        >
          Works With Your Devices
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground text-sm md:text-base"
        >
          Connect in seconds using secure OAuth—we never see your passwords
        </motion.p>
      </div>

      {/* Device Types */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {deviceTypes.map((device, index) => (
          <motion.div
            key={device.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.08 }}
          >
            <Card className="h-full hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
              <CardContent className="p-5 text-center space-y-3">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="p-3 rounded-xl bg-primary/10 w-fit mx-auto group-hover:bg-primary/15 transition-colors"
                >
                  <device.icon className="h-6 w-6 text-primary" />
                </motion.div>
                <p className="font-semibold text-sm text-foreground">{device.label}</p>
                <p className="text-xs text-muted-foreground">{device.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Provider Logos */}
      <Card className="overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20">
        <CardContent className="p-6 md:p-8">
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xs font-semibold text-muted-foreground text-center uppercase tracking-wider mb-6"
          >
            Supported Providers
          </motion.p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {providers.map((provider, index) => (
              <motion.div
                key={provider.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.03 }}
                className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-primary/5 transition-all duration-300 group cursor-default"
              >
                <div className="relative">
                  <img 
                    src={provider.logo} 
                    alt={provider.name}
                    className="h-10 object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                  />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.1, type: "spring" }}
                  >
                    <CheckCircle2 className="absolute -top-1 -right-2 h-4 w-4 text-secondary" />
                  </motion.div>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {provider.devices.map(device => (
                    <Badge 
                      key={device} 
                      variant="secondary" 
                      className="text-xs font-medium bg-muted/80 hover:bg-muted"
                    >
                      {device}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-xs text-muted-foreground text-center mt-6"
          >
            More providers coming soon—let us know what you use!
          </motion.p>
        </CardContent>
      </Card>
    </motion.section>
  );
}
