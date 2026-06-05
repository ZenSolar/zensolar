/**
 * Seeded mint history fixtures for Investor Demo mode.
 * Fixture-only — never written to Supabase.
 */
import type { MintReceipt } from '@/hooks/useDemoData';

const DAY = 24 * 60 * 60 * 1000;

function fakeHash(n: number): string {
  // Stable, pseudo-random-looking hex of length 16.
  const seed = (n * 2654435761) >>> 0;
  return '0x' + seed.toString(16).padStart(8, '0') + (seed ^ 0xdeadbeef).toString(16).padStart(8, '0').slice(0, 8) + '...';
}

export function buildInvestorMintHistory(now: Date = new Date()): MintReceipt[] {
  const t = now.getTime();
  return [
    {
      id: 'inv-mh-1',
      category: 'solar',
      tokens: 1840,
      txHash: fakeHash(1),
      timestamp: new Date(t - 13 * DAY - 3 * 60 * 60 * 1000),
      type: 'token',
    },
    {
      id: 'inv-mh-2',
      category: 'all',
      tokens: 3210,
      txHash: fakeHash(2),
      timestamp: new Date(t - 9 * DAY - 7 * 60 * 60 * 1000),
      type: 'token',
    },
    {
      id: 'inv-mh-3',
      category: 'battery',
      tokens: 920,
      txHash: fakeHash(3),
      timestamp: new Date(t - 6 * DAY - 11 * 60 * 60 * 1000),
      type: 'token',
    },
    {
      id: 'inv-mh-4',
      category: 'home_charging',
      tokens: 1465,
      txHash: fakeHash(4),
      timestamp: new Date(t - 3 * DAY - 4 * 60 * 60 * 1000),
      type: 'token',
    },
    {
      id: 'inv-mh-5',
      category: 'all',
      tokens: 2280,
      txHash: fakeHash(5),
      timestamp: new Date(t - 18 * 60 * 60 * 1000),
      type: 'token',
    },
  ];
}

/** Two milestone NFTs seeded as already-minted in the demo collection. */
export const INVESTOR_SEED_MINTED_NFTS: number[] = [
  0, // Welcome NFT
  28, // Electra — 10,000 EV miles
  9, // Voltbank — 500 kWh battery
];
