import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Hexagon, TrendingUp, Globe } from 'lucide-react';

const edges = [
  {
    icon: Hexagon,
    title: 'Mint-on-Proof Architecture',
    description: 'Unlike legacy systems that distribute from pre-minted pools, SEGI creates tokens on-demand—each one backed by verified clean energy activity.',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  {
    icon: TrendingUp,
    title: 'Deflationary by Design',
    description: 'Our innovative tokenomics apply burn mechanics at minting and transfer, creating sustainable scarcity as adoption grows.',
    iconBg: 'bg-secondary/10',
    iconColor: 'text-secondary',
  },
  {
    icon: Globe,
    title: 'Unified Multi-Vertical',
    description: 'The first and only platform aggregating Solar, Battery, EV, and Charging rewards into one dashboard with one token.',
    iconBg: 'bg-solar/10',
    iconColor: 'text-solar',
  },
  {
    icon: Shield,
    title: 'Patent-Pending IP',
    description: "SEGI's software-only gateway methodology is protected by pending patents—no existing claims cover this approach.",
    iconBg: 'bg-energy/10',
    iconColor: 'text-energy',
  },
];

export function CompetitiveEdge() {
  return (
    <section className="py-16 md:py-20">
      <div className="container max-w-4xl mx-auto px-4 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
            <Shield className="h-3.5 w-3.5 mr-2" />
            First-Mover Advantage
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            A{' '}
            <span className="bg-gradient-to-r from-secondary via-energy to-primary bg-clip-text text-transparent">
              Category-Defining
            </span>{' '}
            Innovation
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            ZenSolar isn't an incremental improvement—it's the first platform to unify verified energy
            data with true on-demand blockchain minting.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4">
          {edges.map((edge, index) => (
            <motion.div
              key={edge.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ delay: 0.05 + index * 0.05, duration: 0.4 }}
            >
              <Card className="h-full bg-card/80 border-border/50 hover:border-primary/40 transition-all">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${edge.iconBg} flex items-center justify-center`}>
                      <edge.icon className={`h-5 w-5 ${edge.iconColor}`} />
                    </div>
                    <h3 className="font-semibold">{edge.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {edge.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
