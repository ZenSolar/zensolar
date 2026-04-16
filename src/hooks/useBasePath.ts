import { useLocation } from 'react-router-dom';

/**
 * Returns '/demo' when on a demo route, '' otherwise.
 * Use to prefix links so they stay within the demo layout.
 */
export function useBasePath() {
  const { pathname } = useLocation();
  return pathname.startsWith('/demo') ? '/demo' : '';
}
