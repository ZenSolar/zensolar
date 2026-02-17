import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Mike R.',
    role: 'Tesla Solar + Powerwall Owner',
    quote: "I connected my Tesla account in under a minute. Within 24 hours, I had my first $ZSOLAR tokens. It's like getting paid for something I was already doing.",
    avatar: '☀️',
    highlight: 'First tokens in 24h',
  },
  {
    name: 'Sarah K.',
    role: 'Enphase Solar System Owner',
    quote: "The Proof-of-Delta verification is brilliant. I can see exactly how my solar production translates to token rewards. It's completely transparent.",
    avatar: '⚡',
    highlight: 'Full transparency',
  },
  {
    name: 'David L.',
    role: 'EV Driver & Solar Owner',
    quote: "I'm earning rewards for my solar panels AND my EV charging. The NFT milestones make it feel like a game. My kids love checking our 'energy achievements.'",
    avatar: '🚗',
    highlight: 'Dual rewards',
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-[clamp(3rem,8vw,6rem)]">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Badge variant="outline" className="px-3 py-1 border-solar/40 bg-solar/10 text-solar font-medium mb-4">
              Beta Users
            </Badge>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
          >
            What Our Beta Users Say
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-muted-foreground max-w-lg mx-auto"
          >
            Real feedback from real clean energy users earning real rewards.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
            >
              <Card className="h-full border-border/60 hover:shadow-lg transition-shadow bg-gradient-to-br from-card to-muted/10">
                <CardContent className="p-6 flex flex-col gap-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 text-solar fill-solar" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed italic">"{t.quote}"</p>
                  <div className="flex items-center gap-3 mt-auto pt-3 border-t border-border/40">
                    <span className="text-2xl">{t.avatar}</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="self-start text-xs">{t.highlight}</Badge>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
