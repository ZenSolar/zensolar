import { BlogArticle } from '@/components/blog/BlogArticle';

export default function V2GV2HBidirectionalCharging() {
  return (
    <BlogArticle
      title="V2G, V2H, and V2X: How Bi-Directional EV Charging Creates Blockchain Rewards"
      description="Bi-directional EV charging (V2G, V2H, V2X) lets your electric vehicle power your home and the grid. Learn how ZenSolar rewards this with $ZSOLAR tokens."
      slug="v2g-v2h-bidirectional-ev-charging"
      date="2026-02-11"
      readTime="8 min read"
      category="Technology"
    >
      <h2>What Is Bi-Directional EV Charging?</h2>
      <p>
        Bi-directional charging is the ability for an electric vehicle to not only <em>receive</em> power
        but also <em>send it back</em> — to your home, the grid, or other loads. This
        technology goes by several names depending on where the energy flows:
      </p>
      <ul>
        <li><strong>V2G (Vehicle-to-Grid):</strong> Your EV exports energy back to the utility grid during peak demand</li>
        <li><strong>V2H (Vehicle-to-Home):</strong> Your EV powers your house during outages or peak pricing</li>
        <li><strong>V2X (Vehicle-to-Everything):</strong> The umbrella term for any bi-directional energy flow from an EV</li>
        <li><strong>V2L (Vehicle-to-Load):</strong> Your EV powers external devices and appliances directly</li>
      </ul>

      <h2>Why V2G Matters for Clean Energy</h2>
      <p>
        The average EV battery holds 60–100 kWh of energy — far more than most homes use in a
        day. When millions of EVs can discharge back to the grid during peak hours, they become a
        <strong> distributed energy storage network</strong> that rivals utility-scale batteries.
      </p>
      <p>
        This is a game-changer for grid stability, renewable integration, and peak demand management.
        V2G-enabled EVs can absorb excess solar during the day and discharge it during evening peaks —
        smoothing the infamous "duck curve" that plagues grids with high solar penetration.
      </p>

      <h2>How ZenSolar Rewards Bi-Directional Charging</h2>
      <p>
        ZenSolar's <strong>Proof-of-Delta</strong> system is uniquely designed to verify bi-directional
        energy flows. When your EV discharges to your home (V2H) or the grid (V2G), ZenSolar detects
        the reverse energy flow and mints $ZSOLAR tokens for the verified discharge amount.
      </p>
      <p>
        This creates a <strong>triple-earn scenario</strong> for solar + EV owners:
      </p>
      <ol>
        <li><strong>Solar production</strong> — Earn for every kWh your panels produce</li>
        <li><strong>EV charging</strong> — Earn when your EV charges from solar or grid</li>
        <li><strong>V2G/V2H discharge</strong> — Earn again when your EV sends energy back</li>
      </ol>

      <h2>Current V2G-Capable Vehicles</h2>
      <p>
        Bi-directional charging is rapidly expanding across manufacturers:
      </p>
      <ul>
        <li><strong>Ford F-150 Lightning</strong> — Intelligent Backup Power (V2H via Ford Charge Station Pro)</li>
        <li><strong>Nissan LEAF</strong> — Pioneer of CHAdeMO-based V2G</li>
        <li><strong>Hyundai Ioniq 5 / Kia EV6</strong> — Vehicle-to-Load (V2L) via onboard outlet</li>
        <li><strong>Tesla Powerwall + Cybertruck</strong> — V2H capabilities via Powerwall integration</li>
        <li><strong>BMW iX / i4</strong> — V2G pilot programs with select utilities</li>
      </ul>

      <h2>V2G and Virtual Power Plants</h2>
      <p>
        V2G is the backbone of <strong>Virtual Power Plants (VPPs)</strong> — aggregated networks of
        distributed energy resources that act as a single dispatchable power plant. When thousands of
        EVs participate in coordinated discharge, they can provide grid services worth billions.
        ZenSolar rewards participants in these aggregated events with bonus $ZSOLAR.
      </p>

      <h2>The Future of V2X Rewards</h2>
      <p>
        As bi-directional charging standards (CCS V2X, ISO 15118-20) mature and more vehicles
        support discharge, ZenSolar will automatically expand rewards for V2G, V2H, and V2L
        activities. Early adopters of bi-directional charging are positioning themselves for
        the richest reward multipliers.
      </p>
    </BlogArticle>
  );
}
