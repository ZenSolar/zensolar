import { BlogArticle } from '@/components/blog/BlogArticle';
import { Link } from 'react-router-dom';

export default function V2GV2HBidirectionalCharging() {
  return (
    <BlogArticle
      title="Bi-Directional EV Charging: The Complete Guide to V2G, V2H, V2X, and V2L"
      description="Everything you need to know about bi-directional EV charging — V2G, V2H, V2X, and V2L explained. Learn how your EV can power the grid, your home, and earn $ZSOLAR crypto."
      slug="v2g-v2h-bidirectional-ev-charging"
      date="2026-02-13"
      readTime="5 min read"
      category="Technology"
    >
      <h2>What Is Bi-Directional EV Charging?</h2>
      <p>
        Bi-directional charging lets your electric vehicle <em>send energy back</em> — to the grid,
        your home, or external devices. Instead of a one-way relationship (grid → car), your EV
        becomes a <strong>mobile energy asset</strong> that earns rewards every time it discharges.
      </p>
      <p>
        The technology goes by four names, depending on where the energy flows. Each has its own
        use case, reward structure, and market opportunity:
      </p>

      <h2><Link to="/blog/v2g-vehicle-to-grid" className="text-primary hover:underline">V2G — Vehicle-to-Grid →</Link></h2>
      <p>
        Your EV exports energy back to the utility grid during peak demand. V2G turns millions of
        parked EVs into a <strong>distributed energy storage network</strong> that stabilizes the grid
        and replaces fossil fuel peaker plants. Utilities pay for this service, and ZenSolar adds
        $ZSOLAR token rewards on top.
      </p>
      <p>
        V2G is the most impactful form of bi-directional charging and the backbone of{' '}
        <Link to="/blog/virtual-power-plant-vpp" className="text-primary hover:underline">Virtual Power Plants (VPPs)</Link>.
        <Link to="/blog/v2g-vehicle-to-grid" className="text-primary hover:underline ml-1">Read the full V2G guide →</Link>
      </p>

      <h2><Link to="/blog/v2h-vehicle-to-home" className="text-primary hover:underline">V2H — Vehicle-to-Home →</Link></h2>
      <p>
        Your EV powers your house during outages, peak pricing, or low-solar hours. A 75 kWh EV
        battery can run an average home for 2–3 days — far more than dedicated home batteries.
        Perfect for backup power and time-of-use optimization.
      </p>
      <p>
        Pair V2H with <Link to="/blog/tesla-solar-panel-crypto-rewards" className="text-primary hover:underline">solar panels</Link> to
        charge from sun and discharge at night — earning $ZSOLAR at every step.
        <Link to="/blog/v2h-vehicle-to-home" className="text-primary hover:underline ml-1">Read the full V2H guide →</Link>
      </p>

      <h2><Link to="/blog/v2l-vehicle-to-load" className="text-primary hover:underline">V2L — Vehicle-to-Load →</Link></h2>
      <p>
        Your EV powers external devices directly — tools, camping gear, appliances, even other EVs.
        No gas generator needed. V2L-capable vehicles like the Ford F-150 Lightning and Hyundai Ioniq 5
        output up to 9.6 kW of clean, silent power.
        <Link to="/blog/v2l-vehicle-to-load" className="text-primary hover:underline ml-1">Read the full V2L guide →</Link>
      </p>

      <h2><Link to="/blog/v2x-vehicle-to-everything" className="text-primary hover:underline">V2X — Vehicle-to-Everything →</Link></h2>
      <p>
        V2X is the umbrella term covering all bi-directional energy flows. Our comprehensive V2X guide
        covers the standards landscape (CHAdeMO, CCS, ISO 15118-20), compatible vehicles, and how
        every form of V2X earns $ZSOLAR rewards.
        <Link to="/blog/v2x-vehicle-to-everything" className="text-primary hover:underline ml-1">Read the full V2X guide →</Link>
      </p>

      <h2>How ZenSolar Rewards Bi-Directional Charging</h2>
      <p>
        Every kWh your EV discharges — whether to the grid, your home, or a portable load — is verified
        by <Link to="/blog/proof-of-delta-explained" className="text-primary hover:underline">Proof-of-Delta</Link> and
        minted as $ZSOLAR tokens on the Base blockchain. This creates a{' '}
        <strong>triple-earn scenario</strong> for solar + EV owners:
      </p>
      <ol>
        <li><Link to="/blog/what-is-solar-energy-blockchain-rewards" className="text-primary hover:underline">Solar production rewards</Link> — Earn for every kWh produced</li>
        <li><Link to="/blog/ev-charging-crypto-earnings" className="text-primary hover:underline">EV charging rewards</Link> — Earn when your EV charges</li>
        <li><strong>V2X discharge rewards</strong> — Earn again when your EV sends energy out</li>
      </ol>

      <h2>Getting Started</h2>
      <p>
        If you have a bi-directional charger and compatible EV, you're ready to earn. Sign up for
        ZenSolar, connect your vehicle and charger, and every V2G, V2H, and V2L event automatically
        generates blockchain-verified $ZSOLAR rewards.{' '}
        <Link to="/blog/how-to-earn-crypto-from-solar-panels" className="text-primary hover:underline">See our step-by-step getting started guide →</Link>
      </p>
    </BlogArticle>
  );
}
