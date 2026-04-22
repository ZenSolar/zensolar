import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VipWelcomeScreen } from '@/components/demo/VipWelcomeScreen';
import { activateVipCode } from '@/lib/vipDemo';
import { SEO } from '@/components/SEO';

const TAYLOR_CODE = 'TAYTAY-2026';

/**
 * NDA-bypass preview of Taylor's exact VIP onboarding experience.
 * Mirrors DwightPreview — see that file for flow notes.
 */
export default function TaylorPreview() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(
        'zen_demo_access',
        JSON.stringify({ ts: Date.now(), ndaSigned: true })
      );
      localStorage.removeItem(`zen_vip_welcome_shown:${TAYLOR_CODE}`);
      activateVipCode(TAYLOR_CODE);
    } catch {}
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <>
      <SEO
        title="Taylor Preview — VIP Onboarding"
        description="Internal preview of Taylor's personalized ZenSolar VIP welcome experience."
        url="https://zensolar.com/taylor-preview"
      />
      <VipWelcomeScreen
        accessCode={TAYLOR_CODE}
        onContinue={() => navigate('/demo', { replace: true })}
      />
    </>
  );
}
