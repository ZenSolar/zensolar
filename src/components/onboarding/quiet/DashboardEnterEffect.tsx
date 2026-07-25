import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Dashboard glow handoff. Fires once when the user arrives from onboarding
 * (`?fromOnboarding=1`), then strips the query param.
 * A single signature-gradient sweep across the screen — no confetti, no toast.
 */
export function DashboardEnterEffect() {
  const location = useLocation();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('fromOnboarding') === '1') {
      setVisible(true);
      params.delete('fromOnboarding');
      const search = params.toString();
      navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: true });
      const t = setTimeout(() => setVisible(false), 950);
      return () => clearTimeout(t);
    }
  }, [location.pathname, location.search, navigate]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[9998] pointer-events-none overflow-hidden"
        >
          <div className="absolute inset-y-0 -inset-x-1/2 qc-current-bg opacity-30 qc-sweep" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
