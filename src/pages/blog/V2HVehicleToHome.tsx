import { BlogArticle } from '@/components/blog/BlogArticle';
import { Link } from 'react-router-dom';

export default function V2HVehicleToHome() {
  return (
    <BlogArticle
      title="V2H (Vehicle-to-Home): Use Your EV as a Home Battery and Earn Crypto Rewards"
      description="Vehicle-to-Home (V2H) lets your EV power your house during outages or peak pricing. Learn how V2H works and how to earn $ZSOLAR blockchain rewards."
      slug="v2h-vehicle-to-home"
      date="2026-02-13"
      readTime="7 min read"
      category="Technology"
    >
      <h2>What Is V2H (Vehicle-to-Home)?</h2>
      <p>
        <strong>Vehicle-to-Home (V2H)</strong> is a bi-directional charging technology that allows
        your electric vehicle to power your house. Your EV becomes a massive home battery —
        providing backup during power outages, reducing peak electricity costs, and maximizing
        your solar self-consumption.
      </p>
      <p>
        A typical EV battery (60–100 kWh) can power an average U.S. home for 2–3 days. Compare
        that to a Tesla Powerwall at 13.5 kWh — your EV holds 5–7× more energy storage, and
        you already own it.
      </p>

      <h2>How V2H Works</h2>
      <ol>
        <li><strong>Bi-directional charger installed</strong> — Hardware like the Wallbox Quasar, Ford Charge Station Pro, or Nissan-compatible units</li>
        <li><strong>EV plugged in at home</strong> — The charger connects your EV to your home electrical panel</li>
        <li><strong>Discharge triggered</strong> — During a power outage, peak pricing, or low-solar hours, your EV sends energy to your home</li>
        <li><strong>Seamless switchover</strong> — Your home runs on EV battery power without interruption</li>
      </ol>

      <h2>V2H Use Cases</h2>
      <h3>🔋 Backup Power During Outages</h3>
      <p>
        When the grid goes down, your EV keeps the lights on, the fridge running, and your
        internet connected. This is especially valuable in areas prone to severe weather, wildfires,
        or rolling blackouts. A fully charged EV can run essential home loads for days.
      </p>

      <h3>💰 Peak Shaving / Time-of-Use Optimization</h3>
      <p>
        If your utility charges higher rates during evening peak hours (typically 4–9 PM), V2H
        lets you power your home from your EV during expensive hours and recharge from cheap
        overnight rates or solar the next day. The savings add up fast.
      </p>

      <h3>☀️ Solar Self-Consumption Maximization</h3>
      <p>
        Pair V2H with{' '}
        <Link to="/blog/what-is-solar-energy-blockchain-rewards" className="text-primary hover:underline">solar panels</Link> for
        maximum impact. Charge your EV from solar during the day, then discharge to your home
        in the evening. This eliminates grid dependency almost entirely and earns $ZSOLAR tokens
        at every stage.
      </p>

      <h2>V2H-Compatible Vehicles and Chargers</h2>
      <ul>
        <li><strong>Ford F-150 Lightning</strong> — Built-in Intelligent Backup Power via Ford Charge Station Pro</li>
        <li><strong>Nissan LEAF</strong> — CHAdeMO V2H with compatible bi-directional chargers</li>
        <li><strong>Hyundai Ioniq 5 / Kia EV6</strong> — V2H via external bi-directional inverters</li>
        <li><strong>GM Ultium vehicles</strong> — V2H support rolling out across Silverado EV, Blazer EV</li>
        <li><strong>Wallbox Quasar 2</strong> — The most popular residential bi-directional charger for V2H</li>
      </ul>

      <h2>How ZenSolar Rewards V2H</h2>
      <p>
        Every kWh your EV discharges to your home is tracked through your charger's API and verified by{' '}
        <Link to="/blog/proof-of-delta-explained" className="text-primary hover:underline">Proof-of-Delta</Link>.
        ZenSolar mints $ZSOLAR tokens for verified V2H discharge, rewarding you for reducing grid
        demand and increasing energy independence.
      </p>
      <p>
        Combined with{' '}
        <Link to="/blog/ev-charging-crypto-earnings" className="text-primary hover:underline">EV charging rewards</Link> and{' '}
        <Link to="/blog/tesla-solar-panel-crypto-rewards" className="text-primary hover:underline">solar production tokens</Link>,
        V2H creates a complete energy reward loop: produce → store → discharge → earn.
      </p>

      <h2>V2H vs. V2G vs. V2L</h2>
      <p>
        V2H is one type of bi-directional charging. See our dedicated guides on{' '}
        <Link to="/blog/v2g-vehicle-to-grid" className="text-primary hover:underline">V2G (Vehicle-to-Grid)</Link>,{' '}
        <Link to="/blog/v2l-vehicle-to-load" className="text-primary hover:underline">V2L (Vehicle-to-Load)</Link>, and our{' '}
        <Link to="/blog/v2x-vehicle-to-everything" className="text-primary hover:underline">complete V2X overview</Link> to
        understand the full bi-directional charging ecosystem.
      </p>

      <h2>Getting Started With V2H</h2>
      <p>
        If you have a V2H-compatible EV and charger, connect your accounts to ZenSolar and your
        home discharge sessions will automatically earn blockchain-verified $ZSOLAR rewards.
      </p>
    </BlogArticle>
  );
}
