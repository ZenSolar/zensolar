import { describe, it, expect } from 'vitest';
import { classifyGrantFailure } from '../../supabase/functions/_shared/grantHealth.ts';

/**
 * REGRESSION GUARD — a refresh race must never be reported as member churn.
 *
 * Tesla returns `login_required` for three unrelated situations. Blaming the
 * member for all of them is what made a self-inflicted token race look like
 * users revoking access, and it hid the real defect for weeks.
 */
describe('classifyGrantFailure — Tesla login_required disambiguation', () => {
  it('treats a spent rotating refresh token as OUR defect, not churn', () => {
    const body = '{"error":"login_required","error_description":"The refresh_token is invalid"}';
    expect(classifyGrantFailure(400, body)).toBe('technically_invalid');
  });

  it('treats a Tesla-side session flush as OUR defect, not churn', () => {
    const body = '{"error":"login_required","error_description":"user session flushed"}';
    expect(classifyGrantFailure(400, body)).toBe('technically_invalid');
  });

  it('still reports a genuine consent withdrawal as churn', () => {
    const body = '{"error":"login_required","error_description":"User consent revoked."}';
    expect(classifyGrantFailure(400, body)).toBe('user_revoked');
  });

  it('reports access_denied as churn', () => {
    expect(classifyGrantFailure(400, '{"error":"access_denied"}')).toBe('user_revoked');
  });

  it('defaults unknown failures to technically_invalid', () => {
    expect(classifyGrantFailure(500, 'upstream timeout')).toBe('technically_invalid');
    expect(classifyGrantFailure(400, '{"error":"invalid_grant"}')).toBe('technically_invalid');
  });
});
