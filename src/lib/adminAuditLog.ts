/**
 * Admin Audit Log (mock, off-chain)
 * ─────────────────────────────────
 * Append-only local ledger of every action taken in the Admin Subscription
 * Panel. Used to give founders a transparent history of mock-state changes
 * (tier overrides, anchor resets, usage edits) before mainnet billing ships.
 *
 * Storage: localStorage, capped at MAX_ENTRIES (newest first).
 * When billing/LP smart contract goes live, replace with on-chain event log.
 */

const STORAGE_KEY = 'zensolar_admin_audit_log';
const MAX_ENTRIES = 100;

export type AuditAction =
  | 'tier_set'
  | 'tier_cleared'
  | 'anchor_reset'
  | 'usage_set'
  | 'usage_reset';

export interface AuditEntry {
  id: string;
  action: AuditAction;
  label: string;
  detail?: string;
  at: number; // epoch ms
}

function safeRead(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWrite(entries: AuditEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
    window.dispatchEvent(new CustomEvent('zensolar:audit-log-updated'));
  } catch {
    /* ignore */
  }
}

export function logAuditAction(action: AuditAction, label: string, detail?: string): void {
  const entry: AuditEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action,
    label,
    detail,
    at: Date.now(),
  };
  const next = [entry, ...safeRead()];
  safeWrite(next);
}

export function readAuditLog(): AuditEntry[] {
  return safeRead();
}

export function clearAuditLog(): void {
  safeWrite([]);
}
