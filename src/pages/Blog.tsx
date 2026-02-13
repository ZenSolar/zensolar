import { SEO } from '@/components/SEO';
import { HomeNav } from '@/components/home/HomeNav';
import { HomeFooter } from '@/components/home/HomeFooter';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Calendar } from 'lucide-react';

const posts = [
  {
    slug: 'tesla-solar-panel-crypto-rewards',
    title: 'Tesla Solar Panel Crypto Rewards: How to Earn $ZSOLAR With Your Powerwall',
    excerpt: 'Discover how Tesla solar panel and Powerwall owners can earn $ZSOLAR crypto tokens automatically for every kWh produced and stored.',
    date: '2026-02-13',
    category: 'Guide',
    readTime: '7 min read',
  },
  {
    slug: 'enphase-solar-blockchain',
    title: 'Enphase Solar Blockchain Integration: Earn Crypto With Microinverters',
    excerpt: 'How Enphase IQ microinverter owners can earn blockchain-verified $ZSOLAR crypto tokens for every kWh of solar energy produced.',
    date: '2026-02-13',
    category: 'Guide',
    readTime: '6 min read',
  },
  {
    slug: 'ev-charging-crypto-earnings',
    title: 'EV Charging Crypto Earnings: How Electric Vehicle Owners Earn $ZSOLAR',
    excerpt: 'Electric vehicle owners earn $ZSOLAR tokens for every kWh charged and every mile driven. Learn how EV charging becomes a reward-earning activity.',
    date: '2026-02-12',
    category: 'Guide',
    readTime: '7 min read',
  },
  {
    slug: 'v2g-v2h-bidirectional-ev-charging',
    title: 'Bi-Directional EV Charging: The Complete Guide to V2G, V2H, V2X, and V2L',
    excerpt: 'Everything you need to know about bi-directional EV charging — V2G, V2H, V2X, and V2L explained with dedicated deep dives into each technology.',
    date: '2026-02-13',
    category: 'Technology',
    readTime: '5 min read',
  },
  {
    slug: 'v2g-vehicle-to-grid',
    title: 'V2G (Vehicle-to-Grid): How Your EV Can Power the Grid and Earn Crypto',
    excerpt: 'Vehicle-to-Grid technology lets your EV export energy back to the utility grid during peak demand, earning utility payments and $ZSOLAR tokens.',
    date: '2026-02-13',
    category: 'Technology',
    readTime: '8 min read',
  },
  {
    slug: 'v2h-vehicle-to-home',
    title: 'V2H (Vehicle-to-Home): Use Your EV as a Home Battery and Earn Crypto',
    excerpt: 'Vehicle-to-Home lets your EV power your house during outages or peak pricing. Your 75 kWh EV battery can run your home for 2–3 days.',
    date: '2026-02-13',
    category: 'Technology',
    readTime: '7 min read',
  },
  {
    slug: 'v2x-vehicle-to-everything',
    title: 'V2X (Vehicle-to-Everything): The Complete Guide to Bi-Directional EV Charging',
    excerpt: 'V2X is the umbrella term for all bi-directional energy flows from your EV — V2G, V2H, V2L, and V2V. The complete standards and vehicle guide.',
    date: '2026-02-13',
    category: 'Technology',
    readTime: '9 min read',
  },
  {
    slug: 'v2l-vehicle-to-load',
    title: 'V2L (Vehicle-to-Load): Power Anything From Your EV and Earn Crypto',
    excerpt: 'Vehicle-to-Load lets your EV power external devices — tools, camping gear, appliances. A silent, zero-emission portable generator.',
    date: '2026-02-13',
    category: 'Technology',
    readTime: '6 min read',
  },
  {
    slug: 'virtual-power-plant-vpp',
    title: 'Virtual Power Plants (VPP): How Your Home Battery and EV Power the Grid — and Earn Crypto',
    excerpt: 'Virtual Power Plants aggregate solar panels, batteries, and EVs into a grid-scale resource. Learn how VPP participants earn $ZSOLAR blockchain rewards.',
    date: '2026-02-10',
    category: 'Technology',
    readTime: '8 min read',
  },
  {
    slug: 'what-is-solar-energy-blockchain-rewards',
    title: 'What Are Solar Energy Blockchain Rewards?',
    excerpt: 'Learn how blockchain technology is creating a new way for solar panel owners to earn passive income from every kilowatt-hour they produce.',
    date: '2026-02-12',
    category: 'Education',
    readTime: '6 min read',
  },
  {
    slug: 'how-to-earn-crypto-from-solar-panels',
    title: 'How to Earn Crypto From Your Solar Panels in 2026',
    excerpt: 'A step-by-step guide to connecting your solar inverter and earning $ZSOLAR tokens automatically — no crypto experience required.',
    date: '2026-02-10',
    category: 'Guide',
    readTime: '8 min read',
  },
  {
    slug: 'proof-of-delta-explained',
    title: 'Proof-of-Delta Explained: How ZenSolar Verifies Clean Energy',
    excerpt: 'Deep dive into ZenSolar\'s patent-pending verification system that ensures every token is backed by real, measured energy production.',
    date: '2026-02-08',
    category: 'Technology',
    readTime: '5 min read',
  },
];

export default function Blog() {
  return (
    <>
      <SEO
        title="Blog — Solar Energy Blockchain Rewards"
        description="Learn how to earn crypto from solar panels, understand Proof-of-Delta verification, and stay updated on clean energy blockchain rewards."
        url="https://zensolar.com/blog"
        image="https://zensolar.com/og-image.png"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'ZenSolar Blog',
          url: 'https://zensolar.com/blog',
          description: 'Articles about solar energy blockchain rewards, Proof-of-Delta verification, and earning crypto from clean energy.',
          publisher: {
            '@type': 'Organization',
            name: 'ZenSolar',
            url: 'https://zensolar.com',
          },
        }}
      />
      <div className="min-h-screen bg-background">
        <HomeNav />
        <main className="container max-w-4xl mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <Badge variant="outline" className="px-3 py-1 border-energy/40 bg-energy/10 text-energy font-medium mb-4">
              Blog
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
              Clean Energy Meets Blockchain
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Guides, deep dives, and updates on earning crypto from your solar panels, EVs, and batteries.
            </p>
          </motion.div>

          <div className="space-y-6">
            {posts.map((post, i) => (
              <motion.article
                key={post.slug}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  to={`/blog/${post.slug}`}
                  className="block group border border-border/60 rounded-xl p-6 bg-card/50 hover:bg-card hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    <Badge variant="secondary" className="text-xs">{post.category}</Badge>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{post.date}</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-3">{post.excerpt}</p>
                  <span className="text-sm text-primary font-medium flex items-center gap-1">
                    Read more <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </motion.article>
            ))}
          </div>
        </main>
        <HomeFooter />
      </div>
    </>
  );
}
