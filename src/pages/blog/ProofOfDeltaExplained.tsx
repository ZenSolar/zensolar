import { BlogArticle } from '@/components/blog/BlogArticle';

export default function ProofOfDeltaExplained() {
  return (
    <BlogArticle
      title="Proof-of-Delta Explained: How ZenSolar Verifies Clean Energy"
      description="Deep dive into ZenSolar's patent-pending verification system that ensures every token is backed by real, measured energy production."
      slug="proof-of-delta-explained"
      date="2026-02-08"
      readTime="5 min read"
      category="Technology"
    >
      <h2>The Problem: How Do You Prove Energy Was Actually Produced?</h2>
      <p>
        If you're going to reward people with real-value tokens for clean energy production,
        you need to be absolutely certain the energy data is real. Self-reported data can be
        faked. Screenshots can be doctored. Even API data can theoretically be replayed.
      </p>
      <p>
        This is the fundamental challenge of energy tokenization — and it's why ZenSolar
        developed <strong>Proof-of-Delta</strong>.
      </p>

      <h2>What Is a "Delta"?</h2>
      <p>
        In mathematics, delta (Δ) means "change." In ZenSolar's context, a delta is the
        change in your energy meter reading between two points in time. If your inverter
        reported 10,000 kWh total yesterday and 10,035 kWh today, your delta is 35 kWh.
      </p>
      <p>
        This delta is what we verify and reward — not absolute readings, not estimates,
        but the actual measured change in production.
      </p>

      <h2>How Proof-of-Delta Works</h2>
      <p>The verification process has four key steps:</p>
      <ol>
        <li>
          <strong>Baseline Capture:</strong> When you first connect your device, ZenSolar
          records your current lifetime production reading as a baseline. This prevents
          retroactive claiming of historical production.
        </li>
        <li>
          <strong>Periodic Sampling:</strong> ZenSolar reads your production data at regular
          intervals through the manufacturer's official API (Tesla, Enphase, or SolarEdge).
        </li>
        <li>
          <strong>Delta Calculation:</strong> The system calculates the difference between
          consecutive readings. Anomalous jumps (which might indicate data manipulation)
          are flagged for review.
        </li>
        <li>
          <strong>On-Chain Proof:</strong> The verified delta, along with a cryptographic
          hash of the source data, is recorded on the Base blockchain. This creates an
          immutable audit trail linking real-world energy production to token mints.
        </li>
      </ol>

      <h2>Why This Matters</h2>
      <p>
        Proof-of-Delta solves three critical problems simultaneously:
      </p>
      <ul>
        <li><strong>No double-counting:</strong> Each kWh can only be counted once because
          we track cumulative lifetime readings</li>
        <li><strong>No fabrication:</strong> Data comes directly from hardware APIs, not
          user input</li>
        <li><strong>Full auditability:</strong> Every token mint can be traced back to a
          specific energy delta on the blockchain</li>
      </ul>

      <h2>The Patent-Pending Innovation</h2>
      <p>
        ZenSolar's Proof-of-Delta system is patent-pending because it represents a novel
        approach to bridging physical energy production with digital token minting. Unlike
        traditional Renewable Energy Certificates (RECs), which are issued in bulk and
        traded between corporations, Proof-of-Delta enables real-time, granular rewards
        for individual energy producers.
      </p>

      <h2>Built on Base (Coinbase L2)</h2>
      <p>
        All Proof-of-Delta verifications are recorded on Base, Coinbase's Layer 2 network.
        Base provides Ethereum-level security with fast, low-cost transactions — essential
        for a system that needs to process frequent, small-value energy reward mints without
        prohibitive gas fees.
      </p>
    </BlogArticle>
  );
}
