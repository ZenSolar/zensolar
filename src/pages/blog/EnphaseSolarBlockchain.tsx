import { BlogArticle } from '@/components/blog/BlogArticle';
import { Link } from 'react-router-dom';

export default function EnphaseSolarBlockchain() {
  return (
    <BlogArticle
      title="Enphase Solar Blockchain Integration: Earn Crypto With Microinverters"
      description="How Enphase IQ microinverter owners can earn blockchain-verified $ZSOLAR crypto tokens for every kWh of solar energy produced."
      slug="enphase-solar-blockchain"
      date="2026-02-13"
      readTime="6 min read"
      category="Guide"
    >
      <h2>Enphase Meets Blockchain</h2>
      <p>
        Enphase Energy is the world's leading microinverter manufacturer, powering millions of
        solar installations globally. Now, Enphase system owners can unlock a new revenue stream
        by connecting their Enlighten account to ZenSolar and earning <strong>$ZSOLAR tokens</strong> for
        every kilowatt-hour produced. New to solar crypto?{' '}
        <Link to="/blog/what-is-solar-energy-blockchain-rewards" className="text-primary hover:underline">Learn how solar blockchain rewards work</Link>.
      </p>

      <h2>Why Enphase + Blockchain Is a Perfect Match</h2>
      <p>
        Enphase microinverters are uniquely suited for blockchain energy verification because
        they report <strong>panel-level production data</strong>. Unlike string inverters that report
        aggregate output, Enphase IQ systems provide granular, per-panel metrics through the
        Enlighten API — giving ZenSolar the most precise energy data possible.
      </p>
      <p>
        This granularity means higher-confidence verification through our{' '}
        <Link to="/blog/proof-of-delta-explained" className="text-primary hover:underline">Proof-of-Delta</Link> system,
        which translates to faster reward minting and stronger anti-gaming protections.
      </p>

      <h2>How the Integration Works</h2>
      <ol>
        <li><strong>Authorize your Enlighten account</strong> — Secure OAuth connection to your Enphase system</li>
        <li><strong>Microinverter data syncs automatically</strong> — Production data from every panel flows to ZenSolar</li>
        <li><strong>Delta verification runs</strong> — Real energy production is verified against historical patterns</li>
        <li><strong>$ZSOLAR tokens mint on-chain</strong> — Verified production triggers automatic token minting on Base L2</li>
      </ol>

      <h2>Enphase Battery (IQ Battery) Rewards</h2>
      <p>
        If your Enphase system includes IQ Batteries, you earn additional $ZSOLAR for every kWh
        discharged. Battery discharge during peak hours demonstrates grid support and earns a
        higher reward multiplier. Enphase IQ Battery owners can also participate in{' '}
        <Link to="/blog/virtual-power-plant-vpp" className="text-primary hover:underline">Virtual Power Plant (VPP) events</Link> for
        even greater rewards.
      </p>

      <h2>Supported Enphase Systems</h2>
      <ul>
        <li><strong>IQ7 / IQ7+ / IQ7A microinverters</strong> — Full production tracking</li>
        <li><strong>IQ8 / IQ8+ microinverters</strong> — Enhanced grid-forming data support</li>
        <li><strong>IQ Batteries (3, 5, 10, 10T)</strong> — Discharge and storage rewards</li>
        <li><strong>Envoy / IQ Gateway</strong> — Required for API data access</li>
      </ul>

      <h2>Enphase + EV: The Full Stack</h2>
      <p>
        Pair your Enphase solar system with an EV to maximize rewards. Every kWh your panels produce
        earns solar tokens, and every kWh that charges your EV earns{' '}
        <Link to="/blog/ev-charging-crypto-earnings" className="text-primary hover:underline">EV charging rewards</Link>.
        If your EV supports{' '}
        <Link to="/blog/v2g-v2h-bidirectional-ev-charging" className="text-primary hover:underline">bi-directional charging</Link>,
        you earn even more when it discharges.
      </p>

      <h2>Getting Started With Enphase</h2>
      <p>
        All you need is an active Enphase Enlighten account and an Envoy or IQ Gateway on your
        local network. Follow our{' '}
        <Link to="/blog/how-to-earn-crypto-from-solar-panels" className="text-primary hover:underline">step-by-step guide</Link> to
        sign up for ZenSolar, authorize your Enlighten account, and start earning
        blockchain-verified rewards. Using Tesla instead?{' '}
        <Link to="/blog/tesla-solar-panel-crypto-rewards" className="text-primary hover:underline">See our Tesla guide</Link>.
      </p>
    </BlogArticle>
  );
}
