import { BlogArticle } from '@/components/blog/BlogArticle';
import { Link } from 'react-router-dom';

export default function V2GVehicleToGrid() {
  return (
    <BlogArticle
      title="V2G (Vehicle-to-Grid) Explained: How Your EV Can Power the Grid and Earn Crypto"
      description="Vehicle-to-Grid (V2G) technology lets your EV export energy back to the utility grid during peak demand. Learn how V2G works and how ZenSolar rewards it with $ZSOLAR tokens."
      slug="v2g-vehicle-to-grid"
      date="2026-02-13"
      readTime="8 min read"
      category="Technology"
    >
      <h2>What Is V2G (Vehicle-to-Grid)?</h2>
      <p>
        <strong>Vehicle-to-Grid (V2G)</strong> is a bi-directional charging technology that allows
        electric vehicles to export stored energy back to the utility grid. Instead of your EV
        battery sitting idle while parked, V2G turns it into a <strong>distributed energy asset</strong> that
        helps stabilize the grid during peak demand — and earns you money in the process.
      </p>
      <p>
        The average EV battery holds 60–100 kWh of energy, far more than most homes consume in a day.
        When millions of EVs can discharge to the grid simultaneously, they form a massive,
        decentralized storage network that rivals utility-scale battery farms.
      </p>

      <h2>How V2G Works — Step by Step</h2>
      <ol>
        <li><strong>Plug in your V2G-capable EV</strong> — Using a bi-directional charger (like the Wallbox Quasar or Ford Charge Station Pro)</li>
        <li><strong>Grid signal received</strong> — Your utility or aggregator sends a discharge request during peak hours</li>
        <li><strong>EV exports energy</strong> — Your car's battery feeds electricity back through the charger to the grid</li>
        <li><strong>Compensation</strong> — You're paid for the energy exported, often at premium peak rates</li>
      </ol>
      <p>
        With ZenSolar, you earn <strong>$ZSOLAR tokens on top of utility payments</strong>. Our{' '}
        <Link to="/blog/proof-of-delta-explained" className="text-primary hover:underline">Proof-of-Delta</Link> system
        verifies the exact amount of energy your EV discharged to the grid, creating an immutable on-chain
        record and minting tokens proportional to your contribution.
      </p>

      <h2>Why V2G Matters for the Clean Energy Transition</h2>
      <p>
        V2G solves the <strong>"duck curve" problem</strong> — the phenomenon where solar-rich grids
        have excess energy during the day but face sharp demand spikes in the evening when the sun sets.
        V2G-enabled EVs absorb cheap solar energy during the day and discharge it during evening peaks,
        smoothing demand and reducing the need for fossil fuel peaker plants.
      </p>
      <p>
        According to the U.S. Department of Energy, if just 20% of American EVs participated in V2G,
        they could provide more storage capacity than all existing grid-scale batteries combined.
      </p>

      <h2>V2G-Capable Vehicles in 2026</h2>
      <ul>
        <li><strong>Nissan LEAF / Ariya</strong> — Pioneer of CHAdeMO-based V2G, supported in multiple utility pilots</li>
        <li><strong>Ford F-150 Lightning</strong> — Intelligent Backup Power with V2G via Ford Charge Station Pro</li>
        <li><strong>BMW iX / i4 / i5</strong> — V2G pilot programs with select European and U.S. utilities</li>
        <li><strong>Hyundai Ioniq 5 / Kia EV6 / EV9</strong> — CCS-based V2G support rolling out</li>
        <li><strong>Tesla Cybertruck</strong> — V2G capabilities via Powerwall integration</li>
      </ul>

      <h2>V2G and Virtual Power Plants</h2>
      <p>
        V2G is the foundation of <Link to="/blog/virtual-power-plant-vpp" className="text-primary hover:underline">Virtual Power Plants (VPPs)</Link> —
        coordinated networks of distributed batteries that act as a single dispatchable power plant. When thousands
        of V2G-enabled EVs discharge simultaneously during a grid event, they provide megawatts of capacity that
        utilities would otherwise source from gas peaker plants.
      </p>
      <p>
        ZenSolar rewards VPP participants with <strong>bonus multipliers</strong> — up to 3× during emergency
        grid events like CAISO Flex Alerts or ERCOT conservation calls.
      </p>

      <h2>V2G vs. V2H: What's the Difference?</h2>
      <p>
        While V2G sends energy back to the <em>utility grid</em>,{' '}
        <Link to="/blog/v2h-vehicle-to-home" className="text-primary hover:underline">V2H (Vehicle-to-Home)</Link> sends
        energy to <em>your house</em>. Both are bi-directional charging, but they serve different purposes.
        V2G is about grid services and earning revenue; V2H is about home backup and energy independence.
        Both earn $ZSOLAR rewards. For the full picture, see our{' '}
        <Link to="/blog/v2x-vehicle-to-everything" className="text-primary hover:underline">V2X overview</Link>.
      </p>

      <h2>How ZenSolar Rewards V2G</h2>
      <p>
        Every kWh your EV discharges to the grid is verified by{' '}
        <Link to="/blog/proof-of-delta-explained" className="text-primary hover:underline">Proof-of-Delta</Link> and
        minted as $ZSOLAR tokens on the Base blockchain. Combined with{' '}
        <Link to="/blog/ev-charging-crypto-earnings" className="text-primary hover:underline">EV charging rewards</Link> and{' '}
        <Link to="/blog/what-is-solar-energy-blockchain-rewards" className="text-primary hover:underline">solar production rewards</Link>,
        V2G creates a <strong>triple-earn scenario</strong> for solar + EV owners.
      </p>

      <h2>Getting Started With V2G</h2>
      <p>
        To participate in V2G, you need a bi-directional charger and a compatible EV. Sign up for
        ZenSolar, connect your vehicle, and your V2G discharge events will automatically earn
        $ZSOLAR tokens — verified on-chain and deposited to your gasless wallet.
      </p>
    </BlogArticle>
  );
}
