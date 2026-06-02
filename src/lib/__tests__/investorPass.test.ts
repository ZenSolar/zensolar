// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  INVESTOR_PASS_KEY,
  writeInvestorPass,
  readInvestorPass,
  hasInvestorPass,
  clearInvestorPass,
} from '@/lib/investorPass';

describe('investorPass — SSOT for /investor → /demo handoff', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns no pass and false when storage is empty', () => {
    expect(readInvestorPass()).toBeNull();
    expect(hasInvestorPass()).toBe(false);
  });

  it('persists and reads back the investor pass written by /investor after NDA', () => {
    writeInvestorPass({
      email: 'lp@example.com',
      fullName: 'Limited Partner',
      ndaVersion: '1.0',
      signedAt: '2026-06-02T12:00:00.000Z',
    });

    const raw = localStorage.getItem(INVESTOR_PASS_KEY);
    expect(raw).toBeTruthy();

    const pass = readInvestorPass();
    expect(pass).toEqual({
      email: 'lp@example.com',
      fullName: 'Limited Partner',
      ndaVersion: '1.0',
      signedAt: '2026-06-02T12:00:00.000Z',
    });
    expect(hasInvestorPass()).toBe(true);
  });

  it('rejects a malformed pass (missing fullName)', () => {
    localStorage.setItem(
      INVESTOR_PASS_KEY,
      JSON.stringify({ email: 'lp@example.com' }),
    );
    expect(readInvestorPass()).toBeNull();
    expect(hasInvestorPass()).toBe(false);
  });

  it('rejects a malformed pass (missing email)', () => {
    localStorage.setItem(
      INVESTOR_PASS_KEY,
      JSON.stringify({ fullName: 'Limited Partner' }),
    );
    expect(readInvestorPass()).toBeNull();
    expect(hasInvestorPass()).toBe(false);
  });

  it('rejects non-JSON garbage without throwing', () => {
    localStorage.setItem(INVESTOR_PASS_KEY, 'not-json-at-all');
    expect(() => readInvestorPass()).not.toThrow();
    expect(hasInvestorPass()).toBe(false);
  });

  it('clearInvestorPass removes the key', () => {
    writeInvestorPass({
      email: 'lp@example.com',
      fullName: 'Limited Partner',
      ndaVersion: '1.0',
      signedAt: '2026-06-02T12:00:00.000Z',
    });
    expect(hasInvestorPass()).toBe(true);
    clearInvestorPass();
    expect(hasInvestorPass()).toBe(false);
    expect(localStorage.getItem(INVESTOR_PASS_KEY)).toBeNull();
  });
});
