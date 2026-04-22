import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VipWelcomeScreen } from '@/components/demo/VipWelcomeScreen';
import { activateVipCode } from '@/lib/vipDemo';
import { SEO } from '@/components/SEO';

const DWIGHT_CODE = 'MTNYOTAS-4L';

/**
 * NDA-bypass preview of Dwight's exact VIP onboarding experience.
 *
 * Flow:
 *  1. Mark NDA as already-signed for this device (preview only).
 *  2. Activate Dwight's VIP code so the dashboard shows his ★ VIP badge.
 *  3. Render the personalized VipWelcomeScreen.
 *  4. On Continue → forward into the live /demo dashboard.
 */
export default function DwightPreview() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      // Bypass the NDA gate — DemoAccessGate checks `zen_demo_access`
      // for `{ ts, ndaSigned: true }` within a 24h TTL.
      localStorage.setItem(
        'zen_demo_access',
        JSON.stringify({ ts: Date.now(), ndaSigned: true })
      );
      // Force the welcome screen to fire even if previously dismissed.
      localStorage.removeItem(`zen_vip_welcome_shown:${DWIGHT_CODE}`);
      activateVipCode(DWIGHT_CODE);
    } catch {}
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <>
      <SEO
        title="Dwight Preview — VIP Onboarding"
        description="Internal preview of Dwight's personalized ZenSolar VIP welcome experience."
        url="https://zensolar.com/dwight-preview"
      />
      <VipWelcomeScreen
        accessCode={DWIGHT_CODE}
        onContinue={() => navigate('/demo', { replace: true })}
      />
    </>
  );
}
