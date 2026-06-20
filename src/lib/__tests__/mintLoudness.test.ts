import { describe, it, expect } from 'vitest';
import { classifyLoudness } from '@/hooks/useMintLoudness';

describe('classifyLoudness', () => {
  it('default Supercharger session is L1 silent', () => {
    expect(classifyLoudness({ kind: 'session_started', source: 'supercharger', isFirstEver: false })).toBe('L1');
  });
  it('default home session is L1 silent', () => {
    expect(classifyLoudness({ kind: 'session_started', source: 'home', isFirstEver: false })).toBe('L1');
  });
  it('first-ever Supercharger session is L2 light', () => {
    expect(classifyLoudness({ kind: 'session_started', source: 'supercharger', isFirstEver: true })).toBe('L2');
  });
  it('first-ever home session is L2 light', () => {
    expect(classifyLoudness({ kind: 'session_started', source: 'home', isFirstEver: true })).toBe('L2');
  });
  it('paused, resumed, and error are L2', () => {
    expect(classifyLoudness({ kind: 'session_paused' })).toBe('L2');
    expect(classifyLoudness({ kind: 'session_resumed' })).toBe('L2');
    expect(classifyLoudness({ kind: 'session_error' })).toBe('L2');
  });
  it('milestone events are L3 delight', () => {
    expect(classifyLoudness({ kind: 'mint_milestone', milestone: 'first_mint' })).toBe('L3');
    expect(classifyLoudness({ kind: 'mint_milestone', milestone: 'kwh_1k' })).toBe('L3');
    expect(classifyLoudness({ kind: 'mint_milestone', milestone: 'tokens_10k' })).toBe('L3');
  });
});
