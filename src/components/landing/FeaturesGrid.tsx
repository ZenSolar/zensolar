import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Sun, Car, Battery, Zap } from 'lucide-react';

const features = [
  {
    icon: Sun,
    title: 'Solar Production',
    description: 'Earn tokens for every kWh your panels generate',
    gradient: 'from-solar to-accent',
  },
  {
    icon: Car,
    title: 'EV Miles',
    description: 'Get rewarded for every electric mile driven',
    gradient: 'from-energy to-primary',
  },
  {
    icon: Battery,
    title: 'Battery Storage',
    description: 'Maximize earnings from home battery systems',
    gradient: 'from-secondary to-eco',
  },
  {
    icon: Zap,
    title: 'EV Charging',
    description: 'Earn from every charge session at home',
    gradient: 'from-token to-primary',
  },
];

export function FeaturesGrid() {
  return (
    <section className="py-16 md:py-20 bg-muted/30 dark:bg-muted/10">
      <div className="container max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Four Ways to Earn</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Connect your existing clean energy hardware and start earning $ZSOLAR tokens automatically
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
            >
              <Card className="h-full bg-card/80 border-border/50 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 dark:hover:shadow-primary/15 transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-5 text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} mb-3 shadow-lg`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-base mb-1.5">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
